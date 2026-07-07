# Cleanup Audit

Branch: `codex/safe-cleanup-audit`
Date: 2026-07-07

This audit is inspection-only. No project features, assets, folders, Git history, or external chats were deleted or rewritten.

## 1. Workspace Folder Audit

| Path | Git repo | Branch | Latest commit | Dirty | Untracked | Upstream / unpushed | Size | Appears to be | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `D:\first-tackle` | Yes | `codex/mvp1-usability-pass` | `ea03ba3 fix: prepare mvp1 usability pass` | Yes | Yes | No upstream configured | 914.02 MB | Original frontend worktree / old feature branch with unique dirty asset and lockfile changes | DO NOT DELETE until dirty files are reviewed |
| `D:\first-tackle-api` | Yes | `main` | `24fafb0 merge: cloud-save leaderboard endpoints` | No | No | `origin/main`, 0 unpushed | 77.02 MB | Backend API repo | KEEP |
| `D:\first-tackle-cloud-market-pass` | Yes | `codex/cloud-market-buffs-leaderboard-pass` | `cc78e4f feat: unify cloud save ux and add leaderboard pass` | No | No | `origin/codex/cloud-market-buffs-leaderboard-pass`, 0 unpushed | 400.69 MB | Old feature worktree | SAFE TO DELETE AFTER USER CONFIRMATION |
| `D:\first-tackle-main-merge` | Yes | `codex/safe-cleanup-audit` | `a5ce626 docs: summarize mvp1.1 deployment [skip ci]` before this audit | No before audit docs | No before audit docs | Local audit branch | 216.06 MB | Active frontend audit worktree | KEEP until audit branch is handled |
| `D:\first-tackle-mvp11` | Yes | `codex/mvp11-leaderboard-guide-progression` | `d3ba72f MVP 1.1 leaderboard guide progression polish` | No | No | `origin/main`, 0 unpushed | 168.91 MB | Old MVP 1.1 feature worktree | SAFE TO DELETE AFTER USER CONFIRMATION |
| `D:\first-tackle\.worktrees\ios-cloud-profile-fixes` | Yes | `codex/ios-cloud-profile-fixes` | `8245713 fix: improve mobile cloud profile flow` | No | No | `origin/codex/ios-cloud-profile-fixes`, 0 unpushed | 164.00 MB | Old iOS/profile worktree | SAFE TO DELETE AFTER USER CONFIRMATION |

Special notes:

- `cc78e4f`, `d3ba72f`, and `8245713` are reachable from current `main`, so their clean worktrees have no obvious unique work.
- `D:\first-tackle` has dirty changes including `package-lock.json` and many `public/assets/fish`, `public/assets/fish/species`, and `public/assets/items` files. Those files need review before deleting or resetting that worktree.
- The old worktrees contain local generated folders that can be removed after confirmation:

| Path | `node_modules` | `dist` |
| --- | ---: | ---: |
| `D:\first-tackle` | 59.45 MB | 102.01 MB |
| `D:\first-tackle-cloud-market-pass` | 59.45 MB | 200.43 MB |
| `D:\first-tackle-main-merge` | 74.31 MB | 41.79 MB |
| `D:\first-tackle-mvp11` | 79.12 MB | 41.79 MB |
| `D:\first-tackle\.worktrees\ios-cloud-profile-fixes` | 74.31 MB | 41.75 MB |

## 2. Repository Size Audit

Measured in the active frontend repo `D:\first-tackle-main-merge`.

| Area | Size |
| --- | ---: |
| Worktree total | 216.06 MB |
| Shared `.git` directory at `D:\first-tackle\.git` | 465.81 MB |
| `node_modules` | 74.31 MB |
| `dist` | 41.79 MB |
| `src` | 0.86 MB |
| `public` | 40.59 MB |
| `public/assets` | 40.59 MB |
| `docs` | 0.07 MB |
| `_source-assets` | 58.27 MB |

Largest 20 folders:

