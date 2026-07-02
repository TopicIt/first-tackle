# Mobile Performance and Cloud Save Menu Audit

Date: 2026-07-02

Branch: `codex/cloud-save-menu-performance-audit`

## Summary

Cloud Save is now visible from the main menu/profile area, but the bigger mobile heating risk is still frontend rendering work. Backend migration will help account, validation, sync, and leaderboard systems, but it will not fix GPU/CPU pressure from WebGL, large images, videos, CSS animations, full DOM rebuilds, or repeated save serialization.

The most important optimization direction is to reduce work while the player is in menus, profile/settings panels, startup screens, or inactive tabs; then reduce mobile asset weight and animation/video cost.

## Cloud Save Menu Visibility

Current implementation:

- Main menu now includes a compact Cloud Save card.
- Mobile menu sheet also includes the same Cloud Save card.
- The card reuses existing `cloud:*` actions and does not duplicate auth forms.
- Logged-out state shows:
  - `Гість: прогрес зберігається локально`
  - `Увійдіть, щоб увімкнути хмарне автозбереження`
- Logged-in state shows:
  - `Хмарне автозбереження увімкнено`
  - account/email if available
  - `Останнє збереження: ...`
- Busy/saved states show:
  - `Автозбереження...`
  - `Збережено в хмару`

Reachable actions:

- Save locally: main menu Cloud Save card and existing save controls.
- Login/cloud panel: `Увійти / Хмара`, routed to the existing Cloud Save settings panel.
- Upload to cloud: direct compact button when logged in.
- Download from cloud: direct compact button when logged in; existing confirmation/backup behavior remains in the current cloud download path.
- Logout: direct compact button when logged in.

Autosave safety:

- Cloud autosave still requires an access token.
- Existing debounce/throttle remains in place.
- Local autosave still uses a meaningful-progress signature before queueing cloud autosave.
- Cloud failures remain non-blocking and surface as status text.

## Hotspot Classification

| Hotspot | Evidence | Classification | Notes |
| --- | --- | --- | --- |
| Continuous WebGL render loop | `src/main.js` uses `requestAnimationFrame(animate)` and `renderer.render(...)` every visible frame. | frontend optimize / should stay frontend | This is the primary heat suspect. Backend cannot reduce GPU render cost. |
| Decorative world animation | `world.animate(delta)` runs in the map loop when low-power mode is off. | frontend optimize | A small fix now pauses this while menu/profile/settings-style overlays are open. |
| Fishing minigame ticking | `tickFishingMinigame(gameState, performance.now())` runs from the main loop. | should stay frontend | Timing-sensitive gameplay should stay client-side. Optimize only if profiling shows cost. |
| Full HUD rebuilds | `src/ui/hud.js` assigns `root.innerHTML = ...` for large UI sections. | frontend optimize | Split hot counters from heavy hidden panels later. |
| HUD snapshot stringification | `src/main.js` builds a large `JSON.stringify` snapshot for render invalidation. | frontend optimize | Replace with dirty flags/selectors before adding larger UI systems. |
| Autosave signatures | `queueAutosave` and `getCloudSaveSignature` stringify large save payloads. | frontend optimize | Current throttles are good; future saves may need revision/dirty markers. |
| CSS animations in fishing view | Many infinite animations in `src/ui/fishingMinigame.css`. | frontend optimize | Keep core bobber feedback; reduce decorative bird/insect/reed/ripple animations on mobile/low-power. |
| CSS animations in location scenes | Infinite pan/zoom/light/dust/haze effects in `src/ui/locationScene.css`. | frontend optimize | Disable more aggressively when panels are open or low-power/mobile is active. |
| Map overlay animations | Light drift, water shimmer, hotspot pulse in `src/ui/mapOverlay.css`. | frontend optimize | Hotspot pulse is useful; ambient shimmer/light can be reduced on mobile. |
| Transition and intro videos | Multiple MP4/WebM files, including 3.61 MB, 2.68 MB, 2.49 MB, and 2.26 MB assets. | frontend optimize | Defer video, prefer lower-resolution mobile variants, and avoid autoplay unless needed. |
| Large images/maps/locations | Largest images include 2.96 MB world map, 2.4 MB cafe, 2.06 MB house, 1.6 MB time-of-day maps. | frontend optimize | Add mobile variants and compression before backend work. |
| 3D prototype renderer | `src/ui/fishingPrototype3d.js` has a separate WebGL renderer/requestAnimationFrame path. | frontend optimize / low priority if disabled | Keep off by default; ensure cleanup and low-power gating stay reliable. |
| Audio preload | `audioManager.js` sets music preload to `auto`. | low priority | Mostly network/memory; not the first heating suspect. |
| Backend-save JSON blob | Cloud save uploads full client save JSON. | can move to backend later | Useful for sync/validation, but not a render heating fix. |
| Leaderboards/profile sync | Not performance-critical for frame heat. | can move to backend later | Backend is appropriate for account/profile/leaderboards, not animation/render loops. |

## What Should Stay Frontend

- WebGL/canvas rendering.
- Fishing minigame timing and input feedback.
- Immediate local save.
- Offline gameplay state.
- Basic local inventory/economy updates.
- UI panel rendering, after frontend optimization.

## What Can Move Backend Later

- Authenticated profile records.
- Guest-to-account migration.
- Cloud save conflict metadata and revision history.
- Leaderboard submissions and aggregation.
- Anti-cheat validation for important records.
- Account-wide achievements/stars if they become competitive.
- Shared economic events, if the economy becomes live/server-wide.

## Priority Plan

Priority 1:

- Stop unnecessary loops/work when paused, menu/profile/settings is open, or tab is hidden.
- Reduce animation/video/render work on mobile and low-power mode.
- Lazy-load non-critical images.
- Compress large images.
- Defer 3D/video until needed.

Priority 2:

- Add mobile image variants for maps, locations, fish cards, and large UI art.
- Add PWA/cache strategy for stable assets.
- Split the JS bundle if startup cost grows.
- Reduce DOM churn by rendering hidden panels lazily and updating counters in place.
- Replace large `JSON.stringify` render/autosave signatures with dirty flags or scoped selectors.

Priority 3:

- Backend validation for leaderboard records.
- Backend-backed account profile.
- More robust cloud-save conflict resolution.
- Guest profile migration.

## Small Safe Fix Made

Added a low-risk frontend guard in `src/main.js`:

- When startup/profile/settings/menu-style overlays are open, decorative `world.animate(delta)` no longer runs.
- Player/camera update, HUD refresh, minigame tick, autosave, and rendering behavior remain intact.
- Existing low-power mode behavior remains unchanged.

This is not a complete heating fix. It is a small reduction in unnecessary background animation while UI panels are open.

## Next Measurements To Run

- Chrome Performance profile on a flagship Android device for 60 seconds on map, fishing minigame, and profile/settings open.
- Chrome Performance Monitor for CPU, JS heap, DOM nodes, and GPU raster pressure.
- Network/coverage check for loaded but unused images/videos on first session.
- Lighthouse or WebPageTest only after gameplay profiling; PageSpeed should not drive gameplay optimization decisions.
