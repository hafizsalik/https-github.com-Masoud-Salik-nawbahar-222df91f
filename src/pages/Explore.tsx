import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

const topics = [
  { id: "politics", label: "سیاست", icon: "🏛️", color: "from-blue-500/20 to-blue-600/10" },
  { id: "culture", label: "فرهنگ", icon: "🎭", color: "from-purple-500/20 to-purple-600/10" },
  { id: "science", label: "علم", icon: "🔬", color: "from-green-500/20 to-green-600/10" },
  { id: "society", label: "جامعه", icon: "👥", color: "from-orange-500/20 to-orange-600/10" },
  { id: "economy", label: "اقتصاد", icon: "📊", color: "from-yellow-500/20 to-yellow-600/10" },
  { id: "health", label: "سلامت", icon: "🏥", color: "from-red-500/20 to-red-600/10" },
];

const trendingHashtags = [
  "افغانستان",
  "ادبیات",
  "تاریخ",
  "هنر",
  "فناوری",
  "آموزش",
  "محیط_زیست",
  "ورزش",
];

const Explore = () => {
  const { articles, refetch } = usePublishedArticles();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    let result = articles;

    // Filter by topic
    if (activeTopic) {
      result = result.filter((article) =>
        article.tags?.some((tag) =>
          tag.toLowerCase().includes(activeTopic.toLowerCase())
        )
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.author?.display_name?.toLowerCase().includes(query) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [articles, activeTopic, searchQuery]);

  const handleTopicClick = (topicId: string) => {
    setActiveTopic(activeTopic === topicId ? null : topicId);
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(hashtag);
    setActiveTopic(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="px-4 pt-2">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="جستجوی مقالات، موضوعات، نویسندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 bg-muted border-0 rounded-xl h-12 text-base"
            />
          </div>
        </div>

        {/* Topic Grid */}
        <div className="px-4">
          <h2 className="text-base font-semibold text-foreground mb-3">موضوعات</h2>
          <div className="grid grid-cols-3 gap-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                  "bg-gradient-to-br border",
                  topic.color,
                  activeTopic === topic.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/50 hover:border-border"
                )}
              >
                <span className="text-2xl mb-1">{topic.icon}</span>
                <span className="text-sm font-medium text-foreground">{topic.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">هشتگ‌های داغ</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag}
                onClick={() => handleHashtagClick(hashtag)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors",
                  searchQuery === hashtag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Hash size={14} />
                {hashtag}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results / Filtered Articles */}
        {(searchQuery || activeTopic) && (
          <div className="border-t border-border pt-4">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {filteredArticles.length > 0
                  ? `${filteredArticles.length} نتیجه`
                  : "نتیجه‌ای یافت نشد"}
              </h2>
              {(searchQuery || activeTopic) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTopic(null);
                  }}
                  className="text-sm text-primary"
                >
                  پاک کردن
                </button>
              )}
            </div>
            <div className="space-y-0">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={refetch} />
              ))}
            </div>
          </div>
        )}

        {/* Default State - Show hint */}
        {!searchQuery && !activeTopic && (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <p className="text-sm">موضوعی را انتخاب کنید یا جستجو کنید</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;