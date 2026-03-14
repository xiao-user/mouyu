const container = document.getElementById('app-container');
const opacitySlider = document.getElementById('opacity-slider');
const opacityBtn = document.getElementById('opacity-btn');
const opacityPopover = document.getElementById('opacity-popover');
const opacityValue = document.getElementById('opacity-value');
const transparentBtn = document.getElementById('transparent-btn');
const webview = document.getElementById('browser-view');
const closeBtn = document.getElementById('close-btn');
const minBtn = document.getElementById('min-btn');
const runtimeAlert = document.getElementById('runtime-alert');
const runtimeAlertText = document.getElementById('runtime-alert-text');
const runtimeAlertClose = document.getElementById('runtime-alert-close');
const noop = () => {};
const electronBridge = window.electronAPI ?? {
  windowClose: noop,
  windowMinimize: noop,
  setAlwaysOnTop: noop,
  changeIcon: noop,
  listCamouflageIcons: async () => [],
  checkForUpdates: async () => ({ ok: false, message: '更新功能不可用。' }),
  activateLicense: async () => ({ ok: false, message: '激活功能不可用。' }),
  getLicenseStatus: async () => ({ activated: false, maskedKey: '', activatedAt: '' }),
  onToggleTransparency: noop,
  onToggleBookmarks: noop,
  onGoBack: noop,
  onGoForward: noop,
};

if (!window.electronAPI) {
  console.error('[renderer] window.electronAPI is unavailable.');
}

function showRuntimeAlert(message, timeoutMs = 7000) {
  if (!runtimeAlert || !runtimeAlertText) return;
  runtimeAlertText.textContent = message;
  runtimeAlert.style.display = 'flex';
  if (timeoutMs > 0) {
    window.clearTimeout(showRuntimeAlert.timerId);
    showRuntimeAlert.timerId = window.setTimeout(() => {
      runtimeAlert.style.display = 'none';
    }, timeoutMs);
  }
}

runtimeAlertClose?.addEventListener('click', () => {
  runtimeAlert.style.display = 'none';
});

// 窗口控制
closeBtn.addEventListener('click', () => {
  electronBridge.windowClose();
});
minBtn.addEventListener('click', () => electronBridge.windowMinimize());

const autoHideBtn = document.getElementById('auto-hide-btn');
const toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');
const toolbar = document.getElementById('toolbar');
const pinBtn = document.getElementById('pin-btn');

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
  xhsHideMainContainer: 'moyu-xhs-hide-main-container',
  appIcon: 'moyu-app-icon',
  scrollY: 'moyu-scroll-y',
  firstRunCompleted: 'moyu-first-run-completed',
};

function logRendererError(scope, error) {
  console.error(`[renderer:${scope}]`, error);
}

let isWebviewReady = false;

function executeWebviewScript(code, scope) {
  if (!isWebviewReady) return Promise.resolve();
  return webview.executeJavaScript(code).catch((error) => {
    logRendererError(scope, error);
  });
}

webview.addEventListener('did-start-loading', () => {
  isWebviewReady = false;
});

webview.addEventListener('dom-ready', () => {
  isWebviewReady = true;
});

function runStartupHealthCheck() {
  const issues = [];

  if (!window.electronAPI) {
    issues.push('桌面桥接不可用，窗口控制和快捷键同步可能失效。');
  }
  if (!container || !webview || !toolbar) {
    issues.push('关键界面元素缺失，请重启应用。');
  }

  if (issues.length > 0) {
    showRuntimeAlert(issues.join(' '), 0);
    return false;
  }
  return true;
}

window.addEventListener('error', (event) => {
  showRuntimeAlert(`运行错误：${event.message || '未知错误'}`);
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason || '未知 Promise 错误');
  showRuntimeAlert(`异步错误：${message}`);
});

// 默认配置
let currentOpacity = 1.0; // 当前设定的主透明度 (由滑块控制，默认 100%)
let isAutoHideEnabled = false; // 默认关闭自动隐身
let isToolbarAutoHideEnabled = false; // 默认关闭导航栏自动隐藏
let isPinned = false; // 默认不置顶
let hasRestoredSettings = false;
runStartupHealthCheck();

// 1. 网页浏览功能 (已移至网址管理)

// 2. 智能隐形逻辑 (Mouse Hover Logic)
const clickOutsideOverlay = document.getElementById('click-outside-overlay');

// 透明度 Popover 开关
opacityBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // 防止冒泡
  const isVisible = opacityPopover.style.display === 'block';

  if (isVisible) {
    closeOpacityPopover();
  } else {
    openOpacityPopover();
  }
});

clickOutsideOverlay?.addEventListener('click', () => {
  closeOpacityPopover();
});

function openOpacityPopover() {
  opacityPopover.style.display = 'block';
  clickOutsideOverlay.style.display = 'block';
  // 禁用 webview 交互，确保点击能被 overlay 捕获
  webview.style.pointerEvents = 'none';
}

function closeOpacityPopover() {
  opacityPopover.style.display = 'none';
  clickOutsideOverlay.style.display = 'none';
  // 恢复 webview 交互
  webview.style.pointerEvents = 'auto';

  // 检查是否需要隐藏导航栏
  if (isToolbarAutoHideEnabled && !toolbar.matches(':hover')) {
    setToolbarVisibility(false);
  }
}

