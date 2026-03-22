import { usePWAStatus } from "@/hooks/usePWAStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, Plus, MoreVertical, ArrowRight, Wifi, Zap, Bell, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InstallUpdateButton } from "@/components/InstallUpdateButton";

export default function Install() {
  const { isPWA, installState, updateState, checkForUpdates } = usePWAStatus();
  const navigate = useNavigate();

  // Detect platform for manual instructions
  const getPlatform = () => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  };

  const platform = getPlatform();

  if (isPWA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-scale-in">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-5 rounded-2xl mb-4">
              <CheckCircle2 className="h-14 w-14 text-primary" />
            </div>
            <CardTitle className="text-2xl">نوبهار نصب شده است ✅</CardTitle>
            <CardDescription className="leading-relaxed">
              می‌توانید از آیکون روی صفحه اصلی دستگاهتان به اپلیکیشن دسترسی داشته باشید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Update Status */}
            <div className="bg-muted rounded-xl p-4">
              {updateState === 'up-to-date' && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">برنامه بروز است</span>
                </div>
              )}
              {updateState === 'update-available' && (
                <div className="space-y-2">
                  <p className="text-amber-600 font-medium">نسخه جدید موجود است</p>
                  <InstallUpdateButton className="w-full" />
                </div>
              )}
              {updateState === 'checking' && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>در حال بررسی...</span>
                </div>
              )}
              {(updateState === 'up-to-date' || updateState === 'error') && (
                <Button 
                  variant="outline" 
                  onClick={checkForUpdates}
                  className="w-full mt-2"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  بررسی بروزرسانی
                </Button>
              )}
            </div>

            <Button onClick={() => navigate('/')} className="w-full btn-press" size="lg">
              برو به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight size={18} />
          <span className="text-sm">بازگشت</span>
        </button>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary/10 p-5 rounded-2xl mb-4 w-fit">
            <img 
              src="/pwa-192x192.png" 
              alt="نوبهار" 
              className="h-20 w-20 rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">نوبهار</h1>
          <p className="text-muted-foreground">جامعه نخبگان</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Wifi className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">دسترسی آفلاین</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">سرعت بیشتر</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Bell className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">اعلانات</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Smartphone className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">تمام‌صفحه</p>
          </div>
        </div>

        {/* Install Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              نصب اپلیکیشن
            </CardTitle>
            <CardDescription>
              با نصب اپلیکیشن، تجربه بهتری خواهید داشت
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Install Button */}
            {installState === 'not-installed' ? (
              <InstallUpdateButton className="w-full" size="lg" />
            ) : installState === 'installing' ? (
              <Button disabled className="w-full" size="lg">
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                در حال نصب...
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-sm font-medium mb-4 text-center">راهنمای نصب دستی</p>
                  
                  {platform === 'ios' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۱</span>
                        <div className="flex items-center gap-2">
                          <span>روی</span>
                          <Share className="h-4 w-4 text-primary" />
                          <span>ضربه بزنید</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۲</span>
                        <div className="flex items-center gap-2">
                          <span>«Add to Home Screen»</span>
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۳</span>
                        <span>روی «Add» ضربه بزنید</span>
                      </div>
                    </div>
                  )}

                  {platform === 'android' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۱</span>
                        <div className="flex items-center gap-2">
                          <span>روی</span>
                          <MoreVertical className="h-4 w-4 text-primary" />
                          <span>ضربه بزنید</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۲</span>
                        <span>«نصب برنامه» را انتخاب کنید</span>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۳</span>
                        <span>«نصب» را تأیید کنید</span>
                      </div>
                    </div>
                  )}

                  {platform === 'desktop' && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۱</span>
                        <span>روی آیکون نصب در نوار آدرس کلیک کنید</span>
                      </div>
                      <div className="flex items-center gap-3 bg-card rounded-lg p-3">
                        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">۲</span>
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
          className="w-full text-muted-foreground hover:text-foreground"
        >
          ادامه بدون نصب
        </Button>
      </div>
    </div>
  );
}
