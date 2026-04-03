import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  className?: string;
}

export function AppLayout({ children, hideHeader, hideNav, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-200 ease-out">
      {!hideHeader && <Header />}
      <main 
        className={`${!hideNav ? 'pb-24' : ''} w-full mx-auto max-w-[640px] flex-1 ${className || ''} animate-fade-in`}
        role="main"
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
