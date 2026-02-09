import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { usePublishedArticles } from "@/hooks/useArticles";

const Index = () => {
  const { articles, loading, refetch } = usePublishedArticles();

  return (
    <AppLayout>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">در حال بارگذاری...</p>
        </div>
      ) : (
        <ArticleFeed articles={articles} onRefresh={refetch} />
      )}
    </AppLayout>
  );
};

export default Index;