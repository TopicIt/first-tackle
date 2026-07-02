# PlayerState Server Contract

Date: 2026-07-02

Branch: `codex/player-state-authority-phase1`

## Status

This repository contains the frontend game and API client wrappers. Backend route code was not found here, so this phase does not fake backend endpoints inside the Vite app.

`PlayerState` is now the frontend bridge between today's local/offline save and a future server-source-of-truth model. Local fallback remains required.

## Ownership Direction

Future backend source of truth:

- player profile;
- coins and economy;
- inventory/items;
- fish storage and keepnet;
- shop purchases;
- fish sales and releases;
- catch result;
- records and achievements;
- config/dictionaries;
- leaderboards.

Frontend remains responsible for:

- UI and panel rendering;
- map and location navigation;
- animations, sounds, bobber movement, and short minigame interactions;
- local/offline fallback;
- cached config display.

Bobber animation can stay frontend because it is visual feedback. Catch result, purchases, inventory, records, and leaderboard submissions should become server-owned because they affect trusted state.

## PlayerState Shape

The frontend shape is versioned and defensive:

```json
{
  "version": 1,
  "revision": 12,
  "profile": {
    "playerName": "Івасик Телесик",
    "avatarId": "/assets/profile/Grandson-1.png",
    "level": 1,
    "xp": 0,
    "achievements": {},
    "createdAt": null,
    "updatedAt": "2026-07-02T12:00:00.000Z"
  },
  "economy": {
    "coins": 1000,
    "totalCoinsEarned": 0,
    "totalCoinsSpent": 0
  },
  "inventory": {
    "items": {},
    "bait": {},
    "rods": {},
    "tackle": {},
    "equipment": {}
  },
  "keepnet": {
    "fish": [],
    "capacity": null,
    "summary": {}
  },
  "progress": {
    "day": 1,
    "timeOfDay": 420,
    "unlockedLocations": ["canal"],
    "visitedLocations": { "canal": true },
    "tutorialFlags": {},
    "questFlags": {},
    "orderFlags": {}
  },
  "stats": {
    "fishCaughtTotal": 0,
    "fishReleasedTotal": 0,
    "fishSoldTotal": 0,
    "biggestFish": null,
    "catchesBySpecies": {},
    "catchesByLocation": {}
  },
  "authority": {
    "mode": "local",
    "verified": false,
    "lastServerRevision": null,
    "lastSyncAt": null
  }
}
```

## Endpoints

### GET `/api/game/player-state`

Response:

```json
{
  "ok": true,
  "playerState": {},
  "serverRevision": 123
}
```

### POST `/api/game/player-state/sync`

Request:

```json
{
  "localRevision": 12,
  "playerState": {}
}
```

Response:

```json
{
  "ok": true,
  "playerState": {},
  "serverRevision": 13,
  "conflict": false
}
```

### POST `/api/game/catch/resolve`

Response should include:

```json
{
  "ok": true,
  "catch": {
    "caught": true,
    "fish": {
      "id": "crucian",
      "weightGrams": 420,
      "value": 51
    }
  },
  "playerState": {},
  "serverRevision": 14
}
```

### POST `/api/game/shop/buy`

Request should include item id and client revision. Response should return updated `playerState`, `serverRevision`, and purchase result.

### POST `/api/game/fish/sell`

Request should include sale type, fish ids/entry ids, and client revision. Response should return updated `playerState`, `serverRevision`, and sale result.

### POST `/api/game/fish/release`

Request should include fish entry id or species release rule. Response should return updated `playerState`, `serverRevision`, and release result.

### GET `/api/game/config`

Returns versioned config/dictionaries used by both backend calculations and frontend display. The frontend can cache config for local fallback.

### GET `/api/leaderboard/biggest-fish`

Returns validated leaderboard rows. Submissions should be based on server-verified records, not raw client save data.

## Conflict Direction

Early sync can be simple:

- if `localRevision` matches server, accept patch;
- if server is newer, return `conflict: true`;
- frontend keeps local backup before overwrite;
- guest/local mode never blocks gameplay.

Later sync can add merge rules per section, but first phase should prefer clarity and safe overwrite prompts.
