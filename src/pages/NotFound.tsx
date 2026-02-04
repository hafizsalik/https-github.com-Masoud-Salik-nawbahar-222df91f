import { Link } from "react-router-dom";
import { Home, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center animate-fade-in">
      {/* 404 Illustration */}
      <div className="relative mb-8">
        <div className="text-[120px] font-black text-muted/20 leading-none select-none">۴۰۴</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search size={40} className="text-primary" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-3">
        صفحه پیدا نشد
      </h1>
      
      <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
        متأسفانه صفحه‌ای که دنبال آن هستید وجود ندارد یا منتقل شده است.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/">
          <Button className="gap-2 btn-press">
            <Home size={16} />
            صفحه اصلی
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowRight size={16} />
          بازگشت
        </Button>
      </div>

      {/* Helpful links */}
      <div className="mt-12 text-sm text-muted-foreground">
        <p className="mb-3">شاید این لینک‌ها مفید باشند:</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/explore" className="text-primary hover:underline">کاوش</Link>
          <Link to="/write" className="text-primary hover:underline">نوشتن</Link>
          <Link to="/about" className="text-primary hover:underline">درباره ما</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
