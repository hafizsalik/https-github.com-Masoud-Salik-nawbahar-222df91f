import { Info, LogOut, Shield, MessageSquare, Share2, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect, useRef } from "react";
import nawbaharLogo from "@/assets/nawbahar-logo.png";
import { NotificationBell, ThemeToggle, LogoutConfirmDialog } from "@/components/EnhancedButtons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NawbaharIcon } from "@/components/ui/NawbaharIcon";

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
    const title = "Ù†ÙˆØ¨Ù‡Ø§Ø± - Ø¬Ø§Ù…Ø¹Ù‡ Ù†Ø®Ø¨Ú¯Ø§Ù†";
    const text = "Ù†ÙˆØ¨Ù‡Ø§Ø± Ø§Ù¾Ù„ÛŒÚ©ÛŒØ´Ù† Ø§Ù†ØªØ´Ø§Ø± Ù…Ù‚Ø§Ù„Ø§Øª Ø¹Ù„Ù…ÛŒ Ùˆ ØªØ­Ù„ÛŒÙ„ÛŒ Ø§Ø³Øª. Ù‡Ù…ÛŒÙ† Ø­Ø§Ù„Ø§ Ù†ØµØ¨ Ú©Ù†ÛŒØ¯!";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${title} - ${shareUrl}`);
        alert("Ù„ÛŒÙ†Ú© Ø§Ù¾Ù„ÛŒÚ©ÛŒØ´Ù† Ú©Ù¾ÛŒ Ø´Ø¯. Ø¢Ù† Ø±Ø§ Ø¨Ø§ Ø¯ÙˆØ³ØªØ§Ù†ØªØ§Ù† Ø¨Ù‡ Ø§Ø´ØªØ±Ø§Ú© Ø¨Ú¯Ø°Ø§Ø±ÛŒØ¯.");
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40 safe-top" style={{ boxShadow: '0 1px 8px -2px rgba(0,0,0,0.06)' }}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 h-11 max-w-lg mx-auto">
          <div className="flex items-center justify-start">
            <NotificationBell 
              unreadCount={unreadCount}
              onClick={() => navigate('/notifications')}
            />
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"><NawbaharIcon name="search" size={14} /></span>
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Ø¬Ø³ØªØ¬ÙˆÛŒ Ù…Ù‚Ø§Ù„Ø§Øª..."
              className="pr-8 pl-3 bg-muted/40 border-0 rounded-full h-9 text-[12px] focus:ring-1 focus:ring-primary/25 placeholder:text-muted-foreground/40"
              aria-label="Ø¬Ø³ØªØ¬Ùˆ"
            />
          </form>

          <div className="flex items-center gap-1.5 justify-end">
            {!user && (
              <div className="flex items-center gap-1">
                <Link to="/auth?view=login">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[11.5px] text-muted-foreground hover:text-foreground">
                    <LogIn size={14} className="ml-1 sm:hidden" />
                    <span className="hidden sm:inline">ورود</span>
                  </Button>
                </Link>
                <Link to="/auth?view=register">
                  <Button size="sm" className="h-8 px-2 text-[11.5px]">
                    <UserPlus size={14} className="ml-1 sm:hidden" />
                    <span className="hidden sm:inline">ثبت‌نام</span>
                  </Button>
                </Link>
              </div>
            )}
            <Link to="/" className="flex items-center gap-1.5 group interactive">
              <img src={nawbaharLogo} alt="Ù†ÙˆØ¨Ù‡Ø§Ø±" className="w-6 h-6" />
              <span className="text-[15px] font-extrabold tracking-tight text-foreground leading-none">
                Ù†ÙˆØ¨Ù‡Ø§Ø±
              </span>
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Ù…Ù†Ùˆ"
              >
                <NawbaharIcon name="menu" size={19} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg animate-scale-in origin-top-right z-50 overflow-hidden">
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
                      Ù¾Ù†Ù„ Ù…Ø¯ÛŒØ±ÛŒØª
                    </button>
                  )}

                  <button
                    onClick={() => { setMenuOpen(false); navigate("/about"); }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                  >
                    <Info size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø±
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
                    Ù†ØµØ¨ Ø§Ù¾Ù„ÛŒÚ©ÛŒØ´Ù†
                  </button>

                  <button
                    onClick={handleShareApp}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                  >
                    <Share2 size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    Ø§Ø´ØªØ±Ø§Ú©â€ŒÚ¯Ø°Ø§Ø±ÛŒ Ø§Ù¾
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); navigate("/contact"); }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30"
                  >
                    <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    Ø§Ø±ØªØ¨Ø§Ø· Ø¨Ø§ Ù…Ø§
                  </button>

                  {user && (
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 flex items-center gap-2 text-[11.5px] text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut size={14} strokeWidth={1.5} />
                      Ø®Ø±ÙˆØ¬
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

