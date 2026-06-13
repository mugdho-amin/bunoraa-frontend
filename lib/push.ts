import { apiFetch } from "@/lib/api";

type PushResultStatus = "enabled" | "denied" | "unsupported" | "error";

export type PushSubscriptionResult = {
  status: PushResultStatus;
  error?: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function detectBrowser(userAgent: string) {
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  return "Unknown";
}

export async function subscribeToBrowserPush(): Promise<PushSubscriptionResult> {
  if (typeof window === "undefined") {
    return { status: "unsupported" };
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { status: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { status: "denied" };
    }

    const registration = await navigator.serviceWorker.register("/notifications-sw.js");

    // Send VAPID public key to service worker for pushsubscriptionchange handling
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    if (registration.active) {
      registration.active.postMessage({ type: "SET_VAPID_KEY", key: vapidPublicKey });
    } else {
      registration.addEventListener("activate", () => {
        registration.active?.postMessage({ type: "SET_VAPID_KEY", key: vapidPublicKey });
      });
    }

    // Also respond to service worker's REQUEST_VAPID_KEY messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "REQUEST_VAPID_KEY") {
        registration.active?.postMessage({ type: "SET_VAPID_KEY", key: vapidPublicKey });
      }
    });

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      if (!vapidPublicKey) {
        return {
          status: "unsupported",
          error: "Browser notifications are not configured for this environment.",
        };
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const token = JSON.stringify(subscription);
    const userAgent = navigator.userAgent;

    await apiFetch("/notifications/push-tokens/", {
      method: "POST",
      body: {
        token,
        device_type: "web",
        device_name: "Browser",
        platform: navigator.platform,
        app_version: navigator.appVersion,
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browser: detectBrowser(userAgent),
        user_agent: userAgent,
      },
    });

    return { status: "enabled" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enable browser notifications";
    return { status: "error", error: message };
  }
}
