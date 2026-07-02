# Profile, Save, and Backend Audit

Date: 2026-07-02

Branch audited: `codex/profile-cloud-save-shortcut`

## Summary

The game is currently local-save first. Player profile and progression data are stored inside the normal save object, and cloud save sends that same save payload to the backend as JSON. The client owns all gameplay calculations today: profile normalization, XP, level, catch totals, coin totals, stars, and achievement flags.

This is a reasonable short-term shape for offline play and simple cloud backup. For future account profiles, leaderboards, and anti-cheat, the backend should become authoritative only for selected account and competitive records instead of trying to calculate the full game state immediately.

The XP/level system exists and is visible in the profile panel. Since level design is not settled, it should not be expanded right now. It is safe to keep the stored fields for migration and future use, but the visible level/XP presentation should stay de-emphasized or be hidden until progression design is intentional.

## 1. Current Player Profile Structure

Profile state is initialized in `src/game/state.js` under `playerProfile` and normalized in `src/game/profile.js`.

Current profile fields:

| Field | Purpose |
| --- | --- |
| `setupComplete` | Whether profile setup was completed. |
| `name` | Display name used by current UI. |
| `playerName` | Alias/back-compat profile name field. |
| `avatar` | Display avatar used by current UI. |
| `avatarId` | Alias/back-compat avatar field. |
| `avatarType` | Built-in vs custom avatar mode. |
| `customAvatarDataUrl` | Locally stored custom avatar image data. |
| `level` | Cached level derived from XP. |
| `xp` | Total profile XP. |
| `totalCoinsEarned` | Lifetime coins earned through rewards/sales. |
| `fishCaughtTotal` | Lifetime total fish caught. |
| `locationsUnlocked` | List of unlocked location ids. |
| `achievementFlags` | Small boolean milestone flags. |
| `selectedStarId` | Selected achievement/star badge. |
| `selectedStarColor` | Display color for selected star. |
| `nameCustom` | Whether the player manually customized the name. |
| `createdAt` | Profile creation timestamp. |
| `updatedAt` | Last profile update timestamp. |

Fields currently used in UI:

- Profile header: `name`, `avatar`, `selectedStarId`, `selectedStarColor`, `level`, `xp`.
- Profile stats: current coins from `state.money`, `fishCaughtTotal`, `totalCoinsEarned`, keepnet count, trophy count, earned stars, biggest fish, favorite water, unlocked water count.
- Profile editing: `name`, built-in avatars, `avatarType`, `customAvatarDataUrl`.
- Cloud save section: cloud session/profile metadata, not `playerProfile` itself.
- Achievement/star display: `selectedStarId`, `selectedStarColor`, derived star data.

Fields saved locally:

- The full `playerProfile` object is included in the normal cleaned save object from `src/game/save.js`.
- Runtime-only queues and transient UI fields are stripped, but profile data is not stripped.

Fields included in cloud save:

- Cloud upload uses `exportSave(gameState)` and sends `exported.save` as the cloud payload.
- Because `playerProfile` is inside that save payload, all current profile fields are included in cloud save.
- No separate backend profile endpoint is used for gameplay profile data yet.

## 2. Current Level and XP Logic

XP is stored at:

- `state.playerProfile.xp`

Level is calculated in:

- `src/game/profile.js`
- `getXpForLevel(level)`
- `getLevelForXp(xp)`
- `getLevelProgress(profile)`

The current formula is simple and deterministic:

- Level 1 starts at 0 XP.
- Level 2 threshold is 100 XP.
- Level 3 threshold is 250 XP.
- Level 4 threshold is 450 XP.
- Higher levels scale with `25 * (level - 1) * (level + 2)`.

Actions that award XP:

- Catching fish through `addCaughtFish` in `src/game/fishInventory.js`.
- Catch XP comes from `awardCatchXp` in `src/game/profile.js`.
- The amount is based on a base catch value, fish weight, and trophy rarity bonus.

Actions that update lifetime profile values but do not award XP:

