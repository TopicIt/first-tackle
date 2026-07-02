# Item Effects and Market

Date: 2026-07-02

Branch: `codex/cloud-market-buffs-leaderboard-pass`

## Goal

This pass keeps the current local gameplay loop, but makes the market more product-ready and prepares item effects for future server ownership.

## Market Categories

The Buy tab now uses compact categories:

- `Снасті`
- `Наживки / прикормки`
- `Різне`

Current mapping is still frontend-owned and safe:

- rods, lines, floats, sinkers, hooks, tackle upgrades -> `Снасті`
- bait packs -> `Наживки / прикормки`
- tools, salt, travel utility -> `Різне`

## Effect Schema

Shop items can now include visible and functional effects:

```js
effects: [
  { type: "fishSizeMultiplier", value: 0.01, label: "★ +1% до розміру риби" },
  { type: "trophyChanceBonus", value: 0.01, label: "★ +1% до шансу трофея" },
  { type: "biteChanceBonus", value: 0.02, label: "★ +2% до шансу клювання" },
  { type: "escapeChanceMultiplier", value: -0.10, label: "★ -10% до ймовірності зриву" }
]
```

The UI renders these through a consistent `.item-effect-bonus` style.

## Current Rule

Current passive/equipped behavior:

- tackle-slot items use the currently equipped tackle state when equipment exists;
- utility items with no tackle slot can remain passive;
- frontend still bridges this through local `PlayerState` inventory/tackle data.

This keeps the logic honest without inventing a large new equipment UI in this pass.

## Where Effects Apply

Current local catch flow uses item modifiers in small, clamped ways:

- bite chance checks;
- strike success chance;
- trophy bonus passed into catch roll;
- fish size multiplier after local weight roll;
- escape/break chance reduction.

The values are intentionally small. This is not a balance rewrite.

## Future Server Ownership

The frontend now sends active item modifiers in catch-resolution payload metadata for contract readiness, but that must not become the final trust model.

Future direction:

1. server owns player profile and `PlayerState`
2. server owns inventory/equipment
3. server computes active modifiers from server-owned equipment
4. server resolves catch and validates leaderboard records

## Balance Risks

- Stacking too many passive bonuses would flatten progression.
- Frontend-computed modifiers are still untrusted.
- Server migration helps trust and anti-cheat, but does not reduce render, image, video, or animation cost on phones.
