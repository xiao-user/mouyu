#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const distIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error(`[verify-dist] Missing file: ${distIndexPath}`);
  process.exit(1);
}

const html = fs.readFileSync(distIndexPath, 'utf8');
const absoluteAssetPattern = /(?:src|href)=["']\/assets\//g;
const matches = html.match(absoluteAssetPattern) || [];

if (matches.length > 0) {
  console.error('[verify-dist] Found absolute asset paths in dist/index.html:');
  for (const match of matches) {
    console.error(`- ${match}`);
  }
  console.error('[verify-dist] This will cause a blank window in packaged Electron (file://) mode.');
  console.error('[verify-dist] Fix by setting Vite base to ./ (for example: base: \"./\").');
  process.exit(1);
}

console.log('[verify-dist] OK: dist assets are relative.');
