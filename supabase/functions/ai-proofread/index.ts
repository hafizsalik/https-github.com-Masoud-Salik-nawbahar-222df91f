import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateMap = new Map<string, number[]>();

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ issues: [], error: "unauthorized" }, 401);
    }

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return json({ issues: [], error: "invalid_token" }, 401);
    }

    const userId = data.user.id;

    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return json({ issues: [] });
    }

    const cleanText = text.slice(0, 3000);

    // Rate limit
    const now = Date.now();
    const userRate = rateMap.get(userId) || [];
    const recent = userRate.filter((t: number) => now - t < 60000);
    if (recent.length > 20) {
      return json({ issues: [], error: "rate_limited" }, 429);
    }
    rateMap.set(userId, [...recent, now]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing API key");

    const prompt = `
Return ONLY valid JSON.

Analyze Persian/Dari text and return issues:

Format:
{
  "issues": [
    {
      "word": "...",
      "suggestion": "...",
      "type": "spelling | grammar | style",
      "reason": "...",
      "index": number,
      "severity": "low | medium | high"
    }
  ]
}

Rules:
- Max 15 issues
- Be conservative
- Ignore proper nouns
- Short Persian reasons
- If clean → { "issues": [] }

Text:
${cleanText}
`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          temperature: 0,
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!response.ok) {
      console.error("AI error:", response.status);
      return json({ issues: [], error: "ai_failed" });
    }

    const dataAI = await response.json();

    interface ProofreadIssue {
      word: string;
      suggestion: string;
      type: string;
      reason: string;
      index: number;
      severity: string;
    }

    let result: { issues: ProofreadIssue[] } = { issues: [] };

    try {
      const content = dataAI.choices?.[0]?.message?.content;
      if (content) {
        result = JSON.parse(content);
      }
    } catch {
      console.warn("Fallback parsing failed");
    }

    if (!Array.isArray(result.issues)) {
      result = { issues: [] };
    }

    result.issues = result.issues.slice(0, 15).map((i: ProofreadIssue) => ({
      word: i.word || "",
      suggestion: i.suggestion || "",
      type: i.type || "style",
      reason: i.reason || "",
      index: typeof i.index === "number" ? i.index : -1,
      severity: i.severity || "low",
    }));

    return json(result);
  } catch (e) {
    console.error("fatal:", e);
    return json({ issues: [], error: "server_error" });
  }
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
