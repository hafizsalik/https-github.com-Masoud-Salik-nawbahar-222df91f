import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Hash, X, User, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const topics = [
  { id: "politics", label: "سیاست", emoji: "🏛️" },
  { id: "culture", label: "فرهنگ", emoji: "🎭" },
  { id: "science", label: "علم", emoji: "🔬" },
  { id: "society", label: "جامعه", emoji: "👥" },
  { id: "economy", label: "اقتصاد", emoji: "💰" },
  { id: "health", label: "سلامت", emoji: "🏥" },
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    if (category) setActiveTopic(category);
    if (tag) setActiveTag(tag);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    if (activeTopic) {
      result = result.filter((article) =>
        article.tags?.some((tag) =>
          tag.toLowerCase() === activeTopic.toLowerCase()
        )
      );
    }

    if (activeTag) {
      result = result.filter((article) =>
        article.tags?.some((tag) =>
          tag.toLowerCase() === activeTag.toLowerCase()
        )
      );
    }

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
      <div className="space-y-5 animate-fade-in">
        {/* Search Bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="جستجوی مقالات، نویسندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pr-10 bg-muted border-0 rounded-xl h-11 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* User Search Results */}
          {suggestedUsers.length > 0 && isSearchFocused && (
            <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-slide-down">
              <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/50">نویسندگان</p>
              {suggestedUsers.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={16} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.display_name}</p>
                    {user.specialty && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{user.specialty}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Topics */}
        <div className="px-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            موضوعات
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 btn-press",
                  activeTopic === topic.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <span>{topic.emoji}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">هشتگ‌های داغ</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 btn-press",
                  activeTag === hashtag
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
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
          <div className="px-4 animate-slide-down">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {topics.find(t => t.id === activeTopic)?.emoji}
                  {topics.find(t => t.id === activeTopic)?.label}
                  <button onClick={() => handleTopicClick(activeTopic)} className="hover:text-primary/70 mr-1">
                    <X size={12} />
                  </button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  #{activeTag}
                  <button onClick={() => handleHashtagClick(activeTag)} className="hover:text-primary/70 mr-1">
                    <X size={12} />
                  </button>
                </span>
              )}
              {debouncedQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs">
                  جستجو: {debouncedQuery}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-destructive hover:underline font-medium"
              >
                پاک کردن
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasActiveFilters && (
          <div className="border-t border-border pt-4">
            <div className="px-4 mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {filteredArticles.length > 0
                  ? `${filteredArticles.length} نتیجه یافت شد`
                  : "نتیجه‌ای یافت نشد"}
              </h2>
            </div>
            <div className="space-y-4 px-3">
              {filteredArticles.map((article, index) => (
                <div 
                  key={article.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ArticleCard article={article} onDelete={refetch} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default State */}
        {!hasActiveFilters && (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              موضوعی را انتخاب کنید یا جستجو کنید
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
