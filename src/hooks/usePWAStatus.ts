import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from '@/services/analytics';
import { registerSW } from 'virtual:pwa-register';

type InstallState = 'unknown' | 'installed' | 'not-installed' | 'installing';
type UpdateState = 'checking' | 'up-to-date' | 'update-available' | 'updating' | 'error';

interface PWAStatus {
  installState: InstallState;
  updateState: UpdateState;
  isPWA: boolean;
  currentVersion: string;
  updateSW?: (reloadPage?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  installApp: () => Promise<void>;
}

// Detect if running as PWA
const detectPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check display mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isFullscreen || isIOSStandalone;
};

// Listen for beforeinstallprompt event
let deferredPrompt: Event | null = null;

export function usePWAStatus(): PWAStatus {
  const [installState, setInstallState] = useState<InstallState>('unknown');
  const [updateState, setUpdateState] = useState<UpdateState>('checking');
  const [isPWA, setIsPWA] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>();
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | undefined>();
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const currentVersion = import.meta.env.VITE_APP_VERSION || '0.0.0';

  // Check install status on mount
  useEffect(() => {
    const checkInstallStatus = () => {
      const pwa = detectPWA();
      setIsPWA(pwa);

      if (pwa) {
        setInstallState('installed');
      } else {
        // Check if beforeinstallprompt was fired (app is installable)
        setInstallState(deferredPrompt ? 'not-installed' : 'unknown');
      }
    };

    checkInstallStatus();

    // Listen for install prompt availability
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setInstallState('not-installed');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setInstallState('installed');
      setIsPWA(true);
      deferredPrompt = null;

      // Track install
      analyticsService.trackAppInstall();

      toast({
        title: 'نصب شد! 🎉',
        description: 'برنامه روی دستگاه شما نصب شد',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    setUpdateState('checking');

    try {
      toast({
        title: 'بررسی بروزرسانی',
        description: 'در حال بررسی نسخه جدید...',
      });

      if (registration) {
        await registration.update();
      }

      if (registration?.waiting) {
        setUpdateState('update-available');
        return;
      }

      setUpdateState('up-to-date');
      toast({
        title: 'برنامه بروز است',
        description: 'شما آخرین نسخه را دارید',
      });
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateState('error');
      toast({
        title: 'خطا در بررسی',
        description: 'دوباره تلاش کنید',
        variant: 'destructive',
      });
    }
  }, [toast, registration]);

  // Register service worker for updates (single source of truth)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (isRegistering) return;
    setIsRegistering(true);

    let updateChecker: NodeJS.Timeout | undefined;

    const updateHandler = registerSW({
      onNeedRefresh() {
        setUpdateState('update-available');
        toast({
          title: 'نسخه جدید آماده است',
          description: 'برای دریافت آخرین تغییرات، بروزرسانی کنید',
        });
      },
      onOfflineReady() {
        setUpdateState('up-to-date');
        toast({
          title: 'حالت آفلاین فعال شد',
          description: 'برنامه اکنون بدون اینترنت همچنان کار می‌کند',
        });
      },
      onRegistered(reg) {
        setRegistration(reg);
      },
      onRegisterError(error) {
        console.error('SW registration failed:', error);
        setUpdateState('error');
      },
    });

    setUpdateSW(() => async (reloadPage: boolean = true) => {
      setUpdateState('updating');
      try {
        await updateHandler(reloadPage);
        if (reloadPage) {
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setUpdateState('up-to-date');
        }
      } catch (error) {
        console.error('Update failed:', error);
        setUpdateState('error');
        toast({
          title: 'خطا در بروزرسانی',
          description: 'لطفاً دوباره تلاش کنید',
          variant: 'destructive',
        });
      }
    });

    updateChecker = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000);

    return () => {
      if (updateChecker) clearInterval(updateChecker);
    };
  }, [toast, checkForUpdates, isRegistering]);

  // Install app function
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      toast({
        title: 'نصب در مرورگر شما پشتیبانی نمی‌شود',
        description: 'لطفاً از Chrome یا Edge استفاده کنید',
        variant: 'destructive',
      });
      return;
    }

    setInstallState('installing');

    try {
      // Show install prompt
      (deferredPrompt as any).prompt();

      // Wait for user choice
      const result = await (deferredPrompt as any).userChoice;

      if (result.outcome === 'accepted') {
        setInstallState('installed');
        setIsPWA(true);

        analyticsService.trackAppInstall();

        toast({
          title: 'در حال نصب...',
          description: 'برنامه در حال نصب روی دستگاه شماست',
        });
      } else {
        setInstallState('not-installed');
      }

      deferredPrompt = null;
    } catch (error) {
      setInstallState('not-installed');
      toast({
        title: 'خطا در نصب',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    installState,
    updateState,
    isPWA,
    currentVersion,
    updateSW,
    checkForUpdates,
    installApp,
  };
}

export type { InstallState, UpdateState, PWAStatus };
export default usePWAStatus;
