#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const VITE_HOST = '127.0.0.1';
const VITE_PORT = Number.parseInt(process.env.VITE_PORT || '5173', 10) || 5173;
const RENDERER_URL = `http://${VITE_HOST}:${VITE_PORT}`;

function createSanitizedEnv(extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_FORCE_IS_PACKAGED;
  return env;
}

function resolveElectronBinary() {
  try {
    const electronBinary = require('electron');
    if (typeof electronBinary === 'string' && electronBinary.trim() !== '') {
      return electronBinary;
    }
  } catch (error) {
    console.error('[moyu-reader] 无法解析 Electron 可执行文件路径。');
    console.error(error instanceof Error ? error.message : String(error));
  }

  process.exit(1);
}

function resolveViteCliPath() {
  try {
    const vitePackagePath = require.resolve('vite/package.json');
    return path.join(path.dirname(vitePackagePath), 'bin', 'vite.js');
  } catch (error) {
    console.error('[moyu-reader] 无法解析 Vite CLI 路径。');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const startAt = Date.now();

  while (Date.now() - startAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        return;
      }
    } catch {
      // 服务未就绪时忽略错误并继续轮询
    }

    await delay(250);
  }

  throw new Error(`等待 Vite 服务超时: ${url}`);
}

function terminateProcess(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
}

async function main() {
  const viteCliPath = resolveViteCliPath();
  const viteProcess = spawn(
    process.execPath,
    [viteCliPath, '--host', VITE_HOST, '--port', String(VITE_PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      env: createSanitizedEnv(),
      stdio: 'inherit',
    }
  );

  let isCleaningUp = false;
  let electronProcess = null;

  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    terminateProcess(electronProcess);
    terminateProcess(viteProcess);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  viteProcess.on('error', (error) => {
    console.error('[moyu-reader] 启动 Vite 失败。');
    console.error(error instanceof Error ? error.message : String(error));
    cleanup();
    process.exit(1);
  });

  try {
    await waitForServer(RENDERER_URL, 30000);
  } catch (error) {
    console.error(`[moyu-reader] ${error instanceof Error ? error.message : String(error)}`);
    cleanup();
    process.exit(1);
  }

  const electronBinary = resolveElectronBinary();
  electronProcess = spawn(electronBinary, ['.'], {
    cwd: process.cwd(),
    env: createSanitizedEnv({ ELECTRON_RENDERER_URL: RENDERER_URL }),
    stdio: 'inherit',
  });

  electronProcess.on('error', (error) => {
    console.error('[moyu-reader] 启动 Electron 失败。');
    console.error(error instanceof Error ? error.message : String(error));
    cleanup();
    process.exit(1);
  });

  electronProcess.on('exit', (code, signal) => {
    cleanup();

    if (typeof signal === 'string' && signal.length > 0) {
      console.error(`[moyu-reader] Electron 异常退出，signal=${signal}`);
      process.exit(1);
    }

    process.exit(code ?? 1);
  });

  viteProcess.on('exit', (code, signal) => {
    if (isCleaningUp) return;

    console.error(
      `[moyu-reader] Vite 进程提前退出，code=${code ?? 'null'}, signal=${signal ?? 'null'}`
    );

    cleanup();
    process.exit(1);
  });
}

main();
