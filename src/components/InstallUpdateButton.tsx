import { Button } from "@/components/ui/button";
import { usePWAStatus } from "@/hooks/usePWAStatus";
import { AlertCircle, CheckCircle, Download, Loader2, RefreshCw } from "lucide-react";

interface InstallUpdateButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function InstallUpdateButton({
  variant = "default",
  size = "default",
  className,
}: InstallUpdateButtonProps) {
  const { installState, updateState, isPWA, installApp, checkForUpdates, updateSW } = usePWAStatus();

  if (!isPWA && installState === "not-installed") {
    return (
      <Button variant={variant} size={size} className={className} onClick={installApp}>
        <Download className="ml-2 h-4 w-4" />
        نصب برنامه
      </Button>
    );
  }

  if (installState === "installing") {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        در حال نصب...
      </Button>
    );
  }

  if (isPWA) {
    if (updateState === "update-available") {
      return (
        <Button
          variant="default"
          size={size}
          className={className}
          onClick={async () => {
            if (updateSW) {
              await updateSW(true);
              return;
            }

            window.location.reload();
          }}
        >
          <RefreshCw className="ml-2 h-4 w-4" />
          بروزرسانی برنامه
        </Button>
      );
    }

    if (updateState === "updating") {
      return (
        <Button variant={variant} size={size} className={className} disabled>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          در حال بروزرسانی...
        </Button>
      );
    }

    if (updateState === "checking") {
      return (
        <Button variant={variant} size={size} className={className} disabled>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          در حال بررسی...
        </Button>
      );
    }

    if (updateState === "up-to-date") {
      return (
        <Button variant="outline" size={size} className={className} onClick={checkForUpdates}>
          <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
          برنامه بروز است
        </Button>
      );
    }

    if (updateState === "error") {
      return (
        <Button variant="destructive" size={size} className={className} onClick={checkForUpdates}>
          <AlertCircle className="ml-2 h-4 w-4" />
          تلاش مجدد
        </Button>
      );
    }

    return (
      <Button variant={variant} size={size} className={className} onClick={checkForUpdates}>
        <RefreshCw className="ml-2 h-4 w-4" />
        بررسی بروزرسانی
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} disabled>
      <AlertCircle className="ml-2 h-4 w-4" />
      بررسی وضعیت...
    </Button>
  );
}

export default InstallUpdateButton;
