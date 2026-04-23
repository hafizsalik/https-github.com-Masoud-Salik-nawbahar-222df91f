import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { getHighlightedPreview } from '@/lib/fuzzySearch';
import type { SearchResult, SearchArticle, SearchProfile } from '@/lib/fuzzySearch';
import { cn, toPersianNumber } from '@/lib/utils';

interface SearchDropdownProps {
    articleResults: SearchResult<SearchArticle>[];
    profileResults: SearchResult<SearchProfile>[];
    query: string;
    isOpen: boolean;
    onClose: () => void;
}

export function SearchDropdown({
    articleResults,
    profileResults,
    query,
    isOpen,
    onClose,
}: SearchDropdownProps) {
    const navigate = useNavigate();

    const handleArticleClick = (articleId: string) => {
        navigate(`/article/${articleId}?q=${encodeURIComponent(query)}`);
        onClose();
    };

    const handleProfileClick = (userId: string) => {
        navigate(`/profile/${userId}`);
        onClose();
    };

    const handleExploreAll = () => {
        navigate(`/explore?q=${encodeURIComponent(query)}`);
        onClose();
    };

    if (!isOpen || (!articleResults.length && !profileResults.length)) {
        return null;
    }

    return (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
            {/* Articles Section */}
            {articleResults.length > 0 && (
                <div className="border-b border-border/50 last:border-b-0">
                    <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground bg-muted/30">
                        مقالات
                    </div>
                    {articleResults.map((result) => (
                        <button
                            key={result.item.id}
                            onClick={() => handleArticleClick(result.item.id)}
                            className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
                        >
                            <div className="flex items-start gap-2">
                                {result.item.cover_image_url && (
                                    <img
                                        src={result.item.cover_image_url}
                                        alt=""
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-foreground truncate">
                                        {result.item.title}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                        {getHighlightedPreview(result.item.content, query, 100)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {result.item.author?.avatar_url && (
                                            <img
                                                src={result.item.author.avatar_url}
                                                alt={result.item.author.display_name}
                                                className="w-5 h-5 rounded-full object-cover"
                                            />
                                        )}
                                        <span className="text-[10px] text-muted-foreground">
                                            {result.item.author?.display_name || 'نویسنده'}
                                        </span>
                                        {result.item.view_count > 0 && (
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {toPersianNumber(result.item.view_count)} بازدید
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Profiles Section */}
            {profileResults.length > 0 && (
                <div className="border-b border-border/50 last:border-b-0">
                    <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground bg-muted/30">
                        نویسندگان
                    </div>
                    {profileResults.map((result) => (
                        <button
                            key={result.item.id}
                            onClick={() => handleProfileClick(result.item.id)}
                            className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 flex items-center gap-3"
                        >
                            {result.item.avatar_url ? (
                                <img
                                    src={result.item.avatar_url}
                                    alt={result.item.display_name}
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User size={18} className="text-primary/50" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-foreground truncate">
                                    {result.item.display_name}
                                </p>
                                {result.item.specialty && (
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {result.item.specialty}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* View All Results */}
            {(articleResults.length > 0 || profileResults.length > 0) && (
                <button
                    onClick={handleExploreAll}
                    className="w-full px-4 py-3 text-center text-[12px] font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                    <Search size={14} />
                    مشاهده تمام نتایج
                </button>
            )}
        </div>
    );
}