function setToolbarVisibility(isVisible) {
  toolbar.classList.toggle('toolbar-hidden', !isVisible);
}

setToolbarVisibility(true);

const TOOLBAR_REVEAL_ZONE = 56;

// 鼠标移出气泡时关闭（更自然的交互方式）
opacityPopover.addEventListener('mouseleave', () => {
  // 添加短暂延迟，避免意外关闭
  setTimeout(() => {
    if (!opacityPopover.matches(':hover')) {
      closeOpacityPopover();
    }
  }, 300);
});

// 滑块控制“显示时的透明度”
opacitySlider.addEventListener('input', (e) => {
  currentOpacity = e.target.value / 100;
  opacityValue.textContent = e.target.value + '%'; // 更新显示数值

  // 实时应用:
  // 1. 如果自动隐身关闭 -> 始终应用 currentOpacity
  // 2. 如果自动隐身开启 -> 只有鼠标在窗口内时，才应用 currentOpacity (鼠标在外面是 0)
  if (!isAutoHideEnabled || isMouseIn) {
    container.style.opacity = currentOpacity;
  }
  // 保存设置
  localStorage.setItem(STORAGE_KEYS.opacity, currentOpacity);
});

let isMouseIn = false;

// 鼠标移入：恢复到滑块设定的透明度
document.body.addEventListener('mouseenter', () => {
  isMouseIn = true;
  container.style.opacity = currentOpacity;
  // 恢复鼠标交互
  webview.style.pointerEvents = 'auto';
});

// 鼠标移出：根据开关决定是否变透明
document.body.addEventListener('mouseleave', () => {
  isMouseIn = false;

  if (isAutoHideEnabled) {
    // 开启自动隐身：移出变 0.01 (几乎看不见，但能保持事件响应)
    // 注意：如果完全为 0，部分系统可能认为窗口不可交互
    container.style.opacity = 0.01;
    // 禁用 Webview 鼠标交互，让事件穿透到 container 以便检测 mouseenter
    webview.style.pointerEvents = 'none';
  } else {
    // 关闭自动隐身：保持滑块透明度
    container.style.opacity = currentOpacity;
    webview.style.pointerEvents = 'auto';
  }

  if (isToolbarAutoHideEnabled && opacityPopover.style.display !== 'block') {
    setToolbarVisibility(false);
  }
});

// 导航栏专属交互逻辑
toolbar.addEventListener('mouseenter', () => {
  // 如果开启了导航栏自动隐藏，移入时显示
  if (isToolbarAutoHideEnabled) {
    setToolbarVisibility(true);
  }
});

toolbar.addEventListener('mouseleave', () => {
  // 如果开启了导航栏自动隐藏，移出时隐藏
  if (isToolbarAutoHideEnabled) {
    // 如果透明度调节 Popover 是打开的，则不隐藏导航栏
    if (opacityPopover.style.display === 'block') {
      return;
    }
    setToolbarVisibility(false);
  }
});

document.addEventListener('mousemove', (event) => {
  if (!isToolbarAutoHideEnabled) return;
  if (opacityPopover.style.display === 'block') return;

  if (event.clientY <= TOOLBAR_REVEAL_ZONE) {
    setToolbarVisibility(true);
    return;
  }

  if (!toolbar.matches(':hover')) {
    setToolbarVisibility(false);
  }
});

// 自动隐身开关
autoHideBtn.addEventListener('click', () => {
  isAutoHideEnabled = !isAutoHideEnabled;
  if (isAutoHideEnabled) {
    // 开启：如果鼠标不在窗口内，立即变 0.01
    autoHideBtn.classList.add('active'); // 高亮
    if (!isMouseIn) {
      container.style.opacity = 0.01;
      webview.style.pointerEvents = 'none';
    }
  } else {
    // 关闭：立即恢复到滑块透明度
    autoHideBtn.classList.remove('active'); // 灰色
    container.style.opacity = currentOpacity;
    webview.style.pointerEvents = 'auto';
  }
  // 保存设置
  localStorage.setItem(STORAGE_KEYS.autoHideWindow, isAutoHideEnabled);
});

// 导航栏自动隐藏开关
toggleToolbarBtn.addEventListener('click', () => {
  isToolbarAutoHideEnabled = !isToolbarAutoHideEnabled;
  if (isToolbarAutoHideEnabled) {
    toggleToolbarBtn.classList.add('active'); // 高亮
    // 开启时，如果鼠标不在导航栏内，立即隐藏
    if (!toolbar.matches(':hover')) {
      setToolbarVisibility(false);
    }
  } else {
    toggleToolbarBtn.classList.remove('active'); // 灰色
    setToolbarVisibility(true);
  }
  // 保存设置
  localStorage.setItem(STORAGE_KEYS.toolbarAutoHide, isToolbarAutoHideEnabled);
});

// 置顶开关
pinBtn.addEventListener('click', () => {
  isPinned = !isPinned;
  if (isPinned) {
    pinBtn.classList.add('active'); // 高亮
  } else {
    pinBtn.classList.remove('active'); // 灰色
  }
  electronBridge.setAlwaysOnTop(isPinned);
  // 保存设置
  localStorage.setItem(STORAGE_KEYS.pinned, isPinned);
});

