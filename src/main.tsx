import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('New content available, please refresh.');
            }
          });
        }
      });
    } catch (error) {
      // Service worker registration failed - app continues to work without it
      console.warn('SW registration failed:', error);
    }
  });

  // Handle controller change (when new SW takes over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Optional: reload on new SW activation for seamless updates
  });
}

createRoot(document.getElementById("root")!).render(<App />);