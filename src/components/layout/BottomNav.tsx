import { Home, Search, BookOpen, PenSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Search, path: "/explore", label: "کاوش" },
  { icon: BookOpen, path: "/vip", label: "ویژه" },
  { icon: PenSquare, path: "/write", label: "نوشتن" },
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
      <div className="bg-background/95 backdrop-blur-md border-t border-border/60 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-12">
          {navItems.map(({ icon: Icon, path }) => {
            const isActive = location.pathname === path;

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center justify-center flex-1 h-full transition-colors duration-150 focus:outline-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/45 active:text-muted-foreground"
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.4}
                  className="transition-all duration-150"
                  fill={isActive ? "currentColor" : "none"}
                />
              </Link>
            );
          })}

          {/* Profile with avatar */}
          <Link
            to="/profile"
            className={cn(
              "flex items-center justify-center flex-1 h-full transition-colors duration-150 focus:outline-none",
              isProfileActive
                ? "text-foreground"
                : "text-muted-foreground/45 active:text-muted-foreground"
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className={cn(
                  "w-[22px] h-[22px] rounded-full object-cover transition-all duration-150",
                  isProfileActive ? "ring-[1.5px] ring-foreground" : "opacity-50"
                )}
              />
            ) : (
              <div className={cn(
                "w-[22px] h-[22px] rounded-full bg-muted-foreground/20 flex items-center justify-center transition-all duration-150",
                isProfileActive && "ring-[1.5px] ring-foreground"
              )}>
                <span className="text-[9px] text-muted-foreground font-bold">؟</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
