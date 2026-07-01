# Backend Migration Plan

Goal: keep the mobile frontend fast while moving account, save, leaderboard, and trusted game-state logic to a backend.

## Recommended Stack

- Frontend: existing Vite app, served separately from static hosting or CDN.
- Backend: Node.js API on Railway first; Hetzner VPS as fallback when more control is needed.
- Database: PostgreSQL.
- Auth: email magic link/passwordless first, with Google OAuth as an optional second provider.
- Storage: object storage later for avatars/screenshots if custom profile media becomes common.

## High-Level Data Model

- `users`: id, email, display name, auth provider metadata, created/updated timestamps.
- `profiles`: user id, avatar, public name, selected trophy/star cosmetics.
- `saves`: user id, save version, compressed save JSON, checksum, updated timestamp.
- `catches`: user id, fish id, weight, water id, bait, tackle summary, trophy tier, caught timestamp.
- `achievements`: user id, achievement id, state, claimed rewards.
- `leaderboards`: fish id or board id, user id, best weight/score, submitted timestamp.

## API Groups

- `POST /auth/start`, `POST /auth/verify`, `POST /auth/google`.
- `GET /me`, `PATCH /me/profile`.
- `GET /save`, `PUT /save`, `POST /save/import`.
- `POST /catches`, `GET /catches/recent`, `GET /catches/best`.
- `GET /achievements`, `POST /achievements/:id/claim`.
- `GET /leaderboards`, `GET /leaderboards/:boardId`.

## Keep On Frontend

- Immediate fishing UI, bobber feedback, animations, and moment-to-moment interactions.
- Offline/local save fallback.
- Asset rendering, guide display, tutorial presentation, market UI.

## Move To Backend First

- Optional account creation and cloud save sync.
- Save import/export validation and version migrations.
- Trophy reward claim validation.
- Leaderboard submissions and best-fish records.
- Daily market seed generation once economy balancing matters.

## Phased Rollout

1. Add backend health check, PostgreSQL schema, and auth.
2. Add cloud save upload/download while preserving localStorage fallback.
3. Add server-side save validation and migration helpers.
4. Add catch/trophy record submission and leaderboards.
5. Move reward claims, market seed, and anti-cheat checks server-side.
6. Add account recovery, profile privacy controls, and admin tools.
