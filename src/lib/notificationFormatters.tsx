import { ThumbsUp, Heart, Lightbulb, Smile, Frown, MessageCircle, UserPlus, Bell } from "lucide-react";
import { REACTION_LABELS } from "@/hooks/useCardReactions";

export const REACTION_ICON_MAP: Record<string, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  insightful: Lightbulb,
  laugh: Smile,
  sad: Frown,
};

/**
 * Get the appropriate icon for a notification type
 */
export function getNotificationIcon(type: string, reactionType?: string) {
  const s = 10;
  const sw = 1.8;
  const cls = "text-muted-foreground/60";
  if (type === "like" && reactionType) {
    const Icon = REACTION_ICON_MAP[reactionType] || ThumbsUp;
    return <Icon size={s} strokeWidth={sw} className={cls} />;
  }
  switch (type) {
    case "like":
      return <ThumbsUp size={s} strokeWidth={sw} className={cls} />;
    case "comment":
      return <MessageCircle size={s} strokeWidth={sw} className={cls} />;
    case "follow":
      return <UserPlus size={s} strokeWidth={sw} className={cls} />;
    case "new_article":
      return <Bell size={s} strokeWidth={sw} className={cls} />;
    default:
      return <Bell size={s} strokeWidth={sw} className="text-muted-foreground/40" />;
  }
}

/**
 * Generate notification text based on type and data
 */
export function getNotificationText(
  type: string,
  actorName: string,
  articleTitle?: string,
  extras?: { commentPreview?: string; reactionType?: string },
  batchCount?: number
) {
  const reactionLabel = extras?.reactionType ? REACTION_LABELS[extras.reactionType] : null;

  switch (type) {
    case "like":
      return (
        <>
          {batchCount > 1 ? (
            <>
              <strong className="font-medium">{batchCount} نفر</strong>
              {reactionLabel
                ? <> واکنش <span className="text-foreground/70 font-medium">«{reactionLabel}»</span> نشان دادند</>
                : <> واکنش نشان دادند</>
              }
            </>
          ) : (
            <>
              <strong className="font-medium">{actorName}</strong>
              {reactionLabel
                ? <> واکنش <span className="text-foreground/70 font-medium">«{reactionLabel}»</span> نشان داد</>
                : <> واکنش نشان داد</>
              }
            </>
          )}
          {articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    case "comment":
      return (
        <>
          {batchCount > 1 ? (
            <>
              <strong className="font-medium">{batchCount} نظر جدید</strong> دریافت کردید
            </>
          ) : (
            <>
              <strong className="font-medium">{actorName}</strong> نظر داد
            </>
          )}
          {extras?.commentPreview && batchCount === 1 && (
            <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              «{extras.commentPreview}»
            </span>
          )}
          {!extras?.commentPreview && articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    case "follow":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> شما را دنبال کرد
        </>
      );
    case "new_article":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> مقاله جدیدی منتشر کرد
          {articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    default:
      return <span>اعلان جدید</span>;
  }
}

/**
 * Group notifications by time period
 */
export function groupByTime(notifications: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: any[] }[] = [
    { label: "امروز", items: [] },
    { label: "این هفته", items: [] },
    { label: "قبل‌تر", items: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (d >= today) {
      groups[0].items.push(n);
    } else if (d >= weekAgo) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  }

  return groups.filter(g => g.items.length > 0);
}