# First Tackle

First playable browser prototype for a small low-poly 3D fishing game set in a roadside village.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Current MVP

- Low-poly 3D scene with a grandma house, garden yard, pond, road, and bus stop market stall.
- Player marker moves with WASD or arrow keys while a third-person camera follows.
- Inventory starts with thread, a simple hook, no bait, and 0 coins.
- Garden interaction searches for 1-3 worms with a short cooldown.
- Crafting turns thread and a simple hook into primitive tackle.
- Pond interaction consumes bait and can catch rotan, small crucian carp, or bleak.
- Market interaction sells all caught fish for coins.
- Shop shows better line and simple float as early progression items.
- Save, load, and reset use `localStorage`.

## Project Structure

```text
src/
  main.js
  game/
    state.js
    world.js
    player.js
    interactions.js
    fishing.js
    inventory.js
    economy.js
    save.js
  ui/
    hud.js
    panels.js
style.css
index.html
README.md
```
