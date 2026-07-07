# First Tackle Project Summary

Updated: 2026-07-07

## Current State

First Tackle is a local-first browser fishing game with optional account/cloud save support. The frontend remains responsible for rendering, offline play, fishing UI, and local save continuity. The available backend source lives in `D:\first-tackle-api` and currently supports auth, profile, cloud saves, and now read-only leaderboard endpoints aggregated from latest cloud saves.

## Trophy, Guide, Market, And Cleanup Pass

Completed on branch `codex/trophy-guide-market-cleanup`.

Feature commits:

- `2cb8897` (`feat: clean trophy guide market and assets`)
- `2642a78` (`feat: refine trophies market and guide`)

Main merge commit: `80aea69` (`merge: trophy guide market cleanup`).

Deployment status: GitHub Pages workflow run `28846060919` completed successfully for summary commit `5b55ccf`; live URL returned HTTP 200. The later docs-only status correction commit was pushed with `[skip ci]`.

Completed work:

- Cleaned trophy history normalization so monthly trophy boards use only real trophy/star-threshold catches, ignore ordinary fish, filter to the last 30 in-game days, and cap visible trophy rows to 10 per species group.
- Added a save-debug-only action to clear local fish/trophy/journal/guide/leaderboard history and related local/session storage keys while preserving the current save shell.
- Added rare-species trophy eligibility at 5+ population, kept common species at 10+, and raised Mining Lake eel population to make eel trophies reachable.
- Rebuilt the fish guide's fish/water view as a mobile-first dashboard with `Популяція риб` first and `Місця закиду` below, including stable species colors, population bars, and a spot suitability matrix.
- Cleaned broken market/category/quantity/status symbols and labels.
- Removed clean obsolete worktrees `D:\first-tackle-cloud-market-pass`, `D:\first-tackle-mvp11`, and `D:\first-tackle\.worktrees\ios-cloud-profile-fixes`.
- Ran `git worktree prune` and `git gc --prune=now`; no Git history rewrite or force-push was performed.
- Removed tracked `_source-assets/deploy-excluded` source/raw files; active `public/assets` files were kept.

Changed files/modules:

- `src/game/fishInventory.js`, `src/game/leaderboards.js`: trophy normalization, filtering, local monthly trophy board rows, and local fish-history clearing.
- `src/game/waterFishDistribution.js`, `src/game/bitePatterns.js`: rare trophy threshold and added cast spots so every waterbody has at least three spots.
- `src/ui/panels.js`, `style.css`: redesigned guide dashboard/matrix, market label cleanup, and trophy board display filtering.
- `src/main.js`, `src/ui/hud.js`: guide water selection, debug clear action, and trophy leaderboard fallback behavior.
- `src/i18n/translations.js`: labels for the new cast spots.
- `docs/CLEANUP_AUDIT.md`, `_source-assets/deploy-excluded/*`: recorded cleanup follow-up and removed deploy-excluded source files.

Verification:

- `npm.cmd run build` passed before merge and again on `main` after merge.
- No `npm test` or check script is defined in `package.json`.
- `git diff --check` passed; only standard Windows LF-to-CRLF warnings were reported.
- Module smoke verified ordinary old trophy records are filtered out, last-30-day trophy filtering works, monthly trophy rows are real trophies only, and eel uses the rare 5+ trophy threshold at Mining Lake.
- Module smoke verified all waterbodies now have at least three cast spots.
- Mobile browser smoke at `390x844` verified the guide renders `Популяція риб` before `Місця закиду`, has no detected guide text overflow, and the spot matrix scrolls horizontally.

Measured sizes after cleanup:

- Active worktree `D:\first-tackle-main-merge`: 214.61 MB, down from 220.92 MB before tracked source-asset cleanup.
- Shared Git directory `D:\first-tackle\.git`: 352.24 MB, down from about 465.75 MB before `git gc`.
- `node_modules`: 79.12 MB.
- `dist`: 41.79 MB.
- `public/assets`: 40.59 MB.
- `_source-assets`: 51.96 MB, down from 58.27 MB after removing tracked deploy-excluded files.

Known remaining issues:

- Vite still warns that the main JS chunk is larger than 500 kB.
- Remote/backend monthly trophy rows without explicit trophy markers are treated as old incompatible data and the frontend falls back to local trophy rows.
- The original `D:\first-tackle` worktree remains dirty and was not deleted or reset.
- Real-device iPhone Safari testing is still recommended for the redesigned guide and debug clear action.

Recommended next tasks:

