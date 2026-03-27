import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { analyticsService } from "@/services/analytics";

type InstallState = "unknown" | "installed" | "not-installed" | "installing";
type UpdateState = "checking" | "up-to-date" | "update-available" | "updating" | "error";

interface PWAStatus {
  installState: InstallState;
  updateState: UpdateState;
  isPWA: boolean;
  currentVersion: string;
  updateSW?: (reloadPage?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  installApp: () => Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const detectPWA = (): boolean => {
  if (typeof window === "undefined") return false;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone || isFullscreen || isIOSStandalone;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAStatus(): PWAStatus {
  const [installState, setInstallState] = useState<InstallState>("unknown");
  const [updateState, setUpdateState] = useState<UpdateState>("checking");
  const [isPWA, setIsPWA] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>();
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | undefined>();
  const { toast } = useToast();

  const currentVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";

  const prepareUpdate = useCallback(
    (swRegistration: ServiceWorkerRegistration, showToast: boolean) => {
      const waitingWorker = swRegistration.waiting;
      if (!waitingWorker) {
        return false;
      }

      setRegistration(swRegistration);
      setUpdateState("update-available");
      setUpdateSW(() => async (reloadPage: boolean = true) => {
        setUpdateState("updating");

        try {
          waitingWorker.postMessage({ type: "SKIP_WAITING" });

          if (!reloadPage) {
            setUpdateState("up-to-date");
            return;
          }

          let reloaded = false;
          const reload = () => {
            if (reloaded) return;
            reloaded = true;
            window.location.reload();
          };

          navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
          window.setTimeout(reload, 1500);
        } catch (error) {
          console.error("Update failed:", error);
          setUpdateState("error");
          toast({
            title: "خطا در بروزرسانی",
            description: "لطفاً صفحه را دوباره بارگذاری کنید.",
            variant: "destructive",
          });
        }
      });

      if (showToast) {
        toast({
          title: "نسخه جدید آماده است",
          description: "برای دریافت آخرین تغییرات، بروزرسانی را بزنید.",
        });
      }

      return true;
    },
    [toast]
  );

  const runUpdateCheck = useCallback(
    async (showFeedback: boolean) => {
      if (!("serviceWorker" in navigator)) {
        setUpdateState("error");
        if (showFeedback) {
          toast({
            title: "بروزرسانی پشتیبانی نمی‌شود",
            description: "مرورگر شما از Service Worker پشتیبانی نمی‌کند.",
            variant: "destructive",
          });
        }
        return;
      }

      setUpdateState("checking");

      try {
        const swRegistration = registration ?? (await navigator.serviceWorker.getRegistration()) ?? undefined;

        if (!swRegistration) {
          setUpdateState("up-to-date");
          if (showFeedback) {
            toast({
              title: "برنامه آماده است",
              description: "هنوز سرویس ورکر فعالی برای بروزرسانی پیدا نشد.",
            });
          }
          return;
        }

        setRegistration(swRegistration);
        await swRegistration.update();

        if (prepareUpdate(swRegistration, showFeedback)) {
          return;
        }

        setUpdateState("up-to-date");
        setUpdateSW(undefined);

        if (showFeedback) {
          toast({
            title: "برنامه بروز است",
            description: `نسخه ${currentVersion} آخرین نسخه موجود است.`,
          });
        }
      } catch (error) {
        console.error("Update check failed:", error);
        setUpdateState("error");

        if (showFeedback) {
          toast({
            title: "خطا در بررسی بروزرسانی",
            description: "لطفاً کمی بعد دوباره تلاش کنید.",
            variant: "destructive",
          });
        }
      }
    },
    [currentVersion, prepareUpdate, registration, toast]
  );

  const checkForUpdates = useCallback(async () => {
    await runUpdateCheck(true);
  }, [runUpdateCheck]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      toast({
        title: "نصب مستقیم در دسترس نیست",
        description: "لطفاً از Chrome یا Edge استفاده کنید یا از منوی مرورگر نصب را انجام دهید.",
        variant: "destructive",
      });
      return;
    }

    setInstallState("installing");

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === "accepted") {
        setInstallState("installed");
        setIsPWA(true);
        analyticsService.trackAppInstall();
        toast({
          title: "در حال نصب",
          description: "اپلیکیشن روی دستگاه شما اضافه شد.",
        });
      } else {
        setInstallState("not-installed");
      }

      deferredPrompt = null;
    } catch (error) {
      console.error("Install failed:", error);
      setInstallState("not-installed");
      toast({
        title: "خطا در نصب",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const syncInstallState = () => {
      const pwa = detectPWA();
      setIsPWA(pwa);
      setInstallState(pwa ? "installed" : deferredPrompt ? "not-installed" : "unknown");
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      setInstallState("not-installed");
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setInstallState("installed");
      setIsPWA(true);
      analyticsService.trackAppInstall();
      toast({
        title: "نصب انجام شد",
        description: "اکنون می‌توانید نوبهار را مثل یک اپ اجرا کنید.",
      });
    };

    syncInstallState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setUpdateState("error");
      return;
    }

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let detachUpdateFound: (() => void) | undefined;

    const setup = async () => {
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        if (!active) return;

        setRegistration(swRegistration);

        const handleUpdateFound = () => {
          const installingWorker = swRegistration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (!active) return;

            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              prepareUpdate(swRegistration, true);
            }
          });
        };

        swRegistration.addEventListener("updatefound", handleUpdateFound);
        detachUpdateFound = () => swRegistration.removeEventListener("updatefound", handleUpdateFound);

        await runUpdateCheck(false);
        intervalId = window.setInterval(() => {
          void runUpdateCheck(false);
        }, 30 * 60 * 1000);
      } catch (error) {
        console.error("Service worker setup failed:", error);
        if (active) {
          setUpdateState("error");
        }
      }
    };

    void setup();

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      detachUpdateFound?.();
    };
  }, [prepareUpdate, runUpdateCheck]);

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
