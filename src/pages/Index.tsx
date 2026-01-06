import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { usePublishedArticles } from "@/hooks/useArticles";
import { useFollowingIds } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Index = () => {
  const { articles, loading, refetch } = usePublishedArticles();
  const { followingIds, loading: followingLoading } = useFollowingIds();
  const { user } = useAuth();
  const [feedMode, setFeedMode] = useState<"all" | "following">("all");

  const filteredArticles = useMemo(() => {
    if (feedMode === "following" && followingIds.length > 0) {
      return articles.filter(article => followingIds.includes(article.author_id));
    }
    return articles;
  }, [articles, feedMode, followingIds]);

  return (
    <AppLayout>
      {/* Feed Toggle */}
      {user && (
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex">
            <button
              onClick={() => setFeedMode("all")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                feedMode === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              همه
            </button>
            <button
              onClick={() => setFeedMode("following")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                feedMode === "following"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              دنبال‌شده‌ها
            </button>
          </div>
        </div>
      )}

      {loading || followingLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : feedMode === "following" && filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-muted-foreground text-sm">
            {followingIds.length === 0
              ? "هنوز کسی را دنبال نکرده‌اید"
              : "مقاله‌ای از نویسندگان دنبال‌شده یافت نشد"}
          </p>
        </div>
      ) : (
        <ArticleFeed articles={filteredArticles} onRefresh={refetch} />
      )}
    </AppLayout>
  );
};

export default Index;
