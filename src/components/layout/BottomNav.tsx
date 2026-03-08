import { Home, Search, User, Plus, Crown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/", label: "خانه" },
  { icon: Search, path: "/explore", label: "کاوش" },
  { icon: Plus, path: "/write", label: "نوشتن", isWrite: true },
  { icon: Crown, path: "/vip", label: "ویژه" },
  { icon: User, path: "/profile", label: "پروفایل" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 no-print">
      <div className="bg-background/95 backdrop-blur-md border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-12 px-2">
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
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "bg-accent/10 text-accent hover:bg-accent/20 active:scale-90"
                  )}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200 focus:outline-none rounded-lg min-h-[40px]",
                  isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground/50 hover:text-foreground/60 active:scale-90"
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2 : 1.5}
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
