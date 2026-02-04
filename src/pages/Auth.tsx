import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "خوش آمدید! 👋", description: "با موفقیت وارد شدید" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName.trim(),
            },
          },
        });
        if (error) throw error;
        toast({ title: "ثبت‌نام موفق! ✅", description: "لطفاً ایمیل خود را تأیید کنید" });
      }
    } catch (error: any) {
      toast({
        title: "خطا",
        description: sanitizeError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">بازگشت</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <span className="text-4xl font-black text-primary">ن</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">نوبهار</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin ? "وارد حساب خود شوید" : "به جامعه ما بپیوندید"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2 animate-slide-down">
              <Label htmlFor="displayName" className="text-foreground">
                نام نمایشی
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="نام شما"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pr-10 h-12"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              ایمیل
            </Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 h-12"
                dir="ltr"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              رمز عبور
            </Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 h-12"
                dir="ltr"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium btn-press"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                لطفاً صبر کنید...
              </span>
            ) : isLogin ? "ورود" : "ثبت‌نام"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm transition-colors"
          >
            {isLogin ? "حساب ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
          </button>
        </div>

        {/* Privacy note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          با ورود یا ثبت‌نام، با{" "}
          <a href="#" className="underline hover:text-foreground">شرایط استفاده</a>
          {" "}و{" "}
          <a href="#" className="underline hover:text-foreground">حریم خصوصی</a>
          {" "}موافقت می‌کنید.
        </p>
      </div>
    </div>
  );
};

export default Auth;
