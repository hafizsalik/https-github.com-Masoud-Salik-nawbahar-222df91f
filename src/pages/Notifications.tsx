import { AppLayout } from "@/components/layout/AppLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart size={18} className="text-rose-500" fill="currentColor" />;
    case "comment":
      return <MessageCircle size={18} className="text-blue-500" />;
    case "follow":
      return <UserPlus size={18} className="text-green-500" />;
    default:
      return <Bell size={18} />;
  }
}

function getNotificationText(type: string, actorName: string, articleTitle?: string) {
  switch (type) {
    case "like":
      return (
        <>
          <span className="font-semibold">{actorName}</span>
          {" مقاله شما را پسندید: "}
          {articleTitle && <span className="text-muted-foreground">«{articleTitle}»</span>}
        </>
      );
    case "comment":
      return (
        <>
          <span className="font-semibold">{actorName}</span>
          {" روی مقاله شما نظر داد: "}
          {articleTitle && <span className="text-muted-foreground">«{articleTitle}»</span>}
        </>
      );
    case "follow":
      return (
        <>
          <span className="font-semibold">{actorName}</span>
          {" شما را دنبال کرد"}
        </>
      );
    default:
      return "اعلان جدید";
  }
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bell size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">اعلان‌های شما</h2>
          <p className="text-muted-foreground text-sm mb-6">
            برای مشاهده اعلان‌ها وارد شوید
          </p>
          <Button onClick={() => navigate("/auth")}>
            ورود / ثبت نام
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">اعلان‌ها</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs gap-1.5"
            >
              <CheckCheck size={16} />
              خواندن همه
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">هنوز اعلانی ندارید</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={
                  notification.type === "follow"
                    ? `/profile/${notification.actor_id}`
                    : notification.article_id
                    ? `/article/${notification.article_id}`
                    : "#"
                }
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
                  !notification.is_read && "bg-primary/5"
                )}
              >
                <div className="mt-1">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
