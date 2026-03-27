import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Share,
  Smartphone,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallUpdateButton } from "@/components/InstallUpdateButton";
import { usePWAStatus } from "@/hooks/usePWAStatus";

export default function Install() {
  const { isPWA, installState, updateState, checkForUpdates } = usePWAStatus();
  const navigate = useNavigate();

  const getPlatform = () => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
  };

  const platform = getPlatform();

  if (isPWA) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-scale-in text-center">
          <CardHeader>
            <div className="mx-auto mb-4 rounded-2xl bg-primary/10 p-5">
              <CheckCircle2 className="h-14 w-14 text-primary" />
            </div>
            <CardTitle className="text-2xl">نوبهار نصب شده است</CardTitle>
            <CardDescription className="leading-relaxed">
              می‌توانید از آیکن روی صفحه اصلی دستگاه‌تان به اپلیکیشن دسترسی داشته باشید.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted p-4">
              {updateState === "up-to-date" && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">برنامه بروز است</span>
                </div>
              )}

              {updateState === "update-available" && (
                <div className="space-y-2">
                  <p className="font-medium text-amber-600">نسخه جدید موجود است</p>
                  <InstallUpdateButton className="w-full" />
                </div>
              )}

              {updateState === "checking" && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>در حال بررسی...</span>
                </div>
              )}

              {(updateState === "up-to-date" || updateState === "error") && (
                <Button variant="outline" onClick={checkForUpdates} className="mt-2 w-full">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  بررسی بروزرسانی
                </Button>
              )}
            </div>

            <Button onClick={() => navigate("/")} className="w-full btn-press" size="lg">
              برو به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight size={18} />
          <span className="text-sm">بازگشت</span>
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-fit rounded-2xl bg-primary/10 p-5">
            <img src="/pwa-192x192.png" alt="نوبهار" className="h-20 w-20 rounded-xl" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">نوبهار</h1>
          <p className="text-muted-foreground">جامعه نخبگان</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Wifi className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-xs font-medium">دسترسی آفلاین</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Zap className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-xs font-medium">سرعت بیشتر</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Bell className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-xs font-medium">اعلانات</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Smartphone className="mx-auto mb-2 h-6 w-6 text-primary" />
            <p className="text-xs font-medium">تمام‌صفحه</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              نصب اپلیکیشن
            </CardTitle>
            <CardDescription>با نصب اپلیکیشن، تجربه روان‌تر و سریع‌تری خواهید داشت.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {installState === "not-installed" ? (
              <InstallUpdateButton className="w-full" size="lg" />
            ) : installState === "installing" ? (
              <Button disabled className="w-full" size="lg">
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                در حال نصب...
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted p-4">
                  <p className="mb-4 text-center text-sm font-medium">راهنمای نصب دستی</p>

                  {platform === "ios" && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۱
                        </span>
                        <div className="flex items-center gap-2">
                          <span>روی</span>
                          <Share className="h-4 w-4 text-primary" />
                          <span>ضربه بزنید</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۲
                        </span>
                        <div className="flex items-center gap-2">
                          <span>گزینه Add to Home Screen را انتخاب کنید</span>
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۳
                        </span>
                        <span>روی Add ضربه بزنید</span>
                      </div>
                    </div>
                  )}

                  {platform === "android" && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۱
                        </span>
                        <div className="flex items-center gap-2">
                          <span>روی</span>
                          <MoreVertical className="h-4 w-4 text-primary" />
                          <span>ضربه بزنید</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۲
                        </span>
                        <span>گزینه نصب برنامه را انتخاب کنید</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۳
                        </span>
                        <span>نصب را تایید کنید</span>
                      </div>
                    </div>
                  )}

                  {platform === "desktop" && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۱
                        </span>
                        <span>روی آیکن نصب در نوار آدرس کلیک کنید</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-card p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          ۲
                        </span>
                        <span>گزینه Install را انتخاب کنید</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          ادامه بدون نصب
        </Button>
      </div>
    </div>
  );
}
