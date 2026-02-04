import { AppLayout } from "@/components/layout/AppLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Settings, Trash2, X, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { useState } from "react";

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart size={18} className="text-destructive" fill="currentColor" />;
    case "comment":
      return <MessageCircle size={18} className="text-primary" fill="currentColor" />;
    case "follow":
      return <UserPlus size={18} className="text-accent-foreground" />;
    default:
      return <Bell size={18} className="text-muted-foreground" />;
  }
}

function getNotificationText(type: string, actorName: string, articleTitle?: string) {
  switch (type) {
    case "like":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> مقاله شما را پسندید
          {articleTitle && <span className="text-muted-foreground block text-xs mt-0.5 line-clamp-1">«{articleTitle}»</span>}
        </>
      );
    case "comment":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> نظر داد
          {articleTitle && <span className="text-muted-foreground block text-xs mt-0.5 line-clamp-1">«{articleTitle}»</span>}
        </>
      );
    case "follow":
      return (
        <>
          <strong className="font-medium">{actorName}</strong> شما را دنبال کرد
        </>
      );
    default:
      return <span>اعلان جدید</span>;
  }
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    settings,
    updateSettings
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Bell size={36} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3">اعلان‌های شما</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
            برای دریافت اعلانات از نظرات، پسندها و دنبال‌کننده‌های جدید وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")} className="btn-press">
            ورود / ثبت نام
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen animate-fade-in">
        {/* Header */}
        <div className="sticky top-12 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">اعلان‌ها</h1>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs gap-1.5 text-primary h-8"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">خواندن همه</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8 w-8"
              aria-label="تنظیمات اعلانات"
            >
              {showSettings ? <X size={18} /> : <Settings size={18} />}
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-muted/50 border-b border-border p-4 space-y-4 animate-slide-down">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings size={14} />
              تنظیمات اعلان‌ها
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-muted-foreground" />
                  <span className="text-sm">نظرات جدید</span>
                </div>
                <Switch 
                  checked={settings.comments}
                  onCheckedChange={(checked) => updateSettings({ comments: checked })}
                />
              </div>
              <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-muted-foreground" />
                  <span className="text-sm">پسندها</span>
                </div>
                <Switch 
                  checked={settings.likes}
                  onCheckedChange={(checked) => updateSettings({ likes: checked })}
                />
              </div>
              <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <UserPlus size={14} className="text-muted-foreground" />
                  <span className="text-sm">دنبال‌کننده‌های جدید</span>
                </div>
                <Switch 
                  checked={settings.follows}
                  onCheckedChange={(checked) => updateSettings({ follows: checked })}
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BellOff size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">هنوز اعلانی ندارید</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors relative group animate-slide-up",
                  !notification.is_read && "bg-primary/5"
                )}
                style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
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
                  className="flex items-start gap-3 flex-1 min-w-0"
                >
                  <div className="mt-0.5 p-1.5 rounded-full bg-muted shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      {getNotificationText(
                        notification.type,
                        notification.actor?.display_name || "کاربر",
                        notification.article?.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {getRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </Link>
                
                {/* Delete button */}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive rounded-full hover:bg-muted"
                  aria-label="حذف اعلان"
                >
                  <Trash2 size={14} />
                </button>
                
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
