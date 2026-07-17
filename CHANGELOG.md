# Changelog

## 2026-07-17

- Preserved the exact `server-catch-records` leaderboard source in frontend state so the live panel shows the persistent-record subtitle instead of the generic server label.
- Added authenticated `/api/catches/sync` acknowledgement flow and changed the frontend pending-catch queue to clear only backend-acknowledged `catchId`s.
- Added full `caughtAt` timestamps to gameplay catch history and kept pending catch IDs in the local autosave signature for retry visibility.
- Normalized legacy `perch` leaderboard rows to `Окунь`, removed normal-row source/debug labels, and updated the persistent leaderboard subtitle.
- Persisted starter-rod broken state, blocked fishing/casting while it is broken, and made Grandma's rod-stick replacement restore a usable starter rod.
- Wired the real gameplay catch path into cloud synchronization by promoting the catch-history-aware sync/autoload/autosave implementations to the active runtime path.
- Added a gameplay smoke that catches through `addFishToStorage()`, verifies pending catch queue/history state, sells the fish, and confirms the historical catch survives keepnet sale.
- Fixed same-session persistent leaderboard rows so first-save/current-name data is available immediately after sync instead of briefly falling back to the account email prefix.
- Replaced raw leaderboard fallback labels such as `cloud save catch`, `server catch record`, and `day 1` with readable Ukrainian rendering and formatted timestamps.
- Added backend UTF-8/current-name tests so valid Ukrainian profile names survive save sync and leaderboard responses, while corrupted question-mark placeholders fall back safely.
- Removed the remaining gameplay fisherman/prototype path, deleted `public/assets/models/fisher_boy_base.glb`, and finished the feather-float single-layer cleanup.
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