| Folder | Size |
| --- | ---: |
| `node_modules` | 74.31 MB |
| `_source-assets` | 58.27 MB |
| `_source-assets\optimized-originals` | 51.96 MB |
| `_source-assets\optimized-originals\assets` | 51.96 MB |
| `dist` | 41.79 MB |
| `dist\assets` | 41.79 MB |
| `public` | 40.59 MB |
| `public\assets` | 40.59 MB |
| `_source-assets\optimized-originals\assets\locations` | 16.32 MB |
| `public\assets\transitions` | 14.80 MB |
| `dist\assets\transitions` | 14.80 MB |
| `_source-assets\optimized-originals\assets\fish` | 12.82 MB |
| `_source-assets\optimized-originals\assets\items` | 11.89 MB |
| `public\assets\models` | 8.43 MB |
| `dist\assets\models` | 8.43 MB |
| `public\assets\transitions\grandma-house` | 8.37 MB |
| `dist\assets\transitions\grandma-house` | 8.37 MB |
| `_source-assets\optimized-originals\assets\fish\species` | 6.80 MB |
| `_source-assets\deploy-excluded` | 6.31 MB |
| `public\assets\locations` | 5.29 MB |

Largest 50 current files, excluding `.git` and `node_modules`:

| Size | File |
| ---: | --- |
| 8.43 MB | `public\assets\models\fisher_boy_base.glb` |
| 8.43 MB | `dist\assets\models\fisher_boy_base.glb` |
| 8.37 MB | `dist\assets\transitions\grandma-house\grandma-house-flyin.mp4` |
| 8.37 MB | `public\assets\transitions\grandma-house\grandma-house-flyin.mp4` |
| 4.76 MB | `public\assets\audio\music\ambient_day.mp3` |
| 4.76 MB | `dist\assets\audio\music\ambient_day.mp3` |
| 2.68 MB | `_source-assets\deploy-excluded\transitions\grandma-house\grandma-house-flyin-2.mp4` |
| 2.49 MB | `public\assets\transitions\first-catch\first-crucian-catch.mp4` |
| 2.49 MB | `dist\assets\transitions\first-catch\first-crucian-catch.mp4` |
| 2.40 MB | `_source-assets\deploy-excluded\locations\cafe\cafe-location.png` |
| 2.26 MB | `dist\assets\intro\intro-childhood-fishing.mp4` |
| 2.26 MB | `public\assets\intro\intro-childhood-fishing.mp4` |
| 1.86 MB | `public\assets\transitions\shluz\shluz-flyin.mp4` |
| 1.86 MB | `dist\assets\transitions\shluz\shluz-flyin.mp4` |
| 1.20 MB | `public\assets\transitions\garden\garden-flyin.mp4` |
| 1.20 MB | `dist\assets\transitions\garden\garden-flyin.mp4` |
| 1.17 MB | `_source-assets\optimized-originals\assets\maps\world-map-desktop.png` |
| 1.11 MB | `_source-assets\optimized-originals\assets\locations\world_map_concept1.png` |
| 1.07 MB | `_source-assets\optimized-originals\assets\locations\world_map_concept.png` |
| 1.03 MB | `dist\assets\index-C1QXAbN_.js` |
| 0.96 MB | `_source-assets\optimized-originals\assets\locations\stavok-pozhara-05-final-fishing-view.png.png` |
| 0.93 MB | `_source-assets\optimized-originals\assets\locations\garden_location_concept.png` |
| 0.91 MB | `_source-assets\optimized-originals\assets\locations\house_location_concept.png` |
| 0.89 MB | `_source-assets\optimized-originals\assets\locations\pond_location_concept.png` |
| 0.88 MB | `_source-assets\optimized-originals\assets\items\bait_types_clean.png` |
| 0.87 MB | `dist\assets\transitions\fishing-canal\fishing-canal-flyin.mp4` |
| 0.87 MB | `public\assets\transitions\fishing-canal\fishing-canal-flyin.mp4` |
| 0.84 MB | `_source-assets\optimized-originals\assets\locations\stavok.png` |
| 0.84 MB | `_source-assets\optimized-originals\assets\locations\shluz.png` |
| 0.82 MB | `_source-assets\optimized-originals\assets\locations\shliuz.png` |
| 0.80 MB | `_source-assets\optimized-originals\assets\locations\hirnytske-ozero.png` |
| 0.78 MB | `_source-assets\optimized-originals\assets\locations\greada_location_concept.png` |
| 0.78 MB | `_source-assets\optimized-originals\assets\locations\grandma-house-dawn-dusk.png` |
| 0.77 MB | `_source-assets\optimized-originals\assets\locations\kanava-alt.png` |
| 0.77 MB | `_source-assets\optimized-originals\assets\locations\gryada.png` |
| 0.76 MB | `_source-assets\optimized-originals\assets\locations\market_location_concept.png` |
| 0.76 MB | `_source-assets\optimized-originals\assets\locations\ozero-tur.png` |
| 0.76 MB | `_source-assets\optimized-originals\assets\items\tackle_components.png` |
| 0.75 MB | `_source-assets\optimized-originals\assets\items\primitive_tackle.png` |
| 0.74 MB | `_source-assets\optimized-originals\assets\locations\shluz-transition-06-final.png` |
| 0.73 MB | `_source-assets\optimized-originals\assets\locations\stavky-pozhara.png` |
| 0.66 MB | `_source-assets\optimized-originals\assets\items\taranka_drying.png` |
| 0.66 MB | `_source-assets\optimized-originals\assets\time-of-day\main_map\main_map_dawn_dusk.png` |
| 0.65 MB | `_source-assets\optimized-originals\assets\fish\species\rudd.png` |
| 0.64 MB | `_source-assets\optimized-originals\assets\items\bait_worm.png` |
| 0.63 MB | `_source-assets\optimized-originals\assets\fish\species\roach.png` |
| 0.62 MB | `_source-assets\deploy-excluded\logo\Logo (3).png` |
| 0.61 MB | `_source-assets\optimized-originals\assets\fish\catch_result_frame.png` |
| 0.61 MB | `_source-assets\optimized-originals\assets\fish\catch_crucian_card.png` |
| 0.60 MB | `_source-assets\optimized-originals\assets\fish\species\crucian.png` |

