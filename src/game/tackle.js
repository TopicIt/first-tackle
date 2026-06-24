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

export const tackleRigs = [
  {
    id: 'handline',
    labelKey: 'rigPrimitiveHandline',
    descriptionKey: 'rigPrimitiveHandlineDesc',
    method: 'handline',
  },
  {
    id: 'first_rod',
    labelKey: 'rigFirstRod',
    descriptionKey: 'rigFirstRodDesc',
    method: 'stickRod',
  },
  {
    id: 'proper_rod',
    labelKey: 'rigProperRod',
    descriptionKey: 'rigProperRodDesc',
    method: 'stickRod',
  },
];

export function createInitialTackleState() {
  return {
    activeRig: 'handline',
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
  state.inventory ??= {};
  const firstTackleReady = Boolean(state.progress.firstTackleReady || state.tutorialState?.completed || state.tutorialState?.skipped);
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
  state.tackle.activeRig = getRigAvailable(state, state.tackle.activeRig) ? state.tackle.activeRig : getBestAvailableRig(state).id;

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
  state.tackle.activeRig = getRigAvailable(state, state.tackle.activeRig) ? state.tackle.activeRig : getBestAvailableRig(state).id;
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

export function selectActiveRig(state, rigId) {
  ensureTackleState(state);
  if (!getRigAvailable(state, rigId)) {
    return false;
  }
  state.tackle.activeRig = rigId;
  return true;
}

export function getActiveRig(state) {
  ensureTackleState(state);
  return tackleRigs.find((rig) => rig.id === state.tackle.activeRig) ?? getBestAvailableRig(state);
}

export function getAvailableRigs(state) {
  ensureTackleState(state);
  return tackleRigs.map((rig) => ({
    ...rig,
    available: getRigAvailable(state, rig.id),
  }));
}

export function getRigMethod(state, rigId = state.tackle?.activeRig) {
  const rig = tackleRigs.find((entry) => entry.id === rigId) ?? getActiveRig(state);
  return rig.method;
}

export function getTackleEffects(state) {
  ensureTackleState(state);
  const equipped = state.tackle.equipped;
  const rig = getActiveRig(state);
  const usesRod = rig.id === 'first_rod' || rig.id === 'proper_rod';
  const usesProperRod = rig.id === 'proper_rod';
  const usesFloat = usesRod && equipped.float !== 'none';
  const line = usesProperRod ? equipped.line : rig.id === 'first_rod' ? equipped.line : 'grandma_thread';
  const hook = usesRod ? equipped.hook : 'old_dull_hook';
  const sinker = usesRod ? equipped.sinker : 'small_stone';
  const float = usesFloat ? equipped.float : 'none';
  return {
    activeRigId: rig.id,
    reachBonus: line === 'better_line' || usesProperRod ? 1 : 0,
    hookBonus: hook === 'sharper_hook' ? 0.12 : -0.08,
    stabilityBonus: sinker === 'proper_sinker' ? 0.08 : -0.04,
    floatBonus: float === 'proper_float' ? 0.12 : float === 'cheap_float' ? 0.08 : float === 'goose_feather_float' ? 0.05 : -0.08,
    hasFloat: usesFloat,
    hasRod: usesRod,
    hasProperRod: usesProperRod,
    breakPenalty: line === 'grandma_thread' ? 0.12 : -0.16,
    scatterScale: getScatterScale({
      ...equipped,
      line,
      hook,
      sinker,
      float,
      rod: usesProperRod ? 'proper_rod' : usesRod ? 'simple_stick_rod' : 'none',
    }),
  };
}

function getRigAvailable(state, rigId) {
  const owned = state.tackle?.owned ?? {};
  if (rigId === 'handline') {
    return (state.inventory?.primitiveTackle ?? 0) > 0;
  }
  if (rigId === 'first_rod') {
    return (state.inventory?.stickRod ?? 0) > 0 || owned.simple_stick_rod;
  }
  if (rigId === 'proper_rod') {
    return Boolean(owned.proper_rod || state.purchased?.properRod);
  }
  return false;
}

function getBestAvailableRig(state) {
  return [...tackleRigs].reverse().find((rig) => getRigAvailable(state, rig.id)) ?? tackleRigs[0];
}

function getScatterScale(equipped) {
  let scale = equipped.rod === 'proper_rod' ? 0.62 : equipped.rod === 'simple_stick_rod' ? 0.82 : 1.18;
  if (equipped.line === 'better_line') scale -= 0.12;
  if (equipped.float === 'proper_float') scale -= 0.1;
  else if (equipped.float === 'cheap_float') scale -= 0.06;
  if (equipped.sinker === 'proper_sinker') scale -= 0.08;
  return Math.max(0.48, scale);
}
