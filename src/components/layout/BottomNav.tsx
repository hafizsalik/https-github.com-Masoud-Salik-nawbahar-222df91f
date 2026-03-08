import { Home, Compass, User, PenLine, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Compass, path: "/explore", label: "کاوش" },
  { icon: PenLine, path: "/write", label: "نوشتن", isWrite: true },
  { icon: Sparkles, path: "/vip", label: "ویژه" },
  { icon: User, path: "/profile", label: "پروفایل" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-14 px-2">
          {navItems.map(({ icon: Icon, path, label, isWrite }) => {
            const isActive = location.pathname === path || 
              (path === "/profile" && location.pathname.startsWith("/profile"));

            if (isWrite) {
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center justify-center focus:outline-none"
                  aria-label={label}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "bg-accent/10 text-accent hover:bg-accent/20 active:scale-90"
                  )}>
                    <Icon size={17} strokeWidth={2} />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 transition-all duration-200 focus:outline-none rounded-xl min-h-[44px]",
                  isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground/40 hover:text-foreground/60 active:scale-90"
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 1.8 : 1.4}
                  fill={isActive ? "currentColor" : "none"}
                  className="transition-all duration-200"
                />
                <span className={cn(
                  "text-[9px] transition-all duration-200",
                  isActive ? "font-semibold" : "font-normal opacity-70"
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
