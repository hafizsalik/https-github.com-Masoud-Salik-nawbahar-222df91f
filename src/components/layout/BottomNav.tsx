import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import houseIcon from "@/assets/icons/house-chimney.svg";
import categoryIcon from "@/assets/icons/category.svg";
import addIcon from "@/assets/icons/add.svg";
import bookmarkIcon from "@/assets/icons/bookmark.svg";
import bellIcon from "@/assets/icons/bell.svg";

const tabs = [
  { to: "/", icon: houseIcon, label: "خانه", size: 20 },
  { to: "/explore", icon: categoryIcon, label: "کشف", size: 20 },
  { to: "/write", icon: addIcon, label: "پست جدید", size: 24, center: true },
  { to: "/bookmarks", icon: bookmarkIcon, label: "کتابخانه", size: 20 },
  { to: "/notifications", icon: bellIcon, label: "اعلان", size: 20 },
];

export function BottomNav() {
  const location = useLocation();
  const isVisible = useScrollDirection();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300 ease-out px-4 pb-2",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg safe-bottom max-w-lg mx-auto">
        <div className="flex items-center justify-around h-[60px]">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 group transition-colors",
                  tab.center && "relative"
                )}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                {tab.center ? (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <NawbaharIcon
                      src={tab.icon}
                      size={tab.size}
                      className="brightness-0 invert"
                    />
                  </div>
                ) : (
                  <>
                    <NawbaharIcon
                      src={tab.icon}
                      size={tab.size}
                      className={cn(
                        "transition-all duration-150 dark:invert",
                        active ? "opacity-100" : "opacity-35 group-active:scale-90"
                      )}
                      alt={tab.label}
                    />
                    <span
                      className={cn(
                        "text-[10px] leading-none transition-colors",
                        active ? "text-foreground font-medium" : "text-muted-foreground/50"
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
