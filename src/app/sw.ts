/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

const sw = self as unknown as WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: sw.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Push notification handlers
const swSelf = self as unknown as ServiceWorkerGlobalScope;

swSelf.addEventListener("push", (event) => {
  const data = event.data?.json();
  event.waitUntil(
    swSelf.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: data.url },
    })
  );
});

swSelf.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(swSelf.clients.openWindow(url));
});

serwist.addEventListeners();
