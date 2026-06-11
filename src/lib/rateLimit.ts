import { supabase } from "@/integrations/supabase/client";

/**
 * Server-enforced rate limit. Returns true when the user is still under the
 * allowed count for the action window, false when they have exceeded it.
 * On unexpected errors we fail open to avoid blocking legitimate users.
 */
export async function checkRateLimit(
  action: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_action: action,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("[rateLimit] rpc error", error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.warn("[rateLimit] exception", err);
    return true;
  }
}

export const RATE_LIMITS = {
  COMMENT: { action: "comment", max: 10, window: 5 * 60 },
  REACTION: { action: "reaction", max: 30, window: 60 },
  REPORT: { action: "report", max: 5, window: 60 * 60 },
  ARTICLE_SUBMIT: { action: "article_submit", max: 5, window: 24 * 60 * 60 },
} as const;
