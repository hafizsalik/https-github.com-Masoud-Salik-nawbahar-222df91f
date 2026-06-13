import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { useSwipeMenu } from "@/hooks/useSwipeMenu";

interface AppLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  className?: string;
}

export function AppLayout({ children, hideHeader, hideNav, className }: AppLayoutProps) {
  // Enable swipe-to-toggle hamburger menu globally (except writing pages).
  useSwipeMenu();

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-200 ease-out">
      {/* Skip-to-content link — keyboard users land here first on Tab */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-md"
      >
        پرش به محتوای اصلی
      </a>
      {!hideHeader && <Header />}
      <main
        id="main-content"
        tabIndex={-1}
        className={`${!hideNav ? 'pb-24' : ''} w-full mx-auto max-w-[640px] flex-1 ${className || ''} animate-fade-in focus:outline-none`}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
