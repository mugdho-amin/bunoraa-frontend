/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Deliberately does NOT include a caching rule for /api/ or /_next/data/:
// those responses can contain user-specific data (checkout sessions, order
// details, profile info) and must always go to the network. Unmatched
// requests are never cached by the service worker.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url: { pathname } }: { sameOrigin: boolean; url: { pathname: string } }) =>
      sameOrigin &&
      (pathname.startsWith("/api/") || pathname.startsWith("/_next/data/")),
    method: "GET",
    handler: new NetworkOnly(),
  },
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 10080 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-font-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 10080 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-image-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 720 * 60 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\/_next\/static.+\.js$/i,
    handler: new CacheFirst({
      cacheName: "next-static-js-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "next-image",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:mp3|wav|ogg)$/i,
    handler: new CacheFirst({
      cacheName: "static-audio-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:mp4|webm)$/i,
    handler: new CacheFirst({
      cacheName: "static-video-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:js)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-js-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 48,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-style-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 1440 * 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline/",
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Purge the legacy "apis" cache created by the previous defaultCache config,
// which held possibly user-specific API responses.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name === "apis").map((name) => caches.delete(name))
      );
    })()
  );
});
