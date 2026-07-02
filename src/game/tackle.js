export const tackleComponents = {
  line: ['none', 'grandma_thread', 'better_line'],
  hook: ['none', 'old_dull_hook', 'small_hook', 'medium_hook', 'large_hook', 'sharper_hook'],
  sinker: ['none', 'small_stone', 'proper_sinker'],
  float: ['none', 'goose_feather_float', 'cheap_float', 'proper_float'],
  rod: ['none', 'simple_stick_rod', 'proper_rod'],
};

export const requiredTackleSlots = ['line', 'hook', 'sinker'];

export const componentLabels = {
  grandma_thread: 'componentGrandmaThread',
  better_line: 'componentBetterLine',
  old_dull_hook: 'componentOldDullHook',
  small_hook: 'componentSmallHook',
  medium_hook: 'componentMediumHook',
  large_hook: 'componentLargeHook',
  sharper_hook: 'componentSharperHook',
  small_stone: 'componentSmallStone',
  proper_sinker: 'componentProperSinker',
  none: 'componentNone',
  goose_feather_float: 'componentGooseFeatherFloat',
  cheap_float: 'componentCheapFloat',
  proper_float: 'componentProperFloat',
  simple_stick_rod: 'componentSimpleStickRod',
  proper_rod: 'componentProperRod',
};

export const componentDescriptions = {
  none: 'componentNoneDesc',
  grandma_thread: 'componentGrandmaThreadDesc',
  better_line: 'componentBetterLineDesc',
  old_dull_hook: 'componentOldDullHookDesc',
  small_hook: 'componentSmallHookDesc',
  medium_hook: 'componentMediumHookDesc',
  large_hook: 'componentLargeHookDesc',
  sharper_hook: 'componentSharperHookDesc',
  small_stone: 'componentSmallStoneDesc',
  proper_sinker: 'componentProperSinkerDesc',
  goose_feather_float: 'componentGooseFeatherFloatDesc',
  cheap_float: 'componentCheapFloatDesc',
  proper_float: 'componentProperFloatDesc',
  simple_stick_rod: 'componentSimpleStickRodDesc',
  proper_rod: 'componentProperRodDesc',
};

export const componentEffects = {
  grandma_thread: { breakPenalty: 0.12, trophyBonus: 0 },
  better_line: { breakPenalty: -0.16, reachBonus: 1, trophyBonus: 0.015 },
  old_dull_hook: { hookBonus: -0.08 },
  small_hook: { hookBonus: 0.03, escapeReduction: 0.01 },
  medium_hook: { hookBonus: 0.07, escapeReduction: 0.03 },
  large_hook: { hookBonus: 0.09, escapeReduction: 0.05, trophyBonus: 0.01 },
  sharper_hook: { hookBonus: 0.12, escapeReduction: 0.08 },
  small_stone: { stabilityBonus: -0.04 },
  proper_sinker: { stabilityBonus: 0.08, scatterBonus: -0.08 },
  none: { floatBonus: -0.08 },
  goose_feather_float: { floatBonus: 0.05 },
  cheap_float: { floatBonus: 0.08, scatterBonus: -0.06 },
  proper_float: { floatBonus: 0.12, scatterBonus: -0.1 },
  simple_stick_rod: { controlBonus: 0.08, scatterBase: 0.82 },
  proper_rod: { controlBonus: 0.16, reachBonus: 1, scatterBase: 0.62, escapeReduction: 0.08 },
};

export function createInitialTackleState() {
  return {
    activeRig: null,
    owned: {
      none: true,
    },
    equipped: {
      line: 'none',
      hook: 'none',
      sinker: 'none',
      float: 'none',
      rod: 'none',
    },
    migratedLegacyRig: false,
  };
}

export function ensureTackleState(state) {
  state.tackle ??= createInitialTackleState();
  state.progress ??= {};
  state.inventory ??= {};
  const firstTackleReady = Boolean(state.progress.firstTackleReady || state.progress.starterTackleDrawerCompleted);
  state.progress.firstTackleReady = firstTackleReady;
  if (firstTackleReady) {
    state.inventory.primitiveTackle = Math.max(1, state.inventory.primitiveTackle ?? 0);
  }
  state.tackle.owned = {
    ...createInitialTackleState().owned,
    ...(state.tackle.owned ?? {}),
  };
  state.tackle.equipped = {
    ...createInitialTackleState().equipped,
    ...(state.tackle.equipped ?? {}),
  };
  migrateOldRigSelectionOnce(state);

  if (state.inventory?.primitiveTackle > 0) {
    state.tackle.owned.grandma_thread = true;
    state.tackle.owned.old_dull_hook = true;
    state.tackle.owned.small_stone = true;
  }
  if (state.progress?.starterTackleDrawerCompleted) {
    state.tackle.owned.goose_feather_float = true;
    state.tackle.owned.simple_stick_rod = true;
  }
  if (state.inventory?.stickRod > 0) {
    state.tackle.owned.simple_stick_rod = true;
  }
  if (state.purchased?.betterLine) {
    state.tackle.owned.better_line = true;
  }
  if (state.purchased?.simpleFloat) {
    state.tackle.owned.cheap_float = true;
  }
  if (state.purchased?.properFloat) {
    state.tackle.owned.proper_float = true;
  }
  if (state.purchased?.properSinker) {
    state.tackle.owned.proper_sinker = true;
  }
  if (state.purchased?.smallHook) {
    state.tackle.owned.small_hook = true;
  }
  if (state.purchased?.mediumHook) {
    state.tackle.owned.medium_hook = true;
  }
  if (state.purchased?.largeHook) {
    state.tackle.owned.large_hook = true;
  }
  if (state.purchased?.sharperHook) {
    state.tackle.owned.sharper_hook = true;
  }
  if (state.purchased?.properRod) {
    state.tackle.owned.proper_rod = true;
  }
  repairEquippedComponents(state);
  state.tackle.activeRig = null;
}

