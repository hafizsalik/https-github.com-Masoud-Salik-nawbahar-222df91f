import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
const motion = { div: 'div' as any, li: 'li' as any };
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Install() {
  const navigate = useNavigate();

  const [isPWA, setIsPWA] = useState(false);
  const [ready, setReady] = useState(false);
  const [updateState, setUpdateState] = useState<
    "idle" | "checking" | "up-to-date" | "update"
  >("idle");

  // ⚡ Fast background detection
  useEffect(() => {
    const detect = () => {
      const installed =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (installed) setIsPWA(true);
      setReady(true);
    };

    detect();
  }, []);

  // ⚡ Safe update check (no infinite loading)
  const checkUpdates = async () => {
    setUpdateState("checking");

    const timeout = setTimeout(() => {
      setUpdateState("up-to-date");
    }, 3000);

    try {
      // simulate service worker check
      await new Promise((r) => setTimeout(r, 1200));
      clearTimeout(timeout);
      setUpdateState("up-to-date");
    } catch {
      setUpdateState("up-to-date");
    }
  };

  // ⚡ Install trigger
  const handleInstall = async () => {
    // You should connect this to beforeinstallprompt
    alert("Install prompt triggered");
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
        key={isPWA ? "installed" : "install"}
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
              {isPWA ? "با موفقیت نصب شد ✅" : "...نصب برنامه"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isPWA ? (
              <>
                {/* Update section */}
                <div className="rounded-xl bg-muted p-4 space-y-2">
                  {updateState === "checking" && (
                    <div className="flex justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </div>
                  )}

                  {updateState === "up-to-date" && (
                    <p className="text-green-600">Up to date</p>
                  )}

                  <Button
                    variant="outline"
                    onClick={checkUpdates}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check updates
                  </Button>
                </div>

                <Button onClick={() => navigate("/")} className="w-full">
                  Go Home
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleInstall} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Install Now
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  ادامه بدون نصب برنامه
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
