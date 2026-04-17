import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { articleId } = await req.json();
    if (!articleId) {
      return new Response(JSON.stringify({ error: "articleId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate articleId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(articleId)) {
      return new Response(JSON.stringify({ error: "Invalid article ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch article from DB and verify ownership
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const articleRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}&select=title,content,author_id,status`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const articles = await articleRes.json();
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const article = articles[0];

    // Check ownership: only the author can trigger AI scoring on their own article
    if (article.author_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden: you can only score your own articles" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow scoring on pending articles
    if (article.status !== "pending") {
      return new Response(JSON.stringify({ error: "Article is not in pending status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = article.title;
    const content = article.content;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a professional and encouraging Persian-language editorial coach for a journal platform called Nobahar.

Your job has TWO parts:

PART 1 - SAFETY CHECK:
Review the article for prohibited or unsafe content:
- Hate speech, discrimination, or content promoting division between ethnic/religious groups
- Insults, defamation, or personal attacks
- Adult/sexual content
- Violence promotion or terrorism support
- Plagiarism indicators (if the content appears to be directly copied from well-known sources)
- Spam, advertising, or meaningless content
- Misinformation or dangerous health/medical claims

If any prohibited content is found, set "approved" to false and "publish_blocked" to true. Provide a clear Persian-language reason and list the policy issues found.

PART 2 - QUALITY REVIEW:
Evaluate the article on 5 criteria with integer scores:
- science (0-15): Scientific accuracy, references, factual correctness
- ethics (0-10): Ethical standards, respect, responsibility
- writing (0-10): Writing quality, structure, paragraphing, clarity
- timing (0-10): Relevance, timeliness of the topic
- innovation (0-5): Originality, fresh perspective

If the article is safe but the quality is below the platform's desired level, set "approved" to false and "publish_blocked" to false. In that case provide a supportive rejection_reason, a short motivation_message, strengths, and improvement_advice.

MINIMUM THRESHOLD: The average percentage score must be at least 40% for approval.
Calculate: ((science/15 + ethics/10 + writing/10 + timing/10 + innovation/5) / 5) * 100

Article Title: ${title}

Article Content: ${content.slice(0, 4000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional editorial coach and content safety reviewer. Use the provided tool to return structured feedback." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluation",
              description: "Submit article moderation, quality evaluation, and coaching feedback",
              parameters: {
                type: "object",
                properties: {
                  approved: { type: "boolean", description: "Whether the article passes moderation and quality checks" },
                  publish_blocked: { type: "boolean", description: "Whether this article must be blocked from publication due to safety or policy issues" },
                  rejection_reason: { type: "string", description: "Persian-language reason for rejection or improvement guidance" },
                  science: { type: "integer", minimum: 0, maximum: 15 },
                  ethics: { type: "integer", minimum: 0, maximum: 10 },
                  writing: { type: "integer", minimum: 0, maximum: 10 },
                  timing: { type: "integer", minimum: 0, maximum: 10 },
                  innovation: { type: "integer", minimum: 0, maximum: 5 },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "What the article does well",
                  },
                  improvement_advice: { type: "string", description: "A concise suggestion for how the author can improve the article" },
                  motivation_message: { type: "string", description: "A short encouraging message for the author" },
                  policy_issues: {
                    type: "array",
                    items: { type: "string" },
                    description: "Policy issues detected in the article, if any",
                  },
                },
                required: ["approved", "publish_blocked", "rejection_reason", "science", "ethics", "writing", "timing", "innovation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "سرویس ارزیابی مشغول است. لطفاً کمی صبر کنید.", code: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "خطای سرویس ارزیابی", code: "payment_required" }), {
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
    let evaluation;

    if (toolCall?.function?.arguments) {
      evaluation = JSON.parse(toolCall.function.arguments);
    } else {
      const content_text = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content_text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI evaluation");
      }
    }

    // Clamp scores
    const scores = {
      science: Math.min(15, Math.max(0, Math.round(evaluation.science || 0))),
      ethics: Math.min(10, Math.max(0, Math.round(evaluation.ethics || 0))),
      writing: Math.min(10, Math.max(0, Math.round(evaluation.writing || 0))),
      timing: Math.min(10, Math.max(0, Math.round(evaluation.timing || 0))),
      innovation: Math.min(5, Math.max(0, Math.round(evaluation.innovation || 0))),
    };

    // Calculate average percentage
    const avgPercent = ((scores.science / 15 + scores.ethics / 10 + scores.writing / 10 + scores.timing / 10 + scores.innovation / 5) / 5) * 100;
    
    const publishBlocked = evaluation.publish_blocked === true;
    const approved = evaluation.approved !== false && avgPercent >= 40 && !publishBlocked;
    const rejectionReason = !approved
      ? (evaluation.rejection_reason || "کیفیت مقاله برای انتشار کافی نیست. لطفاً محتوا را بازبینی و بهبود دهید.")
      : "";

    // Update article with scores and status (articleId already validated above)
    const updateBody: Record<string, unknown> = {
      ai_score_science: scores.science,
      ai_score_ethics: scores.ethics,
      ai_score_writing: scores.writing,
      ai_score_timing: scores.timing,
      ai_score_innovation: scores.innovation,
      status: approved ? "published" : (publishBlocked ? "rejected" : "pending"),
    };

    await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updateBody),
    });

    return new Response(JSON.stringify({ 
      approved, 
      publish_blocked: publishBlocked,
      rejection_reason: rejectionReason,
      strengths: evaluation.strengths || [],
      improvement_advice: evaluation.improvement_advice || "",
      motivation_message: evaluation.motivation_message || "",
      scores,
      avg_percent: Math.round(avgPercent),
    }), {
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
