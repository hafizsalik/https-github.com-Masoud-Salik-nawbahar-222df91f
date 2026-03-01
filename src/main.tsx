import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// vite-plugin-pwa handles SW registration automatically via registerType: "autoUpdate"
// Do NOT manually register /sw.js as it conflicts with the plugin's generated SW

createRoot(document.getElementById("root")!).render(<App />);
