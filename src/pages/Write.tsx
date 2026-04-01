import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PenLine, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

const Write = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          navigate("/editor", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh] animate-fade-in">
          <span className="text-sm text-muted-foreground">در حال بارگذاری...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead
        title="نوشتن مقاله"
        description="مقاله جدید بنویسید و با جامعه نوبهار به اشتراک بگذارید"
        ogUrl="/write"
        noIndex
      />
      <div className="flex flex-col items-center justify-center py-20 px-5 text-center animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground mb-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muted-foreground rounded-md"
          aria-label="بازگشت"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
          <span className="text-[13px]">بازگشت</span>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-5 shadow-sm">
          <PenLine size={24} className="text-muted-foreground/50" />
        </div>
        {/* Headline */}
        <h2 className="text-xl font-semibold mb-2 tracking-tight">بنویسید</h2>
        <p className="text-[14px] text-muted-foreground/70 max-w-[280px] mb-6 leading-relaxed">
          دیدگاه‌های خود را با جامعه نوبهار به اشتراک بگذارید
        </p>

        {/* CTA */}
        <Link to="/auth" className="w-full max-w-[200px]">
          <Button
            variant="outline"
            className="w-full rounded-full px-6 h-10 text-[14px] font-medium transition-all hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:ring-muted-foreground"
          >
            ورود برای شروع نوشتن
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Write;
