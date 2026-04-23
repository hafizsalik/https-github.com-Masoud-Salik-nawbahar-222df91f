import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, CornerUpRight, Share2, Bookmark, BookmarkCheck, ChevronUp, ChevronDown, X } from "lucide-react";
import { formatSolarShort } from "@/lib/solarHijri";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useComments } from "@/hooks/useComments";
import { useCardReactions } from "@/hooks/useCardReactions";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { useViewCount } from "@/hooks/useViewCount";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { useBookmark } from "@/hooks/useBookmark";
import { CommentSection } from "@/components/articles/CommentSection";
import { ArticleRatingModal } from "@/components/admin/ArticleRatingModal";
import { ArticleActionsMenu } from "@/components/articles/ArticleActionsMenu";
import { ArticleReactions } from "@/components/articles/ArticleReactions";
import { SuggestedWriters } from "@/components/profile/SuggestedWriters";
import { ResponseArticles } from "@/components/articles/ResponseArticles";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { useToast } from "@/hooks/use-toast";
import { toPersianNumber } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";

interface ArticleData {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  save_count: number;
  author_id: string;
  editorial_score_science: number;
  editorial_score_ethics: number;
  editorial_score_writing: number;
  editorial_score_timing: number;
  editorial_score_innovation: number;
  author?: {
    display_name: string;
    avatar_url: string | null;
    specialty: string | null;
  };
}

/** Simple HTML content renderer — handles basic formatting from editor */
function ArticleContent({ content, searchQuery }: { content: string; searchQuery?: string }) {
  // Check if content contains HTML tags
  const isHTML = /<[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    return (
      <div
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: highlightText(content, searchQuery) }}
      />
    );
  }

  // Plain text — render with whitespace preserved
  return (
    <div className="text-foreground whitespace-pre-wrap leading-[2.2] text-[15px]">
      {highlightText(content, searchQuery)}
    </div>
  );
}

/** Highlight search matches in text */
function highlightText(text: string, searchQuery?: string) {
  if (!searchQuery || !searchQuery.trim()) return text;

  const query = searchQuery.trim();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  if (/<[a-z][\s\S]*>/i.test(text)) {
    // HTML content - highlight text nodes only
    return text.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, textContent) => {
      if (tag) return tag; // Return HTML tags unchanged
      if (textContent) {
        return textContent.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
      }
      return match;
    });
  } else {
    // Plain text
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ?
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded-sm">{part}</mark> :
        part
    );
  }
}

