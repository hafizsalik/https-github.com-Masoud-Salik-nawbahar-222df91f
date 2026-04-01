import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PenLine, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

const Write = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/editor", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <AppLayout>
      <SEOHead title="Ù†ÙˆØ´ØªÙ† Ù…Ù‚Ø§Ù„Ù‡" description="Ù…Ù‚Ø§Ù„Ù‡ Ø¬Ø¯ÛŒØ¯ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯ Ùˆ Ø¨Ø§ Ø¬Ø§Ù…Ø¹Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø± Ø¨Ù‡ Ø§Ø´ØªØ±Ø§Ú© Ø¨Ú¯Ø°Ø§Ø±ÛŒØ¯" ogUrl="/write" noIndex />
      <div className="flex flex-col items-center justify-center py-20 px-5 text-center animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1.5 text-muted-foreground/50 hover:text-foreground mb-8 transition-colors"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
          <span className="text-[13px]">Ø¨Ø§Ø²Ú¯Ø´Øª</span>
        </button>
        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-5">
          <PenLine size={24} className="text-muted-foreground/40" />
        </div>
        
        <h2 className="text-lg font-bold mb-2">Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯</h2>
        <p className="text-[13px] text-muted-foreground/50 max-w-[240px] mb-6 leading-relaxed">
          Ø¯ÛŒØ¯Ú¯Ø§Ù‡â€ŒÙ‡Ø§ÛŒ Ø®ÙˆØ¯ Ø±Ø§ Ø¨Ø§ Ø¬Ø§Ù…Ø¹Ù‡ Ù†ÙˆØ¨Ù‡Ø§Ø± Ø¨Ù‡ Ø§Ø´ØªØ±Ø§Ú© Ø¨Ú¯Ø°Ø§Ø±ÛŒØ¯
        </p>
        
        <Link to="/auth?view=login">
          <Button variant="outline" className="rounded-full px-6 h-9 text-[13px]">
            ÙˆØ±ÙˆØ¯ Ø¨Ø±Ø§ÛŒ Ø´Ø±ÙˆØ¹ Ù†ÙˆØ´ØªÙ†
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Write;
