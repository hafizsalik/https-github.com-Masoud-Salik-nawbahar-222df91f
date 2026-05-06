import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";

const LS_KEY = "dismissed_articles_v1";
const LEGACY_KEY = "hidden_articles";

function readLocal(): Set<string> {
  try {
    const a = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const b = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    return new Set<string>([...a, ...b]);
  } catch {
    return new Set();
  }
}

function writeLocal(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(set)));
  } catch { /* quota */ }
}

/**
 * Tracks articles the current user has dismissed via "Not interested".
 * Server-backed for signed-in users (article_dismissals table),
 * localStorage fallback for guests.
 */
export function useDismissedArticles() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => readLocal());

  useEffect(() => {
    if (!user) {
      setIds(readLocal());
      return;
    }
    let active = true;
    supabase
      .from("article_dismissals" as any)
      .select("article_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          logger.error("Failed to load dismissals", error);
          return;
        }
        const remote = new Set<string>((data || []).map((r: any) => r.article_id));
        const local = readLocal();
        local.forEach((id) => remote.add(id));
        setIds(remote);
      });
    return () => { active = false; };
  }, [user]);

  const dismiss = useCallback(async (articleId: string, reason?: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.add(articleId);
      writeLocal(next);
      return next;
    });
    if (user) {
      const { error } = await supabase
        .from("article_dismissals" as any)
        .insert({ user_id: user.id, article_id: articleId, reason: reason ?? null });
      if (error && error.code !== "23505") {
        logger.error("Failed to persist dismissal", error);
      }
    }
  }, [user]);

  return { dismissedIds: ids, dismiss };
}
