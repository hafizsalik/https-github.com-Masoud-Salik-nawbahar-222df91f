import { useState } from "react";
import { Eye, MessageCircle, CornerDownLeft, CornerUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
import { useLatestComment } from "@/hooks/useLatestComment";
import { ArticleActionsMenu } from "./ArticleActionsMenu";
import { getRelativeTime } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";
import { SlideDownComments } from "./SlideDownComments";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function calculateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} دقیقه`;
}

function getExcerpt(content: string, maxChars: number = 150): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "...";
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading, userId, addComment, deleteComment, refetch: refetchComments, submitting } = useComments(article.id);
  const { responseCount, parentArticle } = useResponseArticles(article.id);
  const { latestComment } = useLatestComment(article.id);
  const [showComments, setShowComments] = useState(false);
  const [interactedIcons, setInteractedIcons] = useState<Record<string, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewCount = (article as any).view_count || 0;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
    setInteractedIcons(prev => ({ ...prev, comment: true }));
  };

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
    setInteractedIcons(prev => ({ ...prev, response: true }));
  };

  const formatCount = (count: number) => count > 0 ? count : null;

  return (
    <article className="bg-card rounded-xl border border-border/50 overflow-hidden elevated animate-fade-in transition-shadow duration-200 hover:shadow-md">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={12} strokeWidth={1.5} />
          <span>پاسخ به: {parentArticle.title.slice(0, 40)}{parentArticle.title.length > 40 ? '...' : ''}</span>
        </Link>
      )}

      {/* Top Row: Author + Date + Menu */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={handleAuthorClick} 
              className="flex items-center gap-2.5 group"
              aria-label={`پروفایل ${article.author?.display_name}`}
            >
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                  loading="lazy"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary text-[11px] font-semibold">
                    {article.author?.display_name?.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {article.author?.display_name}
              </span>
            </button>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground">
              {getRelativeTime(article.created_at)}
            </span>
          </div>

          <div onClick={(e) => e.preventDefault()}>
            <ArticleActionsMenu
              articleId={article.id}
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>
      </div>

      <Link to={`/article/${article.id}`} className="block">
        {/* Title */}
        <div className="px-4 pb-3">
          <h3 className="text-[15px] font-semibold text-foreground leading-7 line-clamp-2 hover:text-primary transition-colors">
            {article.title}
          </h3>
        </div>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="aspect-[16/9] overflow-hidden bg-muted mx-4 rounded-lg relative">
            {!imageLoaded && (
              <div className="absolute inset-0 skeleton" />
            )}
            <img
              src={article.cover_image_url}
              alt=""
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )}

        {/* Excerpt */}
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground leading-6 line-clamp-3">
            {getExcerpt(article.content, 180)}
          </p>
        </div>
      </Link>

      {/* Bottom Interaction Bar */}
      <div className="px-4 pb-4 flex items-center gap-4">
        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {calculateReadTime(article.content)}
        </span>
        
        {/* View count */}
        <div className={cn(
          "flex items-center gap-1 transition-colors duration-200",
          interactedIcons.view ? "text-primary" : "text-muted-foreground"
        )}>
          <Eye size={14} strokeWidth={1.5} />
          {formatCount(viewCount) && (
            <span className="text-[11px]">{viewCount}</span>
          )}
        </div>
        
        {/* Comment count */}
        <button 
          onClick={handleCommentClick}
          className={cn(
            "flex items-center gap-1 transition-all duration-200 btn-press",
            interactedIcons.comment ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`${comments.length} نظر`}
        >
          <MessageCircle size={14} strokeWidth={1.5} />
          {formatCount(comments.length) && (
            <span className="text-[11px]">{comments.length}</span>
          )}
        </button>
        
        {/* Response count */}
        <button 
          onClick={handleResponseClick}
          className={cn(
            "flex items-center gap-1 transition-all duration-200 btn-press",
            interactedIcons.response ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`${responseCount} پاسخ`}
        >
          <CornerDownLeft size={14} strokeWidth={1.5} />
          {formatCount(responseCount) && (
            <span className="text-[11px]">{responseCount}</span>
          )}
        </button>
      </div>

      {/* Latest Comment Teaser */}
      {latestComment && !showComments && (
        <div className="px-4 pb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-sm border border-border/30">
            <span className="font-medium text-foreground">{latestComment.author_name}:</span>
            <span className="text-muted-foreground mr-1.5 line-clamp-1">{latestComment.content}</span>
          </div>
        </div>
      )}

      {/* Slide-down Comments Panel */}
      <SlideDownComments
        isOpen={showComments}
        articleId={article.id}
        comments={comments}
        loading={commentsLoading}
        submitting={submitting}
        userId={userId}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        onClose={() => setShowComments(false)}
        refetch={refetchComments}
      />
    </article>
  );
}