- Fish sales and some rewards update `totalCoinsEarned`.
- Catch/journal/trophy changes update derived stats and stars.

Visible UI:

- Level and XP progress are visible in the player profile panel.
- XP gain and level-up feedback can appear as small non-blocking messages.

Safety recommendation:

- Do not expand this system yet.
- Keeping `xp` and `level` in saves is safe for migration and future compatibility.
- The main risk is design clarity, not technical correctness: visible levels imply a designed progression loop that does not fully exist yet.
- If progression remains undecided, the next small UI change should be to hide or soften level/XP display rather than add more rewards.

## 3. Local Save and Cloud Save

Local save is handled in `src/game/save.js`.

Stored locally:

- Save version.
- Money and inventory.
- Purchased tackle/gear.
- Travel and unlocked location state.
- Timers, day/time, player position, and fishing state.
- Fish basket, catch journal, trophies, achievement/star state.
- Quests, cafe orders, tutorial/progress flags.
- Settings and non-transient UI preferences.
- Player profile.

Not intended to persist:

- Audio queue.
- Feedback messages.
- Active scene/catch result/fishing minigame runtime data.
- Some drawer/location transition runtime UI state.
- `cloudSave` runtime field.

Cloud save flow:

- `syncCurrentSaveToCloud` in `src/main.js` first saves locally, then calls `exportSave(gameState)`.
- `src/api/saveApi.js` sends `saveVersion`, `revision`, `clientUpdatedAt`, and `payload` to `/save/sync`.
- `payload` is the client-generated JSON save.
- Download calls `/save/load`, confirms before overwrite, backs up the local save, imports the cloud payload, normalizes it, and saves it locally.

Backend behavior from the current client contract:

- The backend appears to store and return a JSON save payload plus metadata/revision.
- The client does not rely on the backend to calculate XP, level, profile stats, economy, stars, or achievements.

Old save migration:

- Old local keys are checked before falling back to a new save.
- `migrateSave` upgrades older versions to the current shape.
- `mergeState(createInitialState(), saved)` and `ensureProfileState` provide safe defaults for missing profile fields.
- Profile aliases such as `name/playerName` and `avatar/avatarId` are normalized.
- This is safe for old saves as long as future fields continue to be optional and defaulted.

## 4. Performance-Sensitive Frontend Logic

| Area | Current behavior | Keep frontend | Backend candidate | Frontend optimization candidate |
| --- | --- | --- | --- | --- |
| Main render loop | Uses `requestAnimationFrame` for world/player/minigame updates. | Yes. Rendering and moment-to-moment simulation should stay client-side. | No. | Keep object allocation low inside frame updates. |
| HUD render checks | `renderHud` builds a large `JSON.stringify` snapshot across many state sections. | Yes. | No. | Replace broad stringify snapshots with smaller dirty flags or focused selectors later. |
| HUD DOM updates | `hud.render` replaces large `innerHTML` when the snapshot changes. | Yes. | No. | Split stable panels from frequently changing counters; avoid rebuilding hidden panel content. |
| Autosave signatures | Local and cloud autosave compare large JSON signatures. | Yes. | Cloud metadata can be backend-owned. | Use revision/dirty markers instead of repeated full-save stringification as saves grow. |
| Profile panel | Builds stats, cloud section, stars, and achievement markup together. | Yes. | Account profile display can be backend-backed later. | Lazy-render achievement details only when opened. |
| Achievement/star summaries | Loops fish/species data and derived trophy/star state. | Mostly yes. | Server validation only for competitive records. | Cache derived summaries until fish/journal state changes. |
| Fish basket operations | Multiple `filter`, `reduce`, and status scans over basket entries. | Yes. | Leaderboard submissions only. | Add indexed counts if basket size grows. |
| Cafe/quest sync | Runs during HUD refresh and can scan orders/fish state. | Yes for now. | Server events only if economy becomes live. | Run only when relevant state changes. |
| World map texture update | Triggered as part of HUD render path. | Yes. | No. | Ensure textures are reused and not recreated unnecessarily. |

