import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { ContinueReading } from "@/components/articles/ContinueReading";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SEOHead } from "@/components/SEOHead";
import { WritingMotivationBanner } from "@/components/WritingMotivationBanner";
import { useSmartFeed } from "@/hooks/useSmartFeed";
import { useAuth } from "@/hooks/useAuth";
import { useWritingMotivation } from "@/hooks/useWritingMotivation";
import { storage } from "@/lib/storage";

const Index = () => {
  const { articles, loading, loadingMore, hasMore, refetch, loadMore } = useSmartFeed();
  const { user } = useAuth();
  const motivationData = useWritingMotivation();
  const [bannerVisible, setBannerVisible] = useState(() => {
    const dismissedUntil = storage.get<number>("writing_motivation_dismissed_until", 0);
    return Date.now() > dismissedUntil;
  });

  const showMotivationBanner = !!user && bannerVisible;
  const dismissBanner = () => {
    storage.set("writing_motivation_dismissed_until", Date.now() + 4 * 60 * 60 * 1000);
    setBannerVisible(false);
  };

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
          {showMotivationBanner && (
            <WritingMotivationBanner
              position="sticky-top"
              motivationData={motivationData}
              onDismiss={dismissBanner}
            />
          )}

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
