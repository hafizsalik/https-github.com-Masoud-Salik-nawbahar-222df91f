import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  clap: "👏",
  love: "❤️",
  insightful: "💡",
  laugh: "😂",
  sad: "😢",
  fire: "🔥",
};

export const REACTION_LABELS: Record<string, string> = {
  like: "پسند",
  clap: "تحسین",
  love: "عالی",
  insightful: "آموزنده",
  laugh: "خنده",
  sad: "غمگین",
  fire: "عالی",
};

export type ReactionKey = keyof typeof REACTION_EMOJIS;

export interface ReactionSummary {
  types: ReactionKey[];
  totalCount: number;
  reactorNames: string[];
  userReaction: ReactionKey | null;
}

export function useCardReactions(articleId: string) {
  const [summary, setSummary] = useState<ReactionSummary>({
    types: [],
    totalCount: 0,
    reactorNames: [],
    userReaction: null,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);

    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_type, user_id")
      .eq("article_id", articleId);

    if (!reactions || reactions.length === 0) {
      setSummary({ types: [], totalCount: 0, reactorNames: [], userReaction: null });
      setLoading(false);
      return;
    }

    const typesSet = new Set<ReactionKey>();
    reactions.forEach((r) => typesSet.add(r.reaction_type as ReactionKey));

    const userReaction = currentUserId
      ? (reactions.find((r) => r.user_id === currentUserId)?.reaction_type as ReactionKey | undefined) || null
      : null;

    const otherReactorIds = reactions
      .filter((r) => r.user_id !== currentUserId)
      .map((r) => r.user_id)
      .slice(0, 2);

    let reactorNames: string[] = [];
    if (otherReactorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("display_name")
        .in("id", otherReactorIds);
      reactorNames = profiles?.map((p) => p.display_name) || [];
    }

    setSummary({
      types: Array.from(typesSet),
      totalCount: reactions.length,
      reactorNames,
      userReaction,
    });
    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const toggleReaction = async (type: ReactionKey) => {
    if (!userId) return false;

    if (summary.userReaction === type) {
      await supabase
        .from("reactions")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);
    } else {
      if (summary.userReaction) {
        await supabase
          .from("reactions")
          .update({ reaction_type: type })
          .eq("article_id", articleId)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("reactions")
          .insert({ article_id: articleId, user_id: userId, reaction_type: type });
      }
    }

    await fetchReactions();
    return true;
  };

  return { summary, loading, userId, toggleReaction };
}