- Split/lazy-load guide, leaderboard, profile/cloud save, transitions, and 3D code to reduce the main JS chunk.
- Review the dirty original `D:\first-tackle` worktree before deciding whether to archive or delete it.
- Add server-authoritative trophy/catch records so leaderboard trophy data is verified and consistently marked.
- Continue asset optimization by converting large active images/videos only after visual QA.

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

## Guide Leaderboard Profile Optimization

Completed on branch `codex/guide-leaderboard-profile-optimization`.

Feature commit: `7fd47f2` (`fix: clean guide leaderboard profile flows`).

Main merge commit: `fe416b1` (`merge: guide leaderboard profile optimization`).

Deployment status: GitHub Pages workflow run `28848907821` completed successfully. Live URL `https://topicit.github.io/first-tackle/` returned HTTP 200; deployed JS `index-A2Cmedqg.js` contains the new leaderboard profile/reset tombstone code, and the optimized grandma-house transition MP4 is live at 1,459,785 bytes.

Completed work:

- Fixed the guide tab regression: `Види риб` now renders fish species cards again, while `Водойми` keeps the dashboard layout with full descriptions, best time, bait/tackle notes, population block, and cast-spot matrix.
- Hardened reset/save cleanup: full reset now clears first-tackle local/session caches, fish/catch/journal/trophy/leaderboard/guide/profile/cloud cache keys, `first-tackle-save-v1`, `first-tackle-save-v2`, save backups, mobile transition markers, cloud autosave queue/signatures, and `first-tackle-cloud-session-v1`; it writes `first-tackle-reset-tombstone-v1` and blocks older cloud saves from reappearing after reset.
- Cleaned leaderboard rules: biggest-fish and trophy boards filter to the last 30 days and max 50 rows; trophy rows require real trophy markers (`realTrophy`, `isTrophy`, `trophy`, stars, tier, trophy key, or trophy catch category), so ordinary catches are ignored.
- Made leaderboard avatar/name/detail rows open a public profile modal with player identity, biggest fish, trophy count, and notable catches when available.
- Replaced raw internal leaderboard labels with Ukrainian labels for bait, depth, cast spot, tackle, and waterbody.
- Adjusted pike bait logic and guide copy: live bait remains best, while worm/nightcrawler rare bites are possible.
- Optimized `public/assets/transitions/grandma-house/grandma-house-flyin.mp4` from 8,775,399 bytes to 1,459,785 bytes.
- Safely inspected the dirty `D:\first-tackle` worktree and removed only the generated `.codex-remote-attachments` cache; review-worthy dirty asset/package-lock changes were left untouched.

Changed files/modules:

- `src/ui/panels.js`, `style.css`: guide tab routing, waterbody dashboard details, leaderboard clickable rows/profile modal, readable labels, profile/modal styling.
- `src/game/leaderboards.js`, `src/game/fishInventory.js`: recent/limit filters and trophy marker compatibility.
- `src/main.js`: full reset cleanup, reset tombstone, older-cloud-save guard, leaderboard profile action filtering.
- `src/game/fishChanceCalculator.js`, `src/i18n/translations.js`: pike rare bait behavior and guide text.
- `public/assets/transitions/grandma-house/grandma-house-flyin.mp4`: compressed active transition asset.

Verification:

- `npm.cmd run build` passed on the feature branch and after merging to `main`.
- `git diff --check` passed; only standard Windows LF-to-CRLF warnings were reported.
- Focused module smoke passed for guide tab separation, population-before-spots ordering, biggest leaderboard 50-row/recent filtering, trophy marker filtering, old trophy hiding, ordinary-fish exclusion, and pike live-bait preference with rare worm/nightcrawler compatibility.
- Mobile Playwright smoke at `390x844` passed for fish guide, waterbody dashboard, leaderboard profile opening, no raw internal leaderboard labels, Profile opening/scrolling, Settings opening/scrolling, and reset clearing seeded cache keys while leaving fresh save plus reset tombstone.
- Live URL returned HTTP 200 after deployment.

Measured state:

- Worktree size: about 200.69 MB in `D:\first-tackle-main-merge`.
- Common Git object store: about 352.26 MB at `D:\first-tackle\.git`.
- `node_modules`: about 79.12 MB.
- `dist`: about 34.83 MB.
- `public/assets`: about 33.62 MB.
- Final local build output: main JS 1,089.02 kB, CSS 174.05 kB, 3D chunk 6.45 kB.

Known remaining issues:

- Vite still warns that the main JS chunk is larger than 500 kB; deeper code splitting/lazy loading remains needed.
- Backend leaderboard rows are still latest-cloud-save aggregates, not server-authoritative verified catch records.
- Remote public profiles depend on whatever metadata the backend row provides; incomplete rows use graceful fallback/default avatar data.
- The original `D:\first-tackle` worktree remains dirty with many generated/optimized assets and a package-lock change that need separate review before keeping or discarding.

