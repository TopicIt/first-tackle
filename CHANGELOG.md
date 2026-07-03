# First Tackle Changelog

## Added

- Root documentation system: `PROJECT_SUMMARY.md`, `TODO.md`, and `CHANGELOG.md`.
- Documentation workflow and major-task Definition of Done.
- Local-first save version 2 with migration, export/import, backup, and cleaned runtime fields.
- Player profile progression, avatars, custom avatar support, XP/level fields, achievement stars, and profile stats.
- Cloud auth/save client integration, cloud save panel, upload/download, status, and autosave hooks.
- Normalized `PlayerState` bridge for future server source of truth.
- Local game authority layer for catch storage, release, market buy, and market sell flows.
- Disabled-by-default server catch path via `VITE_SERVER_AUTHORITATIVE_CATCH`.
- Mock/fallback leaderboard UI and API wrapper.
- Time-of-day background helper and map/location background asset support.
- Mobile/cloud-save visibility and performance audit documentation.
- GitHub Pages deploy workflow and build metadata support.

## Improved

- Local/offline gameplay remains available while cloud save and backend hooks are added.
- Save loading now normalizes missing profile, tackle, market, travel, UI, achievement, and player-state fields.
- Cloud save failures are treated as non-blocking gameplay events.
- Mobile UI exposes cloud save from menu/profile/settings areas.
- Performance behavior reduces some decorative work while panels are open or the document is hidden.
- Fish, market, tackle, travel, guide, profile, and quest systems are split into focused modules.

## Fixed

- Older local saves migrate into the current save shape instead of crashing on missing fields.
- Runtime-only UI fields, audio queues, feedback, active fishing state, and cloud runtime UI are stripped from saved payloads.
- Cloud download path backs up local save before overwriting.
- Leaderboard fetch has a local mock fallback when server data is unavailable.

## Refactored

- High-value gameplay mutations are routed through `src/game/gameAuthority.js` for future backend parity.
- Player/account/economy/inventory/keepnet/progress/stats data is mirrored into a normalized `PlayerState`.
- API calls are centralized under `src/api/`.
- Time-of-day asset selection is centralized in `src/utils/timeOfDayBackgrounds.js`.
- Location, map, minigame, and HUD rendering are separated into UI modules.
