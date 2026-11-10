'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// The only things the web app can ask the desktop shell to do. Everything is validated again in the main process.
contextBridge.exposeInMainWorld('tillHardware', {
  isDesktop: true,
  getSettings: () => ipcRenderer.invoke('hardware:getSettings'),
  setSettings: (patch) => ipcRenderer.invoke('hardware:setSettings', patch),
  listPrinters: () => ipcRenderer.invoke('hardware:listPrinters'),
  printReceipt: (receipt, options) => ipcRenderer.invoke('hardware:printReceipt', receipt, options),
  openDrawer: () => ipcRenderer.invoke('hardware:openDrawer'),
  testPrint: () => ipcRenderer.invoke('hardware:testPrint'),
  appInfo: () => ipcRenderer.invoke('app:info'),
});
