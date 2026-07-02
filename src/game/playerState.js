import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME } from './state.js';
import { getKeepnetSummary } from './fishInventory.js';

export const PLAYER_STATE_VERSION = 1;

let currentPlayerState = null;

export function createDefaultPlayerState(seed = {}) {
  const now = new Date().toISOString();
  const profile = seed.profile ?? {};
  return {
    version: PLAYER_STATE_VERSION,
    revision: Number(seed.revision ?? 0),
    profile: {
      playerName: profile.playerName ?? DEFAULT_PLAYER_NAME,
      avatarId: profile.avatarId ?? DEFAULT_AVATAR,
      level: Number(profile.level ?? 1),
      xp: Number(profile.xp ?? 0),
      achievements: profile.achievements ?? {},
      createdAt: profile.createdAt ?? null,
      updatedAt: profile.updatedAt ?? now,
    },
    economy: {
      coins: Number(seed.economy?.coins ?? 0),
      totalCoinsEarned: Number(seed.economy?.totalCoinsEarned ?? 0),
      totalCoinsSpent: Number(seed.economy?.totalCoinsSpent ?? 0),
    },
    inventory: {
      items: seed.inventory?.items ?? {},
      bait: seed.inventory?.bait ?? {},
      rods: seed.inventory?.rods ?? {},
      tackle: seed.inventory?.tackle ?? {},
      equipment: seed.inventory?.equipment ?? {},
    },
    keepnet: {
      fish: Array.isArray(seed.keepnet?.fish) ? seed.keepnet.fish : [],
      capacity: seed.keepnet?.capacity ?? null,
      summary: seed.keepnet?.summary ?? {
        totalFish: 0,
        totalWeight: 0,
        species: [],
      },
    },
    progress: {
      day: Number(seed.progress?.day ?? 1),
      timeOfDay: seed.progress?.timeOfDay ?? null,
      unlockedLocations: Array.isArray(seed.progress?.unlockedLocations) ? seed.progress.unlockedLocations : ['canal'],
      visitedLocations: seed.progress?.visitedLocations ?? { canal: true },
      tutorialFlags: seed.progress?.tutorialFlags ?? {},
      questFlags: seed.progress?.questFlags ?? {},
      orderFlags: seed.progress?.orderFlags ?? {},
    },
    stats: {
      fishCaughtTotal: Number(seed.stats?.fishCaughtTotal ?? 0),
      fishReleasedTotal: Number(seed.stats?.fishReleasedTotal ?? 0),
      fishSoldTotal: Number(seed.stats?.fishSoldTotal ?? 0),
      biggestFish: seed.stats?.biggestFish ?? null,
      catchesBySpecies: seed.stats?.catchesBySpecies ?? {},
      catchesByLocation: seed.stats?.catchesByLocation ?? {},
    },
    authority: {
      mode: seed.authority?.mode ?? 'local',
      verified: Boolean(seed.authority?.verified ?? false),
      lastServerRevision: seed.authority?.lastServerRevision ?? null,
      lastSyncAt: seed.authority?.lastSyncAt ?? null,
      lastMutationReason: seed.authority?.lastMutationReason ?? null,
    },
  };
}

export function migratePlayerState(rawSaveOrState = {}) {
  const source = rawSaveOrState && typeof rawSaveOrState === 'object' ? rawSaveOrState : {};
  const existing = source.playerState && typeof source.playerState === 'object' ? source.playerState : source;
  const hasLegacyGameState = source.money != null
    || source.playerProfile != null
    || source.inventory != null
    || source.fishBasket != null
    || source.stats != null;
  const derived = hasLegacyGameState ? derivePlayerStateFromGameState(source) : createDefaultPlayerState(existing);
  const base = createDefaultPlayerState(derived);

  const migrated = {
    ...base,
    ...existing,
    version: PLAYER_STATE_VERSION,
    revision: Number(existing.revision ?? base.revision ?? 0),
    profile: {
      ...base.profile,
      ...(existing.profile ?? {}),
    },
    economy: {
      ...base.economy,
      ...(existing.economy ?? {}),
      coins: Number(hasLegacyGameState ? derived.economy.coins : (existing.economy?.coins ?? base.economy.coins)),
      totalCoinsEarned: Number(hasLegacyGameState ? derived.economy.totalCoinsEarned : (existing.economy?.totalCoinsEarned ?? base.economy.totalCoinsEarned)),
    },
    inventory: {
      ...base.inventory,
      ...(existing.inventory ?? {}),
      items: {
        ...base.inventory.items,
        ...(existing.inventory?.items ?? {}),
        ...derived.inventory.items,
      },
      bait: {
        ...base.inventory.bait,
        ...(existing.inventory?.bait ?? {}),
        ...derived.inventory.bait,
      },
      rods: {
        ...base.inventory.rods,
        ...(existing.inventory?.rods ?? {}),
        ...derived.inventory.rods,
      },
      tackle: {
        ...base.inventory.tackle,
        ...(existing.inventory?.tackle ?? {}),
        ...derived.inventory.tackle,
      },
      equipment: {
        ...base.inventory.equipment,
        ...(existing.inventory?.equipment ?? {}),
        ...derived.inventory.equipment,
      },
    },
    keepnet: {
      ...base.keepnet,
      ...(existing.keepnet ?? {}),
      fish: derived.keepnet.fish,
      summary: derived.keepnet.summary,
    },
    progress: {
      ...base.progress,
      ...(existing.progress ?? {}),
      ...derived.progress,
    },
    stats: {
      ...base.stats,
      ...(existing.stats ?? {}),
      ...derived.stats,
      fishReleasedTotal: Number(existing.stats?.fishReleasedTotal ?? base.stats.fishReleasedTotal),
      fishSoldTotal: Number(existing.stats?.fishSoldTotal ?? base.stats.fishSoldTotal),
    },
    authority: {
      ...base.authority,
      ...(existing.authority ?? {}),
    },
  };

  currentPlayerState = migrated;
  return migrated;
}