/** Reading progress bar */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const p = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
      setProgress(p);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress >= 100) return null;

  return (
    <div className="fixed top-[44px] left-0 right-0 z-50 h-[2px] bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  // Search highlighting state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { viewCount } = useViewCount(id || "");
  const { summary: reactionSummary, toggleReaction } = useCardReactions(id || "");
  const { responses, responseCount, parentArticle } = useResponseArticles(id || "");
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(id || "");

  const contentLength = article?.content?.length || 0;
  useEngagementTracking(id || "", contentLength);

  const { comments, loading: commentsLoading, submitting, userId, addComment, deleteComment } = useComments(id || "");

  useEffect(() => {
    if (id) fetchArticle(id);
  }, [id]);

  useEffect(() => {
    if (window.location.hash === "#comments" && !loading) {
      const el = document.getElementById("comments");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loading]);

  // Initialize search from URL params
  useEffect(() => {
    const query = searchParams.get("q");
    if (query && query.trim()) {
      setSearchQuery(query.trim());
      setShowSearchBar(true);
    }
  }, [searchParams]);

  const updateMatches = useCallback(() => {
    if (!article || !searchQuery || !contentRef.current) return;

    const content = article.content;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    setTotalMatches(matches ? matches.length : 0);
    setCurrentMatchIndex(0);

    // Auto-scroll to first match
    if (matches && matches.length > 0) {
      setTimeout(() => scrollToMatch(0), 100);
    }
  }, [article, searchQuery]);

  // Update matches when article or search query changes
  useEffect(() => {
    if (article && searchQuery) {
      // Delay to ensure content is rendered
      setTimeout(updateMatches, 50);
    } else {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
    }
  }, [article, searchQuery, updateMatches]);

  const scrollToMatch = (index: number) => {
    if (!contentRef.current || !searchQuery) return;

    const marks = contentRef.current.querySelectorAll('mark');
    if (marks[index]) {
      marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCurrentMatchIndex(index);
    }
  };

  const navigateMatch = (direction: 'prev' | 'next') => {
    if (totalMatches === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % totalMatches;
    } else {
      newIndex = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
    }
    scrollToMatch(newIndex);
  };

  const fetchArticle = async (articleId: string) => {
    setLoading(true);
    const { data: articleData, error } = await supabase
      .from("articles")
      .select("id, title, content, cover_image_url, tags, created_at, save_count, author_id, editorial_score_science, editorial_score_ethics, editorial_score_writing, editorial_score_timing, editorial_score_innovation")
      .eq("id", articleId)
      .eq("status", "published")
      .maybeSingle();

    if (error || !articleData) { navigate("/"); return; }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, specialty")
      .eq("id", articleData.author_id)
      .maybeSingle();

    setArticle({
      ...articleData,
      tags: articleData.tags || [],
      save_count: articleData.save_count || 0,
      editorial_score_science: articleData.editorial_score_science || 0,
      editorial_score_ethics: articleData.editorial_score_ethics || 0,
      editorial_score_writing: articleData.editorial_score_writing || 0,
      editorial_score_timing: articleData.editorial_score_timing || 0,
      editorial_score_innovation: articleData.editorial_score_innovation || 0,
      author: profileData ? {
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        specialty: profileData.specialty,
      } : undefined,
    });
    setLoading(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${id}`;
    if (navigator.share) {
      await navigator.share({ title: article?.title || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد ✅" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200));
  const articleDescription = article.content.replace(/\s+/g, " ").replace(/<[^>]*>/g, "").slice(0, 155).trim() + "…";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={article.title}
        description={articleDescription}
        ogUrl={`/article/${article.id}`}
        ogType="article"
        ogImage={article.cover_image_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: articleDescription,
          image: article.cover_image_url || undefined,
          datePublished: article.created_at,
          author: {
            "@type": "Person",
            name: article.author?.display_name,
          },
          publisher: {
            "@type": "Organization",
            name: "نوبهار",
            url: "https://nawbahar.lovable.app",
          },
          mainEntityOfPage: `https://nawbahar.lovable.app/article/${article.id}`,
          inLanguage: "fa-AF",
          wordCount: article.content.split(/\s+/).length,
          keywords: article.tags?.join(", "),
        }}
      />

      {/* Reading progress bar */}
      <ReadingProgress />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11 max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={22} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-1">
            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors"
              aria-label={isBookmarked ? "حذف از ذخیره‌شده‌ها" : "ذخیره مقاله"}
            >
              {isBookmarked ? (
                <BookmarkCheck size={18} strokeWidth={1.5} className="text-primary" />
              ) : (
                <Bookmark size={18} strokeWidth={1.5} />
              )}
            </button>
            <button onClick={handleShare} className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors">
              <Share2 size={18} strokeWidth={1.5} />
            </button>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => setRatingModalOpen(true)} className="text-muted-foreground/45 h-8 w-8">
                <Star size={18} strokeWidth={1.5} />
              </Button>
            )}
            <ArticleActionsMenu articleId={article.id} authorId={article.author_id} articleTitle={article.title} />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="sticky top-[44px] z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center gap-2 px-4 py-2 max-w-screen-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مقاله..."
              className="flex-1 px-3 py-1.5 text-sm bg-muted/50 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            {totalMatches > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {toPersianNumber(currentMatchIndex + 1)} از {toPersianNumber(totalMatches)}
              </span>
            )}
            <button
              onClick={() => navigateMatch('prev')}
              disabled={totalMatches === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => navigateMatch('next')}
              disabled={totalMatches === 0}
              className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => {
                setShowSearchBar(false);
                setSearchQuery("");
                setTotalMatches(0);
                setCurrentMatchIndex(0);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Article Content */}
      <main className="max-w-screen-md mx-auto px-5 py-8 pb-24">
        {/* Response indicator */}
        {parentArticle && (
          <Link
            to={`/article/${parentArticle.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <CornerUpRight size={12} strokeWidth={1.5} className="text-primary/50" />
            <span>در پاسخ به:</span>
            <span className="text-foreground font-medium">{parentArticle.title.slice(0, 40)}{parentArticle.title.length > 40 ? "…" : ""}</span>
          </Link>
        )}

        {/* Author Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Link to={`/profile/${article.author_id}`}>
              {article.author?.avatar_url ? (
                <img src={article.author.avatar_url} alt={article.author.display_name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{article.author?.display_name?.charAt(0)}</span>
                </div>
              )}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/profile/${article.author_id}`} className="text-[13px] font-medium text-foreground hover:underline">
                  {article.author?.display_name}
                </Link>
                {user?.id !== article.author_id && <FollowButton userId={article.author_id} />}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 mt-0.5">
                <span>{formatSolarShort(article.created_at)}</span>
                <span className="text-muted-foreground/20">·</span>
                <span>{toPersianNumber(readTime)} دقیقه مطالعه</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-extrabold text-foreground leading-[1.7] mb-5">{article.title}</h1>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="rounded-lg overflow-hidden mb-8">
            <img src={article.cover_image_url} alt={article.title} className="w-full object-cover" loading="lazy" />
          </div>
        )}

        {/* Content */}
        <article className="article-content" ref={contentRef}>
          <ArticleContent content={article.content} searchQuery={searchQuery} />
        </article>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-8">
            {article.tags.map(tag => (
              <Link
                key={tag}
                to={`/explore?tag=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 bg-muted/50 text-muted-foreground/60 rounded-full text-[11px] hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Reactions + Comments */}
        <ArticleReactions
          articleId={article.id}
          summary={reactionSummary}
          commentCount={comments.length}
          onReact={toggleReaction}
          onCommentClick={() => {
            const el = document.getElementById("comments");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Comments Section */}
        <div id="comments" className="pt-2">
          <CommentSection
            comments={comments}
            loading={commentsLoading}
            submitting={submitting}
            userId={userId}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            responses={responses}
          />
        </div>

        {/* Suggested Writers */}
        <div className="mt-8">
          <SuggestedWriters />
        </div>

        {/* Response Articles */}
        <ResponseArticles responses={responses} />

        {/* Related Articles */}
        <RelatedArticles articleId={article.id} tags={article.tags} authorId={article.author_id} />
      </main>

      {/* Admin Rating Modal */}
      {article && (
        <ArticleRatingModal
          articleId={article.id}
          authorId={article.author_id}
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          currentScores={{
            science: article.editorial_score_science,
            ethics: article.editorial_score_ethics,
            writing: article.editorial_score_writing,
            timing: article.editorial_score_timing,
            innovation: article.editorial_score_innovation,
          }}
        />
      )}
    </div>
  );
};

export default Article;
