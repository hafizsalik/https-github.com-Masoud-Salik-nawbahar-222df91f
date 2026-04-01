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
  { to: "/", icon: houseIcon, label: "خانه", size: 20 },
  { to: "/explore", icon: categoryIcon, label: "کشف", size: 20 },
  { to: "/write", icon: addIcon, label: "نوشتن", size: 26, center: true },
  { to: "/bookmarks", icon: bookmarkIcon, label: "ذخیره", size: 20 },
  { to: "/notifications", icon: bellIcon, label: "اعلان", size: 20 },
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
      <div className="bg-background/95 backdrop-blur-md border-t border-border/25 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-[52px]">
          {tabs.map((tab) => {
            const active = isActive(tab.to);

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex items-center justify-center flex-1 h-full group",
                  tab.center && "relative"
                )}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                <NawbaharIcon
                  src={tab.icon}
                  size={tab.size}
                  className={cn(
                    "transition-all duration-200 dark:invert",
                    active ? "opacity-85" : "opacity-35 group-active:scale-90"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
