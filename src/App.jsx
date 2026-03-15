import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ColorPickerField } from '@/components/color-picker-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import iconBookmarkRaw from '@/assets/icons/header/IconBookmark.svg?raw';
import iconChevronLeftRaw from '@/assets/icons/header/IconChevronLeftMedium.svg?raw';
import iconChevronRightRaw from '@/assets/icons/header/IconChevronRightMedium.svg?raw';
import iconCloseRaw from '@/assets/icons/header/IconClose.svg?raw';
import iconGhostRaw from '@/assets/icons/header/IconGhost.svg?raw';
import iconLayoutTopRaw from '@/assets/icons/header/IconLayoutTop.svg?raw';
import iconMinusSmallRaw from '@/assets/icons/header/IconMinusSmall.svg?raw';
import iconMoonRaw from '@/assets/icons/header/IconMoon.svg?raw';
import iconPinRaw from '@/assets/icons/header/IconPin.svg?raw';
import iconRefreshRaw from '@/assets/icons/header/IconRefresh.svg?raw';
import iconRemoveBackgroundRaw from '@/assets/icons/header/IconRemoveBackground2.svg?raw';
import iconSettingsRaw from '@/assets/icons/header/IconSettings.svg?raw';
import iconSunRaw from '@/assets/icons/header/IconSun.svg?raw';
import iconTransparentRaw from '@/assets/icons/header/IconTransparent.svg?raw';
import iconBookmarkEditRaw from '@/assets/icons/bookmarks/IconPageEdit.svg?raw';
import iconBookmarkDeleteRaw from '@/assets/icons/bookmarks/IconTrashCan.svg?raw';

const TOOLBAR_REVEAL_ZONE = 56;
const HEADER_PANEL_STYLE_DARK = {
  background:
    'linear-gradient(180deg, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.22) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.26)',
  boxShadow:
    '1px 1px 1px -0.5px rgba(255, 255, 255, 0.40) inset, -1px -1px 1px -0.5px rgba(255, 255, 255, 0.40) inset',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
};
const HEADER_PANEL_STYLE_LIGHT = {
  background:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.76) 0%, rgba(248, 250, 252, 0.76) 100%)',
  border: '1px solid rgba(15, 23, 42, 0.14)',
  boxShadow:
    '1px 1px 1px -0.5px rgba(255, 255, 255, 0.62) inset, -1px -1px 1px -0.5px rgba(148, 163, 184, 0.35) inset',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
};
const HEADER_PANEL_STYLE_TRANSPARENT = {
  background: 'transparent',
  border: '1px solid transparent',
  boxShadow: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
};
const HEADER_ICON_BUTTON_CLASS = 'h-6 w-6 rounded-full p-0 hover:text-current';
const HEADER_ACTIVE_ICON_CLASS = 'text-blue-500 hover:text-blue-500';
function normalizeHeaderSvg(rawSvg) {
  return String(rawSvg || '')
    .replace(/fill="black"/gi, 'fill="currentColor"')
    .replace(/fill="#000000"/gi, 'fill="currentColor"')
    .replace(/fill="#000"/gi, 'fill="currentColor"');
}
const HEADER_ICON_SVGS = {
  close: normalizeHeaderSvg(iconCloseRaw),
  minus: normalizeHeaderSvg(iconMinusSmallRaw),
  back: normalizeHeaderSvg(iconChevronLeftRaw),
  forward: normalizeHeaderSvg(iconChevronRightRaw),
  refresh: normalizeHeaderSvg(iconRefreshRaw),
  transparent: normalizeHeaderSvg(iconTransparentRaw),
  removeBackground: normalizeHeaderSvg(iconRemoveBackgroundRaw),
  moon: normalizeHeaderSvg(iconMoonRaw),
  sun: normalizeHeaderSvg(iconSunRaw),
  settings: normalizeHeaderSvg(iconSettingsRaw),
  bookmark: normalizeHeaderSvg(iconBookmarkRaw),
  layoutTop: normalizeHeaderSvg(iconLayoutTopRaw),
  pin: normalizeHeaderSvg(iconPinRaw),
  ghost: normalizeHeaderSvg(iconGhostRaw),
};
const BOOKMARK_ACTION_ICON_SVGS = {
  edit: normalizeHeaderSvg(iconBookmarkEditRaw),
  delete: normalizeHeaderSvg(iconBookmarkDeleteRaw),
};
function HeaderSvgIcon({
  svg,
  className = 'header-icon-micro inline-block h-4 w-4 shrink-0 align-middle [&>svg]:block [&>svg]:h-full [&>svg]:w-full',
}) {
  return <span aria-hidden className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function getBookmarkHostname(rawUrl) {
  try {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) return '';
    return new URL(normalized).hostname || '';
  } catch {
    return '';
  }
}

function getBookmarkInitial(name, url) {
  const source = String(name || getBookmarkHostname(url) || '?').trim();
  return source ? source.charAt(0).toUpperCase() : '?';
}

