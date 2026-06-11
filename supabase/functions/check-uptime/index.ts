// =============================================================================
// Supabase Edge Function: check-uptime
// =============================================================================
// A single, batched uptime checker. Triggered by a Supabase Cron schedule
// every 2 minutes, it fetches every monitored site and probes them ALL inside
// ONE invocation using Promise.all — so you make ~720 invocations/day total
// instead of one-per-site, staying well under the 500k/month free limit.
//
// Deploy:
//   supabase functions deploy check-uptime --no-verify-jwt
//
// Schedule (every 2 minutes) — run once in the SQL editor:
//   select cron.schedule(
//     'check-uptime-every-2-min',
//     '*/2 * * * *',
//     $$
//       select net.http_post(
//         url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/check-uptime',
//         headers := jsonb_build_object(
//           'Content-Type', 'application/json',
//           'Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>'
//         )
//       );
//     $$
//   );
//
// See supabase/functions/check-uptime/README.md for full step-by-step deploy
// instructions.
// =============================================================================


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// How many sites to probe per parallel batch. Keeps the concurrent socket
// count sane on very large lists while still finishing fast.
const BATCH_SIZE = 100;

Deno.serve(async (_req) => {
  // 1. Initialize Supabase Admin client to bypass RLS for the background check.
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 2. Fetch all sites that need monitoring.
    const { data: sites, error } = await supabaseAdmin
      .from("monitored_sites")
      .select("id, url, status");

    if (error) throw error;
    if (!sites || sites.length === 0) {
      return new Response("No sites to check.", { status: 200 });
    }

    // Probe a single site and persist its new status + timestamp.
    const checkSite = async (site: {
      id: string;
      url: string;
      status: string;
    }) => {
      let isUp = false;

      try {
        // Use HEAD instead of GET to save bandwidth and server processing costs.
        const response = await fetch(site.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        // If HEAD isn't allowed (405), fall back to GET; otherwise read status.
        if (response.status === 405) {
          const fallback = await fetch(site.url, {
            method: "GET",
            signal: AbortSignal.timeout(10000),
          });
          isUp = fallback.ok;
        } else {
          isUp = response.ok;
        }
      } catch (_err) {
        isUp = false; // Network failure, timeout, or DNS error means it's down.
      }

      const newStatus = isUp ? "UP" : "DOWN";
      const now = new Date().toISOString();

      // Always refresh status + last_checked_at...
      const update = supabaseAdmin
        .from("monitored_sites")
        .update({ status: newStatus, last_checked_at: now })
        .eq("id", site.id);

      // ...but only LOG an event when the status actually CHANGES (including the
      // very first real result, which transitions away from 'PENDING'). This
      // keeps the events table tiny while letting the UI reconstruct a
      // continuous history ("UP since X, DOWN at Y, ...").
      if (newStatus !== site.status) {
        await supabaseAdmin
          .from("site_status_events")
          .insert({ site_id: site.id, status: newStatus });
      }

      return update;
    };


    // 3. Run checks concurrently, chunked into batches of BATCH_SIZE so a huge
    //    list doesn't open thousands of sockets at once.
    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(checkSite));
    }

    return new Response(
      `Batch check completed for ${sites.length} site(s).`,
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
