self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Bunoraa";
  const options = {
    body: payload.body || "",
    data: payload.data || payload,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification && event.notification.data && event.notification.data.url) ||
    "/";
  event.waitUntil(clients.openWindow(targetUrl));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_VAPID_KEY") {
    self.__VAPID_PUBLIC_KEY = event.data.key;
  }
});

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener("pushsubscriptionchange", (event) => {
  const vapidKey = self.__VAPID_PUBLIC_KEY;
  const subscribeOptions = { userVisibleOnly: true };
  if (vapidKey) {
    subscribeOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey);
  }
  event.waitUntil(
    self.registration.pushManager
      .subscribe(subscribeOptions)
      .then((subscription) => {
        return fetch("/api/v1/notifications/push-tokens/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: JSON.stringify(subscription),
            device_type: "web",
            device_name: "Browser",
          }),
        });
      })
      .catch(() => {
        // Re-subscription failed — server will retry on next user visit
      })
  );
});
