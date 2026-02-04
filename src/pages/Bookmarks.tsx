import { AppLayout } from "@/components/layout/AppLayout";
import { Bookmark, WifiOff, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { getRelativeTime } from "@/lib/relativeTime";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, loading } = useProfile(user?.id);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Bookmark size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3">کتابخانه شما</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
            برای ذخیره مقالات و دسترسی آفلاین، ابتدا وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")} className="btn-press">
            ورود به حساب
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Bookmark size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-3">کتابخانه خالی است</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
            مقالاتی که ذخیره می‌کنید اینجا نمایش داده می‌شوند. آن‌ها حتی بدون اینترنت هم در دسترس هستند.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-full">
            <WifiOff size={14} />
            <span>قابل دسترسی آفلاین</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-4 animate-fade-in">
        {/* Header */}
        <div className="px-4 pb-4 border-b border-border">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            کتابخانه شما
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {bookmarks.length} مقاله ذخیره شده
          </p>
        </div>

        {/* Bookmarks List */}
        <div className="divide-y divide-border">
          {bookmarks.map((article, index) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="block px-4 py-4 hover:bg-muted/30 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex gap-4">
                {article.cover_image_url && (
                  <img
                    src={article.cover_image_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(article.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Bookmarks;