Largest generated build files in `dist`:

| Size | File |
| ---: | --- |
| 8.43 MB | `dist\assets\models\fisher_boy_base.glb` |
| 8.37 MB | `dist\assets\transitions\grandma-house\grandma-house-flyin.mp4` |
| 4.76 MB | `dist\assets\audio\music\ambient_day.mp3` |
| 2.49 MB | `dist\assets\transitions\first-catch\first-crucian-catch.mp4` |
| 2.26 MB | `dist\assets\intro\intro-childhood-fishing.mp4` |
| 1.86 MB | `dist\assets\transitions\shluz\shluz-flyin.mp4` |
| 1.20 MB | `dist\assets\transitions\garden\garden-flyin.mp4` |
| 1.03 MB | `dist\assets\index-C1QXAbN_.js` |
| 0.87 MB | `dist\assets\transitions\fishing-canal\fishing-canal-flyin.mp4` |
| 0.44 MB | `dist\assets\locations\stavok.webp` |

Largest active/source media by type:

| Type | Largest files |
| --- | --- |
| Images | `_source-assets\deploy-excluded\locations\cafe\cafe-location.png` 2.40 MB; `_source-assets\optimized-originals\assets\maps\world-map-desktop.png` 1.17 MB; many raw/source location and item PNGs in `_source-assets` |
| Videos | `public\assets\transitions\grandma-house\grandma-house-flyin.mp4` 8.37 MB; `public\assets\transitions\first-catch\first-crucian-catch.mp4` 2.49 MB; `public\assets\intro\intro-childhood-fishing.mp4` 2.26 MB |
| Audio | `public\assets\audio\music\ambient_day.mp3` 4.76 MB |
| 3D/models | `public\assets\models\fisher_boy_base.glb` 8.43 MB |
| Raw/source/archive-like assets | `_source-assets` 58.27 MB, including tracked `_source-assets\deploy-excluded` files; historical `public/assets/3d/nature/...` blobs exist in Git history but are not present in the active tree |

