# Noir Muse — Private Atelier preview

This is a **development-only** prototype. The production page remains on `main`.

## Preview

The preview entry point is `atelier-preview.html` and loads `atelier-mix-match.js` from the same directory.

If Cloudflare Pages Git previews are enabled for `feature/private-atelier-v2`, open the **actual preview URL shown in Cloudflare's deployment dashboard**, appending `/atelier-preview.html`. Do not use the production `noir-muse.pages.dev` homepage to review this prototype.

Cloudflare Pages Git integration must be connected to the repository and have preview-branch builds enabled; this cannot be verified from repository files alone.

## Test

Run `npm install`, then `npx playwright install chromium`, then `npm run test:atelier`.

The test suite checks the character/outfit/scene flow, locked identity snapshots, Studio draft persistence, Creative Dice behavior, and saved Mix & Match favorites. The GitHub Actions configuration is in `.github/workflows/atelier-browser-checks.yml`.

**Release gate:** Do not merge until tests have run successfully, the Cloudflare preview has been checked on mobile and desktop, and legacy user data has been backed up.

## Data

The prototype stores its own data in `noirMuseAtelierPreviewV1`, Studio drafts in `noirMuseAtelierStudioDraftV1`, and mix-and-match favorites in `noirMuseAtelierMixFavoritesV1`. It does not rewrite the legacy `noirMuseProfiles` or `noirMuseScenes` keys.

**Important:** Browser storage is not synchronized across devices. Export backups from the prototype Storybook before clearing browser data. The prototype does **not** migrate old saved characters or images automatically.

## Known limits

- No production-ready image library or cloud sync.
- No hosted preview URL verified yet.
- Browser regression checks have been authored but not confirmed passing.
- Cloudflare branch deployment access/permissions may need account-level configuration.
