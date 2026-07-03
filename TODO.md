# First Tackle TODO

## High Priority

- [ ] Confirm the current dirty asset/package-lock state and decide what should be committed, moved, or discarded.
- [ ] Merge or rebase latest `origin/main` into the active work branch after protecting intentional local changes.
- [ ] Verify the time-of-day background task: 05:00 dawn/dusk, 12:00 day, 19:00 dawn/dusk, 23:00 night, and 02:00 night.
- [ ] Remove or confirm removal of the broken intermediate pre-fishing screen so fishing locations enter the actual fishing scene directly.
- [ ] Verify guide expansion on long fish/water lists without scroll jumping.
- [ ] Verify worm digging and stone-search rewards always match displayed found counts.
- [ ] Decide backend stack before implementation: Node.js API versus FastAPI.
- [ ] Stabilize cloud save conflict behavior and document local backup/overwrite rules clearly.
- [ ] Keep `PROJECT_SUMMARY.md`, `TODO.md`, and `CHANGELOG.md` updated before any long new Codex chat.

## Medium Priority

- [ ] Compress or add mobile variants for the largest maps, location images, transition videos, and the GLB model.
- [ ] Replace broad HUD render snapshots with dirty flags or narrower selectors.
- [ ] Reduce full HUD `innerHTML` replacement for hidden or unchanged panels.
- [ ] Replace large autosave/cloud-save string signatures with revision or dirty markers.
- [ ] Add real server-backed leaderboard validation instead of mock/fallback records.
- [ ] Add stronger save metadata: client id, updated timestamp, revision, schema version, and checksum.
- [ ] Expand server/player-state contract tests once backend route code exists.
- [ ] Profile mobile performance on real Android/iOS devices for map, fishing, profile/settings, and startup.

## Low Priority

- [ ] Polish guide categories and ensure Fish, Waters, Baits, Tackle, and Processing stay visually consistent.
- [ ] Improve item and bait guide imagery so entries do not reuse generic pictures when specific assets exist.
- [ ] De-emphasize or hide XP/level UI if progression design remains undecided.
- [ ] Improve optional 3D fishing prototype cleanup and low-power gating.
- [ ] Add clearer deployment notes for branch/build metadata checks.
- [ ] Add PWA/cache strategy after mobile asset weight is reduced.

## Future Ideas

- [ ] Create a dedicated backend service for auth, profile, cloud saves, leaderboards, and trusted catch records.
- [ ] Add guest-to-account migration with local backup and explicit conflict choice.
- [ ] Add verified biggest-fish, species, water, trophy, stars, and coins leaderboards.
- [ ] Add daily/seasonal market seeds only after economy balance is stable.
- [ ] Add account-wide achievements after local achievements and competitive validation are stable.
- [ ] Add object storage for custom avatars or screenshots if profile media grows.
- [ ] Add mobile wrapper only after PWA/backend/offline behavior is stable.

## Technical Debt

- [ ] Resolve mojibake/encoding display issues in existing docs and source strings where needed.
- [ ] Document ownership of generated/source asset folders and ignored worktree folders.
- [ ] Normalize backend planning docs so they do not conflict on the chosen stack.
- [ ] Add automated tests or focused verification scripts for save migration and player-state migration.
- [ ] Add test coverage for authority wrapper result shapes and fallback behavior.
- [ ] Audit all economy mutations and route remaining high-value changes through the authority layer.
- [ ] Audit large public assets for duplicates, obsolete files, and deploy artifact bloat.
- [ ] Keep root docs updated after every major completed feature, before merging into `main`, before starting long chats, whenever context grows large, and whenever requested.
