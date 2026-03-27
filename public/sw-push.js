// Custom service worker for push notifications and background sync
// Compatible with vite-plugin-pwa

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const title = data.title || "نوبهار";
  const notificationId = data.id || data.tag || `nawbahar-notification-${Date.now()}`;
  const options = {
    body: data.body || "",
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-96x96.png",
    dir: "rtl",
    lang: "fa",
    data: data.data || { url: "/" },
    vibrate: [100, 50, 100],
    tag: notificationId,
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })()
  );
});

const SYNC_QUEUE_KEY = "nawbahar-sync-queue";

self.addEventListener("sync", (event) => {
  if (event.tag === "nawbahar-offline-actions") {
    event.waitUntil(replayOfflineActions());
  }
});

async function replayOfflineActions() {
  try {
    const cache = await caches.open(SYNC_QUEUE_KEY);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const body = await response.text();
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      try {
        await fetch(request.url, {
          method: request.method || "POST",
          headers,
          body: body || undefined,
        });
        await cache.delete(request);
      } catch (err) {
        console.warn("[SW] Background sync retry failed:", request.url, err);
      }
    }
  } catch (err) {
    console.error("[SW] Background sync error:", err);
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "nawbahar-sync-articles") {
    event.waitUntil(refreshArticlesCache());
  }
});

async function refreshArticlesCache() {
  try {
    const supabaseUrl = "https://rubspbitfypqaeuxhvco.supabase.co";
    const apiUrl = `${supabaseUrl}/rest/v1/articles?status=eq.published&order=created_at.desc&limit=20&select=id,title,content,cover_image_url,created_at,author_id,reaction_count,comment_count,view_count,tags`;

    const response = await fetch(apiUrl, {
      headers: {
        apikey: self.SUPABASE_API_KEY || "", // replace with environment variable in vite-plugin-pwa config
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const cache = await caches.open("articles-cache");
      await cache.put(new Request(apiUrl), response.clone());
    }
  } catch (err) {
    console.warn("[SW] Periodic sync failed:", err);
  }
}