export function getPlayerState(state = null) {
  if (state && typeof state === 'object') {
    state.playerState = migratePlayerState(state);
    return state.playerState;
  }

  currentPlayerState ??= createDefaultPlayerState();
  return currentPlayerState;
}

export function setPlayerState(stateOrNextState, maybeNextState = null) {
  if (maybeNextState == null) {
    currentPlayerState = migratePlayerState({ playerState: stateOrNextState });
    return currentPlayerState;
  }

  const state = stateOrNextState;
  state.playerState = migratePlayerState({ ...state, playerState: maybeNextState });
  currentPlayerState = state.playerState;
  return state.playerState;
}

export function patchPlayerState(stateOrPatch, maybePatch = null, reason = 'patch') {
  if (maybePatch == null) {
    currentPlayerState = deepMergePlayerState(getPlayerState(), stateOrPatch ?? {});
    return incrementPlayerRevision(reason);
  }

  const state = stateOrPatch;
  state.playerState = deepMergePlayerState(getPlayerState(state), maybePatch ?? {});
  return incrementPlayerRevision(state, reason);
}

export function incrementPlayerRevision(stateOrReason = null, maybeReason = 'mutation') {
  if (stateOrReason && typeof stateOrReason === 'object') {
    const state = stateOrReason;
    state.playerState = migratePlayerState(state);
    state.playerState.revision = Number(state.playerState.revision ?? 0) + 1;
    state.playerState.profile.updatedAt = new Date().toISOString();
    state.playerState.authority = {
      ...(state.playerState.authority ?? {}),
      mode: state.playerState.authority?.mode ?? 'local',
      verified: Boolean(state.playerState.authority?.verified ?? false),
      lastMutationReason: maybeReason,
    };
    currentPlayerState = state.playerState;
    return state.playerState.revision;
  }

  const reason = typeof stateOrReason === 'string' ? stateOrReason : maybeReason;
  currentPlayerState = migratePlayerState({ playerState: getPlayerState() });
  currentPlayerState.revision = Number(currentPlayerState.revision ?? 0) + 1;
  currentPlayerState.profile.updatedAt = new Date().toISOString();
  currentPlayerState.authority.lastMutationReason = reason;
  return currentPlayerState.revision;
}

export function getPlayerRevision(state = null) {
  return Number(getPlayerState(state).revision ?? 0);
}

export function syncPlayerStateFromGameState(state, { incrementRevision = false, reason = 'sync' } = {}) {
  const previousRevision = Number(state.playerState?.revision ?? 0);
  const previousAuthority = state.playerState?.authority ?? {};
  state.playerState = {
    ...migratePlayerState(state),
    revision: previousRevision,
    authority: {
      ...migratePlayerState(state).authority,
      ...previousAuthority,
      mode: previousAuthority.mode ?? 'local',
      verified: Boolean(previousAuthority.verified ?? false),
    },
  };

  if (incrementRevision) {
    incrementPlayerRevision(state, reason);
  }

  currentPlayerState = state.playerState;
  return state.playerState;
}

export function playerStatePatchForSave(state) {
  return syncPlayerStateFromGameState(state, { incrementRevision: false });
}

