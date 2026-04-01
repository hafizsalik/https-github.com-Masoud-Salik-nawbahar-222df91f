import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import houseIcon from "@/assets/icons/house-chimney.svg";
import categoryIcon from "@/assets/icons/category.svg";
import addIcon from "@/assets/icons/add.svg";
import bookmarkIcon from "@/assets/icons/bookmark.svg";
import bellIcon from "@/assets/icons/bell.svg";

const tabs = [
  { to: "/", icon: houseIcon, label: "خانه", size: 21 },
  { to: "/explore", icon: categoryIcon, label: "کشف", size: 21 },
  { to: "/write", icon: addIcon, label: "پست جدید", size: 28, center: true },
  { to: "/bookmarks", icon: bookmarkIcon, label: "کتابخانه", size: 21 },
  { to: "/notifications", icon: bellIcon, label: "اعلان", size: 21 },
];

export function BottomNav() {
  const location = useLocation();
  const isVisible = useScrollDirection();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", session.user.id)
          .single();
        setAvatarUrl(data?.avatar_url || null);
      }
    };
    loadAvatar();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background/95 backdrop-blur-md border-t border-border/30 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            if (tab.center) {
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="flex flex-col items-center justify-center flex-1 h-full group"
                  aria-label={tab.label}
                >
                  <NawbaharIcon
                    src={tab.icon}
                    size={tab.size}
                    className={cn(
                      "transition-all duration-200 dark:invert",
                      active ? "opacity-90 scale-105" : "opacity-40 group-active:scale-90"
                    )}
                  />
                  <span className={cn(
                    "text-[10px] mt-0.5 transition-colors",
                    active ? "text-foreground font-medium" : "text-foreground/40"
                  )}>{tab.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex flex-col items-center justify-center flex-1 h-full group"
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                <NawbaharIcon
                  src={tab.icon}
                  size={tab.size}
                  className={cn(
                    "transition-all duration-200 dark:invert",
                    active ? "opacity-90" : "opacity-40 group-active:scale-90"
                  )}
                />
                <span className={cn(
                  "text-[10px] mt-0.5 transition-colors",
                  active ? "text-foreground font-medium" : "text-foreground/40"
                )}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
