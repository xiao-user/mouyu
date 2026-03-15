import { describe, expect, it } from 'vitest';

import { getFileNameFromPath, isHexColor, normalizeUrl } from '../src/lib/app-format-utils';

describe('app-format-utils normalizeUrl', () => {
  it('adds https protocol for bare hosts', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('keeps explicit protocols and trims spaces', () => {
    expect(normalizeUrl('  http://example.com  ')).toBe('http://example.com');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns empty string for invalid input text', () => {
    expect(normalizeUrl('   ')).toBe('');
    expect(normalizeUrl(null)).toBe('');
  });
});

describe('app-format-utils isHexColor', () => {
  it('validates common hex formats', () => {
    expect(isHexColor('#000')).toBe(true);
    expect(isHexColor('#abcdef')).toBe(true);
    expect(isHexColor('#ABCDEF')).toBe(true);
  });

  it('rejects invalid color strings', () => {
    expect(isHexColor('#abcd')).toBe(false);
    expect(isHexColor('fff')).toBe(false);
    expect(isHexColor('#zzzzzz')).toBe(false);
  });
});

describe('app-format-utils getFileNameFromPath', () => {
  it('extracts filename from unix and windows style paths', () => {
    expect(getFileNameFromPath('/tmp/icons/icon.png')).toBe('icon.png');
    expect(getFileNameFromPath('C:\\icons\\logo.icns')).toBe('logo.icns');
  });
});
