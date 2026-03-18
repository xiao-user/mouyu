# Release And Manual Update Guide

## 1. Current Update Strategy

This project now uses **manual update only**:

1. User clicks `检查更新` in the app.
2. App checks remote release metadata.
3. If a new version exists, app shows `打开下载页`.
4. User downloads and installs manually.

There is **no background package download** and **no restart-and-install flow**.

## 2. Update Sources

Configure one of the following runtime variables:

- `MOYU_UPDATE_MANIFEST_URL` (JSON endpoint; must contain `version`)
- `MOYU_UPDATE_GITHUB_REPO` (format: `owner/repo`, reads latest release)

If runtime env vars are not set, app falls back to `package.json > moyuUpdate`.

Optional:

- `MOYU_UPDATE_HTTP_TIMEOUT_MS` (request timeout, milliseconds)

Private repo note:

- `MOYU_UPDATE_GITHUB_REPO` uses unauthenticated GitHub API in-app.
- Private repos are not accessible from anonymous API requests.
- Public repos may still hit API rate limits.
- Recommended for production: set `MOYU_UPDATE_MANIFEST_URL` to a stable public JSON endpoint.

Manifest JSON example:

```json
{
  "version": "1.0.1",
  "url": "https://your-download-host.example.com/Moyu-Reader-1.0.1.dmg",
  "notes": "Bug fixes and performance improvements",
  "publishedAt": "2026-03-17T00:00:00.000Z"
}
```

## 3. Release Flow

1. Bump `package.json` version.
2. Build and package:
   - `npm run dist` (all configured targets)
   - `npm run dist:mac`
   - `npm run dist:win`
3. Upload installer artifacts to your release channel.
4. Users update by downloading and reinstalling.

## 3.1 Private Repo + Public Manifest (Gist)

Use `.github/workflows/publish-manifest.yml` to publish manifest JSON to a public Gist.

Required GitHub repository settings:

- Secret: `MOYU_MANIFEST_GIST_ID`
- Secret: `MOYU_MANIFEST_GIST_TOKEN` (PAT with `gist` scope)

Optional GitHub repository settings:

- Variable: `MOYU_MANIFEST_FILE_NAME` (default: `update-manifest.json`)
- Variable: `MOYU_MANIFEST_URL` (default: release page URL)

After workflow runs, set app runtime env:

- `MOYU_UPDATE_MANIFEST_URL=<public gist raw url>`

Manual dispatch inputs:

- `version`
- `url`
- `notes`

## 4. Signing Notes

- macOS and Windows signing are still recommended for distribution trust.
- Since this project is manual update mode, unsigned builds can still be distributed for small-scale internal usage.

## 5. Health Checks

Before release:

- `npm run check`
- `npm run test:regression`
- `npm run build`
