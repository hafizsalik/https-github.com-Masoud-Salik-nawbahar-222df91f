import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Install() {
  const { isInstallable, isInstalled, promptInstall, getInstallInstructions } = usePWAInstall();
  const navigate = useNavigate();
  const instructions = getInstallInstructions();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      navigate('/');
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">نوبهار نصب شده است</CardTitle>
            <CardDescription>
              می‌توانید از آیکون روی صفحه اصلی دستگاهتان به اپلیکیشن دسترسی داشته باشید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              برو به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl mb-4 w-fit">
            <img 
              src="/pwa-192x192.png" 
              alt="نوبهار" 
              className="h-20 w-20 rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">نوبهار</h1>
          <p className="text-muted-foreground">جامعه نخبگان</p>
        </div>

        {/* Install Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              نصب اپلیکیشن
            </CardTitle>
            <CardDescription>
              با نصب اپلیکیشن، دسترسی سریع‌تر و تجربه بهتری خواهید داشت
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Features */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>دسترسی آفلاین به محتوای ذخیره شده</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>اعلانات برای مقالات و نظرات جدید</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>سرعت بارگذاری بیشتر</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>تجربه تمام‌صفحه بدون نوار مرورگر</span>
              </div>
            </div>

            {/* Install Button */}
            {isInstallable ? (
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="h-5 w-5 ml-2" />
                نصب اپلیکیشن
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">راهنمای نصب دستی:</p>
                  
                  {instructions.platform === 'ios' && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۱</span>
                        <span>روی دکمه</span>
                        <Share className="h-4 w-4" />
                        <span>ضربه بزنید</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۲</span>
                        <span>«Add to Home Screen» را انتخاب کنید</span>
                        <Plus className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۳</span>
                        <span>روی «Add» ضربه بزنید</span>
                      </div>
                    </div>
                  )}

                  {instructions.platform === 'android' && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۱</span>
                        <span>روی</span>
                        <MoreVertical className="h-4 w-4" />
                        <span>ضربه بزنید</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۲</span>
                        <span>«نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۳</span>
                        <span>«نصب» را تأیید کنید</span>
                      </div>
                    </div>
                  )}

                  {instructions.platform === 'desktop' && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۱</span>
                        <span>روی آیکون نصب در نوار آدرس کلیک کنید</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">۲</span>
                        <span>«Install» را انتخاب کنید</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="w-full text-muted-foreground"
        >
          ادامه بدون نصب
        </Button>
      </div>
    </div>
  );
}