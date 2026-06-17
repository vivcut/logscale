export default {
 async fetch(request, env, ctx) {
  // 1. Handle CORS preflight requests
  if (request.method === "OPTIONS") {
   return new Response(null, {
    headers: {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type",
    },
   });
  }

  // 2. Only allow POST requests for generation
  if (request.method !== "POST") {
   return new Response("Method Not Allowed", { status: 405 });
  }

  // Guard the AI binding up front so a misconfigured deploy returns a clear,
  // actionable message instead of "Cannot read properties of undefined
  // (reading 'run')". Add the `[ai]` binding in wrangler.toml and redeploy.
  if (!env.AI || typeof env.AI.run !== "function") {
   return new Response(
    JSON.stringify({
     error:
      "Workers AI binding is missing. Add `[ai]\\nbinding = \"AI\"` to wrangler.toml and redeploy the worker.",
    }),
    {
     status: 500,
     headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
     },
    }
   );
  }

  try {
   const body = await request.json();

   // ---- Mode A: short summary of a single feature request ----------------
   // { mode: "summary", title, description } -> { summary }
   // Used by the dashboard overview "Implement / Planned / In progress"
   // sections to render a one-line gist of what each post wants.
   if (body.mode === "summary") {
    const title = (body.title || "").toString().slice(0, 300);
    const description = (body.description || "").toString().slice(0, 1500);
    if (!title && !description) {
     return json({ error: "Nothing to summarize." }, 400);
    }

    const response = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
     messages: [
      {
       role: "system",
       content:
        "You summarize a user's feature request into ONE short, plain sentence (max ~15 words) describing what they want built. No preamble, no quotes, no markdown — just the sentence.",
      },
      {
       role: "user",
       content: `TITLE: ${title}\nDESCRIPTION: ${description || "(none)"}`,
      },
     ],
    });

    const summary = extractText(response).trim().replace(/^"|"$/g, "");
    return json({ summary });
   }

   // ---- Mode C: "most important features" report -------------------------
   // { mode: "report", posts: [{ title, description, upvotes }] } -> { markdown }
   // Used on /dashboard/boards to summarize the top under-review requests into
   // an actionable build recommendation.
   if (body.mode === "report") {
    const posts = Array.isArray(body.posts) ? body.posts.slice(0, 3) : [];
    if (posts.length === 0) {
     return json({ error: "No posts provided." }, 400);
    }

    const list = posts
     .map(
      (p, i) =>
       `${i + 1}. "${(p.title || "").toString().slice(0, 200)}" (${
        p.upvotes ?? 0
       } votes)\n  ${(p.description || "No description.")
        .toString()
        .slice(0, 800)}`
     )
     .join("\n\n");

    const response = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
     messages: [
      {
       role: "system",
       content:
        "You are a senior product strategist. Given the top user-requested features (currently under review), write a concise, actionable recommendation of what the team should build next and why. Use short Markdown: a one-sentence intro, then a bullet per feature with the value + a concrete suggestion. No preamble like 'Sure'. Be specific and punchy.",
      },
      {
       role: "user",
       content: `Here are the top ${posts.length} most-upvoted feature requests under review:\n\n${list}`,
      },
     ],
    });

    return json({ markdown: extractText(response) });
   }

   // ---- Mode B (default): changelog draft from completed features --------
   const { features } = body;

   if (!features || !Array.isArray(features) || features.length === 0) {
    return json({ error: "No features provided to summarize." }, 400);
   }

   // 3. Format the roadmap features into a readable context block for Llama
   const featuresList = features
    .map((f, i) => `${i + 1}. TITLE: ${f.title}\n  DESCRIPTION: ${f.description || 'No description provided.'}`)
    .join("\n\n");

   const systemPrompt = `You are an elite product marketing manager and technical writer. 
Your task is to write a gorgeous, engaging, release-ready Product Changelog based on a list of completed features. 
Structure the response cleanly using Markdown. Use clean headings, short bullet points, and highlight value. 
Do not include conversational filler like "Sure, here is your changelog". Start directly with the content. 
Group items with premium emoji labels like ✨ New, 🐛 Fix, or ⚡ Performance if applicable.`;

   const userPrompt = `Please synthesize the following completed features into a unified product release note update:\n\n${featuresList}`;

   // 4. Run the Cloudflare Workers AI model binding
   const response = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
    messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: userPrompt }
    ]
   });

   // 5. Return the markdown answer back to your Next.js app
   return json({ markdown: extractText(response) });

  } catch (error) {
   return json({ error: error.message }, 500);
  }
 },
};

/**
 * Extract the assistant's text from a Workers AI response.
 *
 * Kimi K2.6 (@cf/moonshotai/kimi-k2.6) returns an OpenAI-compatible shape:
 *  { choices: [{ message: { content: "..." } }], ... }
 *
 * Older models like llama-3-8b-instruct returned { response: "..." }, so we
 * fall back to that (and a couple of other shapes) to stay robust if the model
 * is ever swapped again. Reasoning models may also emit a `reasoning_content`
 * field which we ignore in favour of the final `content`.
 */
function extractText(response) {
 if (!response) return "";

 // OpenAI-compatible chat completion (Kimi K2.6 and most current models)
 const choice = response.choices && response.choices[0];
 if (choice) {
  const msg = choice.message || {};
  if (typeof msg.content === "string" && msg.content.length > 0) {
   return msg.content;
  }
  // Some providers stream the text under `text` on the choice itself.
  if (typeof choice.text === "string" && choice.text.length > 0) {
   return choice.text;
  }
 }

 // Legacy Workers AI shape ({ response: "..." })
 if (typeof response.response === "string") {
  return response.response;
 }

 // Last resort: a bare string.
 if (typeof response === "string") {
  return response;
 }

 return "";
}

function json(payload, status = 200) {
 return new Response(JSON.stringify(payload), {
  status,
  headers: {
   "Content-Type": "application/json",
   "Access-Control-Allow-Origin": "*",
  },
 });
}
