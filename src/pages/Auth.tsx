import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      const nameError = validation.displayName.validate(displayName);
      if (nameError) {
        toast({ title: "خطا", description: nameError, variant: "destructive" });
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "خوش آمدید! 👋" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;
        toast({ title: "ثبت‌نام موفق ✅", description: "لطفاً ایمیل خود را تأیید کنید" });
      }
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title={isLogin ? "ورود" : "ثبت‌نام"} description="ورود یا ثبت‌نام در نوبهار" ogUrl="/auth" noIndex />

      {/* Decorative top strip */}
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1"
            aria-label="بازگشت به صفحه اصلی"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
            <span className="text-[13px]">بازگشت</span>
          </button>

          {/* Brand */}
          <div className="mb-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.75))",
                boxShadow: "0 4px 16px -4px hsl(var(--primary) / 0.4)",
              }}
            >
              <span className="text-[22px] font-black text-primary-foreground leading-none select-none" style={{ marginTop: "2px" }}>ن</span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <h1 className="text-[24px] font-extrabold text-foreground leading-tight">
              {isLogin ? "ورود به نوبهار" : "عضویت در نوبهار"}
            </h1>
            <p className="text-[13px] text-muted-foreground/55 mt-2 leading-relaxed">
              {isLogin
                ? "به جامعه نخبگان خوش آمدید. وارد حساب خود شوید."
                : "حساب جدید بسازید و به جامعه نخبگان بپیوندید."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4" noValidate>
            {!isLogin && (
              <div className="space-y-1.5 animate-slide-down">
                <Label htmlFor="displayName" className="text-[12px] text-muted-foreground">نام نمایشی</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" aria-hidden="true" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="نام شما"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30 transition-shadow"
                    required={!isLogin}
                    autoComplete="name"
                    aria-required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] text-muted-foreground">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30 transition-shadow"
                  dir="ltr"
                  required
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] text-muted-foreground">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30 transition-shadow"
                  dir="ltr"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2 transition-all duration-200 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  صبر کنید...
                </span>
              ) : isLogin ? "ورود" : "ثبت‌نام"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[13px] text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-2 py-1"
            >
              {isLogin ? (
                <>حساب ندارید؟ <span className="text-primary font-medium">ثبت‌نام کنید</span></>
              ) : (
                <>حساب دارید؟ <span className="text-primary font-medium">وارد شوید</span></>
              )}
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/30">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              رمزگذاری شده
            </span>
            <span>·</span>
            <span>حریم خصوصی محفوظ</span>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/25 leading-relaxed">
            با ورود، با شرایط استفاده و حریم خصوصی موافقت می‌کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
