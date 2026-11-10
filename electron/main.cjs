'use strict';
/**
 * Auvren Till desktop shell: a full-screen window around the web till, with receipt printer and cash drawer control.
 *   npm run electron:dev     (with "npm run dev" running)  – opens the dev server
 *   npm run electron:start   – builds the app and opens it from disk
 *   npm run electron:pack    – makes a Windows installer
 * Flags: --windowed (not full screen), --dev (load http://localhost:5173)
 */
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, ipcMain, protocol, net, shell, Menu } = require('electron');
const hardware = require('./hardware.cjs');

const DEV = process.argv.includes('--dev');
const WINDOWED = process.argv.includes('--windowed');
const SMOKE = process.argv.includes('--smoke'); // load the app, check the bridge, print the result and exit (for CI)
const DEV_URL = process.env.TILL_DEV_URL || 'http://localhost:5173';
const DIST = path.join(__dirname, '..', 'dist');

// "app://till/..." serves the built web app, so client-side routes work (a file:// URL would break them).
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

let win = null;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: !WINDOWED && !DEV && !SMOKE,
    show: !SMOKE,
    width: 1280,
    height: 800,
    backgroundColor: '#f9fafb',
    autoHideMenuBar: true,
    title: 'Auvren Till',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.loadURL(DEV ? DEV_URL : 'app://till/index.html');

  // The till never navigates away from itself; links to other sites open in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    const ok = url.startsWith('app://till/') || (DEV && url.startsWith(DEV_URL));
    if (!ok) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });

  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const ctrl = input.control || input.meta;
    if (ctrl && input.shift && input.key.toLowerCase() === 'q') app.quit(); // manager exit
    if (input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (DEV && ctrl && input.shift && input.key.toLowerCase() === 'i') win.webContents.toggleDevTools();
  });
  win.on('closed', () => { win = null; });

  if (SMOKE) {
    win.webContents.once('did-finish-load', async () => {
      try {
        const out = await win.webContents.executeJavaScript(
          "JSON.stringify({ bridge: typeof window.tillHardware, desktop: window.tillHardware && window.tillHardware.isDesktop, title: document.title, root: !!document.getElementById('root') })",
        );
        console.log('SMOKE ' + out);
        app.exit(JSON.parse(out).bridge === 'object' ? 0 : 1);
      } catch (e) { console.log('SMOKE failed ' + e.message); app.exit(1); }
    });
    setTimeout(() => { console.log('SMOKE timeout'); app.exit(2); }, 30000);
  }
}

function serveApp() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    let file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST)) return new Response('Forbidden', { status: 403 }); // never serve outside dist
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html'); // single-page app routes
    return net.fetch('file://' + file);
  });
}

/** Wraps a hardware call so the web app always gets { ok, error } instead of an exception. */
const safe = (fn) => async (_event, ...args) => {
  try { await fn(...args); return { ok: true }; } catch (e) { return { ok: false, error: e.message || String(e) }; }
};

function registerIpc() {
  ipcMain.handle('hardware:getSettings', () => hardware.getSettings());
  ipcMain.handle('hardware:setSettings', (_e, patch) => hardware.setSettings(patch && typeof patch === 'object' ? patch : {}));
  ipcMain.handle('hardware:listPrinters', async () => (win ? (await win.webContents.getPrintersAsync()).map((p) => ({ name: p.name, isDefault: !!p.isDefault })) : []));
  ipcMain.handle('hardware:printReceipt', safe((receipt, options) => hardware.printReceipt(receipt, { openDrawer: !!(options && options.openDrawer) })));
  ipcMain.handle('hardware:openDrawer', safe(() => hardware.openDrawer()));
  ipcMain.handle('hardware:testPrint', safe(() => hardware.testPrint()));
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform, dev: DEV }));
}

if (!app.requestSingleInstanceLock()) {
  app.quit(); // a second till window on the same device would fight over the printer
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    if (!DEV) serveApp();
    registerIpc();
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
