import { Home, Compass, BookOpen, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Compass, path: "/explore", label: "کاوش" },
  { icon: BookOpen, path: "/vip", label: "ویژه" },
  { icon: Bell, path: "/notifications", label: "اعلانات", isBell: true },
  { icon: User, path: "/profile", label: "من" },
];

export function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="bg-background/98 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-[52px]">
          {navItems.map(({ icon: Icon, path, label, isBell }) => {
            const isActive = location.pathname === path ||
              (path === "/profile" && location.pathname.startsWith("/profile"));

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-150 focus:outline-none",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/50"
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
                )}
                <div className="relative mt-0.5">
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    className="transition-all duration-150"
                  />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-bold text-accent-foreground bg-accent rounded-full px-0.5 ring-2 ring-background">
                      {unreadCount > 9 ? "۹+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-bold" : "font-normal"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
