const { contextBridge, ipcRenderer } = require('electron');
const { IPC_CHANNELS } = require('./ipc-channels');

contextBridge.exposeInMainWorld('electronAPI', {
  windowClose: () => ipcRenderer.send(IPC_CHANNELS.windowClose),
  windowMinimize: () => ipcRenderer.send(IPC_CHANNELS.windowMinimize),
  setAlwaysOnTop: (flag) => ipcRenderer.send(IPC_CHANNELS.setAlwaysOnTop, flag),
  changeIcon: (iconPath) => ipcRenderer.send(IPC_CHANNELS.changeIcon, iconPath),
  listCamouflageIcons: () => ipcRenderer.invoke(IPC_CHANNELS.listCamouflageIcons),
  getCamouflageIconPreview: (iconPath) => ipcRenderer.invoke(IPC_CHANNELS.getCamouflageIconPreview, iconPath),
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.checkForUpdates),
  getUpdateState: () => ipcRenderer.invoke(IPC_CHANNELS.getUpdateState),
  installUpdateNow: () => ipcRenderer.invoke(IPC_CHANNELS.installUpdateNow),
  openExternalUrl: (url) => ipcRenderer.invoke(IPC_CHANNELS.openExternalUrl, url),
  activateLicense: (licenseKey) => ipcRenderer.invoke(IPC_CHANNELS.activateLicense, licenseKey),
  getLicenseStatus: () => ipcRenderer.invoke(IPC_CHANNELS.getLicenseStatus),
  onToggleTransparency: (callback) => {
    if (typeof callback !== 'function') return undefined;
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.toggleTransparency, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.toggleTransparency, listener);
  },
  onToggleBookmarks: (callback) => {
    if (typeof callback !== 'function') return undefined;
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.toggleBookmarks, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.toggleBookmarks, listener);
  },
  onGoBack: (callback) => {
    if (typeof callback !== 'function') return undefined;
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.goBack, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.goBack, listener);
  },
  onGoForward: (callback) => {
    if (typeof callback !== 'function') return undefined;
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.goForward, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.goForward, listener);
  },
  onUpdateStateChanged: (callback) => {
    if (typeof callback !== 'function') return undefined;
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.updateStateChanged, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.updateStateChanged, listener);
  },
});