// 记住设置开关
const rememberSettingsToggle = document.getElementById('remember-settings-toggle');
rememberSettingsToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.rememberSettings, e.target.checked);
});

// 恢复设置函数
function restoreSettings() {
  if (hasRestoredSettings) return;
  hasRestoredSettings = true;

  const shouldRemember = localStorage.getItem(STORAGE_KEYS.rememberSettings) === 'true';
  // 更新开关 UI
  rememberSettingsToggle.checked = shouldRemember;

  if (!shouldRemember) return;

  // 1. 窗口透明度
  const savedOpacity = localStorage.getItem(STORAGE_KEYS.opacity);
  if (savedOpacity) {
    currentOpacity = parseFloat(savedOpacity);
    opacitySlider.value = currentOpacity * 100;
    opacityValue.textContent = opacitySlider.value + '%';
    container.style.opacity = currentOpacity;
  }

  // 2. 自动隐身 (Auto-Hide Window)
  const savedAutoHideWindow = localStorage.getItem(STORAGE_KEYS.autoHideWindow) === 'true';
  if (savedAutoHideWindow) {
    autoHideBtn.click(); // 模拟点击以复用逻辑
  }

  // 3. 导航栏自动隐藏
  const savedToolbarAutoHide = localStorage.getItem(STORAGE_KEYS.toolbarAutoHide) === 'true';
  if (savedToolbarAutoHide) {
    toggleToolbarBtn.click();
  }

  // 4. 窗口置顶
  const savedPinned = localStorage.getItem(STORAGE_KEYS.pinned) === 'true';
  if (savedPinned) {
    pinBtn.click();
  }

  // 5. 一键透明
  const savedTransparency = localStorage.getItem(STORAGE_KEYS.transparency) === 'true';
  if (savedTransparency) {
    transparentBtn.click();
  }

  // 6. 深色模式 (Dark Mode) - 逻辑在 dom-ready 中，但需要配合 shouldRemember
  // 我们将在 dom-ready 中处理深色模式
}

// 4. 一键透明 (网页 + 应用壳)
let isTransparentMode = false;

// 应用透明样式 (仅 Webview)
function applyTransparencyCSS() {
  const cssCode = `
    (function() {
      if (!document.getElementById('moyu-transparency-style')) {
        const style = document.createElement('style');
        style.id = 'moyu-transparency-style';
        style.innerHTML = \`
          * {
            background-color: transparent !important;
            background-image: none !important;
          }
          /* 针对某些特定元素的补丁 */
          html, body, #app, #app > div { background: transparent !important; }
          .feed-container, .main-container, .channel-container { background: transparent !important; }
        \`;
        document.head.appendChild(style);
      }
    })();
  `;
  executeWebviewScript(cssCode, 'applyTransparencyCSS');
}

// 移除透明样式 (仅 Webview)
function removeTransparencyCSS() {
  const code = `
    (function() {
      const style = document.getElementById('moyu-transparency-style');
      if (style) style.remove();
    })();
  `;
  executeWebviewScript(code, 'removeTransparencyCSS');
}

transparentBtn.addEventListener('click', () => {
  if (!isTransparentMode) {
    // A. 注入强力 CSS
    applyTransparencyCSS();

    // B. 应用壳去底色
    container.style.background = 'transparent';
    container.style.border = 'none';
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';

    // C. 导航栏样式
    isTransparentMode = true;
    transparentBtn.classList.add('active'); // 高亮
    updateToolbarTheme();

    // 如果开启了深色模式，需要刷新一下 CSS 以应用透明背景
    if (localStorage.getItem(STORAGE_KEYS.darkMode) === 'true') {
      toggleDarkMode(true);
    }
  } else {
    // 恢复默认
    // 1. 移除注入的 CSS
    removeTransparencyCSS();

    // 2. 恢复应用壳背景
    container.style.background = 'transparent';

    // 3. 恢复导航栏背景
    isTransparentMode = false;
    transparentBtn.classList.remove('active'); // 移除高亮
    updateToolbarTheme();

    // 5. 如果开启了深色模式，需要刷新一下 CSS 以恢复黑色背景
    if (localStorage.getItem(STORAGE_KEYS.darkMode) === 'true') {
      toggleDarkMode(true);
    }
  }
  // 保存设置
  localStorage.setItem(STORAGE_KEYS.transparency, isTransparentMode);
});

// 监听导航事件，重新应用透明样式
function checkTransparency() {
  if (isTransparentMode) {
    applyTransparencyCSS();
  }
}
webview.addEventListener('did-navigate', checkTransparency);
webview.addEventListener('did-navigate-in-page', checkTransparency);
webview.addEventListener('dom-ready', checkTransparency);


// 4. 网页导航控制 (Navigation)
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');

backBtn.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

forwardBtn.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

const refreshBtn = document.getElementById('refresh-btn');
refreshBtn.addEventListener('click', () => {
  webview.reload();
});

