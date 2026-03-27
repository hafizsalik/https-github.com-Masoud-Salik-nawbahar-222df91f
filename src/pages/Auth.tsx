import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { analyticsService } from "@/services/analytics";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import InteractiveOnboardingModal from "@/components/InteractiveOnboardingModal";
import nawbaharLogo from "@/assets/nawbahar-logo.png";

type AuthView = "login" | "register" | "forgot";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get("view") as AuthView) || "login";
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 1) return { score: 1, label: "Ø¶Ø¹ÛŒÙ", color: "bg-destructive" };
    if (score <= 2) return { score: 2, label: "Ù…ØªÙˆØ³Ø·", color: "bg-warning" };
    if (score <= 3) return { score: 3, label: "Ø®ÙˆØ¨", color: "bg-primary" };
    return { score: 4, label: "Ù‚ÙˆÛŒ", color: "bg-success" };
  }, [password]);

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }), [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Track login
      if (data?.user) {
        await analyticsService.trackLogin(data.user.id);
      }
      
      toast({ title: "Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯! ðŸ‘‹" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Ø®Ø·Ø§", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameError = validation.displayName.validate(displayName);
    if (nameError) {
      toast({ title: "Ø®Ø·Ø§", description: nameError, variant: "destructive" });
      return;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasLetter || !passwordChecks.hasNumber) {
      toast({ title: "Ø®Ø·Ø§", description: "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û¸ Ú©Ø§Ø±Ø§Ú©ØªØ± Ùˆ Ø´Ø§Ù…Ù„ Ø­Ø±Ù Ùˆ Ø¹Ø¯Ø¯ Ø¨Ø§Ø´Ø¯", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Ø®Ø·Ø§", description: "Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ùˆ ØªÚ©Ø±Ø§Ø± Ø¢Ù† Ù…Ø·Ø§Ø¨Ù‚Øª Ù†Ø¯Ø§Ø±Ù†Ø¯", variant: "destructive" });
      return;
    }

    if (!agreedToTerms) {
      toast({ title: "Ø®Ø·Ø§", description: "Ù„Ø·ÙØ§Ù‹ Ù‚ÙˆØ§Ù†ÛŒÙ† Ùˆ Ù…Ù‚Ø±Ø±Ø§Øª Ø±Ø§ Ø¨Ù¾Ø°ÛŒØ±ÛŒØ¯", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      });
      if (error) throw error;
      if (data?.user) {
        // Track registration
        await analyticsService.trackRegistration(data.user.id);
        
        toast({ title: "Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯ Ø¨Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø±! ðŸŒ±" });
        setShowOnboardingModal(true);
      }
    } catch (error: any) {
      toast({ title: "Ø®Ø·Ø§", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Ø§ÛŒÙ…ÛŒÙ„ Ù†Ø§Ù…Ø¹ØªØ¨Ø±", description: "Ù„Ø·ÙØ§Ù‹ ÛŒÚ© Ø§ÛŒÙ…ÛŒÙ„ Ù…Ø¹ØªØ¨Ø± ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯", variant: "destructive" });
      return;
    }

    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?view=login`,
      });
      if (error) throw error;
      toast({ title: "Ø§ÛŒÙ…ÛŒÙ„ Ø§Ø±Ø³Ø§Ù„ Ø´Ø¯", description: "Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±Ø§ Ø¨Ù‡ Ø§ÛŒÙ…ÛŒÙ„ØªØ§Ù† ÙØ±Ø³ØªØ§Ø¯ÛŒÙ…." });
      setView("login");
    } catch (error: any) {
      toast({ title: "Ø®Ø·Ø§", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };


  // â”€â”€â”€ LOGIN VIEW â”€â”€â”€
  if (view === "login") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="ÙˆØ±ÙˆØ¯" description="ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨ Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/auth" noIndex />
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm animate-fade-in">
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-10 transition-colors"
            >
              <ArrowRight size={18} strokeWidth={1.5} />
              <span className="text-[13px]">Ø¨Ø§Ø²Ú¯Ø´Øª</span>
            </button>

            <div className="flex items-center gap-3 mb-8">
              <img src={nawbaharLogo} alt="" className="w-10 h-10" />
              <div>
                <h1 className="text-[22px] font-extrabold text-foreground">ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø±</h1>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">Ø¨Ù‡ Ø¬Ø§Ù…Ø¹Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø± Ø®ÙˆØ´ Ø¢Ù…Ø¯ÛŒØ¯</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] text-muted-foreground">Ø§ÛŒÙ…ÛŒÙ„</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] text-muted-foreground">Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                    required
                    autoComplete="current-password"
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

              <Button type="submit" className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ØµØ¨Ø± Ú©Ù†ÛŒØ¯...
                  </span>
                ) : "ÙˆØ±ÙˆØ¯"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setView("register")}
                className="text-[13px] text-muted-foreground hover:text-primary transition-colors"
              >
                Ø­Ø³Ø§Ø¨ Ù†Ø¯Ø§Ø±ÛŒØ¯ØŸ <span className="text-primary font-medium">Ø«Ø¨Øªâ€ŒÙ†Ø§Ù… Ú©Ù†ÛŒØ¯</span>
              </button>
              <button
                onClick={() => setView("forgot")}
                className="text-[13px] text-primary hover:underline transition-colors"
              >
                Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±Ø§ ÙØ±Ø§Ù…ÙˆØ´ Ú©Ø±Ø¯Ù‡â€ŒØ§ÛŒØ¯ØŸ
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/30">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Ø±Ù…Ø²Ú¯Ø°Ø§Ø±ÛŒ Ø´Ø¯Ù‡
              </span>
              <span>Â·</span>
              <span>Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ Ù…Ø­ÙÙˆØ¸</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ FORGOT VIEW â”€â”€â”€
  if (view === "forgot") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±" description="Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø­Ø³Ø§Ø¨ Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/auth" noIndex />
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm animate-fade-in">
            <button
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-8 transition-colors"
            >
              <ArrowRight size={18} strokeWidth={1.5} />
              <span className="text-[13px]">Ø¨Ø§Ø²Ú¯Ø´Øª</span>
            </button>

            <div className="flex items-center gap-3 mb-8">
              <img src={nawbaharLogo} alt="" className="w-10 h-10" />
              <div>
                <h1 className="text-[22px] font-extrabold text-foreground">Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</h1>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²Ù†Ø´Ø§Ù†ÛŒ Ø¨Ù‡ Ø§ÛŒÙ…ÛŒÙ„ Ø´Ù…Ø§ Ø§Ø±Ø³Ø§Ù„ Ù…ÛŒâ€ŒØ´ÙˆØ¯</p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail" className="text-[12px] text-muted-foreground">Ø§ÛŒÙ…ÛŒÙ„ Ø«Ø¨Øª Ø´Ø¯Ù‡</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-[14px] font-semibold rounded-lg" disabled={forgotLoading}>
                {forgotLoading ? "Ø¯Ø± Ø­Ø§Ù„ Ø§Ø±Ø³Ø§Ù„..." : "Ø§Ø±Ø³Ø§Ù„ Ù„ÛŒÙ†Ú© Ø¨Ø§Ø²ÛŒØ§Ø¨ÛŒ"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setView("login")}
                className="text-[13px] text-muted-foreground hover:text-primary transition-colors"
              >
                Ø¨Ø±Ú¯Ø´Øª Ø¨Ù‡ ÙˆØ±ÙˆØ¯
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ REGISTER VIEW â”€â”€â”€
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="Ø«Ø¨Øªâ€ŒÙ†Ø§Ù…" description="Ø§ÛŒØ¬Ø§Ø¯ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø¯Ø± Ù†ÙˆØ¨Ù‡Ø§Ø±" ogUrl="/auth" noIndex />
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in">
          <button
            onClick={() => setView("login")}
            className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-8 transition-colors"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
            <span className="text-[13px]">Ø¨Ø§Ø²Ú¯Ø´Øª</span>
          </button>

          <div className="flex items-center gap-3 mb-8">
            <img src={nawbaharLogo} alt="" className="w-10 h-10" />
            <div>
              <h1 className="text-[22px] font-extrabold text-foreground">Ø¹Ø¶ÙˆÛŒØª Ø¯Ø± Ù†ÙˆØ¨Ù‡Ø§Ø±</h1>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">Ø­Ø³Ø§Ø¨ Ø¬Ø¯ÛŒØ¯ Ø¨Ø³Ø§Ø²ÛŒØ¯ Ùˆ Ø¨Ù¾ÛŒÙˆÙ†Ø¯ÛŒØ¯</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-[12px] text-muted-foreground">Ù†Ø§Ù… Ù†Ù…Ø§ÛŒØ´ÛŒ</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Ù†Ø§Ù… Ø´Ù…Ø§"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="regEmail" className="text-[12px] text-muted-foreground">Ø§ÛŒÙ…ÛŒÙ„</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="regPassword" className="text-[12px] text-muted-foreground">Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="regPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ø­Ø¯Ø§Ù‚Ù„ Û¸ Ú©Ø§Ø±Ø§Ú©ØªØ±"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-300 ${
                            i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground min-w-[30px]">{passwordStrength.label}</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { check: passwordChecks.minLength, label: "Ø­Ø¯Ø§Ù‚Ù„ Û¸ Ú©Ø§Ø±Ø§Ú©ØªØ±" },
                      { check: passwordChecks.hasLetter, label: "Ø´Ø§Ù…Ù„ Ø­Ø±Ù" },
                      { check: passwordChecks.hasNumber, label: "Ø´Ø§Ù…Ù„ Ø¹Ø¯Ø¯" },
                    ].map(({ check, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[10px]">
                        {check ? (
                          <Check size={10} className="text-primary" />
                        ) : (
                          <X size={10} className="text-muted-foreground/30" />
                        )}
                        <span className={check ? "text-foreground/60" : "text-muted-foreground/40"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[12px] text-muted-foreground">ØªÚ©Ø±Ø§Ø± Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø±Ø§ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <Check size={16} className="text-primary" />
                    ) : (
                      <X size={16} className="text-destructive" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-[11.5px] text-muted-foreground/70 leading-relaxed cursor-pointer">
                Ø¨Ø§{" "}
                <button type="button" onClick={() => navigate("/about")} className="text-primary hover:underline">
                  Ù‚ÙˆØ§Ù†ÛŒÙ† Ùˆ Ù…Ù‚Ø±Ø±Ø§Øª Ù†ÙˆØ¨Ù‡Ø§Ø±
                </button>
                {" "}Ù…ÙˆØ§ÙÙ‚Ù…
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2" disabled={loading || !agreedToTerms}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ØµØ¨Ø± Ú©Ù†ÛŒØ¯...
                </span>
              ) : "Ø§ÛŒØ¬Ø§Ø¯ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView("login")}
              className="text-[13px] text-muted-foreground hover:text-primary transition-colors"
            >
              Ø­Ø³Ø§Ø¨ Ø¯Ø§Ø±ÛŒØ¯ØŸ <span className="text-primary font-medium">ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/30">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Ø±Ù…Ø²Ú¯Ø°Ø§Ø±ÛŒ Ø´Ø¯Ù‡
            </span>
            <span>Â·</span>
            <span>Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ Ù…Ø­ÙÙˆØ¸</span>
          </div>
        </div>
      </div>
      </div>
      
      {/* Interactive Onboarding Modal */}
      <InteractiveOnboardingModal 
        isOpen={showOnboardingModal} 
        onClose={() => {
          setShowOnboardingModal(false);
          navigate("/");
        }} 
      />
    </>
  );
};

export default Auth;
