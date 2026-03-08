import { House, Search, Crown, PenLine } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: House, path: "/", label: "خانه" },
  { icon: Search, path: "/explore", label: "جستجو" },
  { icon: Crown, path: "/vip", label: "ویژه" },
  { icon: PenLine, path: "/write", label: "نوشتن" },
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

  const isProfileActive = location.pathname === "/profile" || location.pathname.startsWith("/profile");

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background border-t border-border safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-14">
          {navItems.map(({ icon: Icon, path, label }) => {
            const isActive = location.pathname === path;

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 focus:outline-none",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/50 active:text-muted-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-[2.5px] rounded-b-full bg-primary animate-scale-in" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "animate-bounce-subtle"
                  )}
                />
                <span className={cn(
                  "text-[9px] font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-0 scale-90"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Profile with avatar */}
          <Link
            to="/profile"
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 focus:outline-none",
              isProfileActive
                ? "text-primary"
                : "text-muted-foreground/50 active:text-muted-foreground"
            )}
          >
            {isProfileActive && (
              <span className="absolute top-0 w-8 h-[2.5px] rounded-b-full bg-primary animate-scale-in" />
            )}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={cn(
                  "w-5 h-5 rounded-full object-cover transition-all duration-200",
                  isProfileActive ? "ring-[1.5px] ring-primary ring-offset-1 ring-offset-background" : "opacity-60"
                )}
              />
            ) : (
              <div className={cn(
                "w-5 h-5 rounded-full bg-muted flex items-center justify-center transition-all duration-200",
                isProfileActive && "ring-[1.5px] ring-primary ring-offset-1 ring-offset-background"
              )}>
                <span className="text-[8px] text-muted-foreground font-bold">؟</span>
              </div>
            )}
            <span className={cn(
              "text-[9px] font-medium transition-all duration-200",
              isProfileActive ? "opacity-100" : "opacity-0 scale-90"
            )}>
              پروفایل
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
