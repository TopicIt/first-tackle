# First Tackle Project Summary

Updated: 2026-07-07

## Current State

First Tackle is a local-first browser fishing game with optional account/cloud save support. The frontend remains responsible for rendering, offline play, fishing UI, and local save continuity. The available backend source lives in `D:\first-tackle-api` and currently supports auth, profile, cloud saves, and now read-only leaderboard endpoints aggregated from latest cloud saves.

## MVP 1.1 Leaderboard, Guide, Progression, And Mobile Polish

Completed on branch `codex/mvp11-leaderboard-guide-progression`.

Feature commit: `d3ba72f` (`MVP 1.1 leaderboard guide progression polish`).

Main merge commit: `f9a98ba` (`Merge MVP 1.1 leaderboard guide progression`).

Deployment status: GitHub Pages workflow run `28827145021` completed successfully for merge commit `f9a98ba`.

Live URL: `https://topicit.github.io/first-tackle/` verified with HTTP 200 after deployment.

Completed work:

- Reworked the frontend leaderboard to two MVP boards: biggest fish and monthly trophies grouped by fish, with collapsed species groups, refresh/sync action, avatar buttons, and public profile modal UI.
- Added frontend profile sync to PATCH display name/avatar/star metadata to the backend profile and sync the current cloud save before manual leaderboard refresh when logged in.
- Restored current profile identity in local leaderboard rows and carried readable fish/water/bait/depth/date metadata for biggest-fish records.
- Added user-facing fish population indexes per water/fish and tied trophy eligibility to population `10+`, with catch/trophy classification aligned to that threshold.
- Restored fish-guide depth detail blocks and added water population histograms with the `10+` trophy threshold marker.
- Simplified fish guide casting guidance to readable water/zone/depth/population hints instead of raw internal spot labels.
- Fixed player-state migration so a real game-state profile level/xp overrides stale legacy `playerState` values, preventing level progress from sticking at level 1.
- Changed mobile/low-power transition gating to track each unique transition ID in localStorage, so each mobile transition can show once before later suppression.
- Kept the mobile hamburger cloud-save UI compact by default, fixed its text wrapping/overflow, and raised mobile menu z-index above active panels so menu buttons remain tappable.
- Raised startup flow z-index above mobile panels so first-launch intro/skip/profile controls receive taps before the HUD panels.
- Added subtle bobber/cast-target perspective scaling based on water position.

Changed files/modules:

- `src/api/authApi.js`, `src/api/gameApi.js`: profile PATCH helper and leaderboard endpoint mapping.
- `src/game/leaderboards.js`, `src/main.js`: two-board leaderboard model, local fallback rows, refresh/sync, public profile actions.
- `src/game/waterFishDistribution.js`, `src/game/fishInventory.js`: population indexes and trophy threshold enforcement.
- `src/game/playerState.js`, `src/game/gameAuthority.js`, `src/game/state.js`, `src/game/save.js`: profile level migration, XP/level diff metadata, biggest-fish metadata persistence.
- `src/game/locationTransitions.js`: per-transition first mobile playback tracking.
- `src/ui/panels.js`, `src/ui/cloudSavePanel.js`, `src/ui/fishingMinigame.js`, `style.css`: leaderboard UI, guide population/depth UI, mobile menu/panel layering, compact cloud-save menu, bobber scaling.

Verification:

- `npm.cmd install` completed in the clean MVP 1.1 worktree before implementation verification.
- `npm.cmd run build` passed in the feature worktree and again after merging to `main`.
- `git diff --check` passed after EOF cleanup; only standard Windows LF-to-CRLF warnings were reported during Git operations.
- No `npm test` or check script is defined in `package.json`.
- Focused module smoke passed for player-state level migration, local leaderboard identity/metadata, monthly trophy grouping, population threshold values, trophy blocking on low-population waters, per-transition mobile playback gating, guide population/depth render markers, leaderboard refresh/avatar/group render markers, and profile cloud/leaderboard action render markers.
- In-app browser smoke at `390x844` verified first-launch startup controls are tappable above HUD panels, mobile hamburger opens, cloud-save shortcut is compact/readable with no horizontal overflow, Settings opens from the hamburger menu, Profile opens from the top mobile profile control, Leaderboard opens with two tabs and refresh, and Guide opens from the hamburger menu.
- Live GitHub Pages URL returned HTTP 200 and the deployed HTML references built `/first-tackle/assets/` bundles.

Known remaining issues:

- Backend leaderboard rows still come from latest cloud-save aggregation and are not server-authoritative anti-cheat records.
- Backend leaderboard responses do not yet expose enough public profile/avatar metadata for rich remote player cards; frontend shows richer identity for local/current player rows and default avatars for incomplete remote rows.
- Monthly trophy leaderboard grouping can only group rows that include fish IDs; if the backend returns score-only trophy rows, the frontend falls back to local grouped trophy data.
- Vite still warns that the main JS chunk is larger than 500 kB.
- Existing unrelated dirty worktrees/asset changes outside this clean MVP 1.1 worktree were left untouched.

Recommended next tasks:

- Add backend public profile fields and fish IDs to leaderboard responses, then make remote avatar/profile rows fully data-backed.
- Move competitive catch/trophy records server-side for verified leaderboards.
- Real-device test the first-launch intro, hamburger menu, Settings/Profile, guide, and leaderboard on iPhone Safari.
- Continue JS bundle splitting/lazy loading to reduce the large main chunk.

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