export function ownTackleComponent(state, componentId) {
  ensureTackleState(state);
  state.tackle.owned[componentId] = true;
}

export function equipTackleComponent(state, slot, componentId) {
  ensureTackleState(state);
  if (!tackleComponents[slot]?.includes(componentId) || !state.tackle.owned[componentId]) {
    return false;
  }
  if (requiredTackleSlots.includes(slot) && componentId === 'none') {
    return false;
  }
  state.tackle.equipped[slot] = componentId;
  state.tackle.activeRig = null;
  return true;
}

export function selectActiveRig(state, rigId) {
  ensureTackleState(state);
  state.tackle.activeRig = null;
  return ['handline', 'first_rod', 'proper_rod'].includes(rigId);
}

export function getActiveRig(state) {
  ensureTackleState(state);
  const id = getLegacyRigIdFromComponents(state);
  return {
    id,
    labelKey: id === 'handline' ? 'activeTackleHandline' : 'activeTackleComponents',
    descriptionKey: 'activeTackleComponentsDesc',
    method: getRigMethod(state),
  };
}

export function getAvailableRigs(state) {
  ensureTackleState(state);
  return [];
}

export function getRigMethod(state, rigId = null) {
  ensureTackleState(state);
  return state.tackle.equipped?.rod && state.tackle.equipped.rod !== 'none' ? 'stickRod' : 'handline';
}

export function getTackleEffects(state) {
  ensureTackleState(state);
  const equipped = state.tackle.equipped;
  const rod = equipped.rod ?? 'none';
  const usesRod = rod !== 'none';
  const usesProperRod = rod === 'proper_rod';
  const line = equipped.line ?? 'none';
  const hook = equipped.hook ?? 'none';
  const sinker = equipped.sinker ?? 'none';
  const float = equipped.float ?? 'none';
  const lineEffects = componentEffects[line] ?? {};
  const hookEffects = componentEffects[hook] ?? {};
  const sinkerEffects = componentEffects[sinker] ?? {};
  const floatEffects = componentEffects[float] ?? {};
  const rodEffects = componentEffects[rod] ?? {};
  return {
    activeRigId: getLegacyRigIdFromComponents(state),
    reachBonus: Math.max(lineEffects.reachBonus ?? 0, rodEffects.reachBonus ?? 0),
    hookBonus: hookEffects.hookBonus ?? 0,
    stabilityBonus: sinkerEffects.stabilityBonus ?? 0,
    floatBonus: floatEffects.floatBonus ?? 0,
    controlBonus: rodEffects.controlBonus ?? 0,
    escapeReduction: (hookEffects.escapeReduction ?? 0) + (rodEffects.escapeReduction ?? 0),
    trophyBonus: (lineEffects.trophyBonus ?? 0) + (hookEffects.trophyBonus ?? 0),
    hasCompleteStarterSet: Boolean(line !== 'none' && hook !== 'none' && sinker !== 'none'),
    hasFloat: float !== 'none',
    hasRod: usesRod,
    hasProperRod: usesProperRod,
    breakPenalty: lineEffects.breakPenalty ?? 0,
    scatterScale: getScatterScale({
      ...equipped,
      line,
      hook,
      sinker,
      float,
      rod,
    }),
  };
}

function getScatterScale(equipped) {
  let scale = equipped.rod === 'proper_rod' ? 0.62 : equipped.rod === 'simple_stick_rod' ? 0.82 : 1.18;
  if (equipped.line === 'better_line') scale -= 0.12;
  if (equipped.float === 'proper_float') scale -= 0.1;
  else if (equipped.float === 'cheap_float') scale -= 0.06;
  if (equipped.sinker === 'proper_sinker') scale -= 0.08;
  return Math.max(0.48, scale);
}

function migrateOldRigSelectionOnce(state) {
  if (state.tackle?.migratedLegacyRig) {
    return;
  }

  const rigId = state.tackle?.activeRig;
  const currentRod = state.tackle?.equipped?.rod ?? 'none';
  if (currentRod !== 'none') {
    state.tackle.migratedLegacyRig = true;
    return;
  }

  if (rigId === 'proper_rod' && (state.tackle.owned?.proper_rod || state.purchased?.properRod)) {
    state.tackle.equipped.rod = 'proper_rod';
  } else if (rigId === 'first_rod' && (state.tackle.owned?.simple_stick_rod || (state.inventory?.stickRod ?? 0) > 0)) {
    state.tackle.equipped.rod = 'simple_stick_rod';
  }
  state.tackle.migratedLegacyRig = true;
}

function repairEquippedComponents(state) {
  for (const [slot, components] of Object.entries(tackleComponents)) {
    const selected = state.tackle.equipped[slot];
    if (!components.includes(selected) || !state.tackle.owned[selected]) {
      state.tackle.equipped[slot] = components.find((component) => component !== 'none' && state.tackle.owned[component])
        ?? 'none';
    }
  }
}

function getLegacyRigIdFromComponents(state) {
  const rod = state.tackle?.equipped?.rod;
  if (rod === 'proper_rod') {
    return 'proper_rod';
  }
  if (rod === 'simple_stick_rod') {
    return 'first_rod';
  }
  return 'handline';
}
