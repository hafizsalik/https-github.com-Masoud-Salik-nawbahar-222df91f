import { Button } from '@/components/ui/button';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

interface InstallUpdateButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function InstallUpdateButton({ 
  variant = 'default', 
  size = 'default',
  className 
}: InstallUpdateButtonProps) {
  const { 
    installState, 
    updateState, 
    isPWA, 
    installApp, 
    checkForUpdates,
    updateSW 
  } = usePWAStatus();

  // Not installed - show Install button
  if (!isPWA && installState === 'not-installed') {
    return (
      <Button 
        variant={variant} 
        size={size}
        className={className}
        onClick={installApp}
      >
        <Download className="w-4 h-4 ml-2" />
        نصب برنامه
      </Button>
    );
  }

  // Installing
  if (installState === 'installing') {
    return (
      <Button 
        variant={variant} 
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        در حال نصب...
      </Button>
    );
  }

  // Installed - show Check for Updates
  if (isPWA) {
    // Update available
    if (updateState === 'update-available') {
      return (
        <Button 
          variant="default" 
          size={size}
          className={className}
          onClick={() => updateSW?.(true)}
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          بروزرسانی برنامه
        </Button>
      );
    }

    // Checking
    if (updateState === 'checking' || updateState === 'updating') {
      return (
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled
        >
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          {updateState === 'checking' ? 'در حال بررسی...' : 'در حال بروزرسانی...'}
        </Button>
      );
    }

    // Up to date
    if (updateState === 'up-to-date') {
      return (
        <Button 
          variant="outline" 
          size={size}
          className={className}
          onClick={checkForUpdates}
        >
          <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
          برنامه بروز است
        </Button>
      );
    }

    // Error or default - show Check for Updates
    return (
      <Button 
        variant={variant} 
        size={size}
        className={className}
        onClick={checkForUpdates}
      >
        <RefreshCw className="w-4 h-4 ml-2" />
        بررسی بروزرسانی
      </Button>
    );
  }

  // Default/Unknown state
  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      disabled
    >
      <AlertCircle className="w-4 h-4 ml-2" />
      بررسی وضعیت...
    </Button>
  );
}

export default InstallUpdateButton;
