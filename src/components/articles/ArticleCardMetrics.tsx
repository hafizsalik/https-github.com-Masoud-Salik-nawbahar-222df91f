import { CheckCheck } from "lucide-react";
import { cn, toPersianNumber } from "@/lib/utils";
import { ReactionPickerButton } from "./ReactionPickerButton";
import { type ReactionKey, type ReactionSummary, REACTION_EMOJIS, REACTION_LABELS, REACTION_COLORS } from "@/hooks/useCardReactions";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import commentIcon from "@/assets/icons/comment.svg";
import responseIcon from "@/assets/icons/response.svg";

interface ArticleCardMetricsProps {
  articleId: string;
  commentCount: number;
  reactionCount: number;
  reactionsFetched?: boolean;
  isRead: boolean;
  commentsOpen: boolean;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
  onReactionHover?: () => void;
  isProcessing?: boolean;
}

export function ArticleCardMetrics({
  articleId,
  commentCount,
  reactionCount,
  reactionsFetched = false,
  isRead,
  commentsOpen,
  onCommentClick,
  onResponseClick,
  reactionSummary,
  onReact,
  onReactionHover,
  isProcessing = false,
}: ArticleCardMetricsProps) {
  const { totalCount, userReaction } = reactionSummary;

  // Once fetched, trust live totalCount (so removing a reaction can drop to 0
  // without snapping back to the stale denormalized count). Before fetch,
  // show the denormalized DB value so the UI isn't blank on first paint.
  const displayReactionCount = reactionsFetched ? totalCount : reactionCount;
  const displayCommentCount = commentCount || 0;
  const iconBase = "opacity-25 dark:invert";

  return (
    <div className="mt-3 pb-2">
      <div className="flex items-center justify-between" style={{ direction: "rtl" }}>
        {/* Right side: reaction + comment + response */}
        <div className="flex items-center gap-6">
          {/* Reactions — LinkedIn-style floating card picker */}
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <ReactionPickerButton
              userReaction={userReaction}
              onReact={onReact}
              isProcessing={isProcessing}
              count={displayReactionCount}
            />
            {/* User reaction indicator badge */}
            {userReaction && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ring-1"
                style={{
                  backgroundColor: REACTION_COLORS[userReaction]?.bg,
                  color: REACTION_COLORS[userReaction]?.text,
                  borderColor: REACTION_COLORS[userReaction]?.ring,
                }}
              >
                {REACTION_EMOJIS[userReaction]}
                <span className="hidden sm:inline">{REACTION_LABELS[userReaction]}</span>
              </span>
            )}
            {displayReactionCount > 0 && (
              <span
                className={cn(
                  "text-[13px] tabular-nums transition-colors",
                  userReaction ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
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
