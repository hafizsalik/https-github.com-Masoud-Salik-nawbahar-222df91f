import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { ArticleFeedSkeleton } from "@/components/articles/ArticleCardSkeleton";
import { ContinueReading } from "@/components/articles/ContinueReading";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { SEOHead } from "@/components/SEOHead";
import { WritingMotivationBanner } from "@/components/WritingMotivationBanner";
import { useSmartFeed } from "@/hooks/useSmartFeed";
import { useAuth } from "@/hooks/useAuth";
import { useWritingMotivation } from "@/hooks/useWritingMotivation";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { storage } from "@/lib/storage";


const Index = () => {
  const { articles, loading, loadingMore, hasMore, refetch, loadMore } = useSmartFeed();
  const { user } = useAuth();
  const motivationData = useWritingMotivation();
  const [bannerVisible, setBannerVisible] = useState(() => {
    const dismissedUntil = storage.get<number>("writing_motivation_dismissed_until", 0);
    if (Date.now() <= dismissedUntil) return false;
    // Once-per-session
    if (sessionStorage.getItem("writing_motivation_seen") === "1") return false;
    return true;
  });

  // Hide for users who already published today
  const showMotivationBanner = !!user && bannerVisible && !motivationData.hasWrittenToday;
  const dismissBanner = () => {
    // Suppress for 7 days after explicit dismissal
    storage.set("writing_motivation_dismissed_until", Date.now() + 7 * 24 * 60 * 60 * 1000);
    sessionStorage.setItem("writing_motivation_seen", "1");
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
