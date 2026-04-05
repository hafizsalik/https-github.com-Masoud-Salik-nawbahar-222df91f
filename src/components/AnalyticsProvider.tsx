import { createContext, useContext, useCallback, ReactNode } from 'react';
import { analyticsService, ActivityType } from '@/services/analytics';

interface AnalyticsContextType {
  logActivity: (type: ActivityType, metadata?: Record<string, any>) => void;
  setCurrentActivity: (activity: string) => void;
  trackArticleView: (articleId: string) => void;
  trackArticleRead: (articleId: string, timeSpent: number) => void;
  trackSearch: (query: string, resultsCount?: number) => void;
  trackProfileView: (profileId: string) => void;
  deviceId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

// Simplified provider — analytics is no-op until tables exist
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const logActivity = useCallback((_type: ActivityType, _metadata?: Record<string, any>) => {}, []);
  const setCurrentActivity = useCallback((_activity: string) => {}, []);
  const trackArticleView = useCallback((_articleId: string) => {}, []);
  const trackArticleRead = useCallback((_articleId: string, _timeSpent: number) => {}, []);
  const trackSearch = useCallback((_query: string, _resultsCount?: number) => {}, []);
  const trackProfileView = useCallback((_profileId: string) => {}, []);

  const value: AnalyticsContextType = {
    logActivity,
    setCurrentActivity,
    trackArticleView,
    trackArticleRead,
    trackSearch,
    trackProfileView,
    deviceId: analyticsService.deviceId,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
