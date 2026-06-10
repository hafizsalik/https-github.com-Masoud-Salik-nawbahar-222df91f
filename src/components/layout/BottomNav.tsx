import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import { useNotifications } from "@/hooks/useNotifications";
import { toPersianNumber } from "@/lib/utils";

import houseIcon from "@/assets/icons/house-chimney.svg";
import categoryIcon from "@/assets/icons/category.svg";
import addIcon from "@/assets/icons/add.svg";
import bookmarkIcon from "@/assets/icons/bookmark.svg";
import bellIcon from "@/assets/icons/bell.svg";

const tabs = [
  { to: "/", icon: houseIcon, label: "خانه", size: 20 },
  { to: "/explore", icon: categoryIcon, label: "کشف", size: 20 },
  { to: "/write", icon: addIcon, label: "نوشتن", size: 22, center: true },
  { to: "/bookmarks", icon: bookmarkIcon, label: "کتابخانه", size: 20 },
  { to: "/notifications", icon: bellIcon, label: "اعلان", size: 20, badge: true },
];

export function BottomNav() {
  const location = useLocation();
  const isVisible = useScrollDirection();
  // Single source of truth for unread count — useNotifications already opens
  // a guarded realtime subscription. Avoid opening a second channel here.
  const { unreadCount } = useNotifications();


  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300 ease-out px-5 pb-3",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/40 rounded-[28px] shadow-float safe-bottom max-w-md mx-auto">
        <div className="flex items-center justify-around h-[58px]">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 group transition-colors relative",
                  tab.center && "relative"
                )}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                {tab.center ? (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <NawbaharIcon
                      src={tab.icon}
                      size={tab.size}
                      className="brightness-0 invert"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <NawbaharIcon
                        src={tab.icon}
                        size={tab.size}
                        className={cn(
                          "transition-all duration-150 dark:invert",
                          active ? "opacity-100" : "opacity-30 group-active:scale-90"
                        )}
                        alt={tab.label}
                      />
                      {/* Notification badge */}
                      {tab.badge && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1 animate-scale-in">
                          {unreadCount > 9 ? "+۹" : toPersianNumber(unreadCount)}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] leading-none transition-colors",
                        active ? "text-primary font-semibold" : "text-muted-foreground/40"
                      )}
                    >
                      {tab.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
