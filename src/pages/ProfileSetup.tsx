import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import InteractiveOnboardingModal from "@/components/InteractiveOnboardingModal";
import { SEOHead } from "@/components/SEOHead";
import nawbaharLogo from "@/assets/nawbahar-logo.png";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  "ایجاد پروفایل شخصی",
  "تنظیم علایق شما",
  "آماده‌سازی تجربه هوشمند",
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);

  // 🚀 Safe redirect
  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // ✨ Animated steps
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);

    const open = setTimeout(() => setShowModal(true), 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(open);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.display_name || "کاربر";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="تکمیل پروفایل" description="شروع تجربه حرفه‌ای در نوبهار" noIndex />

      {/* 🔥 Top progress */}
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />

      {/* 🌟 Center */}
      <div className="flex-1 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-6"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <img src={nawbaharLogo} className="w-12 h-12" />
              <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-bold">
              خوش آمدی، {name} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              در حال ساخت تجربه‌ای مخصوص شما...
            </p>
          </div>

          {/* 🧠 Smart steps */}
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-all
                  ${i <= step ? "bg-primary/10 text-foreground" : "bg-muted/30 text-muted-foreground"}
                `}
              >
                <span>{s}</span>
                {i < step ? "✓" : i === step ? "..." : ""}
              </div>
            ))}
          </div>

          {/* Loader */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>

          {/* Skip (pro UX) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground"
          >
            رد کردن
            <ArrowRight className="mr-1 w-3 h-3" />
          </Button>
        </motion.div>
      </div>

      {/* 🚀 Onboarding Modal */}
      <InteractiveOnboardingModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          navigate("/");
        }}
      />
    </div>
  );
}
