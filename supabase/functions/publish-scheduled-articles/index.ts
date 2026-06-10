import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cronSecret = Deno.env.get("CRON_SECRET") || "";

    // Auth: allow only the service role or a configured cron secret
    const authHeader = req.headers.get("Authorization") || "";
    const providedCron = req.headers.get("X-Cron-Secret") || "";
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    const isCron = cronSecret.length > 0 && providedCron === cronSecret;
    if (!isServiceRole && !isCron) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, author_id")
      .eq("status", "pending")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let published = 0;
    let notificationsSent = 0;
    let flaggedForReview = 0;

    // Try the AI gate with exponential backoff (500ms, 1.5s, 4.5s). If every
    // attempt fails, mark the article as `needs_review` and notify the author
    // so a human can manually approve it instead of leaving it stuck pending.
    async function scoreWithRetry(articleId: string): Promise<{ ok: boolean; approved: boolean }> {
      const delays = [500, 1500, 4500];
      for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
          const scoreRes = await fetch(`${supabaseUrl}/functions/v1/ai-score-article`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ articleId }),
          });
          if (scoreRes.ok) {
            const scoreData = await scoreRes.json();
            return { ok: true, approved: scoreData.approved === true };
          }
          console.error(`AI scoring attempt ${attempt + 1} for ${articleId} failed: ${scoreRes.status}`);
        } catch (e) {
          console.error(`AI scoring attempt ${attempt + 1} for ${articleId} threw:`, e);
        }
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
      return { ok: false, approved: false };
    }

    for (const article of articles) {
      const result = await scoreWithRetry(article.id);

      if (!result.ok) {
        // AI gate is unreachable — flag for manual review and notify the author.
        await supabase
          .from("articles")
          .update({ status: "needs_review" })
          .eq("id", article.id);
        await supabase.from("notifications").insert({
          user_id: article.author_id,
          actor_id: article.author_id,
          type: "needs_review",
          article_id: article.id,
        });
        flaggedForReview++;
        continue;
      }

      if (!result.approved) {
        // AI scored it but it didn't pass — leave as pending/rejected.
        continue;
      }


      published++;
      console.log(`Published: ${article.title} (${article.id})`);

      // Get author display name
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", article.author_id)
        .single();

      const authorName = authorProfile?.display_name || "نویسنده";

      // Get all followers of this author
      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", article.author_id);

      if (!followers || followers.length === 0) continue;

      // Send push notification to each follower
      for (const follower of followers) {
        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: follower.follower_id,
          actor_id: article.author_id,
          type: "new_article",
          article_id: article.id,
        });

        // Send push notification via edge function
        try {
          const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_id: follower.follower_id,
              title: `مقاله جدید از ${authorName}`,
              body: article.title,
              url: `/article/${article.id}`,
            }),
          });
          if (pushRes.ok) notificationsSent++;
        } catch (e) {
          console.error("Push error for follower:", follower.follower_id, e);
        }
      }
    }

    return new Response(JSON.stringify({ published, notificationsSent, flaggedForReview, total: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
