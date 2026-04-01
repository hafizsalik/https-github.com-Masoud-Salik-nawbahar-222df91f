import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineFallback } from "@/components/OfflineFallback";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, UserPlus, Bell, CheckCheck,
  Settings, X, BellOff, BellRing, ThumbsUp, Lightbulb, Smile, Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, toPersianNumber } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { REACTION_LABELS } from "@/hooks/useCardReactions";

/** Fetch latest comment content by actor on article */
function useNotificationExtras(notifications: any[]) {
  const [extras, setExtras] = useState<Record<string, { commentPreview?: string; reactionType?: string }>>({});

  useEffect(() => {
    const commentNotifs = notifications.filter(n => n.type === "comment" && n.article_id && n.actor_id);
    const reactionNotifs = notifications.filter(n => n.type === "like" && n.article_id && n.actor_id);

    if (commentNotifs.length === 0 && reactionNotifs.length === 0) return;

    const fetchExtras = async () => {
      const result: Record<string, { commentPreview?: string; reactionType?: string }> = {};

      if (commentNotifs.length > 0) {
        for (const n of commentNotifs.slice(0, 20)) {
          const { data } = await supabase
            .from("comments")
            .select("content")
            .eq("article_id", n.article_id)
            .eq("user_id", n.actor_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (data && data[0]) {
            const content = data[0].content;
            result[n.id] = { commentPreview: content.length > 60 ? content.slice(0, 60) + "â€¦" : content };
          }
        }
      }

      if (reactionNotifs.length > 0) {
        for (const n of reactionNotifs.slice(0, 20)) {
          const { data } = await supabase
            .from("reactions")
            .select("reaction_type")
            .eq("article_id", n.article_id)
            .eq("user_id", n.actor_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (data && data[0]) {
            result[n.id] = { ...result[n.id], reactionType: data[0].reaction_type };
          }
        }
      }

      setExtras(result);
    };

    fetchExtras();
  }, [notifications]);

  return extras;
}

const REACTION_ICON_MAP: Record<string, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  insightful: Lightbulb,
  laugh: Smile,
  sad: Frown,
};

function getNotificationIcon(type: string, reactionType?: string) {
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

function getNotificationText(
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
              <strong className="font-medium">{batchCount} Ù†ÙØ±</strong>
              {reactionLabel
                ? <> ÙˆØ§Ú©Ù†Ø´ <span className="text-foreground/70 font-medium">Â«{reactionLabel}Â»</span> Ù†Ø´Ø§Ù† Ø¯Ø§Ø¯Ù†Ø¯</>
                : <> ÙˆØ§Ú©Ù†Ø´ Ù†Ø´Ø§Ù† Ø¯Ø§Ø¯Ù†Ø¯</>
              }
            </>
          ) : (
            <>
              <strong className="font-medium">{actorName}</strong>
              {reactionLabel
                ? <> ÙˆØ§Ú©Ù†Ø´ <span className="text-foreground/70 font-medium">Â«{reactionLabel}Â»</span> Ù†Ø´Ø§Ù† Ø¯Ø§Ø¯</>
                : <> ÙˆØ§Ú©Ù†Ø´ Ù†Ø´Ø§Ù† Ø¯Ø§Ø¯</>
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
              <strong className="font-medium">{batchCount} Ù†Ø¸Ø± Ø¬Ø¯ÛŒØ¯</strong> Ø¯Ø±ÛŒØ§ÙØª Ú©Ø±Ø¯ÛŒØ¯
            </>
          ) : (
            <>
              <strong className="font-medium">{actorName}</strong> Ù†Ø¸Ø± Ø¯Ø§Ø¯
            </>
          )}
          {extras?.commentPreview && batchCount === 1 && (
            <span className="text-muted-foreground/60 block text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              Â«{extras.commentPreview}Â»
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
          <strong className="font-medium">{actorName}</strong> Ø´Ù…Ø§ Ø±Ø§ Ø¯Ù†Ø¨Ø§Ù„ Ú©Ø±Ø¯
        </>
      );
    case "new_article":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> Ù…Ù‚Ø§Ù„Ù‡ Ø¬Ø¯ÛŒØ¯ÛŒ Ù…Ù†ØªØ´Ø± Ú©Ø±Ø¯
          {articleTitle && (
            <span className="text-muted-foreground/50 block text-[11px] mt-0.5 line-clamp-1">
              {articleTitle}
            </span>
          )}
        </>
      );
    default:
      return <span>Ø§Ø¹Ù„Ø§Ù† Ø¬Ø¯ÛŒØ¯</span>;
  }
}

