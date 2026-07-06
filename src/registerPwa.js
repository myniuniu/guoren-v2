const SERVICE_WORKER_PATH = '/sw.js';

function getWorkerScriptUrls(registration) {
  return [registration.active, registration.waiting, registration.installing]
    .map((worker) => worker?.scriptURL)
    .filter(Boolean);
}

function isAppServiceWorker(registration) {
  return getWorkerScriptUrls(registration).some((scriptUrl) => {
    try {
      return new URL(scriptUrl).pathname === SERVICE_WORKER_PATH;
    } catch {
      return false;
    }
  });
}

function unregisterDevelopmentServiceWorker() {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(
      registrations
        .filter(isAppServiceWorker)
        .map((registration) => registration.unregister())
    ))
    .catch(() => {});
}

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    unregisterDevelopmentServiceWorker();
    return;
  }

  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH, { scope: '/' })
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
