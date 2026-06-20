# First Tackle Mobile Cleanup Audit

## Audit Categories

### Keep
- Core loop: travel, fish, catch, keepnet inventory, sell, buy upgrades, unlock waters.
- Classic 2D fishing minigame and bite logic.
- Market sell/buy/prices, now scoped to the market scene.
- Tackle components and active rig selection.
- Save/load with migration.
- Audio toggles and one ambient music track.

### Refactor
- Water progression is centralized in `src/game/locations.js`.
- Travel side effects are centralized in `src/game/travel.js`.
- Fishing spots now filter by selected water instead of special-casing `greada`.
- Guide water data is generated from the same progression model as the map and travel system.
- Mobile map hotspot labels now sit inside touch targets and stay visible at phone widths.

### Merge
- Global shop and fish-price panels were folded into the market scene.
- Market selling remains one path; the unused legacy market renderer was removed.
- Catch/profile-style summary remains in status, keepnet, and journal instead of a separate profile panel.

### Remove
- Experimental 3D fishing UI, loader code, selected 3D assets, sky HDR, and ignored Quaternius source dump.
- Extra music tracks and settings controls for track switching.
- Debug coin tool and developer diagnostic HUD line.
- Global market/profile/shop/fish-price panel surfaces.
- Smoker purchase/action path. Existing smoked fish in old saves can still be sold if present.

## Updated Location Structure

Support locations:
- Бабусин будинок
- Грядки
- Ринок
- Автостанція

Fishing progression:
1. Канава
2. Шлюз
3. Ставки Пожара
4. Гряда
5. Озеро Тур
6. Гірницьке озеро

Travel rules:
- Канава is free/walkable.
- Гряда, Шлюз, and Ставки Пожара require the bicycle.
- Озеро Тур costs 30 coins by bus ticket.
- Гірницьке озеро costs 50 coins by bus ticket.

## Mobile Edition Architecture

- One primary map screen with all major destinations visible.
- Support actions live inside location scenes.
- Market actions live only at Ринок.
- Bus ticket actions live only at Автостанція and are paid per trip.
- Fishing opens directly into the classic 2D minigame.
- HUD menu is reduced to Inventory, Keepnet, Tackle, Guide, Journal, Settings.

## Gameplay Loop Analysis

The cleaned loop is:

Travel -> Fish -> Catch -> Manage keepnet -> Sell at Ринок -> Buy upgrades -> Unlock farther water

The loop is stronger now because distant water access has explicit costs or unlocks. Bus travel is no longer free, bicycle routes are consistent, and the guide/map/fishing systems read the same location progression data.

## UI Before/After

Before:
- Multiple global panels competed with scene UI.
- Market could be opened away from the market.
- Experimental fishing mode added an extra decision before fishing.
- Debug/profile/settings content inflated the mobile menu.
- Far-water travel was mostly a Greada special case.

After:
- Map-first navigation with visible progression.
- Market scoped to Ринок.
- Tickets scoped to Автостанція.
- Fishing starts immediately.
- Fewer menu items and fewer popups.
- Locked map destinations explain their requirement.

## Performance Improvements

- Removed tracked 3D fishing prototype assets and code.
- Removed ignored 116 MB Quaternius source asset dump.
- Removed two large unused music tracks.
- Removed unused pointer listeners for panorama drag.
- Removed dead global panel CSS and renderer branches.
- Build still warns about a large JS chunk because Three.js remains in the main app.

## Save Compatibility

- Old `pond` and `home_canal` water IDs migrate to `canal`.
- Old `old_pond` migrates to `fire_ponds`.
- Existing `greada` saves remain valid.
- Existing smoked fish can still be sold, but new smoker production is removed.

## Remaining Recommendations

- Code-split or remove the background Three.js village world if mobile startup size becomes the next priority.
- Replace the single world-map image with a mobile-composed map or lower-resolution responsive asset.
- Add a small automated browser smoke test when Playwright or the in-app browser tool is available.
- Consider adding one unique background image for Автостанція and one for late-game lakes.