const bookmarksBtn = document.getElementById('bookmarks-btn');
const urlManagerModal = document.getElementById('url-manager-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const urlList = document.getElementById('url-list');
const addUrlBtn = document.getElementById('add-url-btn');
const newUrlName = document.getElementById('new-url-name');
const newUrlLink = document.getElementById('new-url-link');
const bookmarkSearchInput = document.getElementById('bookmark-search-input');
const onboardingModal = document.getElementById('onboarding-modal');
const onboardingCompleteBtn = document.getElementById('onboarding-complete-btn');
const onboardingOpenBookmarksBtn = document.getElementById('onboarding-open-bookmarks-btn');
const checkUpdatesBtn = document.getElementById('check-updates-btn');
const updateStatusText = document.getElementById('update-status-text');
const licenseKeyInput = document.getElementById('license-key-input');
const activateLicenseBtn = document.getElementById('activate-license-btn');
const licenseStatusText = document.getElementById('license-status-text');
let editingIndex = -1; // 当前正在编辑的索引，-1 表示新增模式

// 默认书签
const defaultBookmarks = [
  { name: '微信读书', url: 'https://weread.qq.com/' },
  { name: 'B站', url: 'https://www.bilibili.com/' },
  { name: '知乎', url: 'https://www.zhihu.com/' },
  { name: 'V2EX', url: 'https://www.v2ex.com/' }
];

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

function persistLastUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;
  localStorage.setItem(STORAGE_KEYS.lastUrl, normalized);
}

function getBookmarkSearchKeyword() {
  if (!bookmarkSearchInput) return '';
  return bookmarkSearchInput.value.trim().toLowerCase();
}

function openUrlManagerModal() {
  resetEditState(); // 每次打开重置状态
  if (bookmarkSearchInput) {
    bookmarkSearchInput.value = '';
  }
  renderBookmarks();
  urlManagerModal.style.display = 'flex';

  // 重新触发动画：先移除再添加 (如果需要每次都播放)
  urlManagerModal.classList.remove('modal-animate-in');
  void urlManagerModal.offsetWidth; // 触发重绘
  urlManagerModal.classList.add('modal-animate-in');
}

function isFirstRunPending() {
  return localStorage.getItem(STORAGE_KEYS.firstRunCompleted) !== 'true';
}

function completeOnboarding() {
  localStorage.setItem(STORAGE_KEYS.firstRunCompleted, 'true');
  if (onboardingModal) onboardingModal.style.display = 'none';
}

function openOnboarding() {
  if (!onboardingModal) return;
  onboardingModal.style.display = 'flex';
}

// 初始化：加载上次访问的网址
const lastUrl = normalizeUrl(localStorage.getItem(STORAGE_KEYS.lastUrl));
if (lastUrl) {
  webview.src = lastUrl;
  persistLastUrl(lastUrl);
} else {
  webview.src = 'https://weread.qq.com/'; // 默认加载微信读书
  if (isFirstRunPending()) {
    openUrlManagerModal(); // 首次使用时自动打开网址管理
    openOnboarding();
  }
}

// 监听网页跳转，保存当前网址
function handleNavigationState(url) {
  persistLastUrl(url);
}

webview.addEventListener('did-navigate', (e) => {
  handleNavigationState(e.url);
});
webview.addEventListener('did-navigate-in-page', (e) => {
  handleNavigationState(e.url);
});
webview.addEventListener('did-stop-loading', () => {
  handleNavigationState(webview.getURL());
});

// 加载书签
function loadBookmarks() {
  const stored = localStorage.getItem(STORAGE_KEYS.bookmarks);
  if (!stored) return defaultBookmarks;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : defaultBookmarks;
  } catch (error) {
    logRendererError('loadBookmarks', error);
    localStorage.removeItem(STORAGE_KEYS.bookmarks);
    return defaultBookmarks;
  }
}

// 保存书签
function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
}

function escapeHtml(text) {
  const value = String(text ?? '');
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 渲染列表
function renderBookmarks() {
  const bookmarks = loadBookmarks()
    .map((bookmark, sourceIndex) => ({ ...bookmark, sourceIndex }));
  const keyword = getBookmarkSearchKeyword();
  const filteredBookmarks = keyword
    ? bookmarks.filter((bookmark) => {
      const name = String(bookmark.name || '').toLowerCase();
      const url = String(bookmark.url || '').toLowerCase();
      return name.includes(keyword) || url.includes(keyword);
    })
    : bookmarks;

  urlList.innerHTML = '';

  if (filteredBookmarks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'bookmark-empty';
    emptyState.textContent = keyword
      ? `没有匹配 “${keyword}” 的书签`
      : '还没有书签，先添加一个常用网址吧。';
    urlList.appendChild(emptyState);
    return;
  }

  filteredBookmarks.forEach((bm) => {
    const item = document.createElement('div');
    item.className = 'bookmark-row';

    // 点击跳转
    item.onclick = (e) => {
      // 如果点击的是按钮，不跳转
      if (e.target.closest('button')) return;

      let url = bm.url;
      if (!url.startsWith('http')) url = 'https://' + url;
      persistLastUrl(url);
      webview.loadURL(url);
      urlManagerModal.style.display = 'none'; // 关闭弹窗
    };

    item.innerHTML = `
      <div class="bookmark-meta">
        <span class="bookmark-name">${escapeHtml(bm.name)}</span>
        <span class="bookmark-url">${escapeHtml(bm.url)}</span>
      </div>
      <div class="bookmark-actions">
        <button class="edit-btn bookmark-action edit" data-index="${bm.sourceIndex}">编辑</button>
        <button class="delete-btn bookmark-action delete" data-index="${bm.sourceIndex}">删除</button>
      </div>
    `;

    urlList.appendChild(item);
  });

  // 绑定编辑事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(e.target.dataset.index, 10);
      const bookmarks = loadBookmarks();
      const target = bookmarks[idx];
      if (!target) return;

      // 填充输入框
      newUrlName.value = target.name;
      newUrlLink.value = target.url;

      // 切换状态
      editingIndex = idx;
      addUrlBtn.innerText = '保存';
      addUrlBtn.style.background = '#52c41a'; // 绿色
    });
  });

  // 绑定删除事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止冒泡
      if (confirm('确定要删除吗？')) {
        const idx = parseInt(e.target.dataset.index, 10);
        const current = loadBookmarks();
        current.splice(idx, 1);
        saveBookmarks(current);

        // 如果删除的是正在编辑的，重置状态
        if (idx === editingIndex) {
          resetEditState();
        }
        renderBookmarks();
      }
    });
  });
}

