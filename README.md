# First Tackle

Stable 2D browser prototype for a small fishing game set around a roadside pond and village map, with an optional experimental 3D fishing view for future iteration.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Current Features

- Illustrated world map with clickable area zones for House, Garden, Canal, and Market.
- EN/UK localization with saved language selection.
- Animated location scenes and an animated road car on the world map.
- House crafting and fish processing flow for primitive tackle, cleaning, salting, drying, and taranka.
- Garden bait gathering and basic progression shop loop.
- Dedicated float fishing minigame with bait selection, cast zones, bite patterns, strike timing, centered catch result cards, and a quick return-to-map button.
- Selective market selling from the keepnet by species or by individual fish, plus bulk sell actions for fresh fish, taranka, and smoked fish.
- Collapsible HUD, inventory, fishing controls, and result panels for a cleaner scene view.
- Individual fish inventory entries with saved weight, value, day caught, and processing status.
- Audio settings with browser-safe activation, saved track selection, fixed/random music mode, and Web Audio fallback sounds.
- Optional experimental 3D skybox fishing mode that reuses the same core fishing logic while the stable 2D mode remains the default.
- Save, load, and reset through `localStorage`.

## Asset Usage

The project uses prepared static assets when they are present:

- `public/assets/locations/fishing-canal.webp`
- `public/assets/transitions/grandma-house/grandma-house-flyin.mp4`
- `public/assets/transitions/grandma-house/grandma-house-flyin-2.mp4`
- `public/assets/fish/catch_rotan_card.png`
- `public/assets/fish/catch_crucian_card.png`
- `public/assets/fish/catch_result_frame.png`
- `public/assets/items/primitive_tackle.png`
- `public/assets/items/tackle_components.png`
- `public/assets/items/bait_types_clean.png`
- `public/assets/items/taranka_drying.png`

If optional image assets are missing, the UI falls back to text-first cards and existing scene styling instead of crashing.

## Audio Plan

Optional audio files can be placed here:

- `public/assets/audio/sfx/`
- `public/assets/audio/music/`

Expected SFX filenames:

- `ui_click.mp3`
- `open_scene.mp3`
- `close_scene.mp3`
- `cast_whoosh.mp3`
- `bobber_plop.mp3`
- `water_ripple.mp3`
- `tiny_nibble.mp3`
- `strong_bite.mp3`
- `strike.mp3`
- `catch_success.mp3`
- `fish_escape.mp3`
- `line_break.mp3`
- `coins.mp3`
- `buy_item.mp3`
- `sell_item.mp3`
- `craft_item.mp3`
- `gather_bait.mp3`
- `dry_fish.mp3`

Expected music or ambient filenames:

- `ambient_day.mp3`
- `ambient_day.mp3.mp3`
- `ambient_evening.mp3`
- `ambient_evening.mp3.mp3`
- `theme.mp3`
- `theme.mp3.mp3`

If these files are not present, the game uses built-in Web Audio fallback sounds for click, open/close, cast, plop, nibble, strong bite, strike, catch success, escape, line break, coins, crafting, bait gathering, selling, and drying actions. This keeps the UI responsive without requiring external services or video files.

## Audio Prompt Ideas

Suggested external-generation prompts for optional music:

- Ambient daytime loop: "Quiet rural Ukrainian village canal ambience, soft wind, distant road, birds, insects, gentle water, warm summer afternoon, seamless loop, no vocals, no percussion, 60 seconds."
- Evening fishing loop: "Peaceful evening fishing ambience near a small village canal, crickets, soft water, distant dog bark, light breeze, warm nostalgic mood, seamless loop, no vocals, 60 seconds."
- Main theme: "Minimal cozy acoustic folk ambient theme for a rural fishing game, soft guitar or bandura-like plucked strings, warm nostalgic Ukrainian countryside mood, no vocals, seamless loop, 90 seconds."

Suggested SFX prompts:

- "small fishing float plop into calm water, short clean sound"
- "tiny fish nibble on bobber, subtle water tick"
- "strong fish bite splash, short"
- "fishing line snap, short dry sound"
- "small coins clink, pleasant UI reward"

## Project Structure

```text
src/
  audio/
    audioManager.js
    soundConfig.js
  game/
    bitePatterns.js
    economy.js
    fishData.js
    fishInventory.js
    fishing.js
    fishingMinigameLogic.js
    interactions.js
    inventory.js
    mapHotspots.js
    mapPaths.js
    player.js
    save.js
    state.js
    world.js
  i18n/
    i18n.js
    translations.js
  ui/
    fishingMinigame.css
    fishingMinigame.js
    hud.js
    locationScene.css
    locationScene.js
    mapOverlay.css
    mapOverlay.js
    panels.js
  main.js
public/
  assets/
README.md
style.css
```
