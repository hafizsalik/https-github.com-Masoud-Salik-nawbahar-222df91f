import { QueryClient } from "@tanstack/react-query";

// Create query client with offline-first strategy
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data for 30 minutes
      gcTime: 1000 * 60 * 30,
      // Consider data fresh for 30 seconds
      staleTime: 1000 * 30,
      // Retry failed requests up to 2 times
      retry: 2,
      // Keep previous data while fetching new data
      placeholderData: (previousData: unknown) => previousData,
      // Don't refetch on window focus in offline mode
      refetchOnWindowFocus: (query) => {
        return navigator.onLine;
      },
      // Keep showing stale data when offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations when back online
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

// Listen for online event to refetch stale queries
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    queryClient.invalidateQueries();
  });
}
