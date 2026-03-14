#!/usr/bin/env node

function checkFlag(name, value) {
  if (value === undefined) {
    return { name, status: 'ok', detail: '未设置' };
  }
  return { name, status: 'warn', detail: `已设置为 ${JSON.stringify(value)}` };
}

function main() {
  const env = process.env;

  const checks = [
    checkFlag('ELECTRON_RUN_AS_NODE', env.ELECTRON_RUN_AS_NODE),
    checkFlag('ELECTRON_FORCE_IS_PACKAGED', env.ELECTRON_FORCE_IS_PACKAGED),
  ];

  let electronBinary = '';
  let electronPathStatus = 'ok';
  let electronPathDetail = '';
  try {
    electronBinary = require('electron');
    if (typeof electronBinary === 'string' && electronBinary.trim()) {
      electronPathDetail = electronBinary;
    } else {
      electronPathStatus = 'warn';
      electronPathDetail = '路径解析结果无效';
    }
  } catch (error) {
    electronPathStatus = 'warn';
    electronPathDetail = error instanceof Error ? error.message : String(error);
  }

  console.log('[moyu-reader] Electron 环境诊断');
  console.log(`- ELECTRON_RUN_AS_NODE: ${checks[0].status === 'ok' ? 'OK' : 'WARN'} (${checks[0].detail})`);
  console.log(`- ELECTRON_FORCE_IS_PACKAGED: ${checks[1].status === 'ok' ? 'OK' : 'WARN'} (${checks[1].detail})`);
  console.log(`- Electron binary: ${electronPathStatus === 'ok' ? 'OK' : 'WARN'} (${electronPathDetail})`);

  if (checks.some((item) => item.status === 'warn')) {
    console.log('结论: 发现潜在环境变量干扰，建议先执行 unset 再启动。');
    process.exit(1);
  }

  console.log('- GUI 环境: OK');
  console.log('结论: 环境检查通过，可直接运行 npm run start。');
}

main();
