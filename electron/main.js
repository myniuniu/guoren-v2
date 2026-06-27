import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { startAppServer } from './appServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = dirname(__dirname);
const preloadPath = join(__dirname, 'preload.cjs');
const distPath = join(repoRoot, 'dist');
const backendOrigin = process.env.ELECTRON_BACKEND_URL || 'http://127.0.0.1:8080';
const devRendererUrl = process.env.ELECTRON_RENDERER_URL || '';
const externalDesktopPorts = new Set(['5176', '5177', '8443']);
const localHostnames = new Set(['127.0.0.1', 'localhost']);

let mainWindow = null;
let appServer = null;
let appOrigin = '';
const managedWindows = new Set();

function isDesktopDev() {
  return Boolean(devRendererUrl);
}

function createWindowOptions(overrides = {}) {
  return {
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#f5f7fa',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    ...overrides,
  };
}

function isAppUrl(targetUrl) {
  if (!appOrigin) return false;
  try {
    return new URL(targetUrl).origin === new URL(appOrigin).origin;
  } catch {
    return false;
  }
}

function isManagedLocalServiceUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      localHostnames.has(parsed.hostname) &&
      externalDesktopPorts.has(parsed.port)
    );
  } catch {
    return false;
  }
}

function shouldOpenInsideDesktop(targetUrl) {
  return isAppUrl(targetUrl) || isManagedLocalServiceUrl(targetUrl);
}

function attachNavigationGuards(windowInstance) {
  const { webContents } = windowInstance;

  webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenInsideDesktop(url)) {
      createManagedWindow(url, { parent: windowInstance });
      return { action: 'deny' };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });

  webContents.on('will-navigate', (event, url) => {
    if (shouldOpenInsideDesktop(url)) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });
}

function createManagedWindow(targetUrl, browserWindowOptions = {}) {
  const childWindow = new BrowserWindow(
    createWindowOptions({
      parent: browserWindowOptions.parent,
      width: browserWindowOptions.width || 1320,
      height: browserWindowOptions.height || 900,
    }),
  );

  attachNavigationGuards(childWindow);

  childWindow.once('ready-to-show', () => childWindow.show());
  childWindow.on('closed', () => managedWindows.delete(childWindow));
  managedWindows.add(childWindow);
  childWindow.loadURL(targetUrl);
  return childWindow;
}

async function resolveRendererEntry() {
  if (isDesktopDev()) {
    appOrigin = devRendererUrl;
    return devRendererUrl;
  }

  appServer = await startAppServer({
    distDir: distPath,
    backendOrigin,
  });
  appOrigin = appServer.origin;
  return appServer.origin;
}

async function createMainWindow() {
  const entryUrl = await resolveRendererEntry();
  mainWindow = new BrowserWindow(createWindowOptions());
  attachNavigationGuards(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    managedWindows.delete(mainWindow);
    mainWindow = null;
  });

  managedWindows.add(mainWindow);
  await mainWindow.loadURL(entryUrl);
}

ipcMain.handle('desktop:get-context', () => ({
  isElectron: true,
  backendOrigin,
  appOrigin,
  platform: process.platform,
  version: app.getVersion(),
}));

ipcMain.handle('desktop:open-external', async (_event, targetUrl) => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('A valid URL is required.');
  }

  if (shouldOpenInsideDesktop(targetUrl)) {
    createManagedWindow(targetUrl, { parent: BrowserWindow.getFocusedWindow() || mainWindow });
    return true;
  }

  await shell.openExternal(targetUrl);
  return true;
});

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (error) {
    console.error('[electron] failed to create main window:', error);
    const message = error instanceof Error ? error.message : String(error);
    const details = isDesktopDev()
      ? '请确认 Vite 开发服务器已启动。'
      : '请先执行 `npm run build:web` 生成桌面端前端资源。';
    await shell.beep();
    app.exitCode = 1;
    process.stderr.write(`${message}\n${details}\n`);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (appServer) {
    try {
      await appServer.close();
    } catch (error) {
      console.error('[electron] failed to close local app server:', error);
    }
    appServer = null;
  }
});
