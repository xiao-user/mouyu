# Agent.md

## 1. 项目概览
- 项目名称：`moyu-reader`
- 类型：Electron 桌面应用（单窗口，React 渲染层）
- 目标：提供“摸鱼阅读器”能力，包括网页浏览、透明模式、自动隐身、窗口置顶、书签管理、图标伪装、更新检查与激活入口。

## 2. 技术栈与运行环境
- Node.js + Electron（`electron@^39.2.4`）
- 渲染层：React + Vite + Tailwind CSS
- 关键安全配置：
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - 通过 `preload.js` 暴露白名单 API
  - `index.html` 设置了 CSP

## 3. 目录与职责
- `main.js`：主进程入口，负责窗口创建、菜单、全局快捷键、IPC 处理、图标切换、激活状态读写。
- `preload.js`：渲染层桥接，统一暴露 `window.electronAPI`。
- `ipc-channels.js`：IPC 通道常量定义，主进程与渲染进程共享。
- `src/App.jsx`：渲染层主逻辑（UI 交互、书签、设置、小红书样式注入、主题、透明、状态持久化等）。
- `src/main.jsx`：React 入口。
- `index.html`：Vite HTML 模板。
- `AppLogo/`：可切换的伪装图标资源目录。

## 4. 开发命令
- 安装依赖：`npm install`
- 本地运行：`npm run start`
- 直接原始启动（不做环境保护）：`npm run start:raw`
- 启动环境诊断：`npm run doctor`
- 语法检查：`npm run check`

## 5. Agent 改动规范
- 先改常量，再改调用：新增 IPC 时必须同时更新：
  - `ipc-channels.js`
  - `preload.js`
  - `main.js` 或 `src/App.jsx` 对应监听/调用
- 保持安全边界：
  - 不在渲染层直接启用 Node 能力
  - 主进程对外部输入做校验（路径、激活码、URL 等）
  - 保持或增强现有 CSP，而不是放宽
- 保持现有交互约定：
  - 设置项统一落地 `localStorage`
  - `STORAGE_KEYS` 统一管理 key，避免硬编码散落
  - Webview 注入脚本通过统一执行函数并处理异常
- 样式与文案：
  - 当前 UI/注释以中文为主，新增文案保持中文一致性
  - 不引入无必要的大型前端框架

## 6. 提交前最小验收清单
- 运行 `npm run check` 通过。
- 手动验证以下核心路径不回归：
  - 应用启动、窗口最小化/关闭、全局快捷键可用
  - 书签新增/编辑/删除/检索/跳转可用
  - 透明模式、自动隐身、导航栏自动隐藏、置顶可用
  - 设置面板可打开，主题切换可用
  - 图标伪装列表可读取，图标切换可用
  - 激活码格式校验与状态显示可用

## 7. 当前已知限制（改动时请注意）
- 自动更新目前为占位实现（`check-for-updates` 返回手动更新提示）。
- 激活流程目前是本地格式校验 + 本地存储，尚未接入服务端验签。
- 项目暂无自动化测试（以语法检查 + 手工回归为主）。
