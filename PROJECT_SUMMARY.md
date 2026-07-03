# First Tackle Project Summary

## Project Overview

First Tackle is a Vite browser game about rural fishing, village travel, bait gathering, market selling, player profile progression, local saves, and early cloud-save/backend integration. The current build is a local-first playable frontend with a planned gradual migration toward server-owned account, save, leaderboard, and trusted gameplay state.

## Current Status

- Playable static frontend prototype using localStorage as the primary save path.
- Cloud account/save UI and API clients exist and point to a Railway API by default.
- Core gameplay is still frontend-owned and offline-capable.
- Server-authoritative catch support is scaffolded behind a disabled feature flag.
- The worktree is dirty with many unrelated asset/package-lock changes that predate this documentation task.
- Documentation system introduced in root files: `PROJECT_SUMMARY.md`, `TODO.md`, and `CHANGELOG.md`.

## Tech Stack

- Frontend: Vite 6, plain JavaScript ES modules, CSS, HTML canvas/WebGL.
- Rendering: Three.js 0.181.2 for the main scene and optional 3D fishing prototype.
- Storage: localStorage save version 2, export/import JSON, cloud JSON payload sync.
- Backend integration: fetch-based API clients for auth, save sync/status/load, game endpoints, and leaderboards.
- Deployment: GitHub Pages workflow for static frontend, Railway URL configured for the API.
- Package scripts: `npm run dev`, `npm run build`, `npm run preview`.

## Architecture

### Frontend

- Entry point: `src/main.js` initializes state, Three.js renderer, world, player, HUD, audio, save/autosave, cloud save, and input actions.
- State source: `src/game/state.js` creates the complete default game state.
- Persistence: `src/game/save.js` migrates legacy saves, normalizes loaded state, strips transient UI/audio fields, and persists save version 2.
- UI rendering: `src/ui/hud.js`, `src/ui/panels.js`, `src/ui/locationScene.js`, `src/ui/mapOverlay.js`, and feature-specific UI modules render mostly through template strings.
- Gameplay modules are split under `src/game/` for fishing, fish inventory, economy, market, locations, travel, profile, quests, cafe orders, tackle, time, and authority wrappers.

### Backend

- Backend route code is not in this repository.
- Current client base URL defaults to `https://first-tackle-api-production.up.railway.app`.
- Existing docs recommend a separate API service with PostgreSQL, auth, cloud save, leaderboards, and later trusted gameplay validation.
- Backend stack plans are mixed across docs: newer plan notes mention Node.js API, while older server implementation docs mention FastAPI. Resolve this before starting backend implementation.

### API

- `src/api/client.js` centralizes base URL, bearer token, cloud session persistence, and `ApiError`.
- `src/api/authApi.js` supports register, login, refresh, profile fetch, and local logout/session clearing.
- `src/api/saveApi.js` supports `/save/load`, `/save/status`, and `/save/sync`.
- `src/api/gameApi.js` wraps future game endpoints and leaderboards, with mock leaderboard fallback if server requests fail.
- Planned server endpoints include catch resolve, shop buy, fish sell/release, game profile sync, game config, and leaderboard routes.

### Cloud Save

- Local save remains primary and non-blocking.
- Cloud session is stored under `first-tackle-cloud-session-v1`.
- Cloud save sends `saveVersion`, `revision`, `clientUpdatedAt`, checksum, and the cleaned save payload.
- Downloads back up local save before overwrite.
- Cloud autosave requires an access token, is debounced/throttled, and failures should not block play.

### Assets

- Static assets live under `public/assets/`.
- Major asset groups: maps, locations, time-of-day backgrounds, fish/species art, catch cards, items, profile avatars, minigame art, audio, intro/transition videos, and a GLB model.
- Vite base path is `/first-tackle/`; asset helpers should be used for public asset URLs.
- Large assets are a known mobile performance risk and should be compressed or given mobile variants.

## UI / UX Decisions

- Local/offline play must remain available without account login.
- Main map and location scenes are image-led, with hotspot navigation.
- Fishing flow should favor direct access to the actual fishing scene; avoid extra blocking intermediate panels.
- Mobile menus must keep important save/profile/cloud actions visible but compact.
- Cloud save is presented as an upgrade over guest play, not a gate.
- The HUD currently uses broad render snapshots and large HTML replacement; this is acceptable for now but a performance target.
- Low-power/mobile behavior should reduce decorative animation, video work, and unnecessary rendering.
- Time-of-day backgrounds use shared helpers and buckets: dawn/dusk, day, night.

## Project Principles

- Preserve local-first playable behavior.
- Keep gameplay, save, and UI changes small and verifiable.
- Prefer data-driven helpers for repeated game logic and asset selection.
- Backend migration should be gradual: account/cloud save first, trusted competitive state later.
- Do not trust client-only totals for competitive leaderboards long term.
- Avoid backend work as a substitute for frontend performance optimization.
- Do not modify unrelated dirty assets or generated files unless the task requires it.