function resetEditState() {
  editingIndex = -1;
  newUrlName.value = '';
  newUrlLink.value = '';
  addUrlBtn.innerText = '添加';
  addUrlBtn.style.background = '#1890ff'; // 蓝色
}

// 打开/关闭弹窗
bookmarksBtn.addEventListener('click', () => {
  openUrlManagerModal();
});

closeModalBtn.addEventListener('click', () => {
  if (bookmarkSearchInput) {
    bookmarkSearchInput.value = '';
  }
  urlManagerModal.style.display = 'none';
});

bookmarkSearchInput?.addEventListener('input', () => {
  renderBookmarks();
});

onboardingCompleteBtn?.addEventListener('click', () => {
  completeOnboarding();
});

onboardingOpenBookmarksBtn?.addEventListener('click', () => {
  openUrlManagerModal();
});

// 添加/保存书签
addUrlBtn.addEventListener('click', () => {
  const name = newUrlName.value.trim();
  const url = newUrlLink.value.trim();

  if (!name || !url) {
    alert('请输入名称和网址');
    return;
  }

  const current = loadBookmarks();

  if (editingIndex >= 0) {
    // 编辑模式
    current[editingIndex] = { name, url };
    saveBookmarks(current);
    resetEditState(); // 保存后重置
  } else {
    // 新增模式
    current.push({ name, url });
    saveBookmarks(current);
    newUrlName.value = '';
    newUrlLink.value = '';
  }

  renderBookmarks();
});

// 6. 设置功能 (Settings)
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const settingsTabButtons = document.querySelectorAll('[data-settings-tab-btn]');
const settingsTabPanels = document.querySelectorAll('[data-settings-tab]');

function activateSettingsTab(tabKey) {
  settingsTabButtons.forEach((button) => {
    if (button.dataset.settingsTabBtn === tabKey) {
      button.classList.add('is-active');
    } else {
      button.classList.remove('is-active');
    }
  });

  settingsTabPanels.forEach((panel) => {
    if (panel.dataset.settingsTab === tabKey) {
      panel.classList.add('is-active');
    } else {
      panel.classList.remove('is-active');
    }
  });
}

settingsTabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activateSettingsTab(button.dataset.settingsTabBtn);
  });
});

// 打开设置
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'flex';
  activateSettingsTab('appearance');

  // 触发动画
  settingsModal.classList.remove('modal-animate-in');
  void settingsModal.offsetWidth;
  settingsModal.classList.add('modal-animate-in');

  // 加载设置状态
  loadSettingsUI();
});

async function refreshLicenseStatus() {
  if (!licenseStatusText) return;
  try {
    const status = await electronBridge.getLicenseStatus();
    if (status.activated) {
      licenseStatusText.textContent = `已激活：${status.maskedKey}${status.activatedAt ? `（${new Date(status.activatedAt).toLocaleDateString()}）` : ''}`;
      licenseStatusText.style.color = '#389e0d';
    } else {
      licenseStatusText.textContent = '未激活';
      licenseStatusText.style.color = '#666';
    }
  } catch (error) {
    licenseStatusText.textContent = '激活状态读取失败';
    licenseStatusText.style.color = '#cf1322';
    logRendererError('refreshLicenseStatus', error);
  }
}

checkUpdatesBtn?.addEventListener('click', async () => {
  if (!updateStatusText) return;
  updateStatusText.textContent = '检查中...';
  try {
    const result = await electronBridge.checkForUpdates();
    const checkedAtText = result?.checkedAt ? `（${new Date(result.checkedAt).toLocaleTimeString()}）` : '';
    updateStatusText.textContent = `${result?.message || '检查完成'}${checkedAtText}`;
    updateStatusText.style.color = result?.ok ? '#666' : '#cf1322';
  } catch (error) {
    updateStatusText.textContent = '检查失败';
    updateStatusText.style.color = '#cf1322';
    logRendererError('checkForUpdates', error);
  }
});

activateLicenseBtn?.addEventListener('click', async () => {
  const key = licenseKeyInput?.value?.trim() || '';
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
    if (licenseKeyInput) {
      licenseKeyInput.value = '';
    }
    await refreshLicenseStatus();
  } catch (error) {
    showRuntimeAlert('激活请求失败');
    logRendererError('activateLicense', error);
  }
});