## 3. Git History Size Audit

`git count-objects -vH`:

```text
count: 147
size: 748.62 KiB
in-pack: 9570
packs: 3
size-pack: 464.17 MiB
prune-packable: 0
garbage: 19
size-garbage: 380.28 KiB
```

Git also reported stale garbage and orphan `.idx` files under `D:\first-tackle\.git\objects\pack`. This suggests normal maintenance may reclaim some local disk use, but the pack size also reflects large assets committed in current and past history.

Largest currently tracked files include:

- `public/assets/models/fisher_boy_base.glb` - 8.43 MB
- `public/assets/transitions/grandma-house/grandma-house-flyin.mp4` - 8.37 MB
- `public/assets/audio/music/ambient_day.mp3` - 4.76 MB
- `_source-assets/deploy-excluded/transitions/grandma-house/grandma-house-flyin-2.mp4` - 2.68 MB
- `public/assets/transitions/first-catch/first-crucian-catch.mp4` - 2.49 MB
- `_source-assets/deploy-excluded/locations/cafe/cafe-location.png` - 2.40 MB

Largest historical blobs include current transition/model/audio files plus old `public/assets/3d/nature/...` assets and older location/map/item assets. This is why `.git` is larger than the active worktree assets alone.

Safe now:

- Run normal `git gc` after active worktrees are clean.
- Remove ignored `node_modules`, `dist`, Vite cache, and log files in stale local worktrees after user confirmation.
- Remove stale worktrees using `git worktree remove <path>` after confirming no dirty or unique files remain.

Risky later:

- `git-filter-repo` / BFG history cleanup.
- Any history rewrite or force-push.
- Removing historical blobs from `main` without a coordinated backup/tag and explicit approval.

Recommendation: do not rewrite `main` history in this task.

## 4. Active Asset Audit

Usage was checked by searching `src`, `index.html`, `style.css`, and docs for direct references and `assetPath(...)` calls.

| Asset / area | Classification | Evidence / note |
| --- | --- | --- |
| `public/assets/models/fisher_boy_base.glb` | USED IN ACTIVE BUILD | Referenced by `src/ui/fishingPrototype3d.js` and `src/game/world.js` |
| `public/assets/transitions/grandma-house/grandma-house-flyin.mp4` | USED IN ACTIVE BUILD | Referenced by `src/game/locationTransitions.js` |
| `public/assets/transitions/first-catch/first-crucian-catch.mp4` | USED IN ACTIVE BUILD | Referenced by `src/game/locationTransitions.js` |
| `public/assets/transitions/fishing-canal/fishing-canal-flyin.mp4` | USED IN ACTIVE BUILD | Referenced by `src/game/locationTransitions.js` |
| `public/assets/transitions/shluz/shluz-flyin.mp4` | USED IN ACTIVE BUILD | Referenced by `src/game/locationTransitions.js` |
| `public/assets/transitions/garden/garden-flyin.mp4` | USED IN ACTIVE BUILD | Referenced by `src/game/locationTransitions.js` |
| `public/assets/intro/intro-childhood-fishing.mp4` | USED IN ACTIVE BUILD | Referenced by `src/ui/hud.js` |
| `public/assets/audio/music/ambient_day.mp3` | USED IN ACTIVE BUILD | Referenced by `src/audio/soundConfig.js` |
| `public/assets/maps/world-map-desktop.*` and location images | USED IN ACTIVE BUILD | Referenced by `src/utils/worldMapAsset.js`, `src/utils/locationAsset.js`, `src/ui/locationScene.js`, and `src/ui/panels.js`; optimized extension resolution is handled by asset utilities/build |
| Fish, guide, item, profile, minigame images under `public/assets` | USED IN ACTIVE BUILD / NEEDS MANUAL REVIEW BEFORE PRUNING | Referenced dynamically by fish IDs, item IDs, guide tabs, profile avatars, and minigame renderers |
| `_source-assets/optimized-originals` | SOURCE/RAW FILE | Not needed at runtime; currently present locally and ignored, but should be kept outside active repo or archived before removal |
| `_source-assets/deploy-excluded/*` tracked files | SOURCE/RAW FILE / NEEDS MANUAL REVIEW | These files are tracked even though `.gitignore` ignores `_source-assets/`; good candidate for future tracked removal after backup/confirmation |
| `public/assets/3d/nature/quaternius_stylized_nature` history blobs | DUPLICATE/OLD VERSION / HISTORY ONLY | Ignored now and not actively referenced; contributes to Git history size |
| `dist` assets | BUILD OUTPUT ONLY | Generated by Vite; safe to remove locally when not needed, regenerated by `npm run build` |