What can stay on frontend:

- Fishing minigame state.
- Rendering and map interaction.
- Local inventory and moment-to-moment economy.
- Offline progress calculation.
- Non-competitive achievement/star previews.

What could eventually move to backend:

- Account profile identity.
- Cloud save metadata and conflict decisions.
- Leaderboard records.
- Validated trophy/biggest-fish submissions.
- Account-wide achievements or seasonal/event economy data.

What should simply be optimized on frontend:

- Large state stringification for render/autosave signatures.
- Full HUD `innerHTML` replacement.
- Hidden panel markup generation.
- Repeated scans of fish basket and journal data.

## 5. Future Backend Candidates

Good backend candidates:

- Authenticated account profile: display name, avatar choice, account id, email, created date.
- Guest profile migration: attach a local guest save/profile to a new or existing account.
- Cloud save: keep the current JSON payload model, plus stronger revision/conflict metadata.
- Leaderboards: store validated result records instead of trusting full local save totals.
- Anti-cheat and validation: validate important records such as biggest fish, trophy catches, stars, and high-value economic milestones.
- Achievements/stars: keep local unlocks for offline play, but validate account-wide or competitive versions server-side.
- Economic events: only if there are shared/live market events, daily challenges, or seasonal modifiers.

Avoid moving too soon:

- Frame-by-frame fishing logic.
- Normal local inventory changes.
- Basic offline progression.
- UI-only profile summaries.

## 6. Guest and Account Flow Proposal

Recommended simple flow:

1. Player starts as guest.
   - Create a local save immediately.
   - Store a local guest id or installation id.
   - Game remains fully playable offline.

2. Player registers or logs in.
   - Authenticate through the existing cloud/account flow.
   - Fetch account profile and cloud save status.

3. Convert guest progress to account.
   - If the account has no cloud save, upload the current local guest save.
   - If the account has an existing cloud save, ask the player to choose local progress or cloud progress.
   - Always create a local backup before replacing local data.

4. Continue local-first while offline.
   - Local autosave remains the source of immediate continuity.
   - Cloud sync is queued or retried when online and authenticated.

5. Sync online.
   - Compare local updated time/revision with server revision.
   - Upload local changes when safe.
   - Confirm before overwriting local progress from cloud.

This keeps the game usable without login while making account creation feel like an upgrade instead of a gate.

## 7. Leaderboard Proposal

Simple categories based on existing data:

- Biggest fish overall.
- Biggest fish by species.
- Biggest fish by location.
- Most trophy fish.
- Most rare/very rare/rarest trophy fish.
- Most completed species stars.
- Most unlocked stars.
- Most coins earned.
- Best result by location and fish type.

Suggested leaderboard record shape:

| Field | Purpose |
| --- | --- |
| `accountId` | Authenticated owner. |
| `guestMigrationId` | Optional source id for converted guest records. |
| `fishId` | Species or fish identifier. |
| `locationId` | Location/water where record happened. |
| `weightGrams` | Competitive value for biggest fish. |
| `trophyTier` | Trophy classification if any. |
| `starsEarned` | Competitive star count where relevant. |
| `coinsEarnedTotal` | Lifetime economy leaderboard value. |
| `caughtAt` | Client/server timestamp pair. |
| `saveRevision` | Save revision associated with the submission. |
| `validationStatus` | Pending, accepted, rejected, or reviewed. |

Leaderboard safety:

- Do not trust local totals blindly for competitive rankings.
- Prefer submitting individual record events, then let the backend validate and aggregate.
- Keep local leaderboards or personal bests available offline as non-authoritative previews.

## Recommended Next Steps

- Keep current profile fields in the save for compatibility.
- Do not add more XP or level mechanics until progression design is decided.
- Consider hiding or de-emphasizing level/XP in profile UI if it creates player expectations too early.
- Define a backend account profile schema separately from the local save blob.
- Add lightweight save metadata over time: local updated time, client id, schema version, revision, and optional checksum.
- Optimize frontend render/autosave invalidation before adding larger systems.
