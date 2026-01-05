import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { usePublishedArticles } from "@/hooks/useArticles";

const Index = () => {
  const { articles, loading, refetch } = usePublishedArticles();

  return (
    <AppLayout>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <ArticleFeed articles={articles} onRefresh={refetch} />
      )}
    </AppLayout>
  );
};

export default Index;
