# First Tackle Project Summary

Updated: 2026-07-06

## Current State

First Tackle is a local-first browser fishing game with optional account/cloud save support. The frontend remains responsible for rendering, offline play, fishing UI, and local save continuity. The available backend source lives in `D:\first-tackle-api` and currently supports auth, profile, cloud saves, and now read-only leaderboard endpoints aggregated from latest cloud saves.

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
