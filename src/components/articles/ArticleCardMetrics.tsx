import { CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";
import { useState } from "react";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import commentIcon from "@/assets/icons/comment.svg";
import responseIcon from "@/assets/icons/response.svg";

interface ArticleCardMetricsProps {
  articleId: string;
  commentCount: number;
  reactionCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
  onReactionHover?: () => void;
}

export function ArticleCardMetrics({
  articleId,
  commentCount,
  reactionCount,
  isRead,
  commentsOpen,
  onCommentClick,
  onResponseClick,
  reactionSummary,
  onReact,
  onReactionHover,
}: ArticleCardMetricsProps) {
  const { totalCount, userReaction, topTypes } = reactionSummary;

  const displayReactionCount = totalCount > 0 ? totalCount : reactionCount;
  const displayCommentCount = commentCount || 0;

  const iconBase = "opacity-25 dark:invert";

  return (
    <div className="mt-3 pb-2">
      <div className="flex items-center justify-between" style={{ direction: "rtl" }}>
        {/* Right side: reaction + comment + response */}
        <div className="flex items-center gap-6">
          {/* Reactions */}
          <div className="flex items-center gap-1.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <ReactionPicker
              userReaction={userReaction}
              onReact={onReact}
              onHover={onReactionHover}
              topTypes={topTypes}
            />
            {displayReactionCount > 0 && (
              <span className="text-[13px] text-muted-foreground">
                {toPersianNumber(displayReactionCount)}
              </span>
            )}
          </div>

          {/* Comments */}
          <button
            onClick={onCommentClick}
            className="flex items-center gap-1.5 transition-colors p-1"
          >
            <NawbaharIcon
              src={commentIcon}
              size={20}
              className={cn(iconBase, commentsOpen && "opacity-60")}
            />
            {displayCommentCount > 0 && (
              <span className="text-[13px] text-muted-foreground">
                {toPersianNumber(displayCommentCount)}
              </span>
            )}
          </button>

          {/* Response */}
          <button
            onClick={onResponseClick}
            className="flex items-center gap-1.5 transition-colors p-1"
          >
            <NawbaharIcon
              src={responseIcon}
              size={20}
              className={iconBase}
            />
          </button>
        </div>

        {/* Left side: read indicator */}
        {isRead && <CheckCheck size={14} strokeWidth={2} className="text-primary/40" aria-label="خوانده شده" />}
      </div>
    </div>
  );
}
