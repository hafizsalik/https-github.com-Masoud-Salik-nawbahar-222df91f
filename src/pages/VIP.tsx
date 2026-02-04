import { AppLayout } from "@/components/layout/AppLayout";
import { Star, Trophy, Award, Crown, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VIP = () => {
  return (
    <AppLayout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-10 px-6 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/5 rounded-2xl border border-primary/20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 w-12 h-12 bg-primary/30 rounded-full blur-xl" />
            <div className="absolute bottom-8 left-12 w-16 h-16 bg-accent/30 rounded-full blur-xl" />
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5 animate-bounce-subtle">
              <Crown size={40} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">محتوای ویژه</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              مسابقات رسمی، سرمقاله‌های منتخب و محتوای اختصاصی برای اعضای ویژه
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Zap size={20} className="text-primary" />
            </div>
            <h3 className="font-medium text-sm">دسترسی زودهنگام</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Target size={20} className="text-primary" />
            </div>
            <h3 className="font-medium text-sm">محتوای اختصاصی</h3>
          </div>
        </div>

        {/* Competitions Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy size={18} className="text-primary" />
              مسابقات
            </CardTitle>
            <CardDescription>شرکت در مسابقات نویسندگی</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Trophy size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                به زودی اولین مسابقه نویسندگی نوبهار اعلام می‌شود
              </p>
              <Button variant="outline" size="sm" disabled>
                <Star size={14} className="ml-1" />
                اطلاع از شروع
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editorials Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award size={18} className="text-primary" />
              سرمقاله‌ها
            </CardTitle>
            <CardDescription>مقالات برگزیده هیئت تحریریه</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Award size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                سرمقاله‌های منتخب سردبیر به زودی منتشر می‌شوند
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Note */}
        <p className="text-center text-xs text-muted-foreground py-4">
          این بخش در حال توسعه است و به‌زودی امکانات بیشتری اضافه خواهد شد
        </p>
      </div>
    </AppLayout>
  );
};

export default VIP;
