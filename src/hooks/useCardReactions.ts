import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const REACTION_KEYS = ["like", "celebrate", "support", "insightful", "appreciate", "funny"] as const;

export const REACTION_LABELS: Record<string, string> = {
  like: "پسند",
  celebrate: "عالی",
  support: "حمایت",
  insightful: "آموزنده",
  appreciate: "قدردانی",
  funny: "سرگرم‌کننده",
};

export const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  celebrate: "❤️",
  support: "💙",
  insightful: "💡",
  appreciate: "🤝",
  funny: "😄",
};

export const REACTION_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  like: { bg: "hsl(217 55% 58% / 0.10)", text: "hsl(217 50% 55%)", ring: "hsl(217 55% 58% / 0.20)" },
  celebrate: { bg: "hsl(348 55% 58% / 0.10)", text: "hsl(348 50% 55%)", ring: "hsl(348 55% 58% / 0.20)" },
  support: { bg: "hsl(210 55% 58% / 0.10)", text: "hsl(210 50% 55%)", ring: "hsl(210 55% 58% / 0.20)" },
  insightful: { bg: "hsl(42 60% 50% / 0.10)", text: "hsl(40 55% 48%)", ring: "hsl(42 60% 50% / 0.20)" },
  appreciate: { bg: "hsl(120 40% 45% / 0.10)", text: "hsl(120 38% 42%)", ring: "hsl(120 40% 45% / 0.20)" },
  funny: { bg: "hsl(28 55% 55% / 0.10)", text: "hsl(28 50% 50%)", ring: "hsl(28 55% 55% / 0.20)" },
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

    try {
      const [{ data: { session } }, { data: reactions }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("reactions")
          .select("reaction_type, user_id, created_at, profiles!inner(display_name)")
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

      // FIXED: Fetch top 3 reactor names (excluding current user)
      const topReactors = reactions
        .filter(r => r.user_id !== currentUserId)
        .slice(0, 3)
        .map((r: any) => r.profiles?.display_name || "کاربر");

      setSummary({
        topTypes,
        totalCount: reactions.length,
        reactorNames: topReactors,
        userReaction: userReactionType || null
      });
      setFetched(true);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch reactions:', error);
      setSummary(EMPTY_SUMMARY);
      setFetched(true);
      setLoading(false);
    }
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
    // Prevent double-submit while processing (atomic guarantee)
    if (isProcessing) return false;
    setIsProcessing(true);

    try {
      // Capture current state for optimistic update
      const previousReaction = summary.userReaction;

      // Optimistic update immediately
      if (previousReaction === type) {
        setSummary(prev => ({
          ...prev,
          userReaction: null,
          totalCount: Math.max(0, prev.totalCount - 1)
        }));
      } else if (previousReaction) {
        setSummary(prev => ({ ...prev, userReaction: type }));
      } else {
        setSummary(prev => ({
          ...prev,
          userReaction: type,
          totalCount: prev.totalCount + 1
        }));
      }

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        logger.warn('Not authenticated for reaction');
        await fetchReactions();
        setIsProcessing(false);
        return false;
      }

      try {
        // Atomic toggle via RPC
        const { error } = await supabase.rpc('toggle_reaction' as any, {
          p_article_id: articleId,
          p_user_id: uid,
          p_reaction_type: type,
        });

        if (error) throw error;

        // Trust optimistic state; only correct names list lazily.
        // No second fetchReactions() — that was throwing away the optimistic update
        // and adding a full network round-trip per tap.
        return true;
      } catch (error) {
        logger.error('Reaction toggle failed:', error);
        // Resync from DB on failure
        await fetchReactions();
        return false;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return { summary, loading, userId, toggleReaction, ensureFetched, fetched, isProcessing };
}
