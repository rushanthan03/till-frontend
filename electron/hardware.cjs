'use strict';
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { buildReceipt, buildTestPage, drawerPulse } = require('./escpos.cjs');
const { receiptHtml } = require('./receipt-html.cjs');

const DEFAULTS = {
  /** 'off' = use the normal browser print dialog, 'network' = ESC/POS over TCP (port 9100), 'system' = an installed Windows/macOS printer */
  printMode: 'off',
  printerHost: '',
  printerPort: 9100,
  printerName: '',
  paperWidth: 42, // characters per line: 42 for 80mm paper, 32 for 58mm
  autoPrint: true,
  autoDrawer: true,
};

const file = () => path.join(app.getPath('userData'), 'hardware.json');

function getSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file(), 'utf8')) }; } catch { return { ...DEFAULTS }; }
}

/** Only known keys with the right types are kept, so a bad value from the renderer can't break printing. */
function setSettings(patch) {
  const cur = getSettings();
  const next = { ...cur };
  if (['off', 'network', 'system'].includes(patch.printMode)) next.printMode = patch.printMode;
  if (typeof patch.printerHost === 'string') next.printerHost = patch.printerHost.trim().slice(0, 100);
  if (Number.isInteger(patch.printerPort) && patch.printerPort > 0 && patch.printerPort < 65536) next.printerPort = patch.printerPort;
  if (typeof patch.printerName === 'string') next.printerName = patch.printerName.slice(0, 200);
  if ([32, 42].includes(patch.paperWidth)) next.paperWidth = patch.paperWidth;
  if (typeof patch.autoPrint === 'boolean') next.autoPrint = patch.autoPrint;
  if (typeof patch.autoDrawer === 'boolean') next.autoDrawer = patch.autoDrawer;
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(next, null, 2));
  return next;
}

function sendToNetworkPrinter(host, port, data) {
  return new Promise((resolve, reject) => {
    if (!host) return reject(new Error('No printer address set'));
    const socket = net.createConnection({ host, port, timeout: 5000 });
    socket.once('timeout', () => { socket.destroy(); reject(new Error(`Printer at ${host}:${port} did not respond`)); });
    socket.once('error', (e) => reject(new Error(`Could not reach the printer at ${host}:${port} (${e.code || e.message})`)));
    socket.once('connect', () => socket.end(data, () => resolve()));
    socket.once('close', () => resolve());
  });
}

async function printHtml(html, deviceName) {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise((resolve, reject) => {
      win.webContents.print(
        { silent: true, deviceName: deviceName || undefined, printBackground: false, margins: { marginType: 'none' }, pageSize: { width: 80000, height: 297000 } },
        (ok, reason) => (ok ? resolve() : reject(new Error(reason || 'The printer rejected the job'))),
      );
    });
  } finally {
    win.destroy();
  }
}

async function printReceipt(receipt, { openDrawer = false } = {}) {
  const s = getSettings();
  if (s.printMode === 'network') {
    await sendToNetworkPrinter(s.printerHost, s.printerPort, buildReceipt(receipt, { width: s.paperWidth, openDrawer }));
  } else if (s.printMode === 'system') {
    await printHtml(receiptHtml(receipt), s.printerName); // with a system printer the drawer opens from the driver's own setting
  } else {
    throw new Error('No receipt printer is set up (Device settings)');
  }
}

async function openDrawer() {
  const s = getSettings();
  if (s.printMode !== 'network') throw new Error('Drawer control needs a network (ESC/POS) printer. With a system printer, set the driver to open the drawer when printing.');
  await sendToNetworkPrinter(s.printerHost, s.printerPort, drawerPulse());
}

async function testPrint() {
  const s = getSettings();
  if (s.printMode === 'network') await sendToNetworkPrinter(s.printerHost, s.printerPort, buildTestPage({ width: s.paperWidth, openDrawer: s.autoDrawer }));
  else if (s.printMode === 'system') await printHtml(receiptHtml({ storeName: 'AUVREN TILL', receiptNumber: 'TEST', date: new Date().toLocaleString('en-GB'), lines: [{ name: 'Printer test', quantity: 1, total: 0 }], total: 0, footer: 'If you can read this, the printer works.' }), s.printerName);
  else throw new Error('Choose a printer type first');
}

module.exports = { getSettings, setSettings, printReceipt, openDrawer, testPrint };
