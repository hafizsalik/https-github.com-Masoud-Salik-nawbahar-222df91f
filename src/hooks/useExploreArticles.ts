import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeedArticle } from "./useArticles";

interface ExploreFilters {
  topic?: string | null;
  tag?: string | null;
  query?: string | null;
}

export function useExploreArticles(filters: ExploreFilters) {
  const { topic, tag, query } = filters;

  return useQuery({
    queryKey: ["explore-articles", topic, tag, query],
    queryFn: async () => {
      let q = supabase
        .from("articles")
        .select("id, title, content, cover_image_url, tags, created_at, save_count, view_count, author_id, comment_count, reaction_count, parent_article_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);

      if (topic) {
        q = q.contains("tags", [topic]);
      }
      if (tag) {
        q = q.contains("tags", [tag]);
      }
      if (query && query.length >= 2) {
        q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const authorIds = [...new Set(data.map((a) => a.author_id))];
      const parentIds = [...new Set(data.map((a) => a.parent_article_id).filter(Boolean))] as string[];

      const [profilesResult, parentsResult] = await Promise.all([
        authorIds.length > 0
          ? supabase.from("profiles").select("id, display_name, avatar_url, specialty, reputation_score").in("id", authorIds)
          : { data: [] },
        parentIds.length > 0
          ? supabase.from("articles").select("id, title").in("id", parentIds)
          : { data: [] },
      ]);

      const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
      const parentsMap = new Map((parentsResult.data || []).map((p) => [p.id, p.title]));

      return data.map((item): FeedArticle => {
        const profile = profilesMap.get(item.author_id);
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          cover_image_url: item.cover_image_url,
          tags: item.tags || [],
          created_at: item.created_at,
          save_count: item.save_count || 0,
          view_count: item.view_count || 0,
          comment_count: item.comment_count || 0,
          reaction_count: item.reaction_count || 0,
          parent_article_id: item.parent_article_id,
          parent_title: item.parent_article_id ? parentsMap.get(item.parent_article_id) || null : null,
          author_id: item.author_id,
          author: profile
            ? {
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                specialty: profile.specialty,
                reputation_score: profile.reputation_score || 0,
              }
            : undefined,
        };
      });
    },
    staleTime: 30_000,
  });
}

export function useTrendingArticles() {
  return useQuery({
    queryKey: ["trending-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, content, cover_image_url, tags, created_at, save_count, view_count, author_id, comment_count, reaction_count, parent_article_id")
        .eq("status", "published")
        .order("reaction_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const authorIds = [...new Set(data.map((a) => a.author_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url, specialty, reputation_score").in("id", authorIds);
      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

      return data.map((item): FeedArticle => {
        const profile = profilesMap.get(item.author_id);
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          cover_image_url: item.cover_image_url,
          tags: item.tags || [],
          created_at: item.created_at,
          save_count: item.save_count || 0,
          view_count: item.view_count || 0,
          comment_count: item.comment_count || 0,
          reaction_count: item.reaction_count || 0,
          parent_article_id: item.parent_article_id,
          parent_title: null,
          author_id: item.author_id,
          author: profile
            ? {
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                specialty: profile.specialty,
                reputation_score: profile.reputation_score || 0,
              }
            : undefined,
        };
      });
    },
    staleTime: 60_000,
  });
}
