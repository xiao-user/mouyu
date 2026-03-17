#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function readPackageVersion() {
  try {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const raw = fs.readFileSync(packagePath, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed.version === 'string' ? parsed.version.trim() : '';
  } catch {
    return '';
  }
}

function normalizeVersion(rawVersion) {
  const safe = String(rawVersion || '').trim();
  if (!safe) return '';
  return safe.replace(/^v/i, '');
}

function toIsoDate(rawValue) {
  const safe = String(rawValue || '').trim();
  if (!safe) return new Date().toISOString();
  const parsed = new Date(safe);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function ensureHttpsUrl(rawUrl) {
  const safe = String(rawUrl || '').trim();
  if (!safe) return '';
  try {
    const parsed = new URL(safe);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function buildManifestPayload() {
  const version = normalizeVersion(process.env.MOYU_MANIFEST_VERSION || readPackageVersion());
  if (!version) {
    throw new Error('缺少 MOYU_MANIFEST_VERSION，且无法从 package.json 推断版本号。');
  }

  const releaseUrl = ensureHttpsUrl(
    process.env.MOYU_MANIFEST_URL || process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY
  );
  if (!releaseUrl) {
    throw new Error('缺少有效的 MOYU_MANIFEST_URL（需为 http/https）。');
  }

  const notes = String(process.env.MOYU_MANIFEST_NOTES || '').trim();
  const publishedAt = toIsoDate(process.env.MOYU_MANIFEST_PUBLISHED_AT || '');

  return {
    version,
    url: releaseUrl,
    notes,
    publishedAt,
  };
}

async function updateGist({ gistId, fileName, token, content }) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'moyu-reader-manifest-publisher',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      files: {
        [fileName]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`更新 Gist 失败：HTTP ${response.status} ${response.statusText} ${errorText}`.trim());
  }

  return response.json();
}

function findRawUrlFromGistResponse(gist, fileName) {
  if (!gist || typeof gist !== 'object' || !gist.files || typeof gist.files !== 'object') return '';
  const exact = gist.files[fileName];
  if (exact && typeof exact.raw_url === 'string' && exact.raw_url.trim()) return exact.raw_url.trim();

  for (const value of Object.values(gist.files)) {
    if (value && typeof value === 'object' && typeof value.raw_url === 'string' && value.raw_url.trim()) {
      return value.raw_url.trim();
    }
  }
  return '';
}

function appendSummary(text) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${text}\n`);
}

async function main() {
  const token = String(process.env.MOYU_MANIFEST_GIST_TOKEN || '').trim();
  const gistId = String(process.env.MOYU_MANIFEST_GIST_ID || '').trim();
  const fileName = String(process.env.MOYU_MANIFEST_FILE_NAME || 'update-manifest.json').trim();

  if (!token) throw new Error('缺少 MOYU_MANIFEST_GIST_TOKEN。');
  if (!gistId) throw new Error('缺少 MOYU_MANIFEST_GIST_ID。');
  if (!fileName) throw new Error('缺少 MOYU_MANIFEST_FILE_NAME。');

  const payload = buildManifestPayload();
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  const gist = await updateGist({ gistId, fileName, token, content });
  const rawUrl = findRawUrlFromGistResponse(gist, fileName);

  if (!rawUrl) {
    throw new Error('Gist 已更新，但未找到 raw_url。');
  }

  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `manifest_url=${rawUrl}\n`);
  }

  appendSummary('## Update Manifest Published');
  appendSummary(`- version: ${payload.version}`);
  appendSummary(`- manifest: ${rawUrl}`);
  appendSummary(`- url: ${payload.url}`);

  console.log(`Manifest URL: ${rawUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