function derivePlayerStateFromGameState(state) {
  const profile = state.playerProfile ?? {};
  const inventory = state.inventory ?? {};
  const tackle = state.tackle ?? {};
  const stats = state.stats ?? {};
  const fishBasket = Array.isArray(state.fishBasket) ? state.fishBasket : [];
  const summary = safeKeepnetSummary(state);
  const catchesBySpecies = deriveCatchesBySpecies(state);
  const catchesByLocation = deriveCatchesByLocation(fishBasket);
  const biggestFish = stats.biggestFishSpecies
    ? {
      fishId: stats.biggestFishSpecies,
      weightGrams: stats.biggestFishWeight ?? 0,
      caughtAtDay: stats.biggestFishCaughtAtDay ?? null,
      caughtAtTime: stats.biggestFishCaughtAtTime ?? null,
    }
    : null;

  return createDefaultPlayerState({
    revision: Number(state.playerState?.revision ?? 0),
    profile: {
      playerName: profile.playerName ?? profile.name ?? DEFAULT_PLAYER_NAME,
      avatarId: profile.avatarId ?? profile.avatar ?? DEFAULT_AVATAR,
      level: profile.level ?? 1,
      xp: profile.xp ?? 0,
      achievements: {
        ...(profile.achievementFlags ?? {}),
        ...(state.achievements ?? {}),
      },
      createdAt: profile.createdAt ?? null,
      updatedAt: profile.updatedAt ?? null,
    },
    economy: {
      coins: state.money ?? 0,
      totalCoinsEarned: profile.totalCoinsEarned ?? 0,
      totalCoinsSpent: state.playerState?.economy?.totalCoinsSpent ?? 0,
    },
    inventory: {
      items: { ...inventory },
      bait: pickKeys(inventory, ['smallWorms', 'worms', 'larvae', 'bread', 'mastyrka', 'corn', 'dough', 'nightcrawler']),
      rods: pickKeys(inventory, ['primitiveTackle', 'stickRod']),
      tackle: {
        owned: { ...(tackle.owned ?? {}) },
        equipped: { ...(tackle.equipped ?? {}) },
        activeRig: tackle.activeRig ?? null,
      },
      equipment: { ...(state.purchased ?? {}) },
    },
    keepnet: {
      fish: fishBasket.map(normalizePlayerStateFish),
      capacity: state.playerState?.keepnet?.capacity ?? null,
      summary,
    },
    progress: {
      day: state.day ?? 1,
      timeOfDay: state.time?.minutes ?? null,
      unlockedLocations: profile.locationsUnlocked ?? ['canal'],
      visitedLocations: { ...(state.travel?.visitedWaters ?? { canal: true }) },
      tutorialFlags: { ...(state.tutorialState ?? {}) },
      questFlags: { ...(state.quests ?? {}) },
      orderFlags: { ...(state.cafeOrders ?? {}) },
    },
    stats: {
      fishCaughtTotal: profile.fishCaughtTotal ?? stats.totalFishCaught ?? 0,
      fishReleasedTotal: state.playerState?.stats?.fishReleasedTotal ?? 0,
      fishSoldTotal: state.playerState?.stats?.fishSoldTotal ?? 0,
      biggestFish,
      catchesBySpecies,
      catchesByLocation,
    },
    authority: {
      mode: state.playerState?.authority?.mode ?? 'local',
      verified: Boolean(state.playerState?.authority?.verified ?? false),
      lastServerRevision: state.playerState?.authority?.lastServerRevision ?? null,
      lastSyncAt: state.playerState?.authority?.lastSyncAt ?? null,
      lastMutationReason: state.playerState?.authority?.lastMutationReason ?? null,
    },
  });
}

function deepMergePlayerState(base, patch) {
  const merge = (left, right) => {
    if (!right || typeof right !== 'object' || Array.isArray(right)) {
      return right;
    }
    const result = { ...(left && typeof left === 'object' && !Array.isArray(left) ? left : {}) };
    for (const [key, value] of Object.entries(right)) {
      result[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(result[key], value)
        : value;
    }
    return result;
  };

  return migratePlayerState({ playerState: merge(base, patch) });
}

function safeKeepnetSummary(state) {
  try {
    return getKeepnetSummary(state);
  } catch {
    return {
      totalFish: Array.isArray(state.fishBasket) ? state.fishBasket.length : 0,
      totalWeight: (state.fishBasket ?? []).reduce((total, fish) => total + (fish.weightGrams ?? 0), 0),
      species: [],
    };
  }
}

function normalizePlayerStateFish(entry) {
  return {
    id: entry.id,
    fishId: entry.fishId,
    weightGrams: entry.weightGrams ?? 0,
    value: entry.value ?? 0,
    status: entry.status ?? 'fresh',
    waterId: entry.waterId ?? null,
    caughtAtDay: entry.caughtAtDay ?? null,
    caughtAtTime: entry.caughtAtTime ?? null,
    catchCategory: entry.catchCategory ?? null,
    trophyTier: entry.trophyTier ?? null,
  };
}

function deriveCatchesBySpecies(state) {
  const result = {};
  for (const [fishId, entry] of Object.entries(state.catchJournal ?? {})) {
    const count = entry?.totalCaught ?? entry?.count ?? 0;
    if (count > 0) {
      result[fishId] = count;
    }
  }
  for (const entry of state.fishBasket ?? []) {
    result[entry.fishId] = Math.max(result[entry.fishId] ?? 0, 0);
  }
  return result;
}

function deriveCatchesByLocation(fishBasket) {
  const result = {};
  for (const entry of fishBasket) {
    const waterId = entry.waterId ?? 'canal';
    result[waterId] = (result[waterId] ?? 0) + 1;
  }
  return result;
}

function pickKeys(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, source[key] ?? 0]));
}
