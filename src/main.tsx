import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPeriodicSync } from "./lib/backgroundSync";

// vite-plugin-pwa handles SW registration automatically via registerType: "autoUpdate"
// Do NOT manually register /sw.js as it conflicts with the plugin's generated SW

createRoot(document.getElementById("root")!).render(<App />);

// Suppress mobile long-press context menu (link preview card) except on
// editable / selectable content where users legitimately need it.
if (typeof window !== "undefined") {
  document.addEventListener(
    "contextmenu",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('input, textarea, [contenteditable="true"], .allow-context, .prose, article')) {
        return;
      }
      e.preventDefault();
    },
    { capture: true }
  );
}

// Register periodic background sync after SW is ready
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    registerPeriodicSync();
  });
}
