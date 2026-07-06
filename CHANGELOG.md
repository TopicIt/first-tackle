# Changelog

## 2026-07-06

- Added mobile-default low-power behavior for phone-like viewports, with an explicit settings toggle override.
- Reduced mobile CPU/GPU work by throttling frame work, pausing menu-open ambient animation, calming idle bobber motion, and disabling expensive glass/blur effects in low-power states.
- Made mobile/low-power cloud autosave more conservative while keeping manual cloud save immediate.
- Fixed bait consumption so no-bite and recast/cancel do not consume normal bait or live bait; catch and meaningful bite failures still consume bait.
- Removed recommended-depth guide output and expanded cast spot guidance using real `castSpots` data.
- Replaced vague fish habitat guide text with real waters and real cast spot labels.
- Clarified `рогаль` as an alias for `canadian_catfish`.
- Added server-backed, unverified leaderboard aggregation endpoints in the separate FastAPI backend repo.
