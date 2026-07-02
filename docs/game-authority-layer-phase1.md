# Game Authority Layer Phase 1

Date: 2026-07-02

Branch: `codex/game-authority-layer-phase1`

## Summary

This phase adds a local game authority layer that keeps the game fully playable offline while preparing the codebase for server-authoritative gameplay. The new layer centralizes the highest-value mutations behind result objects shaped like future backend responses.

No backend or Railway changes are required. `SERVER_AUTHORITATIVE_CATCH` remains disabled by default.

## What Was Centralized

New module:

- `src/game/gameAuthority.js`

Authority functions:

- `getAuthorityMode()`
- `resolveCatch({ state, serverPayload, localResolve })`
- `addFishToStorage({ state, catchResult, context })`
- `removeFishFromStorage({ state, fishEntryId, fishId, reason })`
- `buyItem({ state, itemId })`
- `sellFish({ state, saleType, fishEntryId, fishId })`
- `applyPlayerStatePatch(state, patch)`

Centralized paths:

- Catch storage now goes through `addFishToStorage`.
- Catch result resolution now goes through `resolveCatch`.
- Keepnet release paths now go through `removeFishFromStorage`.
- Market purchases now go through `buyItem`.
- Market sales now go through `sellFish`.

The underlying local helpers still perform the actual game logic:

- `src/game/fishingMinigameLogic.js`
- `src/game/fishInventory.js`
- `src/game/economy.js`

This keeps current balance and UI behavior unchanged.

## Authority Result Shape

Local catch resolution returns:

```json
{
  "ok": true,
  "mode": "local",
  "result": {
    "caught": true,
    "fish": {
      "id": "crucian",
      "weightGrams": 420,
      "weightKg": 0.42,
      "rarity": "trophy",
      "value": 51,
      "trophyTier": "normal"
    },
    "rewards": {
      "coins": 50,
      "xp": 0
    },
    "playerStatePatch": {
      "coins": 1050,
      "fishCaughtTotal": 1,
      "inventory": {
        "crucian": 1
      }
    },
    "localRevision": 1
  },
  "metadata": {
    "authorityMode": "local",
    "verified": false,
    "revision": 1
  }
}
```

Notes:

- `verified` is `false` for local authority.
- Future server responses can return `verified: true`.
- Metadata is returned from authority calls; it is not loudly shown in UI.
- Save format is not drastically changed.

## Server Feature Flag

Existing flag:

- `SERVER_AUTHORITATIVE_CATCH`
- default: `false`
- env override: `VITE_SERVER_AUTHORITATIVE_CATCH=true`

When enabled:

1. `resolveCatch` tries `gameApi.resolveCatchOnServer(payload)`.
2. If the server returns a valid result, the authority mode is `server`.
3. If the endpoint fails or is missing, the game falls back to local authority.
4. Fallback result mode becomes `fallback-local`.

The flag is off by default, so normal offline/local gameplay remains unchanged.

## What Is Still Local

Still frontend-owned after phase 1:

- Fish candidate selection and bite probability.
- Bobber/minigame timing and animation.
- Local catch roll before the authority wrapper when the feature flag is off.
- Bait consumption during cast.
- Rod/line break checks.
- Quest rewards.
- Cafe order completion rewards.
- Travel ticket purchases.
- Fish processing at home: clean, salt, dry, smoke.
- Local save and cloud-save JSON payload.
- XP/level calculation.

These are intentionally left local to avoid a risky refactor. The authority layer is a first doorway, not the full migration.

## Future Server Migration Path

Recommended order:

1. Implement backend `POST /api/game/catch/resolve`.
2. Enable `VITE_SERVER_AUTHORITATIVE_CATCH=true` in a test/dev environment only.
3. Return authoritative fish result and `playerStatePatch`.
4. Apply server patch through `applyPlayerStatePatch`.
5. Move shop buy to `POST /api/game/shop/buy`.
6. Move fish sale to `POST /api/game/fish/sell`.
7. Move cafe/quest rewards after catch/shop/sell are stable.
8. Replace cloud JSON as source of truth with backend player state revisions.

## Backend Endpoints Needed Next

First endpoint:

- `POST /api/game/catch/resolve`

Next endpoints:

- `POST /api/game/shop/buy`
- `POST /api/game/fish/sell`
- `GET /api/game/profile`
- `POST /api/game/profile/sync`
- `GET /api/game/config`
- `GET /api/leaderboard/biggest-fish`

## Risks

- Catch logic is still mostly local until the backend endpoint exists.
- Some economy mutations remain outside the authority layer, especially quests, cafe orders, travel, and processing.
- `localRevision` is an in-memory helper, not a persisted authoritative revision.
- Server mode is not production-ready until response patch application is tested against real backend data.
- Async server catch mode may need a small "resolving catch" UI state before it is enabled for real players.

## Manual Check Focus

For this phase, check:

- Guest startup still works.
- Catching still resolves and adds fish to storage.
- Keepnet/inventory still reflect caught fish.
- Market buy still deducts coins/adds item or ownership.
- Fish sale still removes fish and adds coins.
- Cloud save/export still serializes normal local save data.
