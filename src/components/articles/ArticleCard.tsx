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

  // Shared author row
  const authorRow = (
    <button onClick={handleAuthorClick} className="flex items-center gap-1.5 group/author min-w-0">
      {article.author?.avatar_url ? (
        <img src={article.author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" loading="lazy" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-[8px] font-bold">{article.author?.display_name?.charAt(0)}</span>
        </div>
      )}
      <span className="text-[11px] text-foreground/60 group-hover/author:text-primary transition-colors font-medium truncate max-w-[80px]">
        {article.author?.display_name}
      </span>
      <span className="text-muted-foreground/25 text-[9px]">·</span>
      <span className="text-[10px] text-muted-foreground/40">{getRelativeTime(article.created_at)}</span>
    </button>
  );

  // Shared actions row
  const actionsRow = (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground/30">{calculateReadTime(article.content)}</span>
      {formatCount(viewCount) && (
        <span className="flex items-center gap-0.5 text-muted-foreground/25 text-[10px] px-0.5">
          <BarChart3 size={9} strokeWidth={1.5} />
          {viewCount}
        </span>
      )}
      {formatCount(responseCount) && (
        <button 
          onClick={handleResponseClick}
          className="flex items-center gap-0.5 text-muted-foreground/25 hover:text-muted-foreground transition-colors px-0.5 py-1 text-[10px]"
        >
          <CornerDownLeft size={9} strokeWidth={1.5} />
          <span>{responseCount}</span>
        </button>
      )}
      <button 
        onClick={handleCommentClick}
        className={cn(
          "flex items-center gap-0.5 transition-colors px-0.5 py-1 text-[10px]",
          showComments 
            ? "text-primary" 
            : "text-muted-foreground/25 hover:text-muted-foreground"
        )}
      >
        <MessageSquareText size={9} strokeWidth={1.5} />
        {formatCount(comments.length) && <span>{comments.length}</span>}
      </button>
    </div>
  );

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

      <Link to={`/article/${article.id}`} className="block px-5 pt-5 pb-1">
        {/* Author + menu row */}
        <div className="flex items-center justify-between mb-2.5">
          {authorRow}
          <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
            <ArticleActionsMenu
              articleId={article.id}
              authorId={article.author_id}
              articleTitle={article.title}
            />
          </div>
        </div>

        {hasCover ? (
          /* --- Card WITH image: text-first with thumbnail --- */
          <div className="flex gap-3.5">
            {/* Text side — dominant */}
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-[15.5px] font-bold text-foreground leading-[1.85] line-clamp-2">
                {article.title}
              </h3>
              <p className="text-[12px] text-muted-foreground/55 leading-[1.95] line-clamp-2 mt-1">
                {getExcerpt(article.content, 130)}
              </p>
            </div>
            
            {/* Thumbnail — complementary */}
            <div className="w-[108px] h-[108px] flex-shrink-0 rounded-xl overflow-hidden relative bg-muted/20">
              {!imageLoaded && <div className="absolute inset-0 skeleton rounded-xl" />}
              <img
                src={article.cover_image_url!}
                alt=""
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-500 saturate-[0.88] brightness-[0.98]",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
              />
              {/* Subtle editorial tint */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent mix-blend-multiply" />
            </div>
          </div>
        ) : (
          /* --- Card WITHOUT image: pure text --- */
          <div>
            <h3 className="text-[15.5px] font-bold text-foreground leading-[1.85] line-clamp-2">
              {article.title}
            </h3>
            <p className="text-[12px] text-muted-foreground/55 leading-[1.95] line-clamp-3 mt-1">
              {getExcerpt(article.content, 180)}
            </p>
          </div>
        )}

        {/* Tags + actions footer */}
        <div className="flex items-center justify-between mt-3">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {article.tags && article.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-secondary/70 text-muted-foreground/50 px-2 py-0.5 rounded-full text-[10px]">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Actions */}
          {actionsRow}
        </div>
      </Link>

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
