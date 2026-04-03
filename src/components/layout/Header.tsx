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

  const smoothCloseMenu = useCallback(() => {
    if (!menuOpen) return;
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 180);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        smoothCloseMenu();
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
    };
  }, [menuOpen, smoothCloseMenu]);

  useEffect(() => {
    if (location.pathname !== "/explore") return;
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("q") || "");
  }, [location.pathname, location.search]);

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

  const menuAnimClass = menuClosing ? "animate-menu-out" : "animate-scale-in";

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30 safe-top">
        <div className="flex items-center justify-between px-4 h-[52px] max-w-lg mx-auto">
          {/* Left: Hamburger menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                if (menuOpen) smoothCloseMenu();
                else { setMenuOpen(true); setMenuClosing(false); }
              }}
              className="flex items-center justify-center w-10 h-10 transition-colors"
              aria-label="منو"
            >
              <NawbaharIcon src={menuBurgerIcon} size={20} className="opacity-50 dark:invert" />
            </button>

            {/* Full-height slide-in menu */}
            {(menuOpen || menuClosing) && (
              <>
                {/* Backdrop */}
                <div
                  className={cn("fixed inset-0 bg-black/20 z-40", menuClosing ? "opacity-0" : "opacity-100")}
                  style={{ transition: "opacity 0.18s ease" }}
                  onClick={smoothCloseMenu}
                />
                {/* Menu panel */}
                <div
                  className={cn(
                    "fixed top-0 right-0 h-full w-[280px] bg-card border-l border-border/30 shadow-2xl z-50 overflow-y-auto",
                    menuClosing ? "animate-slide-out-right" : "animate-slide-in-right"
                  )}
                >
                  {/* Menu header */}
                  <div className="px-5 pt-6 pb-4 border-b border-border/30">
                    <h2 className="text-[15px] font-bold text-foreground">نوبهار</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">جامعه نخبگان</p>
                  </div>

                  <div className="py-2">
                    {/* Dark mode toggle */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[13px] text-foreground">حالت تاریک</span>
                      <button
                        onClick={() => setIsDark(!isDark)}
                        className={cn(
                          "w-10 h-[22px] rounded-full flex items-center transition-colors relative",
                          isDark ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white shadow transition-transform absolute",
                          isDark ? "translate-x-1" : "translate-x-5"
                        )} />
                      </button>
                    </div>

                    <div className="mx-5 border-b border-border/20" />

                    {isAdmin && (
                      <button onClick={() => { smoothCloseMenu(); navigate("/admin"); }}
                        className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                        <Shield size={16} strokeWidth={1.5} className="text-muted-foreground" />
                        پنل مدیریت
                      </button>
                    )}

                    <button onClick={() => { smoothCloseMenu(); navigate("/about"); }}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                      <Info size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      درباره نوبهار
                    </button>

                    <button onClick={() => { smoothCloseMenu(); navigate("/install"); }}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      نصب اپلیکیشن
                    </button>

                    <button onClick={handleShareApp}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                      <Share2 size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      اشتراک‌گذاری اپ
                    </button>

                    <button onClick={() => { smoothCloseMenu(); navigate("/contact"); }}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                      <MessageSquare size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      ارتباط با ما
                    </button>

                    {user && (
                      <>
                        <div className="mx-5 border-b border-border/20 my-1" />
                        <button onClick={handleSignOut}
                          className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-destructive hover:bg-destructive/5 transition-colors">
                          <LogOut size={16} strokeWidth={1.5} />
                          خروج
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Center: Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 mx-3 max-w-[240px]">
            <div className="relative">
              <NawbaharIcon src={searchIcon} size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 dark:invert" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="دنبال چی می‌گردی؟"
                className="pr-8 pl-3 bg-muted/40 border-0 rounded-full h-[36px] text-[13px] focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                aria-label="جستجو"
              />
            </div>
          </form>

          {/* Right: User avatar or guest icon */}
          <Link
            to={user ? "/profile" : "/auth"}
            className="flex items-center justify-center w-10 h-10"
            aria-label="پروفایل"
          >
            {user && avatarUrl ? (
              <img
                src={avatarUrl}
                alt="پروفایل"
                className="w-8 h-8 rounded-full object-cover border-2 border-border/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <NawbaharIcon src={userIcon} size={16} className="opacity-40 dark:invert" />
              </div>
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
