self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data ? event.notification.data.url : '/';
  const category = event.notification.data ? event.notification.data.category : null;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      let targetClient = null;
      for (let client of clientList) {
        // Find if app is already open
        if (client.url.split('?')[0].includes('azkar_m') || client.url.split('?')[0] === targetUrl.split('?')[0]) {
          targetClient = client;
          break;
        }
      }

      if (targetClient) {
        if (category !== null && category !== undefined) {
          targetClient.postMessage({ type: 'SWITCH_CATEGORY', category: category });
        }
        return targetClient.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
