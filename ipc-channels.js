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
  getUpdateState: 'get-update-state',
  installUpdateNow: 'install-update-now',
  updateStateChanged: 'update-state-changed',
  openExternalUrl: 'open-external-url',
  activateLicense: 'activate-license',
  getLicenseStatus: 'get-license-status',
};

module.exports = {
  IPC_CHANNELS,
};
