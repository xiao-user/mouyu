export function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

export function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

export function getFileNameFromPath(filePath) {
  const parts = String(filePath).split(/[\\/]/);
  return parts[parts.length - 1] || String(filePath);
}
