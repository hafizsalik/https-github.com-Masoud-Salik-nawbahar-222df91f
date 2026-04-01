import { useMemo, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Hash, Flame } from "lucide-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn, toPersianNumber } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SuggestedWriters } from "@/components/profile/SuggestedWriters";

const topics = [
  { id: "politics", label: "سیاست", emoji: "🏛️" },
  { id: "culture", label: "فرهنگ", emoji: "🎭" },
  { id: "science", label: "علم", emoji: "🔬" },
  { id: "society", label: "جامعه", emoji: "👥" },
  { id: "economy", label: "اقتصاد", emoji: "💰" },
  { id: "health", label: "سلامت", emoji: "🏥" },
];

const trendingHashtags = [
  "افغانستان", "ادبیات", "تاریخ", "هنر", "فناوری", "آموزش",
];

const Explore = () => {
  const { articles, refetch } = usePublishedArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    if (category) setActiveTopic(category);
    if (tag) setActiveTag(tag);
  }, [searchParams]);

  const query = (searchParams.get("q") || "").trim();

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeTopic) result = result.filter(a => a.tags?.some(t => t.toLowerCase() === activeTopic.toLowerCase()));
    if (activeTag) result = result.filter(a => a.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase()));
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) ||
        a.author?.display_name?.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, activeTopic, activeTag, query]);

  const trendingArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => ((b.reaction_count || 0) + (b.comment_count || 0) + (b.view_count || 0)) - ((a.reaction_count || 0) + (a.comment_count || 0) + (a.view_count || 0)))
      .slice(0, 8);
  }, [articles]);

  const handleTopicClick = (topicId: string) => {
    const newTopic = activeTopic === topicId ? null : topicId;
    setActiveTopic(newTopic);
    setActiveTag(null);
    setSearchParams(newTopic ? { category: newTopic } : {});
  };

  const handleHashtagClick = (hashtag: string) => {
    setActiveTag(activeTag === hashtag ? null : hashtag);
    setActiveTopic(null);
    setSearchParams(activeTag !== hashtag ? { tag: hashtag } : {});
  };

  const clearFilters = () => { setActiveTopic(null); setActiveTag(null); setSearchParams({}); };
  const hasActiveFilters = Boolean(query || activeTopic || activeTag);

  return (
    <AppLayout>
      <SEOHead
        title="کاوش"
        description="جستجو و کاوش مقالات تخصصی نوبهار. موضوعات سیاست، فرهنگ، علم، جامعه، اقتصاد و سلامت."
        ogUrl="/explore"
      />
      <div className="animate-fade-in">
        {/* Topics */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5 flex-shrink-0",
                  activeTopic === topic.id
                    ? "bg-foreground text-background"
                    : "bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-[12px]">{topic.emoji}</span>
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] transition-all duration-200",
                  activeTag === hashtag
                    ? "bg-foreground text-background"
                    : "text-muted-foreground/45 hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Hash size={8} strokeWidth={2} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters bar */}
        {hasActiveFilters && (
          <div className="px-5 pb-2 animate-slide-down">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTopic && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  {topics.find(t => t.id === activeTopic)?.emoji} {topics.find(t => t.id === activeTopic)?.label}
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  #{activeTag}
                </span>
              )}
              {query && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground rounded-full text-[10px] font-medium">
                  {query}
                </span>
              )}
              <button onClick={clearFilters} className="text-[10px] text-muted-foreground/40 hover:text-foreground transition-colors">پاک کردن</button>
            </div>
          </div>
        )}

        {/* Results or Trending */}
        {hasActiveFilters ? (
          <div className="border-t border-border/30">
            <div className="px-5 py-2">
              <p className="text-[11px] text-muted-foreground/40">
                {filteredArticles.length > 0 ? `${toPersianNumber(filteredArticles.length)} نتیجه` : "نتیجه‌ای یافت نشد"}
              </p>
            </div>
            <div className="divide-y divide-border/30">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={refetch} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="border-t border-border/30">
              <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
                <Flame size={14} strokeWidth={1.5} className="text-muted-foreground/40" />
                <span className="text-[12px] font-semibold text-muted-foreground/50">پرطرفدارترین‌ها</span>
              </div>
              <div className="divide-y divide-border/30">
                {trendingArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} onDelete={refetch} />
                ))}
              </div>
            </div>
            <div className="mt-6 px-5">
              <SuggestedWriters />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
