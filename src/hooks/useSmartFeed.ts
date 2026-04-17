import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { FeedArticle } from "./useArticles";

const PAGE_SIZE = 15;

export function useSmartFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['articles-smart-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch articles ordered by engagement score (with some recency weight)
      const { data: articlesData, error: articlesError } = await supabase
        .from("articles")
        .select("id, title, content, cover_image_url, tags, created_at, save_count, view_count, author_id, comment_count, reaction_count, parent_article_id, engagement_score")
        .eq("status", "published")
        .order("engagement_score", { ascending: false }) // Primary: engagement
        .order("created_at", { ascending: false })       // Secondary: recency
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (articlesError) throw articlesError;

      const data = articlesData || [];
      if (data.length === 0) return [];

      // Get unique author IDs
      const authorIds = [...new Set(data.map(a => a.author_id))];
      const parentIds = [...new Set(data.map(a => a.parent_article_id).filter(Boolean))] as string[];

      // Batch fetch authors and parent titles
      const [profilesResult, parentsResult] = await Promise.all([
        authorIds.length > 0
          ? supabase.from("profiles").select("id, display_name, avatar_url, specialty, reputation_score").in("id", authorIds)
          : { data: [] },
        parentIds.length > 0
          ? supabase.from("articles").select("id, title").in("id", parentIds)
          : { data: [] },
      ]);

      const profilesMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
      const parentsMap = new Map((parentsResult.data || []).map(p => [p.id, p.title]));

      const transformed: FeedArticle[] = data.map((item) => {
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
          author: profile ? {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            specialty: profile.specialty,
            reputation_score: profile.reputation_score || 0,
          } : undefined,
        };
      });

      // Return articles ordered by backend (engagement_score + recency)
      return transformed;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : undefined,
    initialPageParam: 0,
  });

  const articles = data?.pages.flatMap(p => p) ?? [];

  return {
    articles,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    error,
    refetch,
    loadMore: () => fetchNextPage(),
  };
}
