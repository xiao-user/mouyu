function normalizeVersion(rawVersion) {
  if (typeof rawVersion !== 'string') return null;
  const trimmed = rawVersion.trim();
  if (!trimmed) return null;

  const withoutPrefix = trimmed.replace(/^v/i, '');
  const [versionAndPreRelease] = withoutPrefix.split('+');
  const [corePart, preReleasePart = ''] = versionAndPreRelease.split('-', 2);
  const coreParts = corePart.split('.').map((part) => Number.parseInt(part, 10));

  if (coreParts.length === 0 || coreParts.some((part) => Number.isNaN(part) || part < 0)) {
    return null;
  }

  return {
    raw: trimmed,
    normalized: withoutPrefix,
    coreParts,
    preRelease: preReleasePart ? preReleasePart.split('.').filter(Boolean) : [],
  };
}

function comparePreReleaseIdentifier(a, b) {
  const aIsNum = /^\d+$/.test(a);
  const bIsNum = /^\d+$/.test(b);

  if (aIsNum && bIsNum) {
    const aNum = Number.parseInt(a, 10);
    const bNum = Number.parseInt(b, 10);
    if (aNum > bNum) return 1;
    if (aNum < bNum) return -1;
    return 0;
  }

  if (aIsNum && !bIsNum) return -1;
  if (!aIsNum && bIsNum) return 1;

  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

function comparePreRelease(aList, bList) {
  const maxLength = Math.max(aList.length, bList.length);
  for (let i = 0; i < maxLength; i += 1) {
    const aValue = aList[i];
    const bValue = bList[i];

    if (aValue === undefined && bValue !== undefined) return -1;
    if (aValue !== undefined && bValue === undefined) return 1;
    if (aValue === undefined && bValue === undefined) return 0;

    const compared = comparePreReleaseIdentifier(String(aValue), String(bValue));
    if (compared !== 0) return compared;
  }
  return 0;
}

function compareVersions(currentVersion, targetVersion) {
  const a = normalizeVersion(currentVersion);
  const b = normalizeVersion(targetVersion);

  if (!a || !b) return 0;

  const maxLength = Math.max(a.coreParts.length, b.coreParts.length);
  for (let i = 0; i < maxLength; i += 1) {
    const aPart = a.coreParts[i] ?? 0;
    const bPart = b.coreParts[i] ?? 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  const aHasPreRelease = a.preRelease.length > 0;
  const bHasPreRelease = b.preRelease.length > 0;

  if (!aHasPreRelease && !bHasPreRelease) return 0;
  if (!aHasPreRelease && bHasPreRelease) return 1;
  if (aHasPreRelease && !bHasPreRelease) return -1;

  return comparePreRelease(a.preRelease, b.preRelease);
}

module.exports = {
  normalizeVersion,
  compareVersions,
};
