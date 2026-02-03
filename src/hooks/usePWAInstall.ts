import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => {
    // Check if already installed via multiple methods
    const checkIfInstalled = () => {
      // Method 1: Display mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      // Method 2: iOS standalone
      if ((navigator as any).standalone === true) {
        return true;
      }
      // Method 3: Android TWA
      if (document.referrer.includes('android-app://')) {
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstallOutcome('accepted');
      
      // Track installation
      console.log('PWA was installed');
    };

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setInstallOutcome(outcome);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during PWA install:', error);
      return false;
    }
  };

  const getInstallInstructions = () => {
    const ua = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(ua)) {
      return {
        platform: 'ios',
        instructions: 'روی دکمه Share (اشتراک‌گذاری) در پایین صفحه ضربه بزنید، سپس "Add to Home Screen" را انتخاب کنید.',
      };
    }
    
    if (/android/i.test(ua)) {
      return {
        platform: 'android',
        instructions: 'روی منوی سه‌نقطه در بالا ضربه بزنید و "افزودن به صفحه اصلی" را انتخاب کنید.',
      };
    }
    
    return {
      platform: 'desktop',
      instructions: 'روی آیکون نصب در نوار آدرس مرورگر کلیک کنید.',
    };
  };

  return { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    installOutcome,
    getInstallInstructions,
  };
}