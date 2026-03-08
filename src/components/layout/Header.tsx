import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export function Header() {
  const isVisible = useScrollDirection();
  const { unreadCount } = useNotifications();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 safe-top transition-all duration-400",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-3 mt-2">
        <div className="glass rounded-2xl border border-border/30 float-element">
          <div className="flex items-center justify-between px-4 h-11 max-w-lg mx-auto">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-1.5 group">
              <div className="w-6.5 h-6.5 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <span className="text-[13px] font-black text-primary-foreground leading-none">ن</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-black tracking-tight text-foreground leading-none">
                  نوبهار
                </span>
                <span className="text-[6.5px] font-bold tracking-[0.2em] text-muted-foreground/40 leading-none mt-0.5">
                  NOBAHAR
                </span>
              </div>
            </Link>

            {/* Notifications */}
            <Link to="/notifications" className="relative">
              <button 
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                  unreadCount > 0 
                    ? "text-primary" 
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
                aria-label={`اعلانات ${unreadCount > 0 ? `(${unreadCount} خوانده نشده)` : ''}`}
              >
                <Bell size={18} strokeWidth={1.6} fill={unreadCount > 0 ? "currentColor" : "none"} />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[8px] font-bold text-primary-foreground bg-accent rounded-full px-0.5 animate-scale-in ring-2 ring-background">
                  {unreadCount > 9 ? "۹+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
