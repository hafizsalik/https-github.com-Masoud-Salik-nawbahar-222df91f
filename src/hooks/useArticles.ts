import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeedArticle {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  save_count: number;
  author_id: string;
  view_count: number;
  comment_count: number;
  reaction_count: number;
  parent_article_id: string | null;
  parent_title?: string | null;
  author?: {
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
    reputation_score: number;
  };
}

const PAGE_SIZE = 15;

export function usePublishedArticles() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const { data: articlesData, error: articlesError } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, tags, created_at, save_count, view_count, author_id, comment_count, reaction_count, parent_article_id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (articlesError) {
      setError(articlesError.message);
      if (!append) setArticles([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const data = articlesData || [];
    setHasMore(data.length === PAGE_SIZE);

    // Get unique author IDs
    const authorIds = [...new Set(data.map(a => a.author_id))];
    
    // Get unique parent article IDs for response articles
    const parentIds = [...new Set(data.map(a => a.parent_article_id).filter(Boolean))] as string[];

    // Batch fetch authors and parent titles in parallel
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

    if (append) {
      setArticles(prev => [...prev, ...transformed]);
    } else {
      setArticles(transformed);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchArticles(0, false);
  }, [fetchArticles]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchArticles(articles.length, true);
  }, [articles.length, loadingMore, hasMore, fetchArticles]);

  const refetch = useCallback(() => {
    setHasMore(true);
    fetchArticles(0, false);
  }, [fetchArticles]);

  return { articles, loading, loadingMore, hasMore, error, refetch, loadMore };
}