Safe future removal candidates, after confirmation:

- Clean old worktree `dist` and `node_modules` folders.
- Remove tracked `_source-assets/deploy-excluded` files from the active repo after confirming external archival.
- Move `_source-assets/optimized-originals` outside active worktrees or keep in an external archive.
- Review old transition variants and unused raw location/fish/item art before deleting.
- Keep current `public/assets` fish, guide, water, market, tutorial, save, leaderboard, and mobile UI assets until dynamic references are mapped more thoroughly.

## 5. Build / Dist Audit

Dependency state: `node_modules` was present, so `npm install` was not needed.

Build command:

```text
npm run build
```

Result: passed.

Vite output:

- 80 modules transformed.
- `dist/assets/index-C1QXAbN_.js` - 1,076.42 kB minified, 289.66 kB gzip.
- `dist/assets/index-BumE-jx5.css` - 167.42 kB minified, 28.51 kB gzip.
- `dist/assets/fishingPrototype3d-D5_rT6O1.js` - 6.45 kB minified, 2.69 kB gzip.
- Vite warning remains: some chunks are larger than 500 kB after minification.

Final `dist` size: 41.79 MB.

Likely causes of the main chunk warning:

- Most gameplay, panels, guide, inventory, market, profile/cloud save, leaderboard, tutorial, and data modules are bundled into the single app entry.
- Large translations/data/config modules are eagerly loaded.
- Some 3D code is already split into a small dynamic chunk, but the main app shell still owns most UI systems.

Good lazy-load candidates for a later code task:

- Leaderboard panel and API client calls.
- Fish guide and guide art/detail rendering.
- Profile/cloud save panel.
- Optional market/keepnet/profile/settings panels.
- Tutorial/excursion views that are not needed after onboarding.
- Transition video controller/media preloading.
- Map/water image preloads.
- Remaining 3D/fishing scene code if it is imported eagerly elsewhere.

## 6. Context Reduction Audit

Useful docs:

- `PROJECT_SUMMARY.md` is the best current state handoff, but it should stay short.
- `docs/deploy-github-pages.md` and `docs/deploy-visibility-note.md` are useful deployment references.
- Backend/server docs are useful when touching API authority, cloud save, or leaderboard behavior.
- Performance/mobile audits are useful for optimization tasks but should not be loaded for unrelated work.

Docs that are overlapping or should be compressed:

- Several planning docs cover backend authority/migration in different levels of detail.
- `PROJECT_SUMMARY.md` is already around 119 lines / 12 KB and includes historical sprint notes. It is not huge yet, but it will become context-heavy if every major task appends full detail.
- Some old historical text is mojibake in the current summary; keep important state, but do not expand that section.

Recommended docs structure:

