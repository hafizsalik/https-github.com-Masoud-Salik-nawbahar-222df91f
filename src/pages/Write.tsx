import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PenLine, Sparkles, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Write = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/editor");
      }
    });
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-8 relative">
          <PenLine size={40} className="text-primary" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Sparkles size={12} className="text-primary-foreground" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-3">صدای خود را به اشتراک بگذارید</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
          مقالاتی بنویسید که مهم هستند. به جامعه نویسندگان ما بپیوندید و دیدگاه‌های خود را با دیگران به اشتراک بگذارید.
        </p>
        
        <Link to="/auth">
          <Button 
            size="lg" 
            className="rounded-full px-10 h-12 text-base font-medium shadow-lg btn-press"
          >
            ورود برای شروع نوشتن
          </Button>
        </Link>

        {/* Benefits */}
        <div className="mt-12 grid grid-cols-1 gap-4 w-full max-w-sm">
          <div className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-right">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">جامعه فعال</h4>
              <p className="text-xs text-muted-foreground">به هزاران خواننده دسترسی داشته باشید</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border text-right">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">رشد مخاطب</h4>
              <p className="text-xs text-muted-foreground">دنبال‌کنندگان خود را افزایش دهید</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Write;
