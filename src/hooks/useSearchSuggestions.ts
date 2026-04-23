import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fuzzySearchArticles, fuzzySearchProfiles } from '@/lib/fuzzySearch';
import type { SearchArticle, SearchProfile, SearchResult } from '@/lib/fuzzySearch';

export interface SearchSuggestions {
    articles: SearchResult<SearchArticle>[];
    profiles: SearchResult<SearchProfile>[];
    loading: boolean;
    error: string | null;
}

const DEBOUNCE_DELAY = 300;
const MIN_QUERY_LENGTH = 1;

export function useSearchSuggestions(query: string): SearchSuggestions {
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allArticles, setAllArticles] = useState<SearchArticle[]>([]);
    const [allProfiles, setAllProfiles] = useState<SearchProfile[]>([]);
    const [articleResults, setArticleResults] = useState<SearchResult<SearchArticle>[]>([]);
    const [profileResults, setProfileResults] = useState<SearchResult<SearchProfile>[]>([]);

    // Fetch available articles and profiles on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch published articles
                const { data: articlesData, error: articlesError } = await supabase
                    .from('articles')
                    .select(
                        'id, title, content, cover_image_url, tags, created_at, save_count, view_count, comment_count, reaction_count, author_id'
                    )
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                    .limit(100); // Cache recent articles for suggestions

                if (articlesError) throw articlesError;

                // Fetch profiles for author info
                const authorIds = [
                    ...new Set((articlesData || []).map((a) => a.author_id)),
                ] as string[];

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select(
                        'id, display_name, avatar_url, specialty, reputation_score'
                    )
                    .in('id', authorIds.length > 0 ? authorIds : ['']);

                if (profilesError) throw profilesError;

                // Build articles with author info
                const profileMap = new Map(
                    (profilesData || []).map((p) => [
                        p.id,
                        {
                            display_name: p.display_name,
                            avatar_url: p.avatar_url,
                            specialty: p.specialty,
                            reputation_score: p.reputation_score || 0,
                        },
                    ])
                );

                const articlesWithAuthors: SearchArticle[] = (articlesData || []).map(
                    (article) => ({
                        ...article,
                        author: profileMap.get(article.author_id),
                    })
                );

                setAllArticles(articlesWithAuthors);
                setAllProfiles(profilesData || []);
            } catch (err) {
                console.error('Error fetching search data:', err);
                setError('Failed to load search data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timer);
    }, [query]);

    // Perform search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.length < MIN_QUERY_LENGTH) {
            setArticleResults([]);
            setProfileResults([]);
            return;
        }

        try {
            setError(null);
            const articles = fuzzySearchArticles(allArticles, debouncedQuery, 6);
            const profiles = fuzzySearchProfiles(allProfiles, debouncedQuery, 6);

            setArticleResults(articles);
            setProfileResults(profiles);
        } catch (err) {
            console.error('Error performing search:', err);
            setError('Search failed');
        }
    }, [debouncedQuery, allArticles, allProfiles]);

    return {
        articles: articleResults,
        profiles: profileResults,
        loading,
        error,
    };
}