/** Group notifications by time period */
function groupByTime(notifications: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: any[] }[] = [
    { label: "Ø§Ù…Ø±ÙˆØ²", items: [] },
    { label: "Ø§ÛŒÙ† Ù‡ÙØªÙ‡", items: [] },
    { label: "Ù‚Ø¨Ù„â€ŒØªØ±", items: [] },
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

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification,
    settings, updateSettings
  } = useNotifications();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  const extras = useNotificationExtras(notifications);

  const [showSettings, setShowSettings] = useState(false);

  const groups = useMemo(() => groupByTime(notifications), [notifications]);

  const handlePushToggle = async (checked: boolean) => {
    if (checked) await subscribe();
    else await unsubscribe();
  };

  if (!user) {
    return (
      <AppLayout>
        <SEOHead title="Ø§Ø¹Ù„Ø§Ù†Ø§Øª" description="Ø§Ø¹Ù„Ø§Ù†Ø§Øª Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/notifications" noIndex />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <Bell size={22} className="text-muted-foreground/40" aria-hidden="true" />
          </div>
          <h2 className="text-[15px] font-bold mb-1.5">Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§</h2>
          <p className="text-muted-foreground text-[12px] mb-5 max-w-[220px] leading-relaxed">
            Ø¨Ø±Ø§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ø§Ø¹Ù„Ø§Ù† ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯
          </p>
          <Button onClick={() => navigate("/auth?view=login")} variant="outline" className="rounded-full px-5 h-8 text-[12px]">
            ÙˆØ±ÙˆØ¯ / Ø«Ø¨Øª Ù†Ø§Ù…
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Ø§Ø¹Ù„Ø§Ù†Ø§Øª" description="Ø§Ø¹Ù„Ø§Ù†Ø§Øª Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/notifications" noIndex />
      <OfflineFallback>
        <div className="min-h-screen animate-fade-in">
          {/* Header */}
          <div className="sticky top-11 z-30 bg-background border-b border-border/60 px-5 py-2.5 flex items-center justify-between">
            <h1 className="text-[14px] font-bold">Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§</h1>
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label="Ø®ÙˆØ§Ù†Ø¯Ù† Ù‡Ù…Ù‡ Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§"
                >
                  <CheckCheck size={12} aria-hidden="true" />
                  <span>Ø®ÙˆØ§Ù†Ø¯Ù† Ù‡Ù…Ù‡</span>
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={showSettings ? "Ø¨Ø³ØªÙ† ØªÙ†Ø¸ÛŒÙ…Ø§Øª" : "ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§"}
              >
                {showSettings ? <X size={16} strokeWidth={1.5} /> : <Settings size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Push permission prompt */}
          {isSupported && permission === 'default' && (
            <div className="mx-5 mt-3 rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-foreground">Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ø³Ø±ÛŒØ¹</p>
                <p className="text-[11px] text-muted-foreground/60">Ø¨Ø±Ø§ÛŒ Ø¯Ø±ÛŒØ§ÙØª Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ Ø§Ø¬Ø§Ø²Ù‡ Ø¯Ù‡ÛŒØ¯</p>
              </div>
              <Button size="sm" className="h-8 px-3" onClick={() => subscribe()}>
                ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ
              </Button>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="border-b border-border/40 px-5 py-3 animate-slide-down" role="region" aria-label="ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§">
              <div className="space-y-0">
                {isSupported && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <BellRing size={13} className="text-muted-foreground/50" aria-hidden="true" />
                      <div>
                        <span className="text-[12px]">Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù¾ÙˆØ´</span>
                        <p className="text-[10px] text-muted-foreground/40 leading-tight">Ø¯Ø±ÛŒØ§ÙØª Ø®Ø§Ø±Ø¬ Ø§Ø² Ø§Ù¾</p>
                      </div>
                    </div>
                    <Switch checked={isSubscribed} onCheckedChange={handlePushToggle} disabled={permission === 'denied'} aria-label="ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒ Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù¾ÙˆØ´" />
                  </div>
                )}
                {permission === 'denied' && (
                  <div className="text-[10px] text-muted-foreground/60 bg-muted/40 rounded-lg px-3 py-2 mb-1" role="alert">
                    <p>Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ Ø¯Ø± Ù…Ø±ÙˆØ±Ú¯Ø± Ù…Ø³Ø¯ÙˆØ¯ Ø´Ø¯Ù‡â€ŒØ§Ù†Ø¯.</p>
                    <p className="mt-0.5 text-muted-foreground/40 leading-relaxed">
                      Ø¨Ø±Ø§ÛŒ ÙØ¹Ø§Ù„â€ŒØ³Ø§Ø²ÛŒØŒ Ø±ÙˆÛŒ Ø¢ÛŒÚ©ÙˆÙ† Ù‚ÙÙ„ ðŸ”’ Ú©Ù†Ø§Ø± Ø¢Ø¯Ø±Ø³ Ø³Ø§ÛŒØª Ú©Ù„ÛŒÚ© Ú©Ù†ÛŒØ¯ Ùˆ Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ Ø±Ø§ Ù…Ø¬Ø§Ø² Ú©Ù†ÛŒØ¯.
                    </p>
                  </div>
                )}
                {[
                  { key: "comments" as const, icon: MessageCircle, label: "Ù†Ø¸Ø±Ø§Øª" },
                  { key: "likes" as const, icon: Heart, label: "ÙˆØ§Ú©Ù†Ø´â€ŒÙ‡Ø§" },
                  { key: "follows" as const, icon: UserPlus, label: "Ø¯Ù†Ø¨Ø§Ù„â€ŒÚ©Ù†Ù†Ø¯Ù‡â€ŒÙ‡Ø§" },
                ].map(({ key, icon: Icon, label }) => (
                  <div key={key} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Icon size={13} className="text-muted-foreground/50" aria-hidden="true" />
                      <span className="text-[12px]">{label}</span>
                    </div>
                    <Switch
                      checked={settings[key]}
                      onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                      aria-label={`Ø§Ø¹Ù„Ø§Ù† ${label}`}
                    />
                  </div>
                ))}
                
                {/* Smart notification settings */}
                <div className="border-t border-border/20 pt-2 mt-2">
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Bell size={13} className="text-muted-foreground/50" aria-hidden="true" />
                      <div>
                        <span className="text-[12px]">Ú¯Ø±ÙˆÙ‡â€ŒØ¨Ù†Ø¯ÛŒ Ù…Ø´Ø§Ø¨Ù‡</span>
                        <p className="text-[10px] text-muted-foreground/40 leading-tight">ØªØ±Ú©ÛŒØ¨ Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù…Ø´Ø§Ø¨Ù‡</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.batchSimilar}
                      onCheckedChange={(checked) => updateSettings({ batchSimilar: checked })}
                      aria-label="Ú¯Ø±ÙˆÙ‡â€ŒØ¨Ù†Ø¯ÛŒ Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù…Ø´Ø§Ø¨Ù‡"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <Lightbulb size={13} className="text-muted-foreground/50" aria-hidden="true" />
                      <div>
                        <span className="text-[12px]">Ù‡ÙˆØ´Ù…Ù†Ø¯</span>
                        <p className="text-[10px] text-muted-foreground/40 leading-tight">ÙÛŒÙ„ØªØ± Ø¨Ø± Ø§Ø³Ø§Ø³ Ø§ÙˆÙ„ÙˆÛŒØª Ùˆ Ø²Ù…Ø§Ù†</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.contextAware}
                      onCheckedChange={(checked) => updateSettings({ contextAware: checked })}
                      aria-label="Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§ÛŒ Ù‡ÙˆØ´Ù…Ù†Ø¯"
                    />
                  </div>
                  
                  {settings.contextAware && (
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2.5">
                        <BellOff size={13} className="text-muted-foreground/50" aria-hidden="true" />
                        <div>
                          <span className="text-[12px]">Ø³Ø§Ø¹Øªâ€ŒÙ‡Ø§ÛŒ Ø¢Ø±Ø§Ù…Ø´</span>
                          <p className="text-[10px] text-muted-foreground/40 leading-tight">
                            {settings.quietHours.start} - {settings.quietHours.end}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.quietHours.enabled}
                        onCheckedChange={(checked) => updateSettings({ 
                          quietHours: { ...settings.quietHours, enabled: checked } 
                        })}
                        aria-label="Ø³Ø§Ø¹Øªâ€ŒÙ‡Ø§ÛŒ Ø¢Ø±Ø§Ù…Ø´"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16" role="status" aria-label="Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <BellOff size={20} className="text-muted-foreground/35" aria-hidden="true" />
              </div>
              <p className="text-[12px] text-muted-foreground/60">Ù‡Ù†ÙˆØ² Ø§Ø¹Ù„Ø§Ù†ÛŒ Ù†Ø¯Ø§Ø±ÛŒØ¯</p>
            </div>
          ) : (
            <div role="list" aria-label="Ù„ÛŒØ³Øª Ø§Ø¹Ù„Ø§Ù†â€ŒÙ‡Ø§">
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Time group header */}
                  <div className="sticky top-[6.25rem] z-20 bg-muted/50 backdrop-blur-sm px-5 py-1.5 border-b border-border/20">
                    <span className="text-[10.5px] font-semibold text-muted-foreground/50">{group.label}</span>
                  </div>

                  {group.items.map((notification, index) => {
                    const extra = extras[notification.id];
                    return (
                      <div
                        key={notification.id}
                        role="listitem"
                        className={cn(
                          "flex items-start gap-2.5 px-5 py-3 border-b border-border/30 transition-colors relative group",
                          !notification.is_read && "bg-primary/[0.025]",
                          index < 8 && "animate-slide-up"
                        )}
                        style={index < 8 ? { animationDelay: `${index * 20}ms` } : undefined}
                      >
                        <Link
                          to={
                            notification.type === "follow"
                              ? `/profile/${notification.actor_id}`
                              : notification.article_id
                              ? `/article/${notification.article_id}`
                              : "#"
                          }
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          className="flex items-start gap-2.5 flex-1 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
                          aria-label={`Ø§Ø¹Ù„Ø§Ù† Ø§Ø² ${notification.actor?.display_name || "Ú©Ø§Ø±Ø¨Ø±"}`}
                        >
                          {/* Actor avatar */}
                          <div className="relative shrink-0 mt-0.5">
                            {notification.actor?.avatar_url ? (
                              <img
                                src={notification.actor.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground/60">
                                  {notification.actor?.display_name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -left-0.5 w-[18px] h-[18px] rounded-full bg-background flex items-center justify-center shadow-sm border border-border/30 overflow-hidden">
                              {getNotificationIcon(notification.type, extra?.reactionType)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] leading-relaxed">
                              {getNotificationText(
                                notification.type,
                                notification.actor?.display_name || "Ú©Ø§Ø±Ø¨Ø±",
                                notification.article?.title,
                                extra,
                                notification.batch_count
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground/35 mt-0.5">
                              {getRelativeTime(notification.created_at)}
                            </p>
                          </div>
                        </Link>

                        {/* Unread dot */}
                        {!notification.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2.5 shrink-0" aria-label="Ø®ÙˆØ§Ù†Ø¯Ù‡ Ù†Ø´Ø¯Ù‡" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </OfflineFallback>
    </AppLayout>
  );
};

export default Notifications;
