import { Info, LogOut, Shield, MessageSquare, Share2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect, useRef } from "react";
import { LogoutConfirmDialog } from "@/components/EnhancedButtons";
import { Input } from "@/components/ui/input";
import { NawbaharIcon } from "@/components/NawbaharIcon";

import menuBurgerIcon from "@/assets/icons/menu-burger.svg";
import searchIcon from "@/assets/icons/search.svg";
import userIcon from "@/assets/icons/user.svg";

export function Header() {
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (location.pathname !== "/explore") return;
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("q") || "");
  }, [location.pathname, location.search]);

  const handleShareApp = async () => {
    setMenuOpen(false);
    const shareUrl = `${window.location.origin}`;
    const title = "نوبهار - جامعه نخبگان";
    const text = "نوبهار اپلیکیشن انتشار مقالات علمی و تحلیلی است. همین حالا نصب کنید!";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${title} - ${shareUrl}`);
        alert("لینک اپلیکیشن کپی شد.");
      }
    } catch { /* cancelled */ }
  };

  const handleSignOut = async () => setShowLogoutConfirm(true);

  const confirmSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          {/* Left: Hamburger menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 transition-colors"
              aria-label="منو"
            >
              <NawbaharIcon src={menuBurgerIcon} size={19} className="opacity-40 dark:invert" />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg animate-scale-in origin-top-left z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
                  <span className="text-[11.5px] text-muted-foreground">حالت تاریک</span>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-9 h-5 rounded-full bg-muted flex items-center transition-colors relative"
                  >
                    <div className={`w-4 h-4 rounded-full bg-foreground transition-transform absolute ${isDark ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {isAdmin && (
                  <button onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                    className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30">
                    <Shield size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    پنل مدیریت
                  </button>
                )}

                <button onClick={() => { setMenuOpen(false); navigate("/about"); }}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30">
                  <Info size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  درباره نوبهار
                </button>

                <button onClick={() => { setMenuOpen(false); navigate("/install"); }}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  نصب اپلیکیشن
                </button>

                <button onClick={handleShareApp}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30">
                  <Share2 size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  اشتراک‌گذاری اپ
                </button>

                <button onClick={() => { setMenuOpen(false); navigate("/contact"); }}
                  className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30">
                  <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  ارتباط با ما
                </button>

                {user && (
                  <button onClick={handleSignOut}
                    className="w-full px-3 py-2.5 flex items-center gap-2 text-[12px] text-destructive hover:bg-destructive/5 transition-colors">
                    <LogOut size={14} strokeWidth={1.5} />
                    خروج
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Center: Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 mx-3 max-w-[220px]">
            <div className="relative">
              <NawbaharIcon src={searchIcon} size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-35 dark:invert" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="دنبال چی می‌گردی؟"
                className="pr-8 pl-3 bg-muted/30 border border-border/40 rounded-full h-[34px] text-[12px] focus:ring-1 focus:ring-primary/25 placeholder:text-muted-foreground/45"
                aria-label="جستجو"
              />
            </div>
          </form>

          {/* Right: User icon */}
          <Link
            to={user ? "/profile" : "/auth"}
            className="flex items-center justify-center w-10 h-10"
            aria-label="پروفایل"
          >
            <NawbaharIcon src={userIcon} size={20} className="opacity-40 dark:invert" />
          </Link>
        </div>
      </header>

      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmSignOut}
        isLoading={isLoggingOut}
      />
    </>
  );
}
