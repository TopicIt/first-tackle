# First Tackle TODO

Updated: 2026-07-17

## Backend / Online Leaderboard

- Remove the dead legacy cloud-save helper copies from the frontend modules now that the active runtime has been switched to the catch-history-aware sync path.
- Monitor live pending-catch uploads after login/manual sync/autosave to confirm no production edge cases leave catches stuck in the local queue.
- Monitor the deployed persistent catch-record ingestion and retry logs for malformed legacy catch payloads.
- Add a Railway database backup/PITR plan before the next destructive or data-transforming migration; the current plan did not expose snapshots.
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

- Run a real production smoke for catch -> sync -> leaderboard -> sale survival on a physical mobile browser, especially after silent reconnect.
- Run mobile device profiling after deploy to confirm lower temperature and battery draw.
- Run profile rename, cloud-save text layout, and public profile smoke on a physical iPhone Safari device.
- Add automated bait-consumption unit tests once the game logic has a test harness.
- Confirm guide text renders correctly in Ukrainian on narrow iPhone widths.