// 10. 隐藏滚动条功能 (Hide Scrollbar)
const hideScrollbarToggle = document.getElementById('hide-scrollbar-toggle');

function applyScrollbarStyle() {
  const hideScrollbar = localStorage.getItem(STORAGE_KEYS.hideScrollbar) === 'true';

  if (hideScrollbar) {
    const cssCode = `
      (function() {
        if (!document.getElementById('moyu-hide-scrollbar-style')) {
          const style = document.createElement('style');
          style.id = 'moyu-hide-scrollbar-style';
          style.innerHTML = \`
            /* 隐藏滚动条 - 兼容各浏览器 */
            ::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            * {
              scrollbar-width: none !important; /* Firefox */
              -ms-overflow-style: none !important; /* IE/Edge */
            }
          \`;
          document.head.appendChild(style);
        }
      })();
    `;
    executeWebviewScript(cssCode, 'applyScrollbarStyle:add');
  } else {
    const removeCode = `
      (function() {
        const style = document.getElementById('moyu-hide-scrollbar-style');
        if (style) style.remove();
      })();
    `;
    executeWebviewScript(removeCode, 'applyScrollbarStyle:remove');
  }
}

hideScrollbarToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.hideScrollbar, e.target.checked);
  applyScrollbarStyle();
});

// 在页面加载和导航时应用滚动条样式
webview.addEventListener('did-navigate', applyScrollbarStyle);
webview.addEventListener('did-navigate-in-page', applyScrollbarStyle);
webview.addEventListener('dom-ready', applyScrollbarStyle);

// 11. 自定义文字颜色功能 (Custom Text Color)
const textColorPicker = document.getElementById('text-color-picker');
const resetTextColorBtn = document.getElementById('reset-text-color-btn');

function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function applyTextColor() {
  const customColor = localStorage.getItem(STORAGE_KEYS.textColor);
  const safeColor = isHexColor(customColor) ? customColor : null;

  if (safeColor && safeColor !== '#000000') {
    const cssCode = `
      (function() {
        // 移除旧样式
        const oldStyle = document.getElementById('moyu-text-color-style');
        if (oldStyle) oldStyle.remove();
        
        // 添加新样式
        const style = document.createElement('style');
        style.id = 'moyu-text-color-style';
        style.innerHTML = \`
          body, body * {
            color: ${safeColor} !important;
          }
          /* 保持链接可见性 */
          a {
            color: ${safeColor} !important;
            opacity: 0.8;
          }
          a:hover {
            opacity: 1;
          }
        \`;
        document.head.appendChild(style);
      })();
    `;
    executeWebviewScript(cssCode, 'applyTextColor:add');
  } else {
    // 移除自定义颜色
    const removeCode = `
      (function() {
        const style = document.getElementById('moyu-text-color-style');
        if (style) style.remove();
      })();
    `;
    executeWebviewScript(removeCode, 'applyTextColor:remove');
  }
}

// 颜色选择器变化事件
textColorPicker.addEventListener('input', (e) => {
  const color = e.target.value;
  const safeColor = isHexColor(color) ? color : '#000000';
  localStorage.setItem(STORAGE_KEYS.textColor, safeColor);
  applyTextColor();
});

// 重置按钮
resetTextColorBtn.addEventListener('click', () => {
  textColorPicker.value = '#000000';
  localStorage.setItem(STORAGE_KEYS.textColor, '#000000');
  applyTextColor();
});

// 在页面加载和导航时应用文字颜色
webview.addEventListener('did-navigate', applyTextColor);
webview.addEventListener('did-navigate-in-page', applyTextColor);
webview.addEventListener('dom-ready', applyTextColor);

// 6. 设置面板 UI 交互
closeSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// 加载设置 UI 状态
function loadSettingsUI() {


  // 2. 加载伪装图标
  loadCamouflageIcons();

  // 3. 小红书设置
  const isXhsHideLogo = localStorage.getItem(STORAGE_KEYS.xhsHideLogo) === 'true';
  document.getElementById('xhs-hide-logo-toggle').checked = isXhsHideLogo;

  const isXhsHideHeader = localStorage.getItem(STORAGE_KEYS.xhsHideHeader) === 'true';
  document.getElementById('xhs-hide-header-toggle').checked = isXhsHideHeader;

  const isXhsHideBottomMenu = localStorage.getItem(STORAGE_KEYS.xhsHideBottomMenu) === 'true';
  document.getElementById('xhs-hide-bottom-menu-toggle').checked = isXhsHideBottomMenu;

  const isXhsHideMainContainer = localStorage.getItem(STORAGE_KEYS.xhsHideMainContainer) === 'true';
  document.getElementById('xhs-hide-main-container-toggle').checked = isXhsHideMainContainer;

  // 4. 隐藏滚动条设置
  const hideScrollbar = localStorage.getItem(STORAGE_KEYS.hideScrollbar) === 'true';
  hideScrollbarToggle.checked = hideScrollbar;

  // 5. 自定义文字颜色设置
  const savedTextColor = localStorage.getItem(STORAGE_KEYS.textColor);
  const textColor = isHexColor(savedTextColor) ? savedTextColor : '#000000';
  textColorPicker.value = textColor;

  refreshLicenseStatus();
}

