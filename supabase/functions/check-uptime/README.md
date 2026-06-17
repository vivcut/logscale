# check-uptime — deploy guide

**Deploy this one file:** `supabase/functions/check-uptime/index.ts`

That is the canonical Edge Function. (There is no longer a separate
`worker-uptime.js` — ignore any older reference to it.) The TypeScript
red squiggles you may see on `Deno` / the `https://esm.sh/...` import are
expected: this code runs on Deno inside Supabase, not in the Next.js app, and
the folder is excluded from the app's type-check.

---

## 1. Create the table + RLS

In the Supabase Dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/monitored_sites.sql
```

## 2. Install the Supabase CLI (once)

```bash
brew install supabase/tap/supabase
```

## 3. Link your project (once)

```bash
# <PROJECT_REF> is in your dashboard URL: https://supabase.com/dashboard/project/<PROJECT_REF>
supabase login
supabase link --project-ref <PROJECT_REF>
```

## 4. Deploy the function

From the repo root (`/Users/vivaan/Pitstop`):

```bash
supabase functions deploy check-uptime --no-verify-jwt
```

`--no-verify-jwt` lets the cron job call it without a user JWT. `SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` are injected automatically into deployed
functions, so no extra secrets are needed.

## 5. Schedule it every 2 minutes

In the **SQL Editor**, enable the scheduler extensions (once) and create the job.
Replace `<PROJECT_REF>` and `<SERVICE_ROLE_KEY>` (Settings → API → service_role key):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
 'check-uptime-every-2-min',
 '*/2 * * * *',
 $$
  select net.http_post(
   url   := 'https://<PROJECT_REF>.supabase.co/functions/v1/check-uptime',
   headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>'
   )
  );
 $$
);
```

To remove the schedule later:

```sql
select cron.unschedule('check-uptime-every-2-min');
```

## 6. Verify

- Add a site at `/dashboard/status` in the app.
- Trigger a manual run:

```bash
curl -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/check-uptime' \
 -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

- Reload `/dashboard/status` — the **Status** and **Last checked** columns update.

---

### Why this stays cheap

All sites are probed inside **one** invocation using `Promise.all` (batched in
chunks of 100). A 2-minute cron is ~21,600 invocations/month total — far under
the 500,000 free limit — no matter how many sites users add.
