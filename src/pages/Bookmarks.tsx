import { AppLayout } from "@/components/layout/AppLayout";
import { Bookmark, BookOpen } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { getRelativeTime } from "@/lib/relativeTime";
import { toPersianNumber } from "@/lib/utils";
import defaultCover from "@/assets/default-cover.jpg";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarks, loading } = useProfile(user?.id);

  if (!user) {
    return (
      <AppLayout>
        <SEOHead title="Ø°Ø®ÛŒØ±Ù‡â€ŒØ´Ø¯Ù‡â€ŒÙ‡Ø§" description="Ù…Ù‚Ø§Ù„Ø§Øª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡ Ø´Ù…Ø§ Ø¯Ø± Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/bookmarks" noIndex />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Bookmark size={24} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold mb-2">Ú©ØªØ§Ø¨Ø®Ø§Ù†Ù‡ Ø´Ù…Ø§</h2>
          <p className="text-muted-foreground text-[13px] max-w-[240px] mb-6 leading-relaxed">
            Ø¨Ø±Ø§ÛŒ Ø°Ø®ÛŒØ±Ù‡ Ù…Ù‚Ø§Ù„Ø§Øª ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯
          </p>
          <Button onClick={() => navigate("/auth?view=login")} variant="outline" className="rounded-full px-6 h-9 text-[13px]">
            ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Bookmark size={24} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-bold mb-2">Ú©ØªØ§Ø¨Ø®Ø§Ù†Ù‡ Ø®Ø§Ù„ÛŒ Ø§Ø³Øª</h2>
          <p className="text-muted-foreground text-[13px] max-w-[240px] leading-relaxed">
            Ù…Ù‚Ø§Ù„Ø§ØªÛŒ Ú©Ù‡ Ø°Ø®ÛŒØ±Ù‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒØ¯ Ø§ÛŒÙ†Ø¬Ø§ Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Ø°Ø®ÛŒØ±Ù‡â€ŒØ´Ø¯Ù‡â€ŒÙ‡Ø§" description="Ù…Ù‚Ø§Ù„Ø§Øª Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯Ù‡ Ø´Ù…Ø§ Ø¯Ø± Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/bookmarks" noIndex />
      <div className="animate-fade-in">
        {/* Header */}
        <div className="sticky top-11 z-30 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <h1 className="text-[15px] font-bold flex items-center gap-2">
            <BookOpen size={17} strokeWidth={1.5} className="text-muted-foreground/45" />
            Ú©ØªØ§Ø¨Ø®Ø§Ù†Ù‡
          </h1>
          <span className="text-[11px] text-muted-foreground/40">{toPersianNumber(bookmarks.length)} Ù…Ù‚Ø§Ù„Ù‡</span>
        </div>

        {/* Bookmarks List */}
        <div>
          {bookmarks.map((article, index) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="block px-5 py-4 border-b border-border/40 hover:bg-muted/20 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-[14px] line-clamp-2 leading-relaxed">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground/40 mt-1.5">
                    {getRelativeTime(article.created_at)}
                  </p>
                </div>
                <img
                  src={article.cover_image_url || defaultCover}
                  alt=""
                  className="w-[56px] h-[56px] rounded object-cover shrink-0"
                  loading="lazy"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Bookmarks;
