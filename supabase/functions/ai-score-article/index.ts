import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, content, articleId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are an editorial AI evaluator for a Persian-language journal platform called Nobahar. 
Evaluate this article on 5 criteria. Return ONLY a JSON object with integer scores, nothing else.

Criteria and max scores:
- science (0-15): Scientific accuracy, references, factual correctness
- ethics (0-10): Ethical standards, respect, responsibility  
- writing (0-10): Writing quality, structure, paragraphing, clarity
- timing (0-10): Relevance, timeliness of the topic
- innovation (0-5): Originality, fresh perspective

Article Title: ${title}

Article Content: ${content.slice(0, 3000)}

Return ONLY valid JSON like: {"science": 10, "ethics": 7, "writing": 8, "timing": 6, "innovation": 3}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a strict JSON-only responder. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_scores",
              description: "Submit article evaluation scores",
              parameters: {
                type: "object",
                properties: {
                  science: { type: "integer", minimum: 0, maximum: 15 },
                  ethics: { type: "integer", minimum: 0, maximum: 10 },
                  writing: { type: "integer", minimum: 0, maximum: 10 },
                  timing: { type: "integer", minimum: 0, maximum: 10 },
                  innovation: { type: "integer", minimum: 0, maximum: 5 },
                },
                required: ["science", "ethics", "writing", "timing", "innovation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_scores" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let scores;

    if (toolCall?.function?.arguments) {
      scores = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content_text = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content_text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        scores = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI scores");
      }
    }

    // Clamp scores
    scores.science = Math.min(15, Math.max(0, Math.round(scores.science || 0)));
    scores.ethics = Math.min(10, Math.max(0, Math.round(scores.ethics || 0)));
    scores.writing = Math.min(10, Math.max(0, Math.round(scores.writing || 0)));
    scores.timing = Math.min(10, Math.max(0, Math.round(scores.timing || 0)));
    scores.innovation = Math.min(5, Math.max(0, Math.round(scores.innovation || 0)));

    // Update article with AI scores if articleId provided
    if (articleId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          ai_score_science: scores.science,
          ai_score_ethics: scores.ethics,
          ai_score_writing: scores.writing,
          ai_score_timing: scores.timing,
          ai_score_innovation: scores.innovation,
        }),
      });
    }

    return new Response(JSON.stringify({ scores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-score-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
