import { Info, LogOut, Shield, MessageSquare, Share2, BookOpen, Sun, Moon, Monitor } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect, useRef } from "react";
import { useMenu } from "@/contexts/MenuContext";
import { LogoutConfirmDialog } from "@/components/EnhancedButtons";
import { Input } from "@/components/ui/input";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import { WritingGuidanceModal } from "@/components/WritingGuidanceModal";
import { SearchDropdown } from "@/components/SearchDropdown";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

import menuBurgerIcon from "@/assets/icons/menu-burger.svg";
import searchIcon from "@/assets/icons/search.svg";
import userIcon from "@/assets/icons/user.svg";
import logoImg from "@/assets/logo.png";

export function Header() {
  useNotifications();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { mode, setMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen: menuOpen, isClosing: menuClosing, open: openMenu, close: smoothCloseMenu, toggle: toggleMenu } = useMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showWritingGuide, setShowWritingGuide] = useState(false);

  // Search suggestions
  const { articles: articleSuggestions, profiles: profileSuggestions } = useSearchSuggestions(searchValue);

  // Menu state comes from MenuContext (smoothCloseMenu is `close` from useMenu).

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
    if (!showSearchDropdown) return;
    const handler = (e: Event) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => {
      document.removeEventListener('pointerdown', handler, true);
    };
  }, [showSearchDropdown]);

  useEffect(() => {
    if (location.pathname !== "/explore") return;
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get("q") || "");
  }, [location.pathname, location.search]);

  const { profile: profileData } = useProfile(user?.id);
  const avatarUrl = profileData?.avatar_url || null;
  const displayName = profileData?.display_name || null;

  const handleShareApp = async () => {
    smoothCloseMenu();
    const shareUrl = `${window.location.origin}`;
    const title = "نوبهار - جامعه نخبگان";
    const text = "نوبهار اپلیکیشن انتشار مقالات علمی و تحلیلی است. همین حالا نصب کنید!";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
    } catch { /* cancelled or unsupported */ }
    try {
      await navigator.clipboard.writeText(`${title} - ${shareUrl}`);
      toast({ title: "لینک اپلیکیشن کپی شد" });
    } catch {
      toast({ title: "اشتراک‌گذاری ممکن نشد", variant: "destructive" });
    }
  };

  const handleSignOut = async () => setShowLogoutConfirm(true);

  const confirmSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      smoothCloseMenu();
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
        <div className="flex items-center justify-between px-4 h-[52px] max-w-lg mx-auto">
          {/* Left: Hamburger menu */}
          <button
            onClick={toggleMenu}
            className="flex items-center justify-center w-11 h-11 -mr-1 transition-colors"
            aria-label="منو"
            aria-expanded={menuOpen}
          ></button>
            className="flex items-center justify-center w-10 h-10 transition-colors"
            aria-label="منو"
          >
            <NawbaharIcon src={menuBurgerIcon} size={20} className="opacity-55 dark:invert" />
          </button>

          {/* Center: Search bar */}
          <div className="flex-1 mx-3 max-w-[240px] relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <NawbaharIcon src={searchIcon} size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 dark:invert" />
                <Input
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => searchValue && setShowSearchDropdown(true)}
                  placeholder="دنبال چی می‌گردی؟"
                  className="pr-8 pl-3 bg-muted/40 border-0 rounded-full h-[36px] text-[13px] focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                  aria-label="جستجو"
                />
              </div>
            </form>
            {/* Search suggestions dropdown */}
            <SearchDropdown
              articleResults={articleSuggestions}
              profileResults={profileSuggestions}
              query={searchValue}
              isOpen={showSearchDropdown && searchValue.trim().length > 0}
              onClose={() => setShowSearchDropdown(false)}
            />
          </div>

          {/* Right: User avatar or guest icon */}
          <Link
            to={user ? "/profile" : "/auth?view=login"}
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

      {/* Full-screen slide-in menu */}
      {(menuOpen || menuClosing) && (
        <div className="fixed inset-0 z-[100]" ref={menuRef}>
          {/* Backdrop */}
          <div
            className={cn("absolute inset-0 bg-black/25 transition-opacity duration-200", menuClosing ? "opacity-0" : "opacity-100")}
            onClick={smoothCloseMenu}
          />
          {/* Menu panel - FULL HEIGHT */}
          <div
            className={cn(
              "absolute top-0 right-0 bottom-0 w-[280px] bg-card border-l border-border/30 shadow-2xl overflow-y-auto flex flex-col",
              menuClosing ? "animate-slide-out-right" : "animate-slide-in-right"
            )}
          >
            {/* Menu header with logo and user info */}
            <div className="px-5 pt-6 pb-5 border-b border-border/20">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImg} alt="نوبهار" className="w-10 h-10 rounded-xl" />
                <div>
                  <h2 className="text-[16px] font-bold text-foreground">نوبهار</h2>
                  <p className="text-[11px] text-muted-foreground/60">جامعه نخبگان</p>
                </div>
              </div>

              {/* User info */}
              {user && (
                <button
                  onClick={() => { smoothCloseMenu(); navigate("/profile"); }}
                  className="flex items-center gap-3 w-full mt-2 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <NawbaharIcon src={userIcon} size={18} className="opacity-50 dark:invert" />
                    </div>
                  )}
                  <div className="text-right min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{displayName || "کاربر"}</p>
                    <p className="text-[10px] text-muted-foreground/50">مشاهده پروفایل</p>
                  </div>
                </button>
              )}

              {!user && (
                <button
                  onClick={() => { smoothCloseMenu(); navigate("/auth?view=login"); }}
                  className="flex items-center gap-3 w-full mt-2 p-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <NawbaharIcon src={userIcon} size={18} className="opacity-50 dark:invert" />
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-primary">ورود / ثبت‌نام</p>
                    <p className="text-[10px] text-muted-foreground/50">به نوبهار بپیوندید</p>
                  </div>
                </button>
              )}
            </div>

            {/* Menu items */}
            <div className="flex-1 py-2">
              {/* Theme segmented control */}
              <div className="px-5 py-3">
                <p className="text-[11px] text-muted-foreground/60 mb-2">ظاهر</p>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40">
                  {([
                    { value: "light", label: "روشن", Icon: Sun },
                    { value: "dark", label: "تاریک", Icon: Moon },
                    { value: "system", label: "سیستم", Icon: Monitor },
                  ] as const).map(({ value, label, Icon }) => {
                    const active = mode === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value as ThemeMode)}
                        aria-pressed={active}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-medium transition-all",
                          active
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon size={13} strokeWidth={1.8} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mx-5 border-b border-border/15" />

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

              <button onClick={() => { smoothCloseMenu(); setShowWritingGuide(true); }}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-foreground hover:bg-muted/50 transition-colors">
                <BookOpen size={16} strokeWidth={1.5} className="text-muted-foreground" />
                راهنمایی نوشتن
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
            </div>

            {/* Logout at bottom */}
            {user && (
              <div className="border-t border-border/15 pb-6 safe-bottom">
                <button onClick={handleSignOut}
                  className="w-full px-5 py-3.5 flex items-center gap-3 text-[13px] text-destructive hover:bg-destructive/5 transition-colors">
                  <LogOut size={16} strokeWidth={1.5} />
                  خروج
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmSignOut}
        isLoading={isLoggingOut}
      />

      <WritingGuidanceModal
        isOpen={showWritingGuide}
        onClose={() => setShowWritingGuide(false)}
        onOpenEditor={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowWritingGuide(false);
          setTimeout(() => {
            navigate("/write");
          }, 150);
        }}
      />
    </>
  );
}
