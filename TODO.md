# First Tackle TODO

Updated: 2026-07-17

## Backend / Online Leaderboard

- Deploy the updated `D:\first-tackle-api` backend to Railway.
- Verify `GET /api/leaderboard/biggest-fish` returns `200` from production.
- Run Alembic migration `0002_persistent_catch_records` in production.
- Continue from persistent catch records toward server-verified catch/event records instead of client-recovered records.
- Add submission or integration path from server-authoritative catch resolution into leaderboard records.
- Keep frontend local fallback visible whenever server endpoints are unavailable.

Example leaderboard response shape:

```json
{
  "ok": true,
  "type": "biggest-fish",
  "source": "server",
  "verified": true,
  "records": [
    {
      "rank": 1,
      "playerName": "Ivasik",
      "fishId": "pike",
      "weightKg": 2.15,
      "weightGrams": 2150,
      "locationId": "sluice",
      "locationName": "Шлюз",
      "baitId": "live_bait",
      "caughtAt": "2026-07-06T10:00:00Z",
      "verified": true
    }
  ]
}
```

## Server-Authoritative Fishing Migration

1. Server resolves fish candidate.
2. Server resolves bite/no-bite and catch result.
3. Server resolves weight/trophy/value.
4. Server updates profile, economy, journal, and leaderboard event records.
5. Frontend renders bobber, animations, and result UI.
6. Keep local fallback during transition.

## Optimization Roadmap

- PageSpeed and real-device thermal profiling.
- PNG/JPG to WebP/AVIF conversion.
- Mobile image variants.
- Lazy loading for waters, transitions, guide, and fish images.
- JS bundle splitting.
- HUD render/stringify optimization.
- CSS blur/backdrop-filter cleanup.
- Canvas/update frequency review.
- Animation limits and low-power behavior audit.

## Follow-Up Checks

- Run mobile device profiling after deploy to confirm lower temperature and battery draw.
- Add automated bait-consumption unit tests once the game logic has a test harness.
- Confirm guide text renders correctly in Ukrainian on narrow iPhone widths.
