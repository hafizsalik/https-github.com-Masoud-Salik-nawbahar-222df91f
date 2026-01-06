import { Bookmark, Heart, MessageCircle, Share2, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeedArticle } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { useArticleInteractions } from "@/hooks/useArticleInteractions";
import { ArticleMenu } from "./ArticleMenu";
import { useUserRole } from "@/hooks/useUserRole";
import { FollowButton } from "@/components/FollowButton";

interface ArticleCardProps {
  article: FeedArticle;
  onDelete?: () => void;
}

function getReputationRing(score: number): string {
  if (score >= 90) return "ring-2 ring-yellow-500";
  if (score >= 70) return "ring-2 ring-green-500";
  if (score >= 50) return "ring-2 ring-blue-500";
  return "ring-1 ring-border";
}

export function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const { isAdmin, userId } = useUserRole();
  const {
    isLiked,
    isBookmarked,
    likeCount,
    toggleLike,
    toggleBookmark,
  } = useArticleInteractions(article.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: `${window.location.origin}/article/${article.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`);
    }
  };

  const reputationScore = article.author?.reputation_score || 0;

  return (
    <article className="bg-card border-b border-border animate-fade-in">
      <Link to={`/article/${article.id}`} className="block">
        {/* Header: Menu Left, Author Right */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          {/* Three dots menu - Left */}
          <div onClick={(e) => e.preventDefault()}>
            <ArticleMenu
              articleId={article.id}
              authorId={article.author_id}
              currentUserId={userId}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          </div>

          {/* Author - Right */}
          <div className="flex items-center gap-2.5">
            <FollowButton userId={article.author_id} />
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                {reputationScore >= 70 && (
                  <BadgeCheck size={14} className={cn(
                    reputationScore >= 90 ? "text-yellow-500" : "text-green-500"
                  )} />
                )}
                <span className="text-sm font-medium text-foreground">
                  {article.author?.display_name}
                </span>
              </div>
              {article.author?.specialty && (
                <span className="text-xs text-muted-foreground">
                  {article.author.specialty}
                </span>
              )}
            </div>
            <div className={cn("rounded-full", getReputationRing(reputationScore))}>
              {article.author?.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.display_name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {article.author?.display_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pb-3">
          <h3 className="text-lg font-bold text-foreground leading-relaxed line-clamp-2">
            {article.title}
          </h3>
        </div>

        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="px-4 pb-3">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Excerpt */}
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {article.content.substring(0, 140)}...
          </p>
        </div>

        {/* Tags as hashtags */}
        {article.tags && article.tags.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              {article.tags.slice(0, 3).map((tag) => `#${tag}`).join(" ")}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-4 pb-4 flex items-center gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 transition-colors"
          >
            <Heart
              size={20}
              strokeWidth={1.5}
              fill={isLiked ? "currentColor" : "none"}
              className={cn(
                isLiked ? "text-rose-500" : "text-muted-foreground"
              )}
            />
            {likeCount > 0 && (
              <span className="text-xs text-muted-foreground">{likeCount}</span>
            )}
          </button>

          {/* Comment */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageCircle size={20} strokeWidth={1.5} />
          </div>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="transition-colors"
          >
            <Bookmark
              size={20}
              strokeWidth={1.5}
              fill={isBookmarked ? "currentColor" : "none"}
              className={cn(
                isBookmarked ? "text-primary" : "text-muted-foreground"
              )}
            />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="text-muted-foreground"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </Link>
    </article>
  );
}
