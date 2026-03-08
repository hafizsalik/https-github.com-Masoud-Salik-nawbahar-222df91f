import { useState } from "react";
import { MessageSquareText, BarChart3, CornerUpRight, CornerDownLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useResponseArticles } from "@/hooks/useResponseArticles";
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

function getExcerpt(content: string, maxChars: number = 110): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "…";
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const { comments, loading: commentsLoading, userId, addComment, deleteComment, refetch: refetchComments, submitting } = useComments(article.id);
  const { responseCount, parentArticle } = useResponseArticles(article.id);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const viewCount = (article as any).view_count || 0;
  const hasCover = !!article.cover_image_url;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
  };

  const formatCount = (count: number) => count > 0 ? count : null;

  return (
    <article className="group">
      {/* Response indicator */}
      {parentArticle && (
        <Link 
          to={`/article/${parentArticle.id}`}
          className="flex items-center gap-1.5 px-5 pt-3 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/60" />
          <span>پاسخ به: {parentArticle.title.slice(0, 35)}{parentArticle.title.length > 35 ? '…' : ''}</span>
        </Link>
      )}

      <Link to={`/article/${article.id}`} className="block">
        {hasCover ? (
          /* --- Card WITH image: poster + text below --- */
          <div className="px-4 pt-4">
            {/* Image with title overlay */}
            <div className="rounded-t-xl overflow-hidden relative">
              <div className="aspect-[2.6/1] relative bg-muted/30">
                {!imageLoaded && <div className="absolute inset-0 skeleton" />}
                <img
                  src={article.cover_image_url!}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                />
                {/* Soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                
                {/* Title on image */}
                <div className="absolute bottom-0 right-0 left-0 px-4 pb-3">
                  <h3 className="text-[14px] font-bold text-white leading-[1.8] line-clamp-2 drop-shadow-sm">
                    {article.title}
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Excerpt below image — seamlessly connected */}
            <div className="bg-secondary/40 rounded-b-xl px-4 py-2.5">
              <p className="text-[12.5px] text-muted-foreground/70 leading-[1.9] line-clamp-2">
                {getExcerpt(article.content, 110)}
              </p>
            </div>
          </div>
        ) : (
          /* --- Card WITHOUT image: clean text --- */
          <div className="px-5 pt-4">
            <h3 className="text-[15px] font-extrabold text-foreground leading-[1.7] line-clamp-2 tracking-tight">
              {article.title}
            </h3>
            <p className="text-[13px] text-muted-foreground/60 leading-[1.8] line-clamp-2 mt-1">
              {getExcerpt(article.content, 130)}
            </p>
          </div>
        )}
      </Link>

      {/* Footer */}
      <div className="px-5 pt-2.5 pb-4 flex items-center justify-between">
        {/* Left: author + meta */}
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={handleAuthorClick} 
            className="flex items-center gap-1.5 group/author min-w-0"
          >
            {article.author?.avatar_url ? (
              <img
                src={article.author.avatar_url}
                alt=""
                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-[8px] font-bold">
                  {article.author?.display_name?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-[12px] text-foreground/70 group-hover/author:text-primary transition-colors font-medium truncate max-w-[90px]">
              {article.author?.display_name}
            </span>
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
            <span className="text-muted-foreground/20">·</span>
            <span>{getRelativeTime(article.created_at)}</span>
            <span className="text-muted-foreground/20">·</span>
            <span>{calculateReadTime(article.content)}</span>
            {article.tags && article.tags.length > 0 && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <span className="bg-secondary/80 text-secondary-foreground/60 px-2 py-px rounded-full text-[10px]">
                  {article.tags[0]}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {formatCount(viewCount) && (
            <span className="flex items-center gap-0.5 text-muted-foreground/35 text-[11px] px-1">
              <BarChart3 size={10} strokeWidth={1.5} />
              {viewCount}
            </span>
          )}
          {formatCount(responseCount) && (
            <button 
              onClick={handleResponseClick}
              className="flex items-center gap-0.5 text-muted-foreground/35 hover:text-muted-foreground transition-colors px-1 py-1 text-[11px]"
            >
              <CornerDownLeft size={12} strokeWidth={1.5} />
              <span>{responseCount}</span>
            </button>
          )}
          <button 
            onClick={handleCommentClick}
            className={cn(
              "flex items-center gap-0.5 transition-colors px-1 py-1 text-[11px]",
              showComments 
                ? "text-primary" 
                : "text-muted-foreground/35 hover:text-muted-foreground"
            )}
          >
            <MessageSquareText size={12} strokeWidth={1.5} />
            {formatCount(comments.length) && (
              <span>{comments.length}</span>
            )}
          </button>
          <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
            <ArticleActionsMenu
              articleId={article.id}
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/30 mx-5">
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
        </div>
      )}
    </article>
  );
}
