import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Hash, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const topics = [
  { id: "politics", label: "سیاست" },
  { id: "culture", label: "فرهنگ" },
  { id: "science", label: "علم" },
  { id: "society", label: "جامعه" },
  { id: "economy", label: "اقتصاد" },
  { id: "health", label: "سلامت" },
];

const trendingHashtags = [
  "افغانستان",
  "ادبیات",
  "تاریخ",
  "هنر",
  "فناوری",
  "آموزش",
];

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  specialty: string | null;
}

const Explore = () => {
  const { articles, refetch } = usePublishedArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    if (category) setActiveTopic(category);
    if (tag) setActiveTag(tag);
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users when query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchUsers(debouncedQuery);
    } else {
      setSuggestedUsers([]);
    }
  }, [debouncedQuery]);

  const searchUsers = async (query: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, specialty")
      .ilike("display_name", `%${query}%`)
      .limit(5);
    
    setSuggestedUsers(data || []);
  };

  const filteredArticles = useMemo(() => {
    let result = articles;

    // Filter by topic/category
    if (activeTopic) {
      result = result.filter((article) =>
        article.tags?.some((tag) =>
          tag.toLowerCase() === activeTopic.toLowerCase()
        )
      );
    }

    // Filter by specific tag
    if (activeTag) {
      result = result.filter((article) =>
        article.tags?.some((tag) =>
          tag.toLowerCase() === activeTag.toLowerCase()
        )
      );
    }

    // Filter by search query (debounced)
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.author?.display_name?.toLowerCase().includes(query) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [articles, activeTopic, activeTag, debouncedQuery]);

  const handleTopicClick = (topicId: string) => {
    const newTopic = activeTopic === topicId ? null : topicId;
    setActiveTopic(newTopic);
    setActiveTag(null);
    setSearchQuery("");
    if (newTopic) {
      setSearchParams({ category: newTopic });
    } else {
      setSearchParams({});
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveTag(activeTag === hashtag ? null : hashtag);
    setActiveTopic(null);
    setSearchQuery("");
    if (activeTag !== hashtag) {
      setSearchParams({ tag: hashtag });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveTopic(null);
    setActiveTag(null);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || activeTopic || activeTag;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Search Bar */}
        <div className="px-4 pt-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="جستجوی مقالات، موضوعات، نویسندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-muted border-0 rounded-lg h-10 text-sm"
            />
          </div>

          {/* User Search Results */}
          {suggestedUsers.length > 0 && (
            <div className="mt-2 bg-card border border-border rounded-lg overflow-hidden">
              {suggestedUsers.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={16} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.display_name}</p>
                    {user.specialty && (
                      <p className="text-xs text-muted-foreground">{user.specialty}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topics - Compact pills */}
        <div className="px-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">موضوعات</h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeTopic === topic.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">هشتگ‌های داغ</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors",
                  activeTag === hashtag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                )}
              >
                <Hash size={12} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="px-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {topics.find(t => t.id === activeTopic)?.label}
                  <button onClick={() => handleTopicClick(activeTopic)} className="hover:text-primary/70">
                    <X size={12} />
                  </button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  #{activeTag}
                  <button onClick={() => handleHashtagClick(activeTag)} className="hover:text-primary/70">
                    <X size={12} />
                  </button>
                </span>
              )}
              {debouncedQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                  جستجو: {debouncedQuery}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                پاک کردن
              </button>
            </div>
          </div>
        )}

        {/* Search Results / Filtered Articles */}
        {hasActiveFilters && (
          <div className="border-t border-border pt-4">
            <div className="px-4 mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {filteredArticles.length > 0
                  ? `${filteredArticles.length} نتیجه`
                  : "نتیجه‌ای یافت نشد"}
              </h2>
            </div>
            <div className="space-y-0">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={refetch} />
              ))}
            </div>
          </div>
        )}

        {/* Default State - Show hint */}
        {!hasActiveFilters && (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <p className="text-sm">موضوعی را انتخاب کنید یا جستجو کنید</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;