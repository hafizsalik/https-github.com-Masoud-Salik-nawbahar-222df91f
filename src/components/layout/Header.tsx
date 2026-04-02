import { Info, LogOut, Shield, MessageSquare, Share2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect, useRef, useCallback } from "react";
import { LogoutConfirmDialog } from "@/components/EnhancedButtons";
import { Input } from "@/components/ui/input";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import { supabase } from "@/integrations/supabase/client";

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
  const [menuClosing, setMenuClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  // Smooth close for hamburger menu
  const smoothCloseMenu = useCallback(() => {
    if (!menuOpen) return;
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 180);
  }, [menuOpen]);

  // Click-outside for hamburger menu — mouse + touch
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        smoothCloseMenu();
      }
    };
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('touchstart', handler, { passive: true, capture: true });
    return () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('touchstart', handler, true as any);
    };
  }, [menuOpen, smoothCloseMenu]);

  useEffect(() => {
    if (location.pathname !== "/explore") return;
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("q") || "");
  }, [location.pathname, location.search]);

  // Load user avatar
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const handleShareApp = async () => {
    smoothCloseMenu();
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

  const menuVisible = menuOpen && !menuClosing;
  const menuAnimClass = menuClosing ? "animate-menu-out" : "animate-scale-in";

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="flex items-center justify-between px-4 h-[48px] max-w-lg mx-auto">
          {/* Left: Hamburger menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                if (menuOpen) smoothCloseMenu();
                else { setMenuOpen(true); setMenuClosing(false); }
              }}
              className="flex items-center justify-center w-9 h-9 transition-colors"
              aria-label="منو"
            >
              <NawbaharIcon src={menuBurgerIcon} size={18} className="opacity-55 dark:invert" />
            </button>

            {(menuOpen || menuClosing) && (
              <div
                className={`absolute left-0 top-full mt-1 w-48 bg-card/95 backdrop-blur-md border border-border/40 rounded-xl shadow-lg ${menuAnimClass} origin-top-left z-50 overflow-hidden`}
                style={{ opacity: 0.96 }}
              >
                <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">حالت تاریک</span>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-8 h-[18px] rounded-full bg-muted flex items-center transition-colors relative"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-foreground transition-transform absolute ${isDark ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {isAdmin && (
                  <button onClick={() => { smoothCloseMenu(); navigate("/admin"); }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/20">
                    <Shield size={13} strokeWidth={1.5} className="text-muted-foreground" />
                    پنل مدیریت
                  </button>
                )}

                <button onClick={() => { smoothCloseMenu(); navigate("/about"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/20">
                  <Info size={13} strokeWidth={1.5} className="text-muted-foreground" />
                  درباره نوبهار
                </button>

                <button onClick={() => { smoothCloseMenu(); navigate("/install"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/20">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  نصب اپلیکیشن
                </button>

                <button onClick={handleShareApp}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/20">
                  <Share2 size={13} strokeWidth={1.5} className="text-muted-foreground" />
                  اشتراک‌گذاری اپ
                </button>

                <button onClick={() => { smoothCloseMenu(); navigate("/contact"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/20">
                  <MessageSquare size={13} strokeWidth={1.5} className="text-muted-foreground" />
                  ارتباط با ما
                </button>

                {user && (
                  <button onClick={handleSignOut}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-destructive hover:bg-destructive/5 transition-colors">
                    <LogOut size={13} strokeWidth={1.5} />
                    خروج
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Center: Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 mx-2.5 max-w-[200px]">
            <div className="relative">
              <NawbaharIcon src={searchIcon} size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-30 dark:invert" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="دنبال چی می‌گردی؟"
                className="pr-7 pl-2.5 bg-muted/25 border border-border/30 rounded-full h-[32px] text-[11.5px] focus:ring-1 focus:ring-primary/25 placeholder:text-muted-foreground/40"
                aria-label="جستجو"
              />
            </div>
          </form>

          {/* Right: User avatar or guest icon */}
          <Link
            to={user ? "/profile" : "/auth"}
            className="flex items-center justify-center w-9 h-9"
            aria-label="پروفایل"
          >
            {user && avatarUrl ? (
              <img
                src={avatarUrl}
                alt="پروفایل"
                className="w-7 h-7 rounded-full object-cover border border-border/30"
              />
            ) : (
              <NawbaharIcon src={userIcon} size={19} className="opacity-40 dark:invert" />
            )}
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
