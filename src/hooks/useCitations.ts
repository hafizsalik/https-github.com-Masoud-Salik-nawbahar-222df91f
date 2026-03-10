import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CitedArticle {
  id: string;
  title: string;
  author_name: string;
}

export function useCitations(articleId: string) {
  const [citations, setCitations] = useState<CitedArticle[]>([]);
  const [citationCount, setCitationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetchCitations();
      fetchCitationCount();
    }
  }, [articleId, fetchCitations, fetchCitationCount]);

  const fetchCitations = useCallback(async () => {
    const { data, error } = await supabase
      .from("citations")
      .select("cited_article_id")
      .eq("source_article_id", articleId);

    if (error || !data) {
      setCitations([]);
      setLoading(false);
      return;
    }

    // Fetch article details for each citation
    const citedIds = data.map(c => c.cited_article_id);
    if (citedIds.length === 0) {
      setCitations([]);
      setLoading(false);
      return;
    }

    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, author_id")
      .in("id", citedIds);

    if (!articles) {
      setCitations([]);
      setLoading(false);
      return;
    }

    // Fetch author names
    const authorIds = articles.map(a => a.author_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    const citedArticles: CitedArticle[] = articles.map(a => ({
      id: a.id,
      title: a.title,
      author_name: profileMap.get(a.author_id) || "ناشناس",
    }));

    setCitations(citedArticles);
    setLoading(false);
  }, [articleId]);

  const fetchCitationCount = useCallback(async () => {
    // Count how many articles cite THIS article
    const { count } = await supabase
      .from("citations")
      .select("*", { count: "exact", head: true })
      .eq("cited_article_id", articleId);

    setCitationCount(count || 0);
  }, [articleId]);

  return { citations, citationCount, loading };
}

// Hook for searching articles to cite
export function useArticleSearch() {
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const searchArticles = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("articles")
      .select("id, title")
      .eq("status", "published")
      .ilike("title", `%${query}%`)
      .limit(10);

    setResults(data || []);
    setSearching(false);
  };

  return { results, searching, searchArticles };
}

// Hook for adding citations to an article
export async function addCitation(sourceArticleId: string, citedArticleId: string) {
  const { error } = await supabase
    .from("citations")
    .insert({
      source_article_id: sourceArticleId,
      cited_article_id: citedArticleId,
    });

  return { error };
}
