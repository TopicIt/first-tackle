# Changelog

## 2026-07-17

- Fixed profile rename editing so input, deletion, selection, cursor movement, and mobile keyboard composition keep the editor open until explicit Save or Cancel.
- Profile renames now persist through the account API and immediately refresh leaderboard/public-profile names without requiring a new catch.
- Fixed the mobile cloud/status blocks that could collapse Ukrainian text into a one-character-wide column.
- Applied production migration `0002_persistent_catch_records`; biggest-fish and trophy endpoints now use `server-catch-records`.
- Isolated catch-record enrichment from the primary cloud-save transaction so optional record-sync failures cannot turn a committed save into HTTP 500.
- Added one-time access-token refresh/retry for authenticated API requests and readable Ukrainian network/save errors.
- Added persistent backend catch records and migrated catch/trophy leaderboards away from current keepnet-derived rows.
- Fixed profile-name typing so registration/editing inputs keep focus while typing.
- Improved mobile panel sizing for Profile, Settings, Leaderboard, and public profile views.
- Added automatic newer-save selection/sync preferences after login, enabled by default.
- Added Grandma House one-hour rest, diversified non-Canal/non-Sluice cast spots, removed crucian live-bait recommendations, and increased starter rod break risk above 500 g.

## 2026-07-06

- Added mobile-default low-power behavior for phone-like viewports, with an explicit settings toggle override.
- Reduced mobile CPU/GPU work by throttling frame work, pausing menu-open ambient animation, calming idle bobber motion, and disabling expensive glass/blur effects in low-power states.
- Made mobile/low-power cloud autosave more conservative while keeping manual cloud save immediate.
- Fixed bait consumption so no-bite and recast/cancel do not consume normal bait or live bait; catch and meaningful bite failures still consume bait.
- Removed recommended-depth guide output and expanded cast spot guidance using real `castSpots` data.
- Replaced vague fish habitat guide text with real waters and real cast spot labels.
- Clarified `рогаль` as an alias for `canadian_catfish`.
- Added server-backed, unverified leaderboard aggregation endpoints in the separate FastAPI backend repo.