## Implemented Features

- Clickable illustrated world map and location scenes.
- EN/UK localization with saved language selection.
- Profile setup, avatars, custom avatar support, XP/level fields, selected achievement stars, and derived profile stats.
- Tutorial/starter tackle flow, including Grandma drawer minigame.
- Garden worm digging/stone-search bait collection.
- Fishing minigame with bait/depth/spot selection, bite timing, strike, catch result, keep/release, live bait hooks, and item modifiers.
- Multiple fish species, water distributions, fish weights, values, journal, trophies, and catch cards.
- Keepnet/fish basket with individual fish entries and processing states.
- Market buying/selling, item effects, bait/tackle/transport items, and price multipliers.
- Travel/unlocks for canal, sluice, fire ponds, Greada, Lake Tur, and mining lake.
- Quests, cafe orders, Grandma trust/bus unlock direction, and fish processing.
- Local save/load/reset/export/import with migrations.
- Cloud auth/save panel, upload/download, save status, autosave hooks, and session persistence.
- Mock/fallback leaderboard display with planned server routes.
- Local authority wrapper for catch storage, fish release, market buy, and fish sale.
- Optional server catch path behind `VITE_SERVER_AUTHORITATIVE_CATCH=false` by default.
- Audio manager with settings, music/SFX controls, and fallback sounds.
- Time-of-day helper and background assets for map/location variants.
- GitHub Pages deploy workflow.

## Features In Progress

- Server-authoritative player state and catch resolution.
- Backend/cloud save hardening and conflict behavior.
- Leaderboards backed by verified server records.
- Mobile performance pass for large assets, render loops, CSS motion, videos, and HUD rendering.
- Time-of-day background verification and related UI polish from `public/codex_task_time_of_day_and_pending_fixes.txt`.
- Backend stack decision and first API service implementation.

## Known Bugs

- Some existing docs display mojibake in PowerShell output, likely due to encoding/rendering mismatch.
- Current worktree contains many modified/deleted/untracked assets; their intentional state is not documented in git history.
- Pending task file reports a broken pre-fishing intermediate screen and guide scroll jumping on long lists.
- Worm collection needed verification that displayed found amounts exactly match granted rewards.
- Some leaderboard data is mock/fallback and not server-verified.
- Server catch mode is not production-ready and needs real backend response testing.

## Known Risks

- Dirty worktree can make future merges and commits ambiguous.
- Current branch is behind `origin/main` by 5 commits and ahead of its tracking branch by 3 commits before the documentation commit.
- Large PNG/MP4/GLB/MP3 assets can hurt mobile load, memory, battery, and heat.
- Broad HUD render snapshots and full `innerHTML` replacement may become expensive as UI grows.
- Autosave/cloud signatures stringify large save payloads.
- Cloud save currently stores client-generated JSON; cheating remains possible for leaderboards until backend validation exists.
- Save schema migrations can become painful if versioning discipline slips.
- Backend plan inconsistency (Node.js vs FastAPI) should be resolved before coding the API.

## Recent Architectural Decisions

- Keep the frontend static and local-first while adding backend capabilities gradually.
- Add `PlayerState` as a normalized bridge toward server source of truth.
- Centralize high-value state mutations through `src/game/gameAuthority.js`.
- Keep `VITE_SERVER_AUTHORITATIVE_CATCH` disabled by default and fall back to local authority.
- Use cloud save as JSON payload backup/sync before moving individual systems server-side.
- Pause/reduce some decorative work when panels are open, hidden, or low-power paths apply.
- Use shared time-of-day background helpers instead of per-screen hardcoded asset logic.

## Important Files

- `package.json`: scripts and dependencies.
- `vite.config.js`: GitHub Pages base path.
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy workflow.
- `src/main.js`: app bootstrap and action orchestration.
- `src/game/state.js`: default game state and shop item definitions.
- `src/game/save.js`: local save, import/export, migration, normalization.
- `src/game/playerState.js`: normalized future server-owned state shape.
- `src/game/gameAuthority.js`: local/server authority abstraction for key mutations.
- `src/game/fishingMinigameLogic.js`: fishing interaction and catch flow.
- `src/game/fishInventory.js`: keepnet/fish entries and storage.
- `src/game/economy.js`, `src/game/market.js`: buying, selling, prices.
- `src/game/locations.js`, `src/game/travel.js`: water access and travel rules.
- `src/game/profile.js`: profile, avatars, tutorial, XP/level.
- `src/api/*.js`: auth, save, game, and client API wrappers.
- `src/ui/*.js` and `src/ui/*.css`: HUD, map, scenes, minigames.
- `src/utils/timeOfDayBackgrounds.js`, `src/utils/worldMapAsset.js`, `src/utils/locationAsset.js`: asset selection helpers.
- `docs/`: backend plans, performance audits, server contracts, deploy notes.

## Large Assets

