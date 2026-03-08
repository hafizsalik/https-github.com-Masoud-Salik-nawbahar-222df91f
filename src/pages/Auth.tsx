import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { sanitizeError, validation } from "@/lib/errorHandler";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-10 transition-colors"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
          <span className="text-[13px]">بازگشت</span>
        </button>

        {/* Brand */}
        <div className="mb-10">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center mb-4">
            <span className="text-[14px] font-black text-primary-foreground leading-none">ن</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground">
            {isLogin ? "ورود به نوبهار" : "عضویت در نوبهار"}
          </h1>
          <p className="text-[13px] text-muted-foreground/50 mt-1.5">
            {isLogin ? "وارد حساب خود شوید" : "حساب جدید بسازید"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5 animate-slide-down">
              <Label htmlFor="displayName" className="text-[12px] text-muted-foreground">نام نمایشی</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="نام شما"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-1 focus:ring-primary/20"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[12px] text-muted-foreground">ایمیل</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-1 focus:ring-primary/20"
                dir="ltr"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[12px] text-muted-foreground">رمز عبور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-1 focus:ring-primary/20"
                dir="ltr"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2"
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
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? "حساب ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-muted-foreground/30">
          با ورود، با شرایط استفاده و حریم خصوصی موافقت می‌کنید.
        </p>
      </div>
    </div>
  );
};

export default Auth;