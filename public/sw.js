/* Recuperación de caché. Los archivos de GitHub Pages ya incluyen versión en
   su nombre, por eso este worker no intercepta recursos ni guarda HTML viejo. */
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("fhw-")).map((key) => caches.delete(key)))).then(() => self.clients.claim())
));
