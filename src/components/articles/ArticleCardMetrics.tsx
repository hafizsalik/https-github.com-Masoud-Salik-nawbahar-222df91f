import { MessageCircle, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";
import { REACTION_EMOJIS, type ReactionKey, type ReactionSummary } from "@/hooks/useCardReactions";

interface ArticleCardMetricsProps {
  viewCount: number;
  commentCount: number;
  responseCount: number;
  isRead: boolean;
  commentsOpen: boolean;
  tag?: string | null;
  onCommentClick: (e: React.MouseEvent) => void;
  onResponseClick: (e: React.MouseEvent) => void;
  reactionSummary: ReactionSummary;
  onReact: (type: ReactionKey) => void;
}

export function ArticleCardMetrics({
  commentCount,
  isRead,
  commentsOpen,
  tag,
  onCommentClick,
  reactionSummary,
  onReact,
}: ArticleCardMetricsProps) {
  const { types, totalCount, reactorNames, userReaction } = reactionSummary;

  // Build the "X and Y reacted" text
  const buildReactorText = () => {
    if (totalCount === 0) return null;

    const names = [...reactorNames];
    if (userReaction) {
      names.unshift("شما");
    }

    const displayNames = names.slice(0, 2);
    const remaining = totalCount - displayNames.length;

    if (displayNames.length === 0 && remaining > 0) {
      return `${remaining} واکنش`;
    }

    let text = displayNames.join(" و ");
    if (remaining > 0) {
      text += ` و ${remaining} نفر دیگر`;
    }

    return text;
  };

  const reactorText = buildReactorText();

  return (
    <div className="mt-4 pb-5">
      {/* Reaction summary row */}
      {totalCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="flex items-center -space-x-1">
            {types.slice(0, 3).map((type) => (
              <span
                key={type}
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-background border border-border text-[10px] leading-none"
              >
                {REACTION_EMOJIS[type]}
              </span>
            ))}
          </div>
          {reactorText && (
            <span className="text-[11px] text-muted-foreground/60 truncate">
              {reactorText}
            </span>
          )}
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <ReactionPicker userReaction={userReaction} onReact={onReact} />

          <button
            onClick={onCommentClick}
            className={cn(
              "flex items-center gap-1.5 text-[12px] transition-colors",
              commentsOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle size={16} strokeWidth={1.5} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          {isRead && (
            <CheckCheck size={13} strokeWidth={2} className="text-primary/40" />
          )}
        </div>

        {tag && (
          <span className="text-muted-foreground/50 text-[10px]">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
