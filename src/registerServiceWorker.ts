if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    void navigator.serviceWorker
      .register(swUrl)
      .then((registration) => registration.update())
      .catch((error: unknown) => {
        console.warn("Service worker registration failed", error);
      });
  });
} else if ("serviceWorker" in navigator && import.meta.env.DEV) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ("caches" in window) {
      void caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith("myday-"))
          .forEach((key) => {
            void caches.delete(key);
          });
      });
    }
  });
}
