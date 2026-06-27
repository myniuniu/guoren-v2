function getDesktopBridge() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.guorenDesktop || null;
}

export function isElectronRuntime() {
  return Boolean(getDesktopBridge()?.isElectron);
}

export async function getDesktopContext() {
  const bridge = getDesktopBridge();
  if (!bridge?.getContext) {
    return {
      isElectron: false,
      backendOrigin: null,
      appOrigin: null,
      platform: null,
      version: null,
    };
  }

  try {
    return await bridge.getContext();
  } catch {
    return {
      isElectron: true,
      backendOrigin: null,
      appOrigin: null,
      platform: null,
      version: null,
    };
  }
}

export function openDesktopUrl(targetUrl) {
  if (!targetUrl) return;

  const bridge = getDesktopBridge();
  if (bridge?.openUrl) {
    bridge.openUrl(targetUrl).catch((error) => {
      console.error('[desktop] failed to open URL via preload bridge:', error);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    });
    return;
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
