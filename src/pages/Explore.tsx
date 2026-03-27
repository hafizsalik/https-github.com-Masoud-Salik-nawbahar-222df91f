import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { useSmartFeed } from "@/hooks/useSmartFeed";
import { toPersianNumber } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const Explore = () => {
  const { articles, loadMore, hasMore, loading, loadingMore, refetch } = useSmartFeed();
  const [searchParams] = useSearchParams();

  const query = (searchParams.get("q") || "").trim();

  const filteredArticles = useMemo(() => {
    if (!query) return articles;
    const q = query.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.author?.display_name?.toLowerCase().includes(q) ||
      a.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [articles, query]);

  return (
    <AppLayout>
      <SEOHead
        title="کاوش"
        description="خوراک مقالات نوبهار"
        ogUrl="/explore"
      />
      <div className="animate-fade-in">
        <div className="px-5 pt-4 pb-2 border-b border-border/30">
          <h1 className="text-[14px] font-bold text-foreground">خوراک مقالات</h1>
          {query && (
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {filteredArticles.length > 0 ? `${toPersianNumber(filteredArticles.length)} نتیجه` : "نتیجه‌ای یافت نشد"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} onDelete={refetch} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center py-6">
            <Button
              variant="outline"
              className="rounded-full px-6 h-9"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "در حال بارگذاری..." : "نمایش بیشتر"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
