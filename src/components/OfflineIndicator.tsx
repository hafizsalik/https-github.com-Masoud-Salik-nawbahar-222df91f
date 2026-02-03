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
    // Show install banner after 30 seconds if installable and not dismissed
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
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm flex items-center justify-center gap-2 animate-fade-in">
          <WifiOff size={16} />
          <span>شما آفلاین هستید. در حال نمایش محتوای ذخیره شده...</span>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && isOnline && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-xl shadow-lg p-4 animate-fade-in safe-bottom">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">نوبهار را نصب کنید</h3>
              <p className="text-sm text-muted-foreground">
                اپلیکیشن را نصب کنید برای دسترسی سریع‌تر و تجربه بهتر
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleInstall} 
              size="sm" 
              className="flex-1"
            >
              نصب اپلیکیشن
            </Button>
            <Button 
              onClick={handleDismiss} 
              variant="outline" 
              size="sm"
            >
              بعداً
            </Button>
          </div>
        </div>
      )}
    </>
  );
}