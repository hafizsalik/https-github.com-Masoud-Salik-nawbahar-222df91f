import { useState, useMemo, useCallback } from "react";
import { CornerUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { useComments } from "@/hooks/useComments";
import { useCardReactions } from "@/hooks/useCardReactions";
import { ArticleActionsMenu } from "./ArticleActionsMenu";
import { cn } from "@/lib/utils";
import { SlideDownComments } from "./SlideDownComments";
import { formatSolarShort } from "@/lib/solarHijri";
import { ArticleCardMetrics } from "./ArticleCardMetrics";
import defaultCover from "@/assets/default-cover.jpg";
import { storage } from "@/lib/storage";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import userIcon from "@/assets/icons/user.svg";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function getExcerpt(content: string, maxChars: number = 180): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars).trim() + "…";
}

function isArticleRead(articleId: string): boolean {
  return storage.get(`article_viewed_${articleId}`, null) !== null;
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    comments,
    loading: commentsLoading,
    userId,
    addComment,
    deleteComment,
    refetch: refetchComments,
    submitting,
  } = useComments(article.id, { lazy: !showComments });

  const { summary: reactionSummary, toggleReaction, ensureFetched } = useCardReactions(article.id, false);

  const coverImage = article.cover_image_url || defaultCover;
  const hasBeenRead = useMemo(() => isArticleRead(article.id), [article.id]);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${article.author_id}`);
  };

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(prev => !prev);
  }, []);

  const handleResponseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/write?response_to=${article.id}`);
  };

  return (
    <article className="group" aria-label={article.title}>
      {/* Response indicator */}
      {article.parent_title && article.parent_article_id && (
        <Link
          to={`/article/${article.parent_article_id}`}
          className="flex items-center gap-1.5 px-4 pt-3 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/40" />
          <span>
            پاسخ به: {article.parent_title.slice(0, 35)}
            {article.parent_title.length > 35 ? "…" : ""}
          </span>
        </Link>
      )}

      <Link to={`/article/${article.id}`} className="block px-4 pt-4 pb-1">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0" style={{ direction: "rtl" }}>
            <button onClick={handleAuthorClick} className="flex items-center gap-2 min-w-0" aria-label={`View ${article.author?.display_name}'s profile`}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author?.display_name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <NawbaharIcon src={userIcon} size={14} className="opacity-40 dark:invert" />
                </div>
              )}
              <span className="text-[14px] font-medium truncate max-w-[120px] text-foreground">
                {article.author?.display_name}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">
              {formatSolarShort(article.created_at)}
            </span>
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex-shrink-0">
              <ArticleActionsMenu articleId={article.id} authorId={article.author_id} articleTitle={article.title} onDelete={onDelete} />
            </div>
          </div>
        </div>

        {/* Title — full width */}
        <h3
          className={cn(
            "text-[17px] font-bold leading-[1.7] line-clamp-2 mb-1.5 transition-colors",
            hasBeenRead ? "text-muted-foreground/60" : "text-foreground"
          )}
        >
          {article.title}
        </h3>

        {/* Content row: excerpt + image */}
        <div className="flex gap-3" style={{ direction: "rtl" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] leading-[1.7] line-clamp-4 text-muted-foreground">
              {getExcerpt(article.content, 180)}
            </p>
          </div>
          <div
            className={cn(
              "w-[88px] h-[88px] flex-shrink-0 rounded-lg overflow-hidden relative bg-muted self-start transition-opacity",
              hasBeenRead && "opacity-40"
            )}
          >
            {!imageLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={coverImage}
              alt=""
              className={cn("w-full h-full object-cover transition-opacity duration-300", imageLoaded ? "opacity-100" : "opacity-0")}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>

        {/* Metrics */}
        <ArticleCardMetrics
          articleId={article.id}
          commentCount={article.comment_count}
          reactionCount={article.reaction_count}
          isRead={hasBeenRead}
          commentsOpen={showComments}
          onCommentClick={handleCommentClick}
          onResponseClick={handleResponseClick}
          reactionSummary={reactionSummary}
          onReact={(type) => { toggleReaction(type); }}
          onReactionHover={ensureFetched}
        />
      </Link>

      {showComments && (
        <div className="border-t border-border/20 mx-4">
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

      {/* Divider */}
      <div className="mx-4 border-b border-border/40" />
    </article>
  );
}