// 伪装图标逻辑
const iconGrid = document.getElementById('icon-grid');

function getFileNameFromPath(filePath) {
  const parts = String(filePath).split(/[\\/]/);
  return parts[parts.length - 1] || String(filePath);
}

async function loadCamouflageIcons() {
  // 清空现有列表 (保留上传按钮占位，这里简化为重新生成)
  iconGrid.innerHTML = '';

  try {
    const iconPaths = await electronBridge.listCamouflageIcons();
    iconPaths.forEach((iconPath) => {
      const iconDiv = createIconItem(iconPath, getFileNameFromPath(iconPath));
      iconGrid.appendChild(iconDiv);
    });

    const currentIcon = localStorage.getItem(STORAGE_KEYS.appIcon);
    updateSelectedIconUI(currentIcon);
  } catch (error) {
    console.error('Failed to load camouflage icons:', error);
  }
}

function createIconItem(iconPath, title) {
  const div = document.createElement('div');
  div.className = 'icon-item';
  div.title = title;

  const img = document.createElement('img');
  img.src = iconPath;
  div.appendChild(img);

  div.onclick = () => {
    applyAppIcon(iconPath);
    updateSelectedIconUI(iconPath);
  };

  div.dataset.path = iconPath;
  return div;
}

function updateSelectedIconUI(selectedPath) {
  const items = iconGrid.querySelectorAll('.icon-item');
  items.forEach(item => {
    if (item.dataset.path === selectedPath) {
      item.style.borderColor = '#1890ff';
    } else {
      item.style.borderColor = 'transparent';
    }
  });
}

function applyAppIcon(iconPath) {
  localStorage.setItem(STORAGE_KEYS.appIcon, iconPath);
  electronBridge.changeIcon(iconPath);
}

// 初始化时应用保存的图标
const savedIcon = localStorage.getItem(STORAGE_KEYS.appIcon);
if (savedIcon) {
  electronBridge.listCamouflageIcons()
    .then((iconPaths) => {
      if (iconPaths.includes(savedIcon)) {
        electronBridge.changeIcon(savedIcon);
      } else {
        localStorage.removeItem(STORAGE_KEYS.appIcon);
      }
    })
    .catch((error) => {
      logRendererError('applySavedIcon', error);
    });
}



// 工具栏深色模式切换按钮
const themeToggleBtn = document.getElementById('theme-toggle-btn');
themeToggleBtn.addEventListener('click', () => {
  const currentIsDark = localStorage.getItem(STORAGE_KEYS.darkMode) === 'true';
  const newIsDark = !currentIsDark;

  localStorage.setItem(STORAGE_KEYS.darkMode, newIsDark);

  toggleDarkMode(newIsDark);
});

function toggleDarkMode(isDark) {
  // 1. 更新图标
  if (isDark) {
    // 切换为太阳图标
    themeToggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    themeToggleBtn.title = "切换到亮色模式";
  } else {
    // 切换为月亮图标
    themeToggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    themeToggleBtn.title = "切换到深色模式";
  }

  // 2. 注入 CSS
  // 如果开启了一键透明，则背景必须透明，不能是黑色
  const bgStyle = isTransparentMode ? 'transparent' : '#000';

  const code = `
    (function() {
      let style = document.getElementById('moyu-dark-mode-style');
      if (${isDark}) {
        if (!style) {
          style = document.createElement('style');
          style.id = 'moyu-dark-mode-style';
          document.head.appendChild(style);
        }
        style.innerHTML = \`
          html { filter: invert(1) hue-rotate(180deg) !important; }
          img, video, iframe, canvas, svg { filter: invert(1) hue-rotate(180deg) !important; }
          /* 针对某些特殊背景的处理 */
          html { background-color: ${bgStyle} !important; }
        \`;
      } else {
        if (style) {
          style.remove();
        }
      }
    })();
  `;
  executeWebviewScript(code, 'toggleDarkMode');

  // 3. 更新工具栏样式
  updateToolbarTheme();
}

function updateToolbarTheme() {
  const isDark = localStorage.getItem(STORAGE_KEYS.darkMode) === 'true';

  // 基础主题
  if (isDark) {
    toolbar.classList.add('toolbar-dark');
    toolbar.classList.remove('toolbar-light');
    // 更新 Toggle 按钮图标颜色 (svg fill/stroke currentcolor 自动跟随)
  } else {
    toolbar.classList.add('toolbar-light');
    toolbar.classList.remove('toolbar-dark');
  }

  // 透明模式覆盖
  if (isTransparentMode) {
    toolbar.classList.add('toolbar-transparent');
  } else {
    toolbar.classList.remove('toolbar-transparent');
  }
}

// 9. 小红书专属设置 (Xiaohongshu Specific)
const xhsHideLogoToggle = document.getElementById('xhs-hide-logo-toggle');
const xhsHideHeaderToggle = document.getElementById('xhs-hide-header-toggle');
const xhsHideBottomMenuToggle = document.getElementById('xhs-hide-bottom-menu-toggle');
const xhsHideMainContainerToggle = document.getElementById('xhs-hide-main-container-toggle');

