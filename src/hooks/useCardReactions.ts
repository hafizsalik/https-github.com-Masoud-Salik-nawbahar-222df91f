import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const REACTION_KEYS = ["like", "love", "insightful", "laugh", "sad"] as const;

export const REACTION_LABELS: Record<string, string> = {
  like: "پسند",
  love: "عالی",
  insightful: "آموزنده",
  laugh: "سرگرم‌کننده",
  sad: "تأسف‌بار",
};

export const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  love: "❤️",
  insightful: "💡",
  laugh: "😄",
  sad: "😔",
};

export const REACTION_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  like: { bg: "hsl(217 55% 58% / 0.10)", text: "hsl(217 50% 55%)", ring: "hsl(217 55% 58% / 0.20)" },
  love: { bg: "hsl(348 55% 58% / 0.10)", text: "hsl(348 50% 55%)", ring: "hsl(348 55% 58% / 0.20)" },
  insightful: { bg: "hsl(42 60% 50% / 0.10)", text: "hsl(40 55% 48%)", ring: "hsl(42 60% 50% / 0.20)" },
  laugh: { bg: "hsl(28 55% 55% / 0.10)", text: "hsl(28 50% 50%)", ring: "hsl(28 55% 55% / 0.20)" },
  sad: { bg: "hsl(200 40% 52% / 0.10)", text: "hsl(200 38% 48%)", ring: "hsl(200 40% 52% / 0.20)" },
};

export type ReactionKey = keyof typeof REACTION_EMOJIS;

export interface ReactionSummary {
  topTypes: ReactionKey[];
  totalCount: number;
  reactorNames: string[];
  userReaction: ReactionKey | null;
}

const EMPTY_SUMMARY: ReactionSummary = {
  topTypes: [],
  totalCount: 0,
  reactorNames: [],
  userReaction: null,
};

/**
 * Card reactions hook — fixed race condition in toggleReaction.
 * Captures userReaction BEFORE optimistic update to ensure correct DB branch.
 */
export function useCardReactions(articleId: string, autoFetch = true) {
  const [summary, setSummary] = useState<ReactionSummary>(EMPTY_SUMMARY);
  const [fetched, setFetched] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchReactions = useCallback(async () => {
    setLoading(true);

    const [{ data: { session } }, { data: reactions }] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("reactions")
        .select("reaction_type, user_id, created_at")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })
    ]);

    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);

    if (!reactions || reactions.length === 0) {
      setSummary(EMPTY_SUMMARY);
      setFetched(true);
      setLoading(false);
      return;
    }

    const typeCounts: Record<string, number> = {};
    const userReactionType = currentUserId
      ? reactions.find((r) => r.user_id === currentUserId)?.reaction_type as ReactionKey | undefined
      : null;

    reactions.forEach((r) => {
      typeCounts[r.reaction_type] = (typeCounts[r.reaction_type] || 0) + 1;
    });

    const sorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key as ReactionKey);
    const topTypes = sorted.slice(0, 2);

    setSummary({ topTypes, totalCount: reactions.length, reactorNames: [], userReaction: userReactionType || null });
    setFetched(true);
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    if (autoFetch && !fetched && !loading) {
      fetchReactions();
    }
  }, [autoFetch, fetched, loading, fetchReactions]);

  const ensureFetched = useCallback(async () => {
    if (!fetched) await fetchReactions();
  }, [fetched, fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
    // Prevent double-submit while processing
    if (isProcessing) return false;
    setIsProcessing(true);

    try {
      // CRITICAL: Capture current state BEFORE optimistic update to fix race condition
      const previousReaction = summary.userReaction;

      // Optimistic update
      if (previousReaction === type) {
        setSummary(prev => ({ ...prev, userReaction: null, totalCount: Math.max(0, prev.totalCount - 1) }));
      } else if (previousReaction) {
        setSummary(prev => ({ ...prev, userReaction: type }));
      } else {
        setSummary(prev => ({ ...prev, userReaction: type, totalCount: prev.totalCount + 1 }));
      }

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        await fetchReactions();
        setIsProcessing(false);
        return false;
      }

      try {
        // Use captured previousReaction for DB branch logic
        if (previousReaction === type) {
          await supabase.from("reactions").delete().eq("article_id", articleId).eq("user_id", uid);
        } else if (previousReaction) {
          await supabase.from("reactions").update({ reaction_type: type }).eq("article_id", articleId).eq("user_id", uid);
        } else {
          await supabase.from("reactions").insert({ article_id: articleId, user_id: uid, reaction_type: type });
        }
        // Success: Trust optimistic update, don't refetch
        return true;
      } catch (error) {
        logger.error('Reaction toggle failed:', error);
        // Error: Refetch to sync state
        await fetchReactions();
        return false;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return { summary, loading, userId, toggleReaction, ensureFetched, fetched, isProcessing };
}
