import { Bell, Menu, Info, Moon, Sun, LogOut, Shield, MessageSquare, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toPersianNumber, cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import nawbaharLogo from "@/assets/nawbahar-logo.png";
import { NotificationBell, ThemeToggle, LogoutConfirmDialog } from "@/components/EnhancedButtons";

export function Header() {
  const { unreadCount } = useNotifications();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        alert("لینک اپلیکیشن کپی شد. آن را با دوستانتان به اشتراک بگذارید.");
      }
    } catch {
      // User cancelled or not supported.
    }
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(true);
  };

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

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };


  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 safe-top" style={{ boxShadow: '0 1px 8px -2px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between px-4 h-11 max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-1.5 group interactive">
          <img src={nawbaharLogo} alt="نوبهار" className="w-6 h-6" />
          <span className="text-[15px] font-extrabold tracking-tight text-foreground leading-none">
            نوبهار
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Enhanced Notifications Button */}
          <NotificationBell 
            unreadCount={unreadCount}
            onClick={() => navigate('/notifications')}
          />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="منو"
            >
              <Menu size={19} strokeWidth={1.75} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg animate-scale-in origin-top-left z-50 overflow-hidden">
                {/* Enhanced Theme Toggle */}
                <div className="px-3 py-2.5 border-b border-border/50">
                  <ThemeToggle 
                    isDark={isDark} 
                    onToggle={handleThemeToggle}
                  />
                </div>

                {isAdmin && (
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                  >
                    <Shield size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    پنل مدیریت
                  </button>
                )}

                <button
                  onClick={() => { setMenuOpen(false); navigate("/about"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                >
                  <Info size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  درباره نوبهار
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate("/install"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  نصب اپلیکیشن
                </button>

                <button
                  onClick={handleShareApp}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                >
                  <Share2 size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  اشتراک‌گذاری اپ
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate("/contact"); }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                >
                  <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  ارتباط با ما
                </button>

                {user && (
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <LogOut size={14} strokeWidth={1.5} />
                    خروج
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
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
