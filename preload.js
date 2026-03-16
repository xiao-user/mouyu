const { contextBridge, ipcRenderer } = require('electron');

// Sandboxed preload cannot reliably depend on local CommonJS modules.
const IPC_CHANNELS = {
  setAlwaysOnTop: 'set-always-on-top',
  windowMinimize: 'window-min',
  windowClose: 'window-close',
  changeIcon: 'change-icon',
  listCamouflageIcons: 'list-camouflage-icons',
  getCamouflageIconPreview: 'get-camouflage-icon-preview',
  toggleTransparency: 'toggle-transparency',
  toggleBookmarks: 'toggle-bookmarks',
  goBack: 'go-back',
  goForward: 'go-forward',
  checkForUpdates: 'check-for-updates',
  openExternalUrl: 'open-external-url',
  activateLicense: 'activate-license',
  getLicenseStatus: 'get-license-status',
};

contextBridge.exposeInMainWorld('electronAPI', {
  windowClose: () => ipcRenderer.send(IPC_CHANNELS.windowClose),
  windowMinimize: () => ipcRenderer.send(IPC_CHANNELS.windowMinimize),
  setAlwaysOnTop: (flag) => ipcRenderer.send(IPC_CHANNELS.setAlwaysOnTop, flag),
  changeIcon: (iconPath) => ipcRenderer.send(IPC_CHANNELS.changeIcon, iconPath),
  listCamouflageIcons: () => ipcRenderer.invoke(IPC_CHANNELS.listCamouflageIcons),
  getCamouflageIconPreview: (iconPath) => ipcRenderer.invoke(IPC_CHANNELS.getCamouflageIconPreview, iconPath),
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.checkForUpdates),
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
});
