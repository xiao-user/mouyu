# Moyu Reader

一个基于 Electron + React 的桌面摸鱼阅读器，支持网页阅读、窗口伪装、透明模式、书签管理和手动更新检查。

## 功能特性

- 网页阅读（`webview`）
- 无边框窗口、置顶、最小化、老板键
- 一键透明、深浅色模式、自动隐身、导航栏自动隐藏
- 书签管理（新增、编辑、删除、检索）
- 小红书页面增强开关
- 伪装图标切换（`AppLogo/`）
- 手动更新检查（检查后打开下载页）
- 本地激活码状态管理（格式校验 + 本地存储）

## 技术栈

- Electron 39
- React 19 + Vite 8
- Tailwind CSS 4 + Radix UI
- Vitest（回归测试）

## 运行方式

### 1) 安装依赖

```bash
npm install
```

### 2) 本地开发（推荐）

```bash
npm run start
```

该命令会：

1. 启动 Vite 开发服务器（默认 `127.0.0.1:5173`）
2. 等待渲染端就绪
3. 启动 Electron 主进程并注入 `ELECTRON_RENDERER_URL`

### 3) 直接启动 Electron

```bash
npm run start:raw
```

### 4) 构建渲染端

```bash
npm run build
```

## 常用脚本

- `npm run start`：开发模式启动（Vite + Electron）
- `npm run dev`：仅启动 Vite
- `npm run build`：构建前端到 `dist/`
- `npm run pack`：打包目录产物（不发布）
- `npm run dist`：构建并打包安装包（不发布）
- `npm run dist:mac`：仅 macOS 打包
- `npm run dist:win`：仅 Windows 打包
- `npm run check`：Node 语法检查
- `npm run test:regression`：运行 Vitest 回归测试
- `npm run doctor`：Electron 环境诊断

## 更新机制（当前）

当前为**手动更新模式**：

- 在设置页点击“检查更新”
- 应用只做版本检查，不自动下载、不自动安装
- 检查到新版本后，提供“打开下载页”按钮

可选更新源配置：

- `MOYU_UPDATE_MANIFEST_URL`：自定义更新清单 JSON 地址（需包含 `version` 字段）
- `MOYU_UPDATE_GITHUB_REPO`：GitHub 仓库（格式：`owner/repo`，读取 latest release）
- `MOYU_UPDATE_HTTP_TIMEOUT_MS`：更新请求超时（毫秒）

默认行为（安装包）：

- 若未配置环境变量，应用会回退到 `package.json > moyuUpdate` 中的默认更新源
- 当前默认 `manifestUrl` 已指向项目公开 Gist，开箱即可检查更新

私有仓库注意事项：

- `MOYU_UPDATE_GITHUB_REPO` 通过匿名 GitHub API 获取 `latest release`，私有仓库会返回 404
- 公开仓库也可能遇到匿名 API 限流（403）
- 推荐在生产环境优先配置 `MOYU_UPDATE_MANIFEST_URL`
- 示例清单可参考：`docs/update-manifest.example.json`

私有仓库 + 公开 Manifest（推荐做法）：

- 仓库已提供工作流：`.github/workflows/publish-manifest.yml`
- 触发时机：Release `published` 或手动 `workflow_dispatch`
- 作用：将 `update-manifest.json` 发布到公开 Gist，客户端只访问这个 Gist raw URL
- 你需要在 GitHub 仓库中配置：
- Secret `MOYU_MANIFEST_GIST_ID`：公开 Gist 的 ID
- Secret `MOYU_MANIFEST_GIST_TOKEN`：具有 `gist` 权限的 PAT
- Variable `MOYU_MANIFEST_FILE_NAME`（可选，默认 `update-manifest.json`）
- Variable `MOYU_MANIFEST_URL`（可选，默认使用 release 页面链接）
- 然后把应用运行环境变量 `MOYU_UPDATE_MANIFEST_URL` 指向该 Gist 的 raw URL

## 安全设计

- 主窗口：`nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`
- `preload.js` 通过 `contextBridge` 暴露白名单 API
- `webview` 注入防护：禁止自定义 preload、限制协议与可访问 host
- 权限请求白名单（仅允许受控权限）
- 外链仅允许 `http/https`

可选安全配置：

- `MOYU_WEBVIEW_HOST_ALLOWLIST`：限制 `webview` 可访问域名，逗号分隔

## 目录结构

```text
.
├─ main.js                  # Electron 主进程
├─ preload.js               # 安全桥接层
├─ ipc-channels.js          # IPC 通道常量
├─ src/
│  ├─ App.jsx               # React 主界面
│  ├─ main.jsx              # React 入口
│  ├─ components/           # UI 组件
│  ├─ assets/icons/         # 图标资源
│  └─ lib/                  # 前端工具函数
├─ lib/update-utils.js      # 版本比较工具
├─ scripts/
│  ├─ start-electron.js     # 开发模式启动器
│  └─ doctor-electron.js    # 环境诊断
├─ tests/                   # 回归测试
├─ docs/release-and-updates.md
├─ index.html               # Vite 入口模板
└─ package.json
```

## 兼容与说明

- 支持 macOS / Windows（打包目标见 `package.json > build`）
- 激活码流程当前为本地校验与本地存储，不含服务端验签