// 检查是否需要应用小红书样式 (仅在导航时调用)
function checkXiaohongshuNavigation() {
  const url = webview.getURL();
  const isXhs = url.includes('xiaohongshu.com');

  if (isXhs) {
    // 应用样式
    applyXiaohongshuStyles();
  }
}

// 应用小红书样式
function applyXiaohongshuStyles() {
  const shouldHideLogo = localStorage.getItem(STORAGE_KEYS.xhsHideLogo) === 'true';
  const shouldHideHeader = localStorage.getItem(STORAGE_KEYS.xhsHideHeader) === 'true';
  const shouldHideBottomMenu = localStorage.getItem(STORAGE_KEYS.xhsHideBottomMenu) === 'true';
  const shouldHideMainContainer = localStorage.getItem(STORAGE_KEYS.xhsHideMainContainer) === 'true';

  // 检测是否为详情页 (简单判断：URL包含 explore 且长度较长，或者不等于 explore 首页)
  // 首页通常是 https://www.xiaohongshu.com/explore
  // 详情页通常是 https://www.xiaohongshu.com/explore/64...
  const url = webview.getURL();
  const isDetailPage = url.includes('/explore/') && url.split('/explore/')[1]?.length > 5;

  const code = `
    (function() {
      let style = document.getElementById('moyu-xhs-style');
      if (${shouldHideLogo} || ${shouldHideHeader} || ${shouldHideBottomMenu} || (${shouldHideMainContainer} && ${isDetailPage})) {
        if (!style) {
          style = document.createElement('style');
          style.id = 'moyu-xhs-style';
          document.head.appendChild(style);
        }
        
        let css = '';
        
        if (${shouldHideLogo}) {
          css += \`
            #link-guide { opacity: 0 !important; }
            header.mask-paper[data-v-5c1b2170] {
              -webkit-backdrop-filter: blur(0) !important;
              backdrop-filter: blur(0) !important;
            }
          \`;
        }
        
        if (${shouldHideHeader}) {
          css += \`
            header { display: none !important; }
            #app { padding-top: 0 !important; }
            .feeds-page, .user { padding-top: 0 !important; }
          \`;
        }

        if (${shouldHideBottomMenu}) {
          css += \`
            .bottom-menu { display: none !important; }
          \`;
        }

        if (${shouldHideMainContainer} && ${isDetailPage}) {
          css += \`
            .main-container { display: none !important; }
          \`;
        }
        
        style.innerHTML = css;
      } else {
        if (style) {
          style.remove();
        }
      }
    })();
  `;
  executeWebviewScript(code, 'applyXiaohongshuStyles');
}

// 监听 Toggle 变化
xhsHideLogoToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.xhsHideLogo, e.target.checked);
  applyXiaohongshuStyles();
});

xhsHideHeaderToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.xhsHideHeader, e.target.checked);
  applyXiaohongshuStyles();
});

xhsHideBottomMenuToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.xhsHideBottomMenu, e.target.checked);
  applyXiaohongshuStyles();
});

xhsHideMainContainerToggle.addEventListener('change', (e) => {
  localStorage.setItem(STORAGE_KEYS.xhsHideMainContainer, e.target.checked);
  applyXiaohongshuStyles();
});

// 监听 URL 变化
webview.addEventListener('did-navigate', checkXiaohongshuNavigation);
webview.addEventListener('did-navigate-in-page', checkXiaohongshuNavigation);

// 8. 阅读进度同步 (Reading Progress)
webview.addEventListener('dom-ready', () => {
  const scrollStorageKey = STORAGE_KEYS.scrollY;
  const script = `
    (function() {
      // 恢复
      const saved = localStorage.getItem('${scrollStorageKey}');
      if (saved) {
        window.scrollTo(0, parseInt(saved));
      }

      // 监听并保存
      let timeout;
      window.addEventListener('scroll', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          localStorage.setItem('${scrollStorageKey}', window.scrollY);
        }, 500);
      });
    })();
  `;
  executeWebviewScript(script, 'syncReadingProgress');

  // 恢复通用设置
  restoreSettings();

  // 重新应用深色模式 (如果开启且允许记忆)
  const shouldRemember = localStorage.getItem(STORAGE_KEYS.rememberSettings) === 'true';
  const isDarkMode = localStorage.getItem(STORAGE_KEYS.darkMode) === 'true';

  if (shouldRemember && isDarkMode) {
    toggleDarkMode(true);
  } else {
    // 如果不记忆设置，或者记忆了但不是深色模式，则强制确保为浅色模式状态
    if (!shouldRemember) {
      localStorage.setItem(STORAGE_KEYS.darkMode, 'false');
    }
    // 默认或浅色模式，也需要应用主题 (初始化工具栏)
    updateToolbarTheme();
  }

  // 检查小红书设置
  checkXiaohongshuNavigation();
});

// 7. 快捷键支持 (Shortcuts - via IPC from Main Process)
electronBridge.onToggleTransparency(() => {
  transparentBtn.click();
});

electronBridge.onToggleBookmarks(() => {
  bookmarksBtn.click();
});

electronBridge.onGoBack(() => {
  if (webview.canGoBack()) webview.goBack();
});

electronBridge.onGoForward(() => {
  if (webview.canGoForward()) webview.goForward();
});
