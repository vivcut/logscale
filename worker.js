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

    try {
      const { features } = await request.json();

      if (!features || !Array.isArray(features) || features.length === 0) {
        return new Response(JSON.stringify({ error: "No features provided to summarize." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 3. Format the roadmap features into a readable context block for Llama
      const featuresList = features
        .map((f, i) => `${i + 1}. TITLE: ${f.title}\n   DESCRIPTION: ${f.description || 'No description provided.'}`)
        .join("\n\n");

      const systemPrompt = `You are an elite product marketing manager and technical writer. 
Your task is to write a gorgeous, engaging, release-ready Product Changelog based on a list of completed features. 
Structure the response cleanly using Markdown. Use clean headings, short bullet points, and highlight value. 
Do not include conversational filler like "Sure, here is your changelog". Start directly with the content. 
Group items with premium emoji labels like ✨ New, 🐛 Fix, or ⚡ Performance if applicable.`;

      const userPrompt = `Please synthesize the following completed features into a unified product release note update:\n\n${featuresList}`;

      // 4. Run the Cloudflare Workers AI model binding
      // Note: Ensure your wrangler.toml has the [ai] binding configured!
      const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      // 5. Return the markdown answer back to your Next.js app
      return new Response(JSON.stringify({ markdown: response.response }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  },
};