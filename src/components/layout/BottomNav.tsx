import { House, Search, Crown, PenLine, CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const navItems = [
  { icon: House, path: "/" },
  { icon: Search, path: "/explore" },
  { icon: Crown, path: "/vip" },
  { icon: PenLine, path: "/write" },
  { icon: CircleUserRound, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const isVisible = useScrollDirection();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 no-print transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="bg-background/95 backdrop-blur-sm border-t border-border/60 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-12">
          {navItems.map(({ icon: Icon, path }) => {
            const isActive = location.pathname === path ||
              (path === "/profile" && location.pathname.startsWith("/profile"));

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 focus:outline-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/40 active:text-muted-foreground/70"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 w-6 h-[2.5px] rounded-full bg-primary" />
                )}
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.2 : 1.4}
                  className="transition-all duration-200"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
