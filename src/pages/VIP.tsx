import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSmartFeed } from "@/hooks/useSmartFeed";
import { SEOHead } from "@/components/SEOHead";

const VIP = () => {
  const { articles, loading, loadingMore, hasMore, refetch, loadMore } = useSmartFeed();

  return (
    <AppLayout>
      <SEOHead
        title="مقالات"
        description="فید مقالات نوبهار"
        ogUrl="/vip"
      />
      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="animate-fade-in">
          <div className="sticky top-11 z-30 bg-background border-b border-border px-5 py-3">
            <h1 className="text-[15px] font-bold">مقالات</h1>
          </div>
          <ArticleFeed 
            articles={articles} 
            onRefresh={refetch}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      )}
    </AppLayout>
  );
};

export default VIP;
