# First Tackle Project Summary

Updated: 2026-07-06

## Current State

First Tackle is a local-first browser fishing game with optional account/cloud save support. The frontend remains responsible for rendering, offline play, fishing UI, and local save continuity. The available backend source lives in `D:\first-tackle-api` and currently supports auth, profile, cloud saves, and now read-only leaderboard endpoints aggregated from latest cloud saves.

## MVP 1 Usability Pass

Completed on branch `codex/mvp1-usability-pass`.

Feature commit: `ea03ba3` (`fix: prepare mvp1 usability pass`).

Main merge commit: `5bf3568` (`merge: mvp1 usability pass`).

Deployment status: GitHub Pages deployment succeeded on retry commit `4f7ca33` (`chore: retry pages deploy`) in workflow run `28774799950`.

The first deploy attempt for docs commit `d53f465` built successfully but the Pages deploy job failed; the retry run completed successfully.

Live URL: `https://topicit.github.io/first-tackle/` verified with HTTP 200 after deployment.

Completed work:

- Fixed mobile Profile and Settings panels so they open as top-layer, scrollable sheets with safe-area-aware viewport height, iOS momentum scrolling, stronger z-index, and no menu-overlap positioning.
- Reworked the starter tutorial after drawer assembly to say `Злови першу рибину`, then guide the loop through keeping the fish, exiting to the map, opening the market, selling fish, and reading the final short excursion.
- Added the final tutorial text about selling catch, buying better gear, improving tackle, trophy learning/rewards, leaderboards, and saving progress through auth.
- Allowed mobile/touch low-power sessions to show transition video once on first launch before the existing low-power suppression resumes for later launches.
- Restored fish-guide depth recommendations in fish summaries and detailed depth blocks, matching current depth preferences and surface restrictions more closely.

Changed files/modules:

- `src/game/profile.js`: tutorial step sequence and flexible action matching.
- `src/main.js`: tutorial advancement for keep, exit-to-map, and successful fish sale actions.
- `src/ui/hud.js`: final tutorial rendering and tutorial action labels.
- `src/i18n/translations.js`: new Ukrainian tutorial copy and final text.
- `src/game/locationTransitions.js`: first mobile/touch transition exception using localStorage.
- `src/ui/panels.js`: per-fish recommended-depth summary and clearer depth notes.
- `style.css`: mobile panel layering, viewport height, safe-area, and scroll behavior.

Verification:

- `npm.cmd run build` passed on the feature worktree.
- `npm.cmd run build` passed again after merging into `main`.
- No `npm test` or check script is defined in `package.json`.
- Module smoke check passed for tutorial order/copy and first mobile transition gating.
- In-app browser smoke at iPhone 14-sized viewport verified Profile opens, scrolls, and closes.
- In-app browser smoke at iPhone 14-sized viewport verified Settings opens from mobile menu, scrolls, closes, and the menu closes before the panel opens.
- Fresh-origin mobile smoke verified first-launch intro video is visible with local video sources; autoplay remained paused in the automation browser but the transition UI/video is not hidden.
- Fish guide smoke verified per-fish `Радимо глибину` summaries and detailed depth recommendations.
- GitHub Pages workflow run `28774799950` completed successfully, and the live URL returned HTTP 200.

Known remaining issues:

- Browser automation could not fully complete the drawer minigame on the iPhone-sized viewport because the old-hook visual target was overlapped by drawer clutter in the test surface; tutorial order/copy was verified by module smoke instead.
- Vite still warns that the main JS chunk is larger than 500 kB.
- Existing unrelated dirty asset/package-lock changes remain in the original worktree and were not included in the MVP 1 usability commits.

Recommended next tasks:

- Manually test the full first-run tutorial on a real iPhone Safari device, including drawer item tapping and first fish sale.
- Monitor GitHub Pages if intermittent deploy-job failures recur.
- Profile the large JS chunk and split/lazy-load non-critical UI or 3D code.
- Revisit drawer clutter hit targets on narrow mobile screens if real-device tapping reproduces the old-hook overlap.

## This Sprint

- Added an aggressive mobile low-power path: phone-like/touch/narrow viewports default to low-power unless the player explicitly toggles it off.
- Reduced render/update cadence by state: menus and idle mobile screens run much slower, waiting-for-bite is calmer, and strike windows stay responsive.
- Disabled expensive blur/glass/ambient animation work in low-power and menu-open states.
- Made automatic cloud autosave more conservative on mobile/low-power while preserving immediate manual cloud save.
- Changed bait consumption so pure no-bite and recast/cancel do not spend normal bait or live bait. Bait is committed on catch or meaningful bite failure.
- Removed guide recommended-depth output and expanded real cast spot guidance from actual `castSpots` data.
- Replaced vague fish habitat chips in the fish guide with real waters and real cast spot labels.
- Clarified that `рогаль` is the local/common name for `canadian_catfish`; no new fish species was added.
- Added backend leaderboard endpoints in the separate FastAPI backend repo. They aggregate latest cloud saves and are server-backed but not anti-cheat verified until catch resolution moves server-side.

## Backend And Leaderboard Status

Frontend API base: `https://first-tackle-api-production.up.railway.app`

Backend source found: `D:\first-tackle-api`

Implemented backend routes:

- `GET /api/leaderboard/biggest-fish`
- `GET /api/leaderboard/species/{fish_id}/biggest`
- `GET /api/leaderboard/trophies`
- `GET /api/leaderboard/coins`
- `GET /api/leaderboard/total-fish`
- `GET /api/leaderboard/by-location`

Current limitation: these endpoints aggregate user cloud-save payloads. Rows are marked `serverBacked: true` and `verified: false`; real competitive verification still requires server-authoritative catch/event records.

## Optimization Roadmap

- Run a PageSpeed/Lighthouse pass after gameplay profiling.
- Convert large PNG/JPG assets to WebP/AVIF where quality allows.
- Add mobile image variants for waters, maps, transitions, guide art, and fish images.
- Lazy-load non-critical water/transition/guide/fish imagery.
- Split the main JS bundle.
- Reduce HUD full-render/stringify work with dirty flags or narrower selectors.
- Continue removing expensive mobile blur/backdrop-filter and large shadows.
- Review canvas/update frequency after device profiling.
- Add stricter low-power animation limits and low-power defaults for new features.