Recommended next tasks:

- Split/lazy-load heavy guide, leaderboard, profile/cloud, transition, and optional panel modules.
- Add backend public profile fields, fish IDs, trophy markers, and timestamps to leaderboard rows in a stable schema.
- Review and either adopt or discard the remaining dirty asset/package-lock changes in `D:\first-tackle`.
- Real-device smoke test guide, leaderboard profile modal, reset, and Settings/Profile sheets on iPhone Safari.

## Global Leaderboard Cloud Save Profile UX

Completed on branch `codex/fix-global-leaderboard-cloud-save-profile-ux`.

Frontend feature commit: `ac1b104` (`fix: restore global leaderboard and cloud save ux`).

Backend feature commit: `c65922c` (`fix: normalize leaderboard trophies and save overwrite`).

Main merge commit: pending final merge.

Deployment status: pending GitHub Pages and Railway verification after merge/push.

Completed work:

- Fixed the frontend leaderboard fallback rules so local records are used only when the API request fails. Successful server responses now show `Глобальна таблиця` or `Глобальна таблиця порожня`, and server-backed rows with time-only `caughtAt` values are no longer filtered out.
- Kept biggest-fish and trophy rules separate: biggest-fish accepts normal fish records; trophy boards still require real trophy markers and keep the 30-day/max-50 behavior.
- Added cloud save conflict actions: load cloud save, force-overwrite cloud with local progress, or continue locally. `force` overwrite is supported by the backend save sync schema/service.
- Added remember-me session persistence with localStorage/sessionStorage behavior and silent startup reconnect that refreshes account/profile metadata without importing cloud progress or opening Profile.
- Stopped Profile from auto-opening on startup and fixed iPhone-width Profile layout with safe-area aware near-full-width mobile CSS.
- Added no-bait notification feedback and throttling for cast attempts from the fishing UI/context action.
- Preserved scroll for tackle and fishing controls selections, removed the duplicated active-tackle intro block, hid the float `none` option, and migrated old/tutorial-complete saves to the goose-feather starter float.
- Backend leaderboard rows now include player identity/timestamps/details, trophy endpoints emit real species trophy groups with top trophies, and old score-only trophy rows are no longer generated by the new code.
- Inspected dirty `D:\first-tackle`; left the existing package-lock and asset changes untouched.

Changed files/modules:

- Frontend: `src/main.js`, `src/api/client.js`, `src/api/saveApi.js`, `src/ui/cloudSavePanel.js`, `src/ui/hud.js`, `src/ui/panels.js`, `src/ui/fishingMinigame.js`, `src/game/leaderboards.js`, `src/game/fishingMinigameLogic.js`, `src/game/tackle.js`, `src/i18n/translations.js`, `style.css`.
- Backend: `app/schemas/save.py`, `app/services/save_service.py`, `app/services/leaderboard_service.py`.

Verification:

- `npm.cmd run build` passed. Final build output: main JS `1,093.92 kB`, CSS `174.55 kB`, 3D chunk `6.45 kB`; Vite large chunk warning remains.
- `git diff --check` passed for frontend and backend with only standard LF-to-CRLF warnings.
- Backend `python -m compileall app` passed.
- Focused module smoke passed for production-shaped leaderboard rows, trophy filtering, starter float migration, hidden float-none option, and first-tap no-bait feedback.
- Mobile in-app browser smoke at `390x844` passed for Profile opening/scrolling (`366px` wide on a `390px` viewport) and Settings opening/scrolling.
- Local preview leaderboard API call fell back because production API CORS blocks `127.0.0.1`; direct production API check confirmed current biggest-fish rows exist with source `server-cloud-save`, count `7`, and time-only `caughtAt`.

Measured state:

- `dist`: `36,525,108` bytes.
- `public/assets`: `35,249,431` bytes.
- Main JS chunk remains over 500 kB and still needs deeper code splitting.

Known remaining issues:

- Production backend must be deployed before trophy rows switch from old score rows to species trophy groups.
- Leaderboards remain latest-cloud-save aggregates, not server-authoritative verified catch records.
- Localhost preview cannot fully verify the global API in-browser because the production backend CORS policy does not allow `127.0.0.1`.
- Original `D:\first-tackle` remains dirty with package-lock and many asset changes that need separate review.

Recommended next tasks:

- Deploy backend/main frontend and verify GitHub Pages origin shows global records from production API.
- Add real server-authoritative catch/trophy events for verified leaderboards.
- Split/lazy-load guide, leaderboard, profile/cloud, settings, and transition systems to reduce the main JS chunk.
