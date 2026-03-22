import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from '@/services/analytics';

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
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | undefined>();
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

  // Register service worker for updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let updateChecker: NodeJS.Timeout;

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.ready;
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setUpdateState('update-available');
                
                // Show update notification
                toast({
                  title: 'نسخه جدید آماده است',
                  description: 'برای دریافت آخرین تغییرات، بروزرسانی کنید',
                });
              }
            });
          }
        });

        // Periodic check for updates (every 30 minutes)
        updateChecker = setInterval(() => {
          registration?.update();
        }, 30 * 60 * 1000);

      } catch (error) {
        console.error('SW registration failed:', error);
      }
    };

    registerSW();

    return () => {
      clearInterval(updateChecker);
    };
  }, [toast]);

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

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    setUpdateState('checking');
    
    try {
      if (!registration) {
        setUpdateState('up-to-date');
        return;
      }

      await registration.update();
      
      // If no update found, we're up to date
      setTimeout(() => {
        if (updateState !== 'update-available') {
          setUpdateState('up-to-date');
        }
      }, 2000);
      
    } catch (error) {
      setUpdateState('error');
    }
  }, []);

  // Handle update
  const handleUpdate = async (reloadPage: boolean = true) => {
    setUpdateState('updating');
    
    try {
      // Tell service worker to skip waiting
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      if (reloadPage) {
        window.location.reload();
      }
    } catch (error) {
      setUpdateState('error');
      toast({
        title: 'خطا در بروزرسانی',
        variant: 'destructive',
      });
    }
  };

  return {
    installState,
    updateState,
    isPWA,
    currentVersion,
    updateSW: handleUpdate,
    checkForUpdates,
    installApp,
  };
}

export type { InstallState, UpdateState, PWAStatus };
export default usePWAStatus;
