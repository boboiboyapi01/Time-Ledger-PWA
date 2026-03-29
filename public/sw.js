// Service Worker for Time Ledger PWA

const CACHE_NAME = "time-ledger-v1";
const ASSETS_TO_CACHE = ["/", "/manifest.json", "/vercel.svg"];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching assets");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[Service Worker] Error caching assets:", err);
        // Don't fail install if some assets fail
      });
    }),
  );

  // Claim clients immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[Service Worker] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );

  self.clients.claim();
});

// Fetch event - implement network-first then cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip requests to external domains (like Supabase)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !url.pathname.includes("api")) {
    return;
  }

  // Network-first strategy for API calls
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request);
        }),
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
      .catch(() => {
        // Return a generic offline response if needed
        return new Response("Offline");
      }),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.action);

  if (event.action === "stop-timer") {
    event.notification.close();
    stopBackgroundTimer();

    // Send message to all clients
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "STOP_TIMER",
          action: "stop-timer",
        });
      });
    });
  } else {
    // Focus or open the app
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        // If not open, open it
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      }),
    );
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed");
  if (event.notification.tag === "timer-notification") {
    stopBackgroundTimer();
  }
});

// --- BACKGROUND TIMER LOGIC ---
let backgroundTimer = null;
let timerData = null;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateNotification() {
  if (!timerData) return;

  const elapsedSeconds = Math.floor((Date.now() - timerData.startTime) / 1000);
  const timeDisplay = formatTime(elapsedSeconds);

  self.registration.showNotification("Time Ledger Timer", {
    body: `${timerData.activityName}: ${timeDisplay}`,
    icon: "/sand-clock.png",
    badge: "/sand-clock.png",
    tag: "timer-notification",
    requireInteraction: true,
    silent: true,
    actions: [
      {
        action: "stop-timer",
        title: "Stop Timer",
      },
    ],
  });
}

function startBackgroundTimer(data) {
  stopBackgroundTimer();
  timerData = data;
  updateNotification();
  // Update every 5 seconds to keep the process alive as much as possible
  backgroundTimer = setInterval(updateNotification, 1000);
}

function stopBackgroundTimer() {
  if (backgroundTimer) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;
  }
  timerData = null;
}

// Handle messages from the app
self.addEventListener("message", (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case "START_BACKGROUND_TIMER":
      startBackgroundTimer(event.data.payload);
      break;
    case "STOP_BACKGROUND_TIMER":
      stopBackgroundTimer();
      break;
  }
});