- `public/assets/models/fisher_boy_base.glb` around 8.4 MB.
- `public/assets/audio/music/ambient_day.mp3` around 4.8 MB.
- `public/assets/transitions/grandma-house/grandma-house-flyin.webm` around 3.6 MB.
- `public/assets/maps/world-map-desktop.png` around 3.0 MB.
- `public/assets/transitions/grandma-house/grandma-house-flyin-2.mp4` around 2.7 MB.
- `public/assets/transitions/first-catch/first-crucian-catch.mp4` around 2.5 MB.
- `public/assets/locations/cafe/cafe-location.png` around 2.4 MB.
- `public/assets/intro/intro-childhood-fishing.mp4` around 2.3 MB.
- `public/assets/locations/grandma-house-day.png` around 2.1 MB.
- Main-map time-of-day PNGs and transition videos are also over 1 MB each.

## Current Branch

- Branch: `codex/player-state-authority-phase1`.
- Tracking: `origin/codex/player-state-authority-phase1`.
- Remote: `origin https://github.com/TopicIt/first-tackle.git`.
- Before this documentation commit, branch status was ahead of tracking by 3 commits.

## Merge Status

- `HEAD...origin/codex/player-state-authority-phase1`: local ahead 3, behind 0 before this documentation commit.
- `HEAD...origin/main`: local ahead 0, behind 5 before this documentation commit, meaning current branch does not include the latest `origin/main`.
- No merge operation is currently in progress.
- Worktree is not clean because of unrelated modified/deleted/untracked assets, package-lock change, worktrees, source assets, and docs.

## Recent Important Commits

- `f147fae` Merge branch `codex/cloud-market-buffs-leaderboard-pass`.
- `cc78e4f` feat: unify cloud save ux and add leaderboard pass.
- `f5af5d7` Merge branch `codex/player-state-authority-phase1`.
- `d51051f` Add player state authority foundation.
- `2681758` Prepare mobile beta server ready pass.
- `db83ad8` feat: add local game authority layer.
- `e631685` docs: plan server authoritative migration.
- `8621fc9` feat: surface cloud save and audit mobile performance.
- `2aab45c` docs: audit profile save and backend readiness.
- `3df0c79` Add profile cloud save shortcut.

## TODO Snapshot

- High priority: clean/confirm dirty asset state, verify pending time-of-day/fishing/guide/worm/mobile fixes, decide backend stack, and stabilize cloud save conflict handling.
- Medium priority: compress/mobile-optimize large assets, reduce HUD render/autosave stringification, add real leaderboard validation, and strengthen save metadata.
- Low priority: improve optional 3D prototype cleanup/gating, expand guide polish, and improve deployment/build metadata docs.

## Recommended Next Steps

- Confirm whether current modified/untracked assets should be committed, reverted, or moved out of the repo.
- Rebase or merge latest `origin/main` after protecting any intentional local asset work.
- Run the pending time-of-day and fishing-flow verification task from `public/codex_task_time_of_day_and_pending_fixes.txt`.
- Resolve backend stack choice, then create the first backend health/auth/save skeleton outside or inside the repo by explicit decision.
- Add measured mobile performance profiling before more visual features.
- Keep root docs updated before starting any long new Codex chat.

## Files Most Likely To Change Next

- `PROJECT_SUMMARY.md`, `TODO.md`, `CHANGELOG.md`.
- `src/main.js`.
- `src/ui/locationScene.js`, `src/ui/locationScene.css`.
- `src/ui/mapOverlay.js`, `src/ui/mapOverlay.css`.
- `src/ui/panels.js`, `src/ui/hud.js`.
- `src/game/wormDigging.js`, `src/game/guideData.js`, `src/game/locations.js`, `src/game/mapHotspots.js`.
- `src/utils/timeOfDayBackgrounds.js`, `src/utils/worldMapAsset.js`, `src/utils/locationAsset.js`.
- `src/api/*.js`, `src/game/playerState.js`, `src/game/gameAuthority.js`.
- Large public assets if compression/mobile variants are addressed.

## Important Agreements / Notes

- Documentation workflow: update `PROJECT_SUMMARY.md`, `TODO.md`, and `CHANGELOG.md` after every major completed feature, before merging into `main`, before starting a new long development chat, whenever context becomes large, and whenever requested by the user.
- Major-task Definition of Done: project builds successfully, introduced errors are fixed, `PROJECT_SUMMARY.md` updated, `TODO.md` updated, `CHANGELOG.md` updated, commit created, commit hash reported, and push status reported.
- New chats should read the three root docs first before inspecting code.
- Root docs should stay concise, factual, and updated from real repo state.
- This task is documentation-only and must not change gameplay, backend logic, assets, or build configuration.

## Definition of Done

- Build passes with `npm run build`.
- No introduced errors remain.
- `PROJECT_SUMMARY.md` reflects current project state.
- `TODO.md` reflects current priorities with checkboxes.
- `CHANGELOG.md` records major completed work.
- Commit is created for the completed major task.
- Commit hash is reported to the user.
- Push status is reported to the user.
