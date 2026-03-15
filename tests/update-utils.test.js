import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { compareVersions, normalizeVersion } = require('../lib/update-utils');

describe('update-utils normalizeVersion', () => {
  it('normalizes prefixed semver text', () => {
    const parsed = normalizeVersion('v1.2.3-beta.1+build.7');
    expect(parsed).toEqual({
      raw: 'v1.2.3-beta.1+build.7',
      normalized: '1.2.3-beta.1+build.7',
      coreParts: [1, 2, 3],
      preRelease: ['beta', '1'],
    });
  });

  it('returns null for invalid versions', () => {
    expect(normalizeVersion('')).toBeNull();
    expect(normalizeVersion('abc')).toBeNull();
  });
});

describe('update-utils compareVersions', () => {
  it('compares stable versions', () => {
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.4', '1.2.3')).toBe(1);
  });

  it('handles pre-release precedence', () => {
    expect(compareVersions('1.2.3-beta.1', '1.2.3')).toBe(-1);
    expect(compareVersions('1.2.3', 'v1.2.3-beta.1')).toBe(1);
  });
});
