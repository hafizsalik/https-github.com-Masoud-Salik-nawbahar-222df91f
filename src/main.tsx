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
      // Allow native context menu only inside editable surfaces and inside the
      // full-article reader body (which opts in via .article-prose or the
      // [data-allow-context] attribute). Feed cards use <article> as their
      // root but should NOT trigger the iOS link-preview card.
      if (
        t.closest(
          'input, textarea, [contenteditable="true"], .allow-context, .article-prose, [data-allow-context]'
        )
      ) {
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