- `PROJECT_SUMMARY.md`: concise current state, current branch/deploy/build status, known issues, next tasks.
- `docs/CODEX_RULES.md`: short operating rules for Codex, including which docs to read by default and when to read specialized docs. This file is currently absent.
- `docs/ARCHITECTURE.md`: stable game architecture, save/cloud/API boundaries, asset conventions.
- `docs/ROADMAP.md`: planned work and priorities.
- `docs/CLEANUP_AUDIT.md`: this audit and staged cleanup plan.

Context rule recommendation:

- Future tasks should ask Codex to read `PROJECT_SUMMARY.md`, `docs/CODEX_RULES.md` if it exists, and only task-relevant source/docs.
- Avoid pasting full old chats. Link or summarize only the current objective, required constraints, and the last known state.
- Compress old `PROJECT_SUMMARY.md` sections into an "Archive / Past Work" section with one-line entries.

## 7. Chat / Workflow Recommendations

- Keep `D:\first-tackle-api`.
- Keep one clean active frontend worktree for day-to-day work.
- Delete `D:\first-tackle-cloud-market-pass`, `D:\first-tackle-mvp11`, and `D:\first-tackle\.worktrees\ios-cloud-profile-fixes` after user confirmation.
- Do not delete `D:\first-tackle` until the dirty asset/package-lock changes are reviewed.
- Old Codex chats can be archived/deleted after confirming `PROJECT_SUMMARY.md` contains the important state, but no external chat changes were made here.
- Start future Codex tasks with a short task brief plus `PROJECT_SUMMARY.md` and the specific files/modules involved.
- Use branch/worktree names that include date or task, for example `codex/2026-07-07-mobile-profile-fix`.
- Remove temporary worktrees after merge/deploy verification, preferably using `git worktree remove <path>`.
- Update `PROJECT_SUMMARY.md` only at the end of major tasks, after verification and commit/deploy status are known.

## 8. Staged Cleanup Plan

### Phase 1 - Safe Local Cleanup

- Confirm no unique dirty files in old worktrees.
- Delete `node_modules` in old worktrees.
- Delete `dist` in old worktrees.
- Remove stale clean worktree folders after user confirmation with `git worktree remove`.
- Run normal `git gc` after worktree cleanup.
- Remove obvious local caches and logs.

### Phase 2 - Safe Asset Cleanup

- Review and remove unused/duplicate active assets only after confirmation.
- Remove tracked `_source-assets/deploy-excluded` from the repo after external archival.
- Convert large active PNG/JPG images to WebP/AVIF where quality allows.
- Keep original/source assets outside the active repo or in a separate external archive.
- Keep runtime assets required by water bodies, fish guide, market, tutorial, save system, leaderboard, and mobile UI.

### Phase 3 - Build Optimization

- Split the main JS chunk.
- Lazy-load guide, leaderboard, profile/cloud save, optional panels, transition systems, and heavier 3D paths.
- Reduce mobile initial load by loading only the first-screen assets and deferring large video/image preloads.
- Re-check Vite bundle output and mobile smoke tests after each split.

### Phase 4 - Git History Cleanup, Optional/Risky

- Only consider history cleanup after a full backup and tag.
- Use `git-filter-repo` or BFG only with explicit user approval.
- Coordinate force-push and clone reset steps before rewriting shared history.
- Do not rewrite `main` history as part of routine cleanup.

### Phase 5 - Context Cleanup

- Compress `PROJECT_SUMMARY.md`.
- Add concise `docs/CODEX_RULES.md`.
- Split stable architecture and roadmap into separate docs.
- Avoid huge prompts and old chat dumps.
- Make each task read only relevant docs and source files.

## 9. Recommended Next Task

Run Phase 1 as a separate user-confirmed cleanup task:

1. Review dirty files in `D:\first-tackle`.
2. Remove stale clean worktrees.
3. Delete local `node_modules` and `dist` in old worktrees.
4. Run `git gc`.
5. Re-measure workspace and `.git` size.
