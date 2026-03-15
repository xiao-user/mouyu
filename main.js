const { app, BrowserWindow, globalShortcut, ipcMain, Menu, safeStorage, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { IPC_CHANNELS } = require('./ipc-channels');

let mainWindow;
const SUPPORTED_ICON_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.icns']);
const LICENSE_FILE_NAME = 'license-state.json';
const LICENSE_KEY_PATTERN = /^MOYU-[A-Z0-9]{4,}(?:-[A-Z0-9]{4,})+$/;
const ALLOWED_DEV_HOSTS = new Set(['127.0.0.1', 'localhost']);

function getAppLogoDir() {
  return path.resolve(path.join(app.getAppPath(), 'AppLogo'));
}

function isPathInsideDirectory(targetPath, directoryPath) {
  const relative = path.relative(directoryPath, targetPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isSafeIconPath(iconPath) {
  if (typeof iconPath !== 'string' || iconPath.trim() === '') return false;

  const resolvedIconPath = path.resolve(iconPath);
  const appLogoDir = getAppLogoDir();
  const ext = path.extname(resolvedIconPath).toLowerCase();

  return (
    isPathInsideDirectory(resolvedIconPath, appLogoDir) &&
    SUPPORTED_ICON_EXTENSIONS.has(ext) &&
    fs.existsSync(resolvedIconPath)
  );
}

async function listCamouflageIcons() {
  const appLogoDir = getAppLogoDir();
  const entries = await fs.promises.readdir(appLogoDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(appLogoDir, entry.name))
    .filter((filePath) => SUPPORTED_ICON_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .sort();
}

function getImageMimeTypeByExtension(iconPath) {
  const ext = path.extname(iconPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return '';
}

function getCamouflageIconPreviewDataUrl(iconPath) {
  if (!isSafeIconPath(iconPath)) return '';

  try {
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) {
      return image.resize({ width: 64, height: 64 }).toDataURL();
    }
  } catch (error) {
    console.error('Failed to generate native image preview:', error);
  }

  try {
    const mimeType = getImageMimeTypeByExtension(iconPath);
    if (!mimeType) return '';
    const data = fs.readFileSync(iconPath);
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } catch (error) {
    console.error('Failed to generate fallback image preview:', error);
  }

  return '';
}

function getLicenseFilePath() {
  return path.join(app.getPath('userData'), LICENSE_FILE_NAME);
}

function validateLicenseKey(licenseKey) {
  if (typeof licenseKey !== 'string') return false;
  return LICENSE_KEY_PATTERN.test(licenseKey.trim().toUpperCase());
}

function maskLicenseKey(licenseKey) {
  if (typeof licenseKey !== 'string' || licenseKey.length < 8) return '';
  return `${licenseKey.slice(0, 5)}****${licenseKey.slice(-4)}`;
}

function getSafeRendererDevUrl() {
  const rawUrl = process.env.ELECTRON_RENDERER_URL;
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') return null;

  try {
    const parsed = new URL(rawUrl.trim());
    const isHttpProtocol = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!isHttpProtocol || !ALLOWED_DEV_HOSTS.has(parsed.hostname)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

async function loadRendererEntry(window) {
  const devUrl = getSafeRendererDevUrl();
  if (devUrl) {
    await window.loadURL(devUrl);
    return;
  }

  const distIndexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  if (fs.existsSync(distIndexPath)) {
    await window.loadFile(distIndexPath);
    return;
  }

  const legacyIndexPath = path.join(app.getAppPath(), 'index.legacy.html');
  if (fs.existsSync(legacyIndexPath)) {
    await window.loadFile(legacyIndexPath);
    return;
  }

  const fallbackHtml = `
    <html lang="zh-CN">
      <head><meta charset="utf-8" /></head>
      <body style="font-family: sans-serif; padding: 24px;">
        <h3>Moyu Reader 启动失败</h3>
        <p>未找到可用渲染入口。请执行 <code>npm run start</code> 或先执行 <code>npm run build</code>。</p>
      </body>
    </html>
  `;
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`);
}

function readLicenseState() {
  try {
    const filePath = getLicenseFilePath();
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (parsed?.encrypted && typeof parsed.payload === 'string') {
      if (!safeStorage.isEncryptionAvailable()) return null;
      const decrypted = safeStorage.decryptString(Buffer.from(parsed.payload, 'base64'));
      return JSON.parse(decrypted);
    }

    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to read license state:', error);
  }
  return null;
}

function writeLicenseState(state) {
  const filePath = getLicenseFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(JSON.stringify(state)).toString('base64');
    fs.writeFileSync(filePath, JSON.stringify({ encrypted: true, payload: encrypted }, null, 2), 'utf-8');
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400, // 初始宽度，像手机一样窄一点适合摸鱼
    height: 600,
    frame: false, // 无边框模式，更隐蔽
    // titleBarStyle: 'hidden', // 不再使用原生红绿灯
    // trafficLightPosition: { x: 10, y: 8 }, // 微调红绿灯位置
    transparent: true, // 开启透明支持
    alwaysOnTop: false, // 默认不置顶
    hasShadow: false, // 去除阴影
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // 允许使用 webview 标签浏览网页
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    }
  });

  loadRendererEntry(mainWindow).catch((error) => {
    console.error('Failed to load renderer entry:', error);
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 注册老板键 (CommandOrControl+M) -> 最小化/恢复 (全局快捷键，即使应用未聚焦也能触发)
  globalShortcut.register('CommandOrControl+M', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // 注册紧急退出键 (CommandOrControl+Q) -> 全局退出
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '摸鱼操作',
      submenu: [
        {
          label: '一键透明',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow) mainWindow.webContents.send(IPC_CHANNELS.toggleTransparency);
          }
        },
        {
          label: '打开书签',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            if (mainWindow) mainWindow.webContents.send(IPC_CHANNELS.toggleBookmarks);
          }
        },
        { type: 'separator' },
        {
          label: '后退',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow) mainWindow.webContents.send(IPC_CHANNELS.goBack);
          }
        },
        {
          label: '前进',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow) mainWindow.webContents.send(IPC_CHANNELS.goForward);
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 监听从渲染进程发来的透明度/置顶设置
ipcMain.on(IPC_CHANNELS.setAlwaysOnTop, (event, flag) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(flag);
});

// 窗口控制
ipcMain.on(IPC_CHANNELS.windowMinimize, () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on(IPC_CHANNELS.windowClose, () => {
  app.quit(); // 直接退出整个应用
});

// 渲染进程请求图标列表
ipcMain.handle(IPC_CHANNELS.listCamouflageIcons, async () => {
  try {
    return await listCamouflageIcons();
  } catch (error) {
    console.error('Failed to list camouflage icons:', error);
    return [];
  }
});

ipcMain.handle(IPC_CHANNELS.getCamouflageIconPreview, async (event, iconPath) => {
  try {
    return getCamouflageIconPreviewDataUrl(iconPath);
  } catch (error) {
    console.error('Failed to get camouflage icon preview:', error);
    return '';
  }
});

ipcMain.handle(IPC_CHANNELS.checkForUpdates, async () => {
  return {
    ok: true,
    status: 'manual',
    checkedAt: new Date().toISOString(),
    message: '自动更新尚未接入发布源，请前往发布页下载最新版安装包。',
  };
});

ipcMain.handle(IPC_CHANNELS.activateLicense, async (event, licenseKey) => {
  const normalizedKey = typeof licenseKey === 'string' ? licenseKey.trim().toUpperCase() : '';
  if (!validateLicenseKey(normalizedKey)) {
    return {
      ok: false,
      message: '激活码格式无效，请输入类似 MOYU-XXXX-XXXX 的激活码。',
    };
  }

  const state = {
    licenseKey: normalizedKey,
    activatedAt: new Date().toISOString(),
  };
  writeLicenseState(state);

  return {
    ok: true,
    message: '激活成功。',
    status: {
      activated: true,
      maskedKey: maskLicenseKey(normalizedKey),
      activatedAt: state.activatedAt,
    },
  };
});

ipcMain.handle(IPC_CHANNELS.getLicenseStatus, async () => {
  const state = readLicenseState();
  if (!state?.licenseKey) {
    return { activated: false, maskedKey: '', activatedAt: '' };
  }
  return {
    activated: true,
    maskedKey: maskLicenseKey(state.licenseKey),
    activatedAt: state.activatedAt || '',
  };
});

// 更改应用图标 (伪装模式)
ipcMain.on(IPC_CHANNELS.changeIcon, (event, iconPath) => {
  if (!isSafeIconPath(iconPath)) {
    console.warn('Ignored unsafe icon path:', iconPath);
    return;
  }

  if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
  }
  // Windows 下通常需要重新打包或使用 overlay，这里主要支持 macOS Dock 图标实时更改
  // 如果是 Windows，可以尝试 mainWindow.setIcon(iconPath)
  if (mainWindow) {
    mainWindow.setIcon(iconPath);
  }
});

app.whenReady().then(() => {
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setMaxListeners(30);
    }
  });

  createWindow();
  createMenu(); // 创建菜单

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
