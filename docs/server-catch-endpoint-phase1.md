# Server Catch Endpoint Phase 1

Date: 2026-07-02

Branch: `codex/mobile-beta-server-ready-pass`

## Current Status

This repository is still the frontend game. Backend route code for `POST /api/game/catch/resolve` was not found here, so this pass does not fake a server implementation inside Vite.

The frontend is ready behind the disabled-by-default flag:

- `src/config/featureFlags.js`: `VITE_SERVER_AUTHORITATIVE_CATCH=true`
- `src/api/gameApi.js`: `resolveCatchOnServer(payload)`
- `src/game/gameAuthority.js`: tries server catch first, then falls back to local authority without crashing.

Default player behavior remains local/offline.

## Endpoint

`POST /api/game/catch/resolve`

Request shape:

```json
{
  "playerId": "optional-later",
  "sessionId": "optional-later",
  "waterId": "canal",
  "spotId": "near_reeds",
  "method": "active",
  "bait": "worms",
  "depth": "middle",
  "candidateFishId": "crucian",
  "reactionQuality": 0.82,
  "successChance": 0.64,
  "localSaveRevision": 1,
  "clientTimestamp": "2026-07-02T12:00:00.000Z"
}
```

Success response shape:

```json
{
  "ok": true,
  "mode": "server",
  "verified": true,
  "result": {
    "caught": true,
    "fish": {
      "id": "crucian",
      "weightGrams": 420,
      "weightKg": 0.42,
      "rarity": "trophy",
      "value": 51
    },
    "rewards": {
      "coins": 0,
      "xp": 0
    },
    "playerStatePatch": {
      "coins": 100,
      "fishStorageSummary": {
        "totalFish": 1
      }
    },
    "serverTimestamp": "2026-07-02T12:00:01.000Z",
    "serverRevision": 13
  }
}
```

Fallback response is produced by the frontend authority layer if the endpoint fails:

```json
{
  "ok": true,
  "mode": "fallback-local",
  "verified": false,
  "fallbackReason": "Could not resolve catch on server",
  "result": {}
}
```

## What The Server Should Own First

First backend logic needed:

- validate player/session later;
- roll caught/not caught;
- roll fish species;
- calculate weight;
- calculate value;
- return `playerStatePatch`;
- return `serverRevision`.

## What Remains Frontend

The frontend should keep:

- bobber animation and visual movement;
- player input timing feedback;
- short fishing minigame interactions;
- UI, map, sounds, and local fallback.

Bobber animation can stay frontend because it is immediate visual feedback. The catch result can become server-owned because it affects trusted state: fish storage, records, coins, achievements, and leaderboards.

## Deploy Later

To test server catch later:

1. Implement the endpoint in the separate backend service.
2. Deploy that backend.
3. Set `VITE_SERVER_AUTHORITATIVE_CATCH=true` only in a test build.
4. Confirm server success and offline/local fallback.
5. Keep the production default `false` until the endpoint and state patches are stable.
