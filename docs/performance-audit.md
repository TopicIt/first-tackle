# Performance Audit

Mobile-first audit for the current frontend-only build.

## Main Suspects

- The main animation loop renders Three.js every frame even when most gameplay is DOM/UI driven.
- HUD rendering builds a large snapshot with `JSON.stringify` to detect changes; this is useful but can become costly during fishing because it runs often.
- Fishing scenes use many CSS animations for atmosphere, bobber states, insects, ripples, reeds, and character idle motion.
- Location scenes can layer large images, atmosphere elements, glass surfaces, and transition videos on low-end phones.
- Large PNG assets are decoded on the client, and some art variants are still heavy for mobile.

## Optimized In This Patch

- Removed scheduled calls to `updateMapOverlayMotion()`, which is currently a no-op but was still called from both a 250 ms interval and the animation loop.
- Fixed startup preloading so it no longer requests the obsolete `logo-ua.png`; it now preloads `logo-mark.png`, `Logo-ukr.png`, and `logo-eng.png`.
- Kept Shluz/Stavky sub-map scenes free of body/panel blur, backdrop filters, and decorative water/cloud overlays.
- Tightened market card layout so fewer DOM pixels and less scroll height are needed on mobile.

## Still Risky

- The per-frame Three.js render loop is still always active while the app is visible.
- Fishing UI still recalculates and re-renders frequently while the minigame is open.
- CSS animation count is high in fishing scenes; low-power mode helps, but normal mode can still heat phones.
- Several core art assets are large PNGs. They should be converted to mobile-sized WebP/AVIF variants with PNG fallbacks.

## Backend/Server Candidates

- Account/save validation and sync.
- Leaderboards and achievement/trophy verification.
- Market price generation and daily economy state.
- Quest completion validation.
- Anti-cheat checks for money, catches, trophy rewards, and unlocks.

## Recommended Next Client Optimizations

- Pause Three.js rendering or lower render FPS whenever a full DOM scene, market, guide, or settings panel is open.
- Split the HUD snapshot into smaller dirty flags instead of stringifying the whole state.
- Lazy-render hidden panels only when opened.
- Add mobile-sized image variants for location backgrounds and market/fish cards.
- Default older or hot devices to low-power mode after detecting sustained frame drops.
