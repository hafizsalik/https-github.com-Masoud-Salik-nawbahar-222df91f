import { PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";

export function Header() {
  const isVisible = useScrollDirection();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-40 safe-top transition-all duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-11 max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-1.5">
            <div className="w-6.5 h-6.5 rounded-md bg-primary flex items-center justify-center">
              <span className="text-[13px] font-black text-primary-foreground leading-none">ن</span>
            </div>
            <span className="text-[15px] font-black tracking-tight text-foreground leading-none">
              نوبهار
            </span>
          </Link>

          <Link 
            to="/write" 
            className="text-muted-foreground/45 hover:text-foreground transition-colors"
          >
            <PenLine size={20} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
