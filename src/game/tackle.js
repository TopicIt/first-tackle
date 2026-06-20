export const tackleComponents = {
  line: ['grandma_thread', 'better_line'],
  hook: ['old_dull_hook', 'sharper_hook'],
  sinker: ['small_stone', 'proper_sinker'],
  float: ['none', 'goose_feather_float', 'cheap_float', 'proper_float'],
  rod: ['none', 'simple_stick_rod', 'proper_rod'],
};

export const componentLabels = {
  grandma_thread: 'componentGrandmaThread',
  better_line: 'componentBetterLine',
  old_dull_hook: 'componentOldDullHook',
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

export function createInitialTackleState() {
  return {
    owned: {
      grandma_thread: true,
      old_dull_hook: true,
      small_stone: true,
      none: true,
    },
    equipped: {
      line: 'grandma_thread',
      hook: 'old_dull_hook',
      sinker: 'small_stone',
      float: 'none',
      rod: 'none',
    },
  };
}

export function ensureTackleState(state) {
  state.tackle ??= createInitialTackleState();
  state.progress ??= {};
  if (state.progress.firstTackleReady !== false) {
    state.progress.firstTackleReady = true;
    state.inventory ??= {};
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

  if (state.inventory?.primitiveTackle > 0) {
    state.tackle.owned.grandma_thread = true;
    state.tackle.owned.old_dull_hook = true;
    state.tackle.owned.small_stone = true;
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
  if (state.purchased?.sharperHook) {
    state.tackle.owned.sharper_hook = true;
  }
  if (state.purchased?.properRod) {
    state.tackle.owned.proper_rod = true;
  }
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
  state.tackle.equipped[slot] = componentId;
  return true;
}

export function getTackleEffects(state) {
  ensureTackleState(state);
  const equipped = state.tackle.equipped;
  return {
    reachBonus: equipped.line === 'better_line' ? 1 : 0,
    hookBonus: equipped.hook === 'sharper_hook' ? 0.12 : -0.08,
    stabilityBonus: equipped.sinker === 'proper_sinker' ? 0.08 : -0.04,
    floatBonus: equipped.float === 'proper_float' ? 0.12 : equipped.float === 'cheap_float' ? 0.08 : equipped.float === 'goose_feather_float' ? 0.05 : -0.08,
    hasFloat: equipped.float !== 'none',
    hasRod: equipped.rod === 'simple_stick_rod',
    hasProperRod: equipped.rod === 'proper_rod',
    breakPenalty: equipped.line === 'grandma_thread' ? 0.12 : -0.16,
    scatterScale: getScatterScale(equipped),
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
