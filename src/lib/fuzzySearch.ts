import Fuse from 'fuse.js';

export interface SearchArticle {
    id: string;
    title: string;
    content: string;
    cover_image_url: string | null;
    tags: string[];
    created_at: string;
    save_count: number;
    view_count: number;
    comment_count: number;
    reaction_count: number;
    author_id: string;
    author?: {
        display_name: string;
        avatar_url: string | null;
        specialty: string | null;
    };
}

export interface SearchProfile {
    id: string;
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
    reputation_score?: number;
}

export interface SearchResult<T> {
    item: T;
    score: number;
    matches?: Fuse.FuseResultMatch[];
}

/**
 * Fuzzy search articles by title, content, and tags
 * More permissive threshold (0.3) for general content search
 */
export function fuzzySearchArticles(
    articles: SearchArticle[],
    query: string,
    limit: number = 10
): SearchResult<SearchArticle>[] {
    if (!query || query.trim().length === 0) return [];

    const fuse = new Fuse(articles, {
        keys: [
            { name: 'title', weight: 0.8 },
            { name: 'tags', weight: 0.5 },
            { name: 'content', weight: 0.2 },
        ],
        threshold: 0.3,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        ignoreLocation: true,
    });

    return fuse.search(query).slice(0, limit).map((result) => ({
        item: result.item,
        score: result.score ?? 1,
        matches: result.matches,
    }));
}

/**
 * Fuzzy search profiles/writers by display name and specialty
 * Stricter threshold (0.4) for profile names
 */
export function fuzzySearchProfiles(
    profiles: SearchProfile[],
    query: string,
    limit: number = 8
): SearchResult<SearchProfile>[] {
    if (!query || query.trim().length === 0) return [];

    const fuse = new Fuse(profiles, {
        keys: [
            { name: 'display_name', weight: 0.9 },
            { name: 'specialty', weight: 0.5 },
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 1,
        ignoreLocation: true,
    });

    return fuse.search(query).slice(0, limit).map((result) => ({
        item: result.item,
        score: result.score ?? 1,
        matches: result.matches,
    }));
}

/**
 * Highlight text segments with case-insensitive regex
 * Returns JSX-compatible array with marked segments
 */
export function highlightTextSegments(text: string, query: string) {
    if (!query || !text) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
        regex.test(part) ? (
            <mark key= { index } className = "bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded-sm" >
            { part }
            </mark>
    ) : (
        part
    )
  );
}

/**
 * Get a preview of text with search matches highlighted
 * Truncates to specified length and shows context around matches
 */
export function getHighlightedPreview(
    text: string,
    query: string,
    maxLength: number = 150
): React.ReactNode {
    if (!text || !query) {
        return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const match = regex.exec(text);

    if (!match) {
        return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');
    }

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + maxLength);
    const preview = text.slice(start, end);
    const displayText = (start > 0 ? '…' : '') + preview + (end < text.length ? '…' : '');

    return highlightTextSegments(displayText, query);
}
