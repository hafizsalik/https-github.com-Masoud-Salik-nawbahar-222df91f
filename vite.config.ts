import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(async ({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && await import("lovable-tagger").then(m => m.componentTagger()).catch(() => null),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "sitemap.xml",
        "browserconfig.xml",
        "pwa-*.png",
        "icons/*.png",
        "screenshots/*.png",
      ],
      manifest: {
        name: "نوبهار - جامعه نخبگان",
        short_name: "نوبهار",
        description: "پلتفرم انتشار محتوای تخصصی برای نخبگان افغانستانی. مقالات علمی، تحلیلی و فرهنگی با کیفیت بالا.",
        start_url: "/",
        id: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f9f7f4",
        theme_color: "#f9f7f4",
        orientation: "portrait-primary",
        dir: "rtl",
        lang: "fa-AF",
        categories: ["news", "social", "education", "lifestyle"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/mobile-home.png",
            sizes: "750x1334",
            form_factor: "narrow",
            label: "صفحه اصلی نوبهار",
          },
          {
            src: "/screenshots/mobile-article.png",
            sizes: "750x1334",
            form_factor: "narrow",
            label: "نمایش مقاله",
          },
          {
            src: "/screenshots/desktop-home.png",
            sizes: "1920x1080",
            form_factor: "wide",
            label: "صفحه اصلی دسکتاپ",
          },
        ],
        shortcuts: [
          {
            name: "نوشتن مقاله",
            short_name: "نوشتن",
            description: "نوشتن مقاله جدید",
            url: "/write",
            icons: [{ src: "/icons/write-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "ذخیره‌ها",
            short_name: "ذخیره‌ها",
            description: "مشاهده مقالات ذخیره شده",
            url: "/bookmarks",
            icons: [{ src: "/icons/bookmark-96x96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "اعلانات",
            short_name: "اعلانات",
            description: "مشاهده اعلانات",
            url: "/notifications",
            icons: [{ src: "/icons/notification-96x96.png", sizes: "96x96", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp,jpg,jpeg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/~oauth/],
        importScripts: ["/sw-push.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/articles/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "articles-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/profiles/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "profiles-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version || "0.0.1"),
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
}));