function BookmarkFavicon({ name, url }) {
  const [failed, setFailed] = useState(false);
  const host = useMemo(() => getBookmarkHostname(url), [url]);
  const faviconUrl = host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : '';
  const fallbackText = useMemo(() => getBookmarkInitial(name, url), [name, url]);

  if (!faviconUrl || failed) {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt=""
      className="h-8 w-8 shrink-0 rounded-md border border-border/70 bg-background object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const STORAGE_KEYS = {
  opacity: 'moyu-opacity',
  autoHideWindow: 'moyu-autohide-window',
  toolbarAutoHide: 'moyu-toolbar-autohide',
  pinned: 'moyu-pinned',
  rememberSettings: 'moyu-remember-settings',
  transparency: 'moyu-transparency',
  darkMode: 'moyu-dark-mode',
  lastUrl: 'moyu-last-url',
  bookmarks: 'moyu-bookmarks',
  hideScrollbar: 'moyu-hide-scrollbar',
  textColor: 'moyu-text-color',
  xhsHideLogo: 'moyu-xhs-hide-logo',
  xhsHideHeader: 'moyu-xhs-hide-header',
  xhsHideBottomMenu: 'moyu-xhs-hide-bottom-menu',
  xhsHideFeedInDetail: 'moyu-xhs-hide-feed-in-detail',
  appIcon: 'moyu-app-icon',
  scrollY: 'moyu-scroll-y',
  firstRunCompleted: 'moyu-first-run-completed',
};

const DEFAULT_BOOKMARKS = [
  { name: '微信读书', url: 'https://weread.qq.com/' },
  { name: 'B站', url: 'https://www.bilibili.com/' },
  { name: '知乎', url: 'https://www.zhihu.com/' },
  { name: 'V2EX', url: 'https://www.v2ex.com/' },
];

const noop = () => {};
const electronBridge = window.electronAPI ?? {
  windowClose: noop,
  windowMinimize: noop,
  setAlwaysOnTop: noop,
  changeIcon: noop,
  listCamouflageIcons: async () => [],
  getCamouflageIconPreview: async () => '',
  checkForUpdates: async () => ({ ok: false, message: '更新功能不可用。' }),
  activateLicense: async () => ({ ok: false, message: '激活功能不可用。' }),
  getLicenseStatus: async () => ({ activated: false, maskedKey: '', activatedAt: '' }),
  onToggleTransparency: noop,
  onToggleBookmarks: noop,
  onGoBack: noop,
  onGoForward: noop,
};

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

function readNumber(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function getFileNameFromPath(filePath) {
  const parts = String(filePath).split(/[\\/]/);
  return parts[parts.length - 1] || String(filePath);
}

function normalizeCamouflageIcon(pathValue, previewSrc = '') {
  const safePath = typeof pathValue === 'string' ? pathValue.trim() : '';
  if (!safePath) return null;

  return {
    path: safePath,
    name: getFileNameFromPath(safePath),
    previewSrc: typeof previewSrc === 'string' ? previewSrc : '',
  };
}

function isWebviewLifecycleError(error) {
  const message = error?.message;
  if (typeof message !== 'string') return false;
  return message.includes('The WebView must be attached to the DOM');
}

export default function App() {
  const firstRunPendingByDefault = !readBool(STORAGE_KEYS.firstRunCompleted, false);
  const rememberByDefault = readBool(STORAGE_KEYS.rememberSettings, false);
  const initialOpacity = rememberByDefault ? readNumber(STORAGE_KEYS.opacity, 1) : 1;

  const initialUrl = normalizeUrl(localStorage.getItem(STORAGE_KEYS.lastUrl)) || 'https://weread.qq.com/';

  const webviewRef = useRef(null);
  const initialWebviewSrcRef = useRef(initialUrl);
  const toolbarRef = useRef(null);
  const isWebviewReadyRef = useRef(false);
  const runtimeTimerRef = useRef(null);

  const [runtimeAlert, setRuntimeAlert] = useState({ visible: false, message: '' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('appearance');
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(firstRunPendingByDefault);
  const [isFirstRunPending, setIsFirstRunPending] = useState(firstRunPendingByDefault);

  const [rememberSettings, setRememberSettings] = useState(rememberByDefault);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [autoHideEnabled, setAutoHideEnabled] = useState(
    rememberByDefault ? readBool(STORAGE_KEYS.autoHideWindow, false) : false
  );
  const [toolbarAutoHideEnabled, setToolbarAutoHideEnabled] = useState(
    rememberByDefault ? readBool(STORAGE_KEYS.toolbarAutoHide, false) : false
  );
  const [isPinned, setIsPinned] = useState(rememberByDefault ? readBool(STORAGE_KEYS.pinned, false) : false);
  const [transparentMode, setTransparentMode] = useState(
    rememberByDefault ? readBool(STORAGE_KEYS.transparency, false) : false
  );
  const [darkMode, setDarkMode] = useState(rememberByDefault ? readBool(STORAGE_KEYS.darkMode, false) : false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [opacityPopoverOpen, setOpacityPopoverOpen] = useState(false);
  const [isMouseIn, setIsMouseIn] = useState(true);

  const [bookmarks, setBookmarks] = useState(() => {
    const parsed = readJson(STORAGE_KEYS.bookmarks, DEFAULT_BOOKMARKS);
    return Array.isArray(parsed) ? parsed : DEFAULT_BOOKMARKS;
  });
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarkUrl, setBookmarkUrl] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);

  const [hideScrollbar, setHideScrollbar] = useState(readBool(STORAGE_KEYS.hideScrollbar, false));
  const [textColor, setTextColor] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.textColor);
    return isHexColor(raw) ? raw : '#000000';
  });
  const [xhsHideLogo, setXhsHideLogo] = useState(readBool(STORAGE_KEYS.xhsHideLogo, false));
  const [xhsHideHeader, setXhsHideHeader] = useState(readBool(STORAGE_KEYS.xhsHideHeader, false));
  const [xhsHideBottomMenu, setXhsHideBottomMenu] = useState(readBool(STORAGE_KEYS.xhsHideBottomMenu, false));
  const [xhsHideFeedInDetail, setXhsHideFeedInDetail] = useState(
    readBool(STORAGE_KEYS.xhsHideFeedInDetail, false)
  );
  const hasXhsEnhanceEnabled =
    xhsHideLogo || xhsHideHeader || xhsHideBottomMenu || xhsHideFeedInDetail;

  const [iconPaths, setIconPaths] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState(localStorage.getItem(STORAGE_KEYS.appIcon) || '');

  const [updateStatusText, setUpdateStatusText] = useState('未检查');
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseStatus, setLicenseStatus] = useState({
    text: '未激活',
    colorClass: 'text-muted-foreground',
  });

  const webviewInteractionLocked = opacityPopoverOpen || (autoHideEnabled && !isMouseIn);
  const containerOpacity = autoHideEnabled && !isMouseIn ? 0.01 : opacity;
  const headerPanelStyle = transparentMode
    ? HEADER_PANEL_STYLE_TRANSPARENT
    : darkMode
      ? HEADER_PANEL_STYLE_LIGHT
      : HEADER_PANEL_STYLE_DARK;
  const headerIconColor = darkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(248, 250, 252, 0.95)';
  const headerHoverBgClass = darkMode ? 'hover:bg-black/25' : 'hover:bg-white/25';
  const headerIconButtonClass = `${HEADER_ICON_BUTTON_CLASS} ${headerHoverBgClass} header-icon-button`;

  const showRuntimeAlert = useCallback((message, timeoutMs = 7000) => {
    setRuntimeAlert({ visible: true, message });

    if (runtimeTimerRef.current) {
      window.clearTimeout(runtimeTimerRef.current);
      runtimeTimerRef.current = null;
    }

    if (timeoutMs > 0) {
      runtimeTimerRef.current = window.setTimeout(() => {
        setRuntimeAlert((prev) => ({ ...prev, visible: false }));
      }, timeoutMs);
    }
  }, []);

  const executeWebviewScript = useCallback(async (code, scope) => {
    const webview = webviewRef.current;
    if (!webview || !webview.isConnected) return;
    try {
      await webview.executeJavaScript(code);
      isWebviewReadyRef.current = true;
    } catch (error) {
      if (isWebviewLifecycleError(error)) {
        isWebviewReadyRef.current = false;
        return;
      }
      console.error(`[renderer:${scope}]`, error);
    }
  }, []);

  const transparencyCssText = `
    *,
    *::before,
    *::after {
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      -webkit-box-shadow: none !important;
      text-shadow: none !important;
    }
    html, body, #app, #app > div, #root {
      background: transparent !important;
      background-color: transparent !important;
    }
    .feed-container, .main-container, .channel-container { background: transparent !important; }
  `;

  const applyVisualModeStyle = useCallback(async () => {
    const darkCssText = `
      html { filter: invert(1) hue-rotate(180deg) !important; }
      img, video, iframe, canvas, svg { filter: invert(1) hue-rotate(180deg) !important; }
      html { background-color: ${transparentMode ? 'transparent' : '#000'} !important; }
    `;

    const mergedCssText = `${darkMode ? darkCssText : ''}\n${transparentMode ? transparencyCssText : ''}`.trim();

    const code = `
      (function() {
        const styleId = 'moyu-webview-visual-style';
        let style = document.getElementById(styleId);
        const cssText = ${JSON.stringify(mergedCssText)};

        if (!cssText) {
          if (style) style.remove();
          return;
        }

        if (!style) {
          style = document.createElement('style');
          style.id = styleId;
          document.head.appendChild(style);
        }

        style.textContent = cssText;
      })();
    `;

    await executeWebviewScript(code, 'applyVisualModeStyle');
  }, [darkMode, transparentMode, executeWebviewScript, transparencyCssText]);

  const applyTransparencyCSS = useCallback(async () => {
    await applyVisualModeStyle();
  }, [applyVisualModeStyle]);

  const removeTransparencyCSS = useCallback(async () => {
    await applyVisualModeStyle();
  }, [applyVisualModeStyle]);

  const applyDarkModeToWebview = useCallback(async () => {
    await applyVisualModeStyle();
  }, [applyVisualModeStyle]);

  const applyScrollbarStyle = useCallback(async () => {
    if (hideScrollbar) {
      const cssCode = `
        (function() {
          if (!document.getElementById('moyu-hide-scrollbar-style')) {
            const style = document.createElement('style');
            style.id = 'moyu-hide-scrollbar-style';
            style.innerHTML = \`
              ::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
            \`;
            document.head.appendChild(style);
          }
        })();
      `;
      await executeWebviewScript(cssCode, 'applyScrollbarStyle:add');
      return;
    }

    await executeWebviewScript(
      `
        (function() {
          const style = document.getElementById('moyu-hide-scrollbar-style');
          if (style) style.remove();
        })();
      `,
      'applyScrollbarStyle:remove'
    );
  }, [hideScrollbar, executeWebviewScript]);

  const applyTextColor = useCallback(async () => {
    if (isHexColor(textColor) && textColor !== '#000000') {
      const cssCode = `
        (function() {
          const oldStyle = document.getElementById('moyu-text-color-style');
          if (oldStyle) oldStyle.remove();

          const style = document.createElement('style');
          style.id = 'moyu-text-color-style';
          style.innerHTML = \`
            body, body * {
              color: ${textColor} !important;
            }
            a {
              color: ${textColor} !important;
              opacity: 0.8;
            }
            a:hover {
              opacity: 1;
            }
          \`;
          document.head.appendChild(style);
        })();
      `;
      await executeWebviewScript(cssCode, 'applyTextColor:add');
      return;
    }

    await executeWebviewScript(
      `
        (function() {
          const style = document.getElementById('moyu-text-color-style');
          if (style) style.remove();
        })();
      `,
      'applyTextColor:remove'
    );
  }, [textColor, executeWebviewScript]);

  const applyXiaohongshuStyles = useCallback(async () => {
    const webview = webviewRef.current;
    if (!webview || !webview.isConnected) return;

    const xhsConfig = {
      hideLogo: xhsHideLogo,
      hideHeader: xhsHideHeader,
      hideBottomMenu: xhsHideBottomMenu,
      hideFeedInDetail: xhsHideFeedInDetail,
    };

    const code = `
      (function() {
        const config = ${JSON.stringify(xhsConfig)};
        const STYLE_ID = 'moyu-xhs-style';
        const CONFIG_KEY = '__moyuXhsConfig';
        const OBSERVER_KEY = '__moyuXhsObserver';
        const ROOT_HEADER_FLAG = 'data-moyu-xhs-header-hidden';
        const ROOT_LOGO_FLAG = 'data-moyu-xhs-logo-hidden';
        const ROOT_BOTTOM_FLAG = 'data-moyu-xhs-bottom-hidden';
        const DETAIL_FEED_FLAG = 'data-moyu-xhs-detail-feed-hidden';
        const hostname = String(window.location.hostname || '').toLowerCase();
        const isXiaohongshu = /(^|\\.)xiaohongshu\\.com$/.test(hostname);

        const removeStyle = () => {
          const style = document.getElementById(STYLE_ID);
          if (style) style.remove();
        };

        const disconnectObserver = () => {
          const observer = window[OBSERVER_KEY];
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
          }
          window[OBSERVER_KEY] = null;
        };

        const clearRootFlags = () => {
          const root = document.documentElement;
          root.removeAttribute(ROOT_HEADER_FLAG);
          root.removeAttribute(ROOT_LOGO_FLAG);
          root.removeAttribute(ROOT_BOTTOM_FLAG);
          root.removeAttribute(DETAIL_FEED_FLAG);
        };

        const hasEnabledFeature =
          config.hideLogo || config.hideHeader || config.hideBottomMenu || config.hideFeedInDetail;

        if (!isXiaohongshu || !hasEnabledFeature) {
          delete window[CONFIG_KEY];
          disconnectObserver();
          clearRootFlags();
          removeStyle();
          return;
        }

        window[CONFIG_KEY] = config;
        const root = document.documentElement;
        if (config.hideLogo) root.setAttribute(ROOT_LOGO_FLAG, '1');
        else root.removeAttribute(ROOT_LOGO_FLAG);
        if (config.hideHeader) root.setAttribute(ROOT_HEADER_FLAG, '1');
        else root.removeAttribute(ROOT_HEADER_FLAG);
        if (config.hideBottomMenu) root.setAttribute(ROOT_BOTTOM_FLAG, '1');
        else root.removeAttribute(ROOT_BOTTOM_FLAG);

        const ensureStyle = () => {
          let style = document.getElementById(STYLE_ID);
          if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            document.head.appendChild(style);
          }
          style.textContent = \`
            html[\${ROOT_LOGO_FLAG}="1"] #link-guide,
            html[\${ROOT_LOGO_FLAG}="1"] [id*="link-guide"],
            html[\${ROOT_LOGO_FLAG}="1"] [class*="logo"],
            html[\${ROOT_LOGO_FLAG}="1"] [id*="logo"] {
              display: none !important;
            }
            html[\${ROOT_HEADER_FLAG}="1"] .header-container,
            html[\${ROOT_HEADER_FLAG}="1"] header,
            html[\${ROOT_HEADER_FLAG}="1"] [class*="header-container"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="top-nav"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="top-bar"] {
              display: none !important;
              height: 0 !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
            }
            html[\${ROOT_HEADER_FLAG}="1"] [class*="header-placeholder"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="top-placeholder"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="safe-area"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="spacer"],
            html[\${ROOT_HEADER_FLAG}="1"] [class*="offset"] {
              height: 0 !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
            }
            html[\${ROOT_HEADER_FLAG}="1"] .header-container {
              display: none !important;
              height: 0 !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
            }
            html[\${ROOT_HEADER_FLAG}="1"] #app,
            html[\${ROOT_HEADER_FLAG}="1"] .main-container,
            html[\${ROOT_HEADER_FLAG}="1"] #mfContainer,
            html[\${ROOT_HEADER_FLAG}="1"] .feed-container,
            html[\${ROOT_HEADER_FLAG}="1"] .channel-container,
            html[\${ROOT_HEADER_FLAG}="1"] .feeds-container,
            html[\${ROOT_HEADER_FLAG}="1"] .feeds-page,
            html[\${ROOT_HEADER_FLAG}="1"] .user,
            html[\${ROOT_HEADER_FLAG}="1"] main {
              padding-top: 0 !important;
              margin-top: 0 !important;
              top: 0 !important;
              inset-block-start: 0 !important;
              scroll-padding-top: 0 !important;
            }
            html[\${ROOT_HEADER_FLAG}="1"],
            html[\${ROOT_HEADER_FLAG}="1"] body,
            html[\${ROOT_HEADER_FLAG}="1"] #app {
              --header-height: 0px !important;
              --header-container-height: 0px !important;
              --top-bar-height: 0px !important;
              --safe-area-top: 0px !important;
              --safe-top: 0px !important;
              --navigation-height: 0px !important;
              --navigation-bar-height: 0px !important;
              --global-header-height: 0px !important;
              --app-header-height: 0px !important;
            }
            html[\${ROOT_BOTTOM_FLAG}="1"] .bottom-menu,
            html[\${ROOT_BOTTOM_FLAG}="1"] [class*="bottom-menu"],
            html[\${ROOT_BOTTOM_FLAG}="1"] [class*="tabbar"],
            html[\${ROOT_BOTTOM_FLAG}="1"] [class*="bottom-nav"] {
              display: none !important;
            }
            html[\${DETAIL_FEED_FLAG}="1"] #mfContainer.feeds-page {
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          \`;
        };

        const syncDetailFlag = () => {
          const liveConfig = window[CONFIG_KEY] || {};
          const isDetailPage = /\\/explore\\/[^/?#]{6,}/i.test(window.location.pathname || '');
          if (liveConfig.hideFeedInDetail && isDetailPage) {
            root.setAttribute(DETAIL_FEED_FLAG, '1');
          } else {
            root.removeAttribute(DETAIL_FEED_FLAG);
          }
        };

        ensureStyle();
        syncDetailFlag();

        if (!window[OBSERVER_KEY] && document.body) {
          const observer = new MutationObserver(() => {
            syncDetailFlag();
          });
          observer.observe(document.body, { childList: true, subtree: true });
          window[OBSERVER_KEY] = observer;
        }

        window.requestAnimationFrame(syncDetailFlag);
        window.setTimeout(syncDetailFlag, 120);
        window.setTimeout(syncDetailFlag, 320);
      })();
    `;

    await executeWebviewScript(code, 'applyXiaohongshuStyles');
  }, [xhsHideLogo, xhsHideHeader, xhsHideBottomMenu, xhsHideFeedInDetail, executeWebviewScript]);

  const webviewStyleRuntimeRef = useRef({
    transparentMode,
    hasXhsEnhanceEnabled,
    applyTransparencyCSS,
    removeTransparencyCSS,
    applyScrollbarStyle,
    applyTextColor,
    applyDarkModeToWebview,
    applyXiaohongshuStyles,
    executeWebviewScript,
  });

  useEffect(() => {
    webviewStyleRuntimeRef.current = {
      transparentMode,
      hasXhsEnhanceEnabled,
      applyTransparencyCSS,
      removeTransparencyCSS,
      applyScrollbarStyle,
      applyTextColor,
      applyDarkModeToWebview,
      applyXiaohongshuStyles,
      executeWebviewScript,
    };
  }, [
    transparentMode,
    hasXhsEnhanceEnabled,
    applyTransparencyCSS,
    removeTransparencyCSS,
    applyScrollbarStyle,
    applyTextColor,
    applyDarkModeToWebview,
    applyXiaohongshuStyles,
    executeWebviewScript,
  ]);

  const refreshLicenseStatus = useCallback(async () => {
    try {
      const status = await electronBridge.getLicenseStatus();
      if (status.activated) {
        const dateText = status.activatedAt ? `（${new Date(status.activatedAt).toLocaleDateString()}）` : '';
        setLicenseStatus({
          text: `已激活：${status.maskedKey}${dateText}`,
          colorClass: 'text-green-600',
        });
        return;
      }
      setLicenseStatus({ text: '未激活', colorClass: 'text-muted-foreground' });
    } catch (error) {
      console.error('[renderer:refreshLicenseStatus]', error);
      setLicenseStatus({ text: '激活状态读取失败', colorClass: 'text-red-600' });
    }
  }, []);

  const loadCamouflageIcons = useCallback(async () => {
    try {
      const paths = await electronBridge.listCamouflageIcons();
      const safePaths = Array.isArray(paths)
        ? paths.filter((item) => typeof item === 'string' && item.trim() !== '')
        : [];

      const previewEntries = await Promise.all(
        safePaths.map(async (iconPath) => {
          try {
            const previewSrc = await electronBridge.getCamouflageIconPreview(iconPath);
            return normalizeCamouflageIcon(iconPath, previewSrc);
          } catch (error) {
            console.error('[renderer:getCamouflageIconPreview]', error);
            return normalizeCamouflageIcon(iconPath, '');
          }
        })
      );

      const normalizedEntries = previewEntries.filter(Boolean);
      setIconPaths(normalizedEntries);

      if (selectedIcon && !safePaths.includes(selectedIcon)) {
        setSelectedIcon('');
        localStorage.removeItem(STORAGE_KEYS.appIcon);
      }
    } catch (error) {
      console.error('[renderer:loadCamouflageIcons]', error);
      setIconPaths([]);
    }
  }, [selectedIcon]);

  const navigateTo = useCallback((url) => {
    const webview = webviewRef.current;
    if (!webview) return;
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    if (isWebviewReadyRef.current && webview.isConnected) {
      webview.loadURL(normalized).catch((error) => {
        if (isWebviewLifecycleError(error)) {
          isWebviewReadyRef.current = false;
          webview.setAttribute('src', normalized);
          return;
        }
        console.error('[renderer:navigateTo:loadURL]', error);
      });
    } else {
      webview.setAttribute('src', normalized);
    }
    localStorage.setItem(STORAGE_KEYS.lastUrl, normalized);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) {
      showRuntimeAlert('桌面桥接不可用，窗口控制和快捷键同步可能失效。', 0);
    }
  }, [showRuntimeAlert]);

  useEffect(() => {
    const handleError = (event) => {
      showRuntimeAlert(`运行错误：${event.message || '未知错误'}`);
    };

    const handleRejection = (event) => {
      const message = event.reason?.message || String(event.reason || '未知 Promise 错误');
      showRuntimeAlert(`异步错误：${message}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [showRuntimeAlert]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.rememberSettings, String(rememberSettings));
  }, [rememberSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.opacity, String(opacity));
  }, [opacity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoHideWindow, String(autoHideEnabled));
  }, [autoHideEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.toolbarAutoHide, String(toolbarAutoHideEnabled));
    if (!toolbarAutoHideEnabled) {
      setToolbarVisible(true);
      return;
    }

    if (opacityPopoverOpen) return;
    const toolbar = toolbarRef.current;
    if (!toolbar || !toolbar.matches(':hover')) {
      setToolbarVisible(false);
    }
  }, [toolbarAutoHideEnabled, opacityPopoverOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pinned, String(isPinned));
    electronBridge.setAlwaysOnTop(isPinned);
  }, [isPinned]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transparency, String(transparentMode));
    if (transparentMode) {
      applyTransparencyCSS();
    } else {
      removeTransparencyCSS();
    }
  }, [transparentMode, applyTransparencyCSS, removeTransparencyCSS]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.darkMode, String(darkMode));
    applyDarkModeToWebview();
  }, [darkMode, applyDarkModeToWebview]);

  useEffect(() => {
    // Keep UI theme direction aligned with existing darkMode semantics used by webview rendering.
    const isUiDark = !darkMode;
    document.documentElement.classList.toggle('dark', isUiDark);
    document.body.classList.toggle('dark', isUiDark);
  }, [darkMode]);

  useEffect(() => {
    if (!hasXhsEnhanceEnabled) return;
    const webview = webviewRef.current;
    if (!webview || !webview.isConnected) return;
    let currentUrl = '';
    try {
      currentUrl = webview.getURL();
    } catch (error) {
      if (isWebviewLifecycleError(error)) {
        isWebviewReadyRef.current = false;
        return;
      }
      return;
    }
    if (!currentUrl.includes('xiaohongshu.com')) return;
    applyXiaohongshuStyles();
  }, [darkMode, transparentMode, hasXhsEnhanceEnabled, applyXiaohongshuStyles]);

  useEffect(() => {
    const retryTimers = [120, 420].map((delayMs) =>
      window.setTimeout(() => {
        if (transparentMode) {
          applyTransparencyCSS();
        } else {
          removeTransparencyCSS();
        }
        applyDarkModeToWebview();
      }, delayMs)
    );

    return () => {
      retryTimers.forEach((id) => window.clearTimeout(id));
    };
  }, [transparentMode, darkMode, applyTransparencyCSS, removeTransparencyCSS, applyDarkModeToWebview]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.hideScrollbar, String(hideScrollbar));
    applyScrollbarStyle();
  }, [hideScrollbar, applyScrollbarStyle]);

  useEffect(() => {
    const safeColor = isHexColor(textColor) ? textColor : '#000000';
    localStorage.setItem(STORAGE_KEYS.textColor, safeColor);
    applyTextColor();
  }, [textColor, applyTextColor]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.xhsHideLogo, String(xhsHideLogo));
    applyXiaohongshuStyles();
  }, [xhsHideLogo, applyXiaohongshuStyles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.xhsHideHeader, String(xhsHideHeader));
    applyXiaohongshuStyles();
  }, [xhsHideHeader, applyXiaohongshuStyles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.xhsHideBottomMenu, String(xhsHideBottomMenu));
    applyXiaohongshuStyles();
  }, [xhsHideBottomMenu, applyXiaohongshuStyles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.xhsHideFeedInDetail, String(xhsHideFeedInDetail));
    applyXiaohongshuStyles();
  }, [xhsHideFeedInDetail, applyXiaohongshuStyles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (!selectedIcon) return;
    localStorage.setItem(STORAGE_KEYS.appIcon, selectedIcon);
    electronBridge.changeIcon(selectedIcon);
  }, [selectedIcon]);

  useEffect(() => {
    const bodyMouseEnter = () => {
      setIsMouseIn(true);
    };
    const bodyMouseLeave = () => {
      setIsMouseIn(false);
      if (toolbarAutoHideEnabled && !opacityPopoverOpen) {
        setToolbarVisible(false);
      }
    };

    document.body.addEventListener('mouseenter', bodyMouseEnter);
    document.body.addEventListener('mouseleave', bodyMouseLeave);

    return () => {
      document.body.removeEventListener('mouseenter', bodyMouseEnter);
      document.body.removeEventListener('mouseleave', bodyMouseLeave);
    };
  }, [toolbarAutoHideEnabled, opacityPopoverOpen]);

  useEffect(() => {
    if (!toolbarAutoHideEnabled) return undefined;

    const handleMouseMove = (event) => {
      if (opacityPopoverOpen) return;

      const toolbar = toolbarRef.current;
      if (toolbar?.matches(':hover')) {
        setToolbarVisible(true);
        return;
      }

      const toolbarBottom = toolbar ? Math.round(toolbar.getBoundingClientRect().bottom) : TOOLBAR_REVEAL_ZONE;
      const revealThreshold = Math.max(16, Math.min(TOOLBAR_REVEAL_ZONE, toolbarBottom));
      if (event.clientY <= revealThreshold) {
        setToolbarVisible(true);
        return;
      }

      setToolbarVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [toolbarAutoHideEnabled, opacityPopoverOpen]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      showRuntimeAlert('关键界面元素缺失，请重启应用。', 0);
      return undefined;
    }
    isWebviewReadyRef.current = false;

    const handleStartLoading = () => {
      isWebviewReadyRef.current = false;
    };

    const syncUrl = (url) => {
      const normalized = normalizeUrl(url);
      if (!normalized) return;
      localStorage.setItem(STORAGE_KEYS.lastUrl, normalized);
    };

    const reapplyAllStyles = () => {
      const runtime = webviewStyleRuntimeRef.current;
      if (runtime.transparentMode) {
        runtime.applyTransparencyCSS();
      } else {
        runtime.removeTransparencyCSS();
      }
      runtime.applyScrollbarStyle();
      runtime.applyTextColor();
      runtime.applyDarkModeToWebview();

      let currentUrl = '';
      try {
        currentUrl = webview.getURL();
      } catch (error) {
        if (isWebviewLifecycleError(error)) {
          isWebviewReadyRef.current = false;
          return;
        }
        console.error('[renderer:reapplyAllStyles:getURL]', error);
        return;
      }
      if (runtime.hasXhsEnhanceEnabled && currentUrl.includes('xiaohongshu.com')) {
        runtime.applyXiaohongshuStyles();
      }

      const script = `
        (function() {
          const saved = localStorage.getItem('${STORAGE_KEYS.scrollY}');
          if (saved) {
            window.scrollTo(0, parseInt(saved, 10));
          }

          let timeout;
          window.addEventListener('scroll', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              localStorage.setItem('${STORAGE_KEYS.scrollY}', String(window.scrollY));
            }, 500);
          });
        })();
      `;
      runtime.executeWebviewScript(script, 'syncReadingProgress');
    };

    const handleDomReady = () => {
      isWebviewReadyRef.current = true;
      reapplyAllStyles();
    };

    const handleDidFinishLoad = () => {
      if (!isWebviewReadyRef.current) {
        isWebviewReadyRef.current = true;
      }
      reapplyAllStyles();
    };

    const handleDidNavigate = (event) => {
      syncUrl(event.url);
      const runtime = webviewStyleRuntimeRef.current;
      if (runtime.hasXhsEnhanceEnabled && event.url.includes('xiaohongshu.com')) {
        runtime.applyXiaohongshuStyles();
      }
    };

    const handleDidNavigateInPage = (event) => {
      syncUrl(event.url);
      const runtime = webviewStyleRuntimeRef.current;
      if (runtime.hasXhsEnhanceEnabled && event.url.includes('xiaohongshu.com')) {
        runtime.applyXiaohongshuStyles();
      }
    };

    const handleStopLoading = () => {
      if (!isWebviewReadyRef.current) {
        isWebviewReadyRef.current = true;
        reapplyAllStyles();
      }
      try {
        syncUrl(webview.getURL());
      } catch (error) {
        console.error('[renderer:handleStopLoading:getURL]', error);
      }
    };

    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webview.addEventListener('did-stop-loading', handleStopLoading);

    return () => {
      isWebviewReadyRef.current = false;
      webview.removeEventListener('did-start-loading', handleStartLoading);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      webview.removeEventListener('did-stop-loading', handleStopLoading);
    };
  }, [showRuntimeAlert]);

  useEffect(() => {
    let unsubscribeToggleTransparency = null;
    let unsubscribeToggleBookmarks = null;
    let unsubscribeGoBack = null;
    let unsubscribeGoForward = null;

    unsubscribeToggleTransparency =
      electronBridge.onToggleTransparency?.(() => {
        setTransparentMode((prev) => !prev);
      }) ?? null;

    unsubscribeToggleBookmarks =
      electronBridge.onToggleBookmarks?.(() => {
        setBookmarksOpen(true);
      }) ?? null;

    unsubscribeGoBack =
      electronBridge.onGoBack?.(() => {
        if (!isWebviewReadyRef.current) return;
        const webview = webviewRef.current;
        if (!webview || !webview.isConnected) return;
        try {
          if (webview.canGoBack()) {
            webview.goBack();
          }
        } catch (error) {
          if (isWebviewLifecycleError(error)) {
            isWebviewReadyRef.current = false;
            return;
          }
          console.error('[renderer:onGoBack]', error);
        }
      }) ?? null;

    unsubscribeGoForward =
      electronBridge.onGoForward?.(() => {
        if (!isWebviewReadyRef.current) return;
        const webview = webviewRef.current;
        if (!webview || !webview.isConnected) return;
        try {
          if (webview.canGoForward()) {
            webview.goForward();
          }
        } catch (error) {
          if (isWebviewLifecycleError(error)) {
            isWebviewReadyRef.current = false;
            return;
          }
          console.error('[renderer:onGoForward]', error);
        }
      }) ?? null;

    return () => {
      if (typeof unsubscribeToggleTransparency === 'function') unsubscribeToggleTransparency();
      if (typeof unsubscribeToggleBookmarks === 'function') unsubscribeToggleBookmarks();
      if (typeof unsubscribeGoBack === 'function') unsubscribeGoBack();
      if (typeof unsubscribeGoForward === 'function') unsubscribeGoForward();
    };
  }, []);

  useEffect(() => {
    loadCamouflageIcons();
  }, [loadCamouflageIcons]);

  useEffect(() => {
    if (!settingsOpen) return;
    loadCamouflageIcons();
    refreshLicenseStatus();
  }, [settingsOpen, loadCamouflageIcons, refreshLicenseStatus]);

  useEffect(() => {
    if (!rememberSettings) {
      return;
    }

    setOpacity(readNumber(STORAGE_KEYS.opacity, 1));
    setAutoHideEnabled(readBool(STORAGE_KEYS.autoHideWindow, false));
    setToolbarAutoHideEnabled(readBool(STORAGE_KEYS.toolbarAutoHide, false));
    setIsPinned(readBool(STORAGE_KEYS.pinned, false));
    setTransparentMode(readBool(STORAGE_KEYS.transparency, false));
    setDarkMode(readBool(STORAGE_KEYS.darkMode, false));
  }, [rememberSettings]);

  useEffect(() => {
    return () => {
      if (runtimeTimerRef.current) {
        window.clearTimeout(runtimeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedIcon) {
      const saved = localStorage.getItem(STORAGE_KEYS.appIcon);
      if (saved) {
        localStorage.removeItem(STORAGE_KEYS.appIcon);
      }
    }
  }, [selectedIcon]);

  const filteredBookmarks = useMemo(() => {
    const keyword = bookmarkSearch.trim().toLowerCase();
    const dataset = bookmarks.map((item, index) => ({ ...item, sourceIndex: index }));
    if (!keyword) return dataset;

    return dataset.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const url = String(item.url || '').toLowerCase();
      return name.includes(keyword) || url.includes(keyword);
    });
  }, [bookmarks, bookmarkSearch]);

  const resetBookmarkEditor = useCallback(() => {
    setIsAddingBookmark(false);
    setEditingIndex(-1);
    setBookmarkName('');
    setBookmarkUrl('');
  }, []);

  const startBookmarkAdd = useCallback(() => {
    setIsAddingBookmark(true);
    setEditingIndex(-1);
    setBookmarkName('');
    setBookmarkUrl('');
  }, []);

  const startBookmarkEdit = useCallback(
    (index) => {
      const target = bookmarks[index];
      if (!target) return;
      setIsAddingBookmark(false);
      setEditingIndex(index);
      setBookmarkName(target.name || '');
      setBookmarkUrl(target.url || '');
    },
    [bookmarks]
  );

  const handleBookmarkSubmit = useCallback(() => {
    const name = bookmarkName.trim();
    const rawUrl = bookmarkUrl.trim();
    const url = normalizeUrl(rawUrl);

    if (!name || !url) {
      showRuntimeAlert('请输入名称和网址');
      return;
    }

    try {
      new URL(url);
    } catch {
      showRuntimeAlert('请输入有效网址');
      return;
    }

    setBookmarks((prev) => {
      if (editingIndex >= 0) {
        const next = [...prev];
        next[editingIndex] = { name, url };
        return next;
      }
      return [...prev, { name, url }];
    });

    resetBookmarkEditor();
  }, [bookmarkName, bookmarkUrl, editingIndex, showRuntimeAlert, resetBookmarkEditor]);

  const handleBookmarkEditorKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleBookmarkSubmit();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        resetBookmarkEditor();
      }
    },
    [handleBookmarkSubmit, resetBookmarkEditor]
  );

  const handleBookmarkDelete = useCallback(
    (index) => {
      setBookmarks((prev) => prev.filter((_, currentIndex) => currentIndex !== index));

      if (editingIndex === index) {
        resetBookmarkEditor();
      } else if (editingIndex > index) {
        setEditingIndex((prev) => prev - 1);
      }
    },
    [editingIndex, resetBookmarkEditor]
  );

  const completeFirstRun = useCallback(
    ({ openBookmarks }) => {
      localStorage.setItem(STORAGE_KEYS.firstRunCompleted, 'true');
      setIsFirstRunPending(false);
      setOnboardingOpen(false);
      setBookmarksOpen(Boolean(openBookmarks));
    },
    []
  );

  const handleActivateLicense = useCallback(async () => {
    const key = licenseInput.trim();
    if (!key) {
      showRuntimeAlert('请输入激活码');
      return;
    }

    try {
      const result = await electronBridge.activateLicense(key);
      if (!result?.ok) {
        showRuntimeAlert(result?.message || '激活失败');
        return;
      }

      showRuntimeAlert(result.message || '激活成功');
      setLicenseInput('');
      refreshLicenseStatus();
    } catch (error) {
      console.error('[renderer:activateLicense]', error);
      showRuntimeAlert('激活请求失败');
    }
  }, [licenseInput, showRuntimeAlert, refreshLicenseStatus]);

  const handleCheckUpdates = useCallback(async () => {
    setUpdateStatusText('检查中...');
    try {
      const result = await electronBridge.checkForUpdates();
      const checkedAtText = result?.checkedAt ? `（${new Date(result.checkedAt).toLocaleTimeString()}）` : '';
      setUpdateStatusText(`${result?.message || '检查完成'}${checkedAtText}`);
    } catch (error) {
      console.error('[renderer:checkForUpdates]', error);
      setUpdateStatusText('检查失败');
    }
  }, []);

  return (
    <div
      className="relative h-full w-full"
      style={{ opacity: containerOpacity, background: 'transparent' }}
    >
      {runtimeAlert.visible ? (
        <div className="no-drag fixed left-2 right-2 top-2 z-[3100] flex items-center justify-between gap-2 rounded-md bg-red-600 px-3 py-2 text-xs text-white">
          <span>{runtimeAlert.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRuntimeAlert((prev) => ({ ...prev, visible: false }))}
          >
            关闭
          </Button>
        </div>
      ) : null}

      <header
        ref={toolbarRef}
        className={`drag-region relative z-20 mb-2 flex items-center justify-between text-foreground transition-all duration-200 ${
          toolbarVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
        onMouseEnter={() => {
          if (toolbarAutoHideEnabled) {
            setToolbarVisible(true);
          }
        }}
        onMouseLeave={() => {
          if (toolbarAutoHideEnabled && !opacityPopoverOpen) {
            setToolbarVisible(false);
          }
        }}
      >
        <div
          className="no-drag flex items-center gap-1 rounded-full bg-black/20 px-2 py-1"
          style={{ ...headerPanelStyle, color: headerIconColor }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={`${headerIconButtonClass} hover:bg-destructive/15 hover:text-destructive`}
            onClick={() => electronBridge.windowClose()}
            title="关闭"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.close} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => electronBridge.windowMinimize()}
            title="最小化"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.minus} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => {
              if (!isWebviewReadyRef.current) return;
              const webview = webviewRef.current;
              if (!webview || !webview.isConnected) return;
              try {
                if (webview.canGoBack()) webview.goBack();
              } catch (error) {
                if (isWebviewLifecycleError(error)) {
                  isWebviewReadyRef.current = false;
                  return;
                }
                console.error('[renderer:toolbar:goBack]', error);
              }
            }}
            title="后退"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.back} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => {
              if (!isWebviewReadyRef.current) return;
              const webview = webviewRef.current;
              if (!webview || !webview.isConnected) return;
              try {
                if (webview.canGoForward()) webview.goForward();
              } catch (error) {
                if (isWebviewLifecycleError(error)) {
                  isWebviewReadyRef.current = false;
                  return;
                }
                console.error('[renderer:toolbar:goForward]', error);
              }
            }}
            title="前进"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.forward} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => {
              if (!isWebviewReadyRef.current) return;
              const webview = webviewRef.current;
              if (!webview || !webview.isConnected) return;
              try {
                webview.reload();
              } catch (error) {
                if (isWebviewLifecycleError(error)) {
                  isWebviewReadyRef.current = false;
                  return;
                }
                console.error('[renderer:toolbar:reload]', error);
              }
            }}
            title="刷新"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.refresh} />
          </Button>
        </div>

        <div
          className="no-drag flex items-center gap-1 rounded-full bg-black/20 px-2 py-1"
          style={{ ...headerPanelStyle, color: headerIconColor }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => setTransparentMode((prev) => !prev)}
            title="一键透明"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.removeBackground} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => setDarkMode((prev) => !prev)}
            title={darkMode ? '切换到亮色模式' : '切换到深色模式'}
          >
            {darkMode ? (
              <HeaderSvgIcon svg={HEADER_ICON_SVGS.sun} />
            ) : (
              <HeaderSvgIcon svg={HEADER_ICON_SVGS.moon} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => setSettingsOpen(true)}
            title="设置"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.settings} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={headerIconButtonClass}
            onClick={() => {
              setBookmarksOpen(true);
              setBookmarkSearch('');
              resetBookmarkEditor();
            }}
            title="网址管理"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.bookmark} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`${headerIconButtonClass} ${toolbarAutoHideEnabled ? HEADER_ACTIVE_ICON_CLASS : ''}`}
            onClick={() => setToolbarAutoHideEnabled((prev) => !prev)}
            title="开启/关闭 导航栏自动隐藏"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.layoutTop} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`${headerIconButtonClass} ${isPinned ? HEADER_ACTIVE_ICON_CLASS : ''}`}
            onClick={() => setIsPinned((prev) => !prev)}
            title="开启/关闭 窗口置顶"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.pin} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`${headerIconButtonClass} ${autoHideEnabled ? HEADER_ACTIVE_ICON_CLASS : ''}`}
            onClick={() => setAutoHideEnabled((prev) => !prev)}
            title="开启/关闭 自动隐身"
          >
            <HeaderSvgIcon svg={HEADER_ICON_SVGS.ghost} />
          </Button>

          <Popover open={opacityPopoverOpen} onOpenChange={setOpacityPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className={headerIconButtonClass} title="调节透明度">
                <HeaderSvgIcon svg={HEADER_ICON_SVGS.transparent} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 no-drag" align="end" sideOffset={10}>
              <div className="mb-3 text-xs text-muted-foreground">透明度: {Math.round(opacity * 100)}%</div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[Math.round(opacity * 100)]}
                onValueChange={(value) => setOpacity((value[0] || 100) / 100)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <main className="h-[calc(100%-60px)]">
        <webview
          ref={webviewRef}
          id="browser-view"
          src={initialWebviewSrcRef.current}
          className="h-full w-full overflow-hidden rounded-xl bg-transparent"
          style={{
            pointerEvents: webviewInteractionLocked ? 'none' : 'auto',
          }}
        ></webview>
      </main>

      <Dialog
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (open) setSettingsTab('appearance');
        }}
      >
        <DialogContent className="overflow-auto sm:max-h-[92vh] sm:w-full sm:max-w-[1100px]">
          <DialogHeader className="block h-auto text-left">
            <DialogTitle>设置中心</DialogTitle>
            <DialogDescription>统一管理外观、阅读增强、小红书场景、更新与快捷键。</DialogDescription>
          </DialogHeader>

          <Tabs value={settingsTab} onValueChange={setSettingsTab} className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="appearance" className="w-full">外观</TabsTrigger>
              <TabsTrigger value="enhance" className="w-full">增强</TabsTrigger>
              <TabsTrigger value="system" className="w-full">系统</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="space-y-3 p-4">
                <h3 className="text-base font-semibold">伪装图标 (Dock栏)</h3>
                <div className="flex flex-wrap gap-x-2 gap-y-4">
                  {iconPaths.map((iconItem) => (
                    <Button
                      key={iconItem.path}
                      variant={selectedIcon === iconItem.path ? 'secondary' : 'outline'}
                      className="h-16 w-16 rounded-xl p-2.5"
                      onClick={() => setSelectedIcon(iconItem.path)}
                      title={iconItem.name}
                    >
                      {iconItem.previewSrc ? (
                        <span className="inline-flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
                          <img src={iconItem.previewSrc} alt={iconItem.name} className="h-full w-full object-contain" />
                        </span>
                      ) : (
                        <span className="inline-flex h-full w-full items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                          {iconItem.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="space-y-3 p-4">
                <h3 className="text-base font-semibold">通用开关</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">记住上次功能区设置</span>
                  <Switch checked={rememberSettings} onCheckedChange={setRememberSettings} />
                </div>
                <p className="text-xs text-muted-foreground">
                  包含：一键透明、深浅色、导航栏自动隐藏、窗口置顶、移出自动隐身、窗口透明度。
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="enhance" className="space-y-4">
              <Card className="space-y-4 p-4">
                <h3 className="text-base font-semibold">阅读增强</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">隐藏页面滚动条</span>
                  <Switch checked={hideScrollbar} onCheckedChange={setHideScrollbar} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">自定义文字颜色</span>
                  <ColorPickerField value={textColor} onChange={setTextColor} defaultValue="#000000" />
                </div>
              </Card>

              <Card className="space-y-4 p-4">
                <h3 className="text-base font-semibold">小红书专属设置</h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm">隐藏 Logo (左上角)</span>
                  <Switch checked={xhsHideLogo} onCheckedChange={setXhsHideLogo} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">隐藏头部导航 (Header)</span>
                  <Switch checked={xhsHideHeader} onCheckedChange={setXhsHideHeader} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">隐藏底部菜单 (Bottom Menu)</span>
                  <Switch checked={xhsHideBottomMenu} onCheckedChange={setXhsHideBottomMenu} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">详情页隐藏 Feed (#mfContainer.feeds-page)</span>
                  <Switch checked={xhsHideFeedInDetail} onCheckedChange={setXhsHideFeedInDetail} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card className="space-y-4 p-4">
                <h3 className="text-base font-semibold">更新与激活</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCheckUpdates}>
                    检查更新
                  </Button>
                  <span className="text-sm text-muted-foreground">{updateStatusText}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="输入激活码（如 MOYU-XXXX-XXXX）"
                    value={licenseInput}
                    onChange={(event) => setLicenseInput(event.target.value)}
                  />
                  <Button size="sm" onClick={handleActivateLicense}>
                    激活
                  </Button>
                </div>

                <div className={`text-sm ${licenseStatus.colorClass}`}>{licenseStatus.text}</div>
              </Card>

              <Card className="space-y-2 p-4">
                <h3 className="text-base font-semibold">快捷键</h3>
                <div className="flex items-center justify-between text-sm">
                  <span>老板键 (显示/隐藏)</span>
                  <span className="font-medium">Cmd/Ctrl + M</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>一键透明</span>
                  <span className="font-medium">Cmd/Ctrl + T</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>打开网址管理</span>
                  <span className="font-medium">Cmd/Ctrl + B</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>后退</span>
                  <span className="font-medium">Alt + Left</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>前进</span>
                  <span className="font-medium">Alt + Right</span>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bookmarksOpen}
        onOpenChange={(open) => {
          setBookmarksOpen(open);
          if (!open) {
            setBookmarkSearch('');
            resetBookmarkEditor();
          }
        }}
      >
        <DialogContent className="overflow-auto sm:max-h-[92vh] sm:w-full sm:max-w-[920px]">
          <DialogHeader className="block h-auto text-left">
            <DialogTitle>网址管理</DialogTitle>
            <DialogDescription>书签即入口，支持快速检索、行内新增/编辑和一键跳转。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={bookmarkSearch}
                  onChange={(event) => setBookmarkSearch(event.target.value)}
                  placeholder="搜索书签名称或网址..."
                  className="pl-9"
                />
              </div>

              <Button
                variant={isAddingBookmark ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  if (isAddingBookmark) {
                    resetBookmarkEditor();
                    return;
                  }
                  startBookmarkAdd();
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {isAddingBookmark ? '取消新增' : '新增书签'}
              </Button>
            </div>

            {isAddingBookmark ? (
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-indigo-500/35 bg-indigo-500/10 p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  type="text"
                  placeholder="名称 (如: B站)"
                  value={bookmarkName}
                  onChange={(event) => setBookmarkName(event.target.value)}
                  onKeyDown={handleBookmarkEditorKeyDown}
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="网址 (如: bilibili.com)"
                  value={bookmarkUrl}
                  onChange={(event) => setBookmarkUrl(event.target.value)}
                  onKeyDown={handleBookmarkEditorKeyDown}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={resetBookmarkEditor}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleBookmarkSubmit}>
                    添加
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="max-h-[52vh] space-y-2 overflow-auto pr-1">
              {filteredBookmarks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {bookmarkSearch.trim() ? `没有匹配 “${bookmarkSearch.trim()}” 的书签` : '还没有书签，先添加一个常用网址吧。'}
                </div>
              ) : null}

              {filteredBookmarks.map((bookmarkItem) => {
                const isCurrentEditing = editingIndex === bookmarkItem.sourceIndex;

                if (isCurrentEditing) {
                  return (
                    <div
                      key={`${bookmarkItem.sourceIndex}-${bookmarkItem.url}`}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-amber-500/45 bg-amber-500/10 p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        type="text"
                        placeholder="名称 (如: B站)"
                        value={bookmarkName}
                        onChange={(event) => setBookmarkName(event.target.value)}
                        onKeyDown={handleBookmarkEditorKeyDown}
                        autoFocus
                      />
                      <Input
                        type="text"
                        placeholder="网址 (如: bilibili.com)"
                        value={bookmarkUrl}
                        onChange={(event) => setBookmarkUrl(event.target.value)}
                        onKeyDown={handleBookmarkEditorKeyDown}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={resetBookmarkEditor}>
                          取消
                        </Button>
                        <Button size="sm" onClick={handleBookmarkSubmit}>
                          保存
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${bookmarkItem.sourceIndex}-${bookmarkItem.url}`}
                    className="group flex h-[52px] items-center gap-2 rounded-lg border border-border/80 bg-card px-2 pr-2.5 transition-colors hover:bg-muted/35"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-full min-w-0 flex-1 justify-start gap-3 rounded-md px-0.5 py-0 text-left hover:bg-transparent"
                      onClick={() => {
                        navigateTo(bookmarkItem.url);
                        setBookmarksOpen(false);
                      }}
                    >
                      <BookmarkFavicon name={bookmarkItem.name} url={bookmarkItem.url} />
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-medium">{bookmarkItem.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{bookmarkItem.url}</div>
                      </div>
                    </Button>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startBookmarkEdit(bookmarkItem.sourceIndex)}
                      >
                        <HeaderSvgIcon
                          svg={BOOKMARK_ACTION_ICON_SVGS.edit}
                          className="inline-block h-4 w-4 shrink-0 align-middle [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                        />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleBookmarkDelete(bookmarkItem.sourceIndex)}
                      >
                        <HeaderSvgIcon
                          svg={BOOKMARK_ACTION_ICON_SVGS.delete}
                          className="inline-block h-4 w-4 shrink-0 align-middle [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                        />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={onboardingOpen}
        onOpenChange={(open) => {
          if (open) {
            setOnboardingOpen(true);
            return;
          }

          if (isFirstRunPending) {
            completeFirstRun({ openBookmarks: true });
            return;
          }

          setOnboardingOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>欢迎使用 Moyu Reader</DialogTitle>
            <DialogDescription>
              建议先维护你的常用网址，再用快捷键快速显示/隐藏窗口，让切换效率更稳定。
            </DialogDescription>
          </DialogHeader>

          <Card className="space-y-2 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>显示/隐藏窗口</span>
              <span className="font-medium">Cmd/Ctrl + M</span>
            </div>
            <div className="flex items-center justify-between">
              <span>一键透明</span>
              <span className="font-medium">Cmd/Ctrl + T</span>
            </div>
            <div className="flex items-center justify-between">
              <span>打开网址管理</span>
              <span className="font-medium">Cmd/Ctrl + B</span>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                completeFirstRun({ openBookmarks: true });
              }}
            >
              打开网址管理
            </Button>
            <Button
              onClick={() => {
                completeFirstRun({ openBookmarks: true });
              }}
            >
              开始使用
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
