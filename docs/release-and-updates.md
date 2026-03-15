# Release And Auto-Update Guide

## 1. How Auto-Update Works In This Project

- Development mode (`npm run start`): update UI is available, but auto download/install is disabled by design.
- Packaged app: checks remote release metadata, downloads update package in background, then allows `Restart And Install`.

`electron-updater` never uses your local build artifacts on end-user machines.  
Users download update packages from a remote release source.

## 2. Do I Need GitHub?

Not mandatory, but you need **some remote host**:

- Option A: GitHub Releases (recommended first)
- Option B: Your own server/CDN (generic provider)

This repo currently provides a GitHub Releases publishing workflow.

## 3. Signing / Notarization Requirements

### macOS (strongly recommended to be treated as required)

- Developer ID Application certificate
- Apple notarization credentials

Without them, users usually see heavy security warnings and installation friction.

### Windows (strongly recommended)

- Code signing certificate (EV is best for SmartScreen reputation)

Without signing, users commonly see `Unknown Publisher` / SmartScreen warnings.

## 4. One-Time Setup

1. Create a GitHub repository and push this project.
2. Enable GitHub Actions for the repository.
3. Add repository secrets:
   - `CSC_LINK` (base64 p12 or cert file URL)
   - `CSC_KEY_PASSWORD`
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`

If you are not ready for signing yet, you can omit these secrets first.  
The workflow can still publish unsigned packages (not recommended for public distribution).

## 5. Release Flow

1. Bump `package.json` version.
2. Commit and push.
3. Create and push a tag (example: `v1.0.1`).
4. GitHub Actions `Release` workflow builds and publishes artifacts to GitHub Releases.
5. Packaged apps will detect the new version and update automatically.

## 6. Useful Commands

- Local package only (no publish, unsigned by default): `npm run dist`
- Publish (requires GitHub context/token): `npm run release:github`

## 7. Optional Runtime Environment Flags

- `MOYU_UPDATE_FEED_URL`: force a generic feed URL at runtime.
- `MOYU_AUTO_UPDATE_CHECK_INTERVAL_MS`: periodic check interval.
- `MOYU_AUTO_UPDATE_STARTUP_DELAY_MS`: delay before first startup check.
- `MOYU_DEV_AUTO_UPDATE=true`: enable auto-updater path in development mode for debugging.
