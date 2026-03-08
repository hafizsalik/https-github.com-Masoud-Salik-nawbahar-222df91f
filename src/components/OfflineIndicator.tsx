import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { WifiOff, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const { isOnline } = useOfflineStatus();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }

    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Banner — subtle top bar */}
      {!isOnline && (
        <div className="fixed top-11 left-0 right-0 z-50 animate-slide-down">
          <div className="bg-muted/95 backdrop-blur-sm border-b border-border py-1.5 px-4 flex items-center justify-center gap-2">
            <WifiOff size={13} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">آفلاین — نمایش محتوای ذخیره‌شده</span>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && isOnline && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-xl shadow-lg p-4 animate-slide-up safe-bottom">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-[13px] mb-0.5">نوبهار را نصب کنید</h3>
              <p className="text-[11.5px] text-muted-foreground">
                دسترسی سریع‌تر و تجربه بهتر
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="بستن"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleInstall} 
              size="sm" 
              className="flex-1 h-8 text-[12px]"
            >
              نصب اپلیکیشن
            </Button>
            <Button 
              onClick={handleDismiss} 
              variant="outline" 
              size="sm"
              className="h-8 text-[12px]"
            >
              بعداً
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
