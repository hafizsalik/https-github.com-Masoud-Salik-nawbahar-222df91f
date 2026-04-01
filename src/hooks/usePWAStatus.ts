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
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>();
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
        
        // Store registration for update functions
        setRegistration(registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // Check if new worker is installed and we have a current controller (means update available)
              // OR if new worker is installed and becomes the controller (means update was applied)
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New version available but not yet activated
                  setUpdateState('update-available');
                  
                  // Store update function
                  setUpdateSW(() => async (reloadPage: boolean = true) => {
                    setUpdateState('updating');
                    
                    try {
                      // Get current registration
                      const currentReg = await navigator.serviceWorker.ready;
                      
                      if (currentReg.waiting) {
                        // Tell service worker to skip waiting
                        currentReg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        
                        // Wait for controller change
                        const controllerChange = new Promise((resolve) => {
                          const handleControllerChange = () => {
                            window.removeEventListener('controllerchange', handleControllerChange);
                            resolve(undefined);
                          };
                          window.addEventListener('controllerchange', handleControllerChange);
                        });
                        
                        await controllerChange;
                        
                        if (reloadPage) {
                          window.location.reload();
                        }
                      } else if (currentReg.installing) {
                        // If worker is still installing, wait for it
                        const installComplete = new Promise((resolve) => {
                          const handleInstall = () => {
                            if (currentReg.installing?.state === 'installed') {
                              currentReg.installing.removeEventListener('statechange', handleInstall);
                              resolve(undefined);
                            }
                          };
                          
                          if (currentReg.installing?.state === 'installed') {
                            resolve(undefined);
                          } else {
                            currentReg.installing?.addEventListener('statechange', handleInstall);
                          }
                        });
                        
                        await installComplete;
                        
                        // Now try to activate
                        if (currentReg.waiting) {
                          currentReg.waiting.postMessage({ type: 'SKIP_WAITING' });
                          
                          const controllerChange = new Promise((resolve) => {
                            const handleControllerChange = () => {
                              window.removeEventListener('controllerchange', handleControllerChange);
                              resolve(undefined);
                            };
                            window.addEventListener('controllerchange', handleControllerChange);
                          });
                          
                          await controllerChange;
                          
                          if (reloadPage) {
                            window.location.reload();
                          }
                        }
                      } else {
                        // No worker available, force a refresh
                        setUpdateState('up-to-date');
                        toast({
                          title: 'بروزرسانی انجام شد',
                          description: 'صفحه برای اعمال تغییرات رفرش می‌شود',
                        });
                        
                        if (reloadPage) {
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        }
                      }
                    } catch (error) {
                      console.error('Update failed:', error);
                      setUpdateState('error');
                      toast({
                        title: 'خطا در بروزرسانی',
                        description: 'لطفاً صفحه را دستی رفرش کنید',
                        variant: 'destructive',
                      });
                    }
                  });
                  
                  // Show update notification
                  toast({
                    title: 'نسخه جدید آماده است',
                    description: 'برای دریافت آخرین تغییرات، بروزرسانی کنید',
                  });
                } else {
                  // First time installation or no controller, set as up to date
                  setUpdateState('up-to-date');
                }
              }
            });
          }
        });

        // Initial check for updates
        setTimeout(() => {
          checkForUpdates();
        }, 1000);

        // Periodic check for updates (every 30 minutes)
        updateChecker = setInterval(() => {
          checkForUpdates();
        }, 30 * 60 * 1000);

      } catch (error) {
        console.error('SW registration failed:', error);
        setUpdateState('error');
      }
    };

    registerSW();

    return () => {
      clearInterval(updateChecker);
    };
  }, [toast, checkForUpdates]);

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
      let reg = registration;
      
      if (!reg) {
        // Try to get registration if not available
        reg = await navigator.serviceWorker.ready;
        setRegistration(reg);
        
        if (!reg) {
          setUpdateState('error');
          toast({
            title: 'خطا در بررسی',
            description: 'سرویس ورکر در دسترس نیست',
            variant: 'destructive',
          });
          return;
        }
      }

      // Manually check for updates
      await reg.update();
      
      // Wait a bit to see if update is found
      setTimeout(() => {
        if (updateState !== 'update-available' && updateState !== 'updating') {
          setUpdateState('up-to-date');
          toast({
            title: 'برنامه بروز است',
            description: 'شما آخرین نسخه را دارید',
          });
        }
      }, 3000);
      
    } catch (error) {
      console.error('Update check failed:', error);
      setUpdateState('error');
      toast({
        title: 'خطا در بررسی',
        description: 'دوباره تلاش کنید',
        variant: 'destructive',
      });
    }
  }, [registration, updateState, toast]);


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
