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

function getExcerpt(content: string, maxChars: number = 110): string {
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

  const viewCount = article.view_count || 0;
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
    <article className="group transition-colors hover:bg-muted/10" aria-label={article.title}>
      {article.parent_title && article.parent_article_id && (
        <Link
          to={`/article/${article.parent_article_id}`}
          className="flex items-center gap-1.5 px-5 pt-3 text-[11px] text-muted-foreground/50 hover:text-primary transition-colors"
        >
          <CornerUpRight size={10} strokeWidth={1.5} className="text-primary/40" />
          <span>
            پاسخ به: {article.parent_title.slice(0, 35)}
            {article.parent_title.length > 35 ? "…" : ""}
          </span>
        </Link>
      )}

      <Link to={`/article/${article.id}`} className="block px-5 pt-5 pb-1">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0" style={{ direction: "rtl" }}>
            <button onClick={handleAuthorClick} className="flex items-center gap-2 min-w-0" aria-label={`View ${article.author?.display_name}'s profile`}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author?.display_name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <NawbaharIcon src={userIcon} size={18} className="opacity-40 flex-shrink-0 dark:invert" />
              )}
              <span className="text-[14px] font-medium truncate max-w-[120px]" style={{ color: "#888888" }}>
                {article.author?.display_name}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] font-normal" style={{ color: "#888888" }}>
              {formatSolarShort(article.created_at)}
            </span>
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex-shrink-0">
              <ArticleActionsMenu articleId={article.id} authorId={article.author_id} articleTitle={article.title} onDelete={onDelete} />
            </div>
          </div>
        </div>

        {/* Content row: text + image */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "text-[18px] font-extrabold leading-[2] line-clamp-2 transition-colors",
                hasBeenRead ? "text-muted-foreground/65" : "text-foreground"
              )}
            >
              {article.title}
            </h3>
            <p className="text-[14px] leading-[2] line-clamp-2 mt-1" style={{ color: "#444444" }}>
              {getExcerpt(article.content, 150)}
            </p>
          </div>
          <div
            className={cn(
              "w-[110px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden relative bg-muted/20 self-start mt-1 transition-all duration-300",
              hasBeenRead && "opacity-50 saturate-[0.3]"
            )}
          >
            {!imageLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={coverImage}
              alt=""
              className={cn("w-full h-full object-cover transition-opacity duration-500", imageLoaded ? "opacity-100" : "opacity-0")}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>

        <ArticleCardMetrics
          articleId={article.id}
          viewCount={viewCount}
          commentCount={article.comment_count}
          reactionCount={article.reaction_count}
          responseCount={0}
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
        <div className="border-t border-border/20 mx-5">
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
      <div className="mx-5 border-b border-border/20" />
    </article>
  );
}
