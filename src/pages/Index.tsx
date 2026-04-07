import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { ContinueReading } from "@/components/articles/ContinueReading";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SEOHead } from "@/components/SEOHead";
import { useSmartFeed } from "@/hooks/useSmartFeed";

const Index = () => {
  const { articles, loading, loadingMore, hasMore, refetch, loadMore } = useSmartFeed();

  return (
    <AppLayout>
      <SEOHead
        title="نوبهار"
        ogUrl="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "نوبهار",
          alternateName: "Nawbahar",
          url: "https://nawbahar.lovable.app",
          description: "پلتفرم انتشار محتوای تخصصی برای نخبگان افغانستانی",
          inLanguage: "fa-AF",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://nawbahar.lovable.app/explore?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          {/* Continue Reading section */}
          <ContinueReading />

          <ArticleFeed
            articles={articles}
            onRefresh={refetch}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
          <div className="mt-4 text-center text-[10px] text-muted-foreground">
            نسخه برنامه: {import.meta.env.VITE_APP_VERSION || "unknown"}
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Index;
