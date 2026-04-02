import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UpdateState = "idle" | "checking" | "up-to-date" | "update" | "error";

let deferredPrompt: any = null;

export default function Install() {
  const navigate = useNavigate();

  const [isPWA, setIsPWA] = useState(false);
  const [ready, setReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>("idle");

  // 🔍 Detect install state
  useEffect(() => {
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsPWA(installed);
    setReady(true);

    // listen install event
    window.addEventListener("appinstalled", () => {
      setIsPWA(true);
    });

    // capture install prompt
    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    });
  }, []);

  // 🔄 Check for updates (real SW)
  const checkUpdates = async () => {
    setUpdateState("checking");

    try {
      const reg = await navigator.serviceWorker.getRegistration();

      if (!reg) {
        setUpdateState("error");
        return;
      }

      await reg.update();

      if (reg.waiting) {
        setUpdateState("update");
      } else {
        setUpdateState("up-to-date");
      }
    } catch {
      setUpdateState("error");
    }
  };

  // 🚀 Install app
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsPWA(true);
    }

    deferredPrompt = null;
    setCanInstall(false);
  };

  // 🔄 Apply update
  const applyUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();

    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 rounded-2xl bg-primary/10 p-4">
              {isPWA ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : (
                <Download className="h-10 w-10 text-primary" />
              )}
            </div>

            <CardTitle>
              {isPWA ? "Installed Successfully ✅" : "Install App"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isPWA ? (
              <>
                {/* UPDATE BOX */}
                <div className="rounded-xl bg-muted p-4 space-y-2">
                  {updateState === "checking" && (
                    <div className="flex justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking updates...
                    </div>
                  )}

                  {updateState === "up-to-date" && (
                    <p className="text-green-600">Up to date</p>
                  )}

                  {updateState === "update" && (
                    <>
                      <p className="text-yellow-600">
                        New update available 🚀
                      </p>
                      <Button onClick={applyUpdate} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Now
                      </Button>
                    </>
                  )}

                  {updateState === "error" && (
                    <p className="text-red-500">Update check failed</p>
                  )}

                  <Button
                    variant="outline"
                    onClick={checkUpdates}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Updates
                  </Button>
                </div>

                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </>
            ) : (
              <>
                {canInstall ? (
                  <Button onClick={handleInstall} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Install Now
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Install not supported on this device
                  </p>
                )}

                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Continue without install
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}