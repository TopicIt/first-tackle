import { fishIds } from './inventory.js';
import { getFishData } from './fishData.js';
import { pushFeedback, pushLog } from './state.js';
import { classifyCatchSize, trophyTierForCategory } from './fishSizeProfiles.js';
import { syncGrandmaTrust } from './profile.js';

const trackedStatuses = ['fresh', 'cleaned', 'salted', 'drying', 'ready_taranka', 'taranka', 'smoked', 'live_bait'];
const liveBaitSpecies = ['gudgeon', 'crucian', 'plotytsia', 'loach'];

export function createFishEntry(catchResult, caughtAtDay, context = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fishId: catchResult.id,
    weightGrams: catchResult.weightGrams,
    caughtAtDay,
    catchSpotId: context.catchSpotId ?? null,
    method: context.method ?? null,
    bait: context.bait ?? null,
    value: catchResult.value,
    status: 'fresh',
    isLiveBaitEligible: isLiveBaitEligible(catchResult.id, catchResult.weightGrams),
    catchCategory: catchResult.catchCategory ?? classifyCatchSize(catchResult.id, catchResult.weightGrams),
    trophyTier: null,
  };
}

export function ensureFishState(state) {
  state.fishBasket ??= [];
  state.catchJournal ??= {};
  state.trophies ??= [];
  state.achievements ??= {};
  state.achievements.trophyBySpecies ??= {};
  state.day ??= 1;
  state.progress ??= {};
  state.stats ??= {};
  state.progress.firstTackleReady = true;
  state.progress.firstCatchDone = Boolean(state.progress.firstCatchDone ?? state.stats.totalFishCaught > 0);
  state.stats.totalFishCaught ??= 0;
  if (state.fishBasket.length === 0) {
    migrateLegacyFishInventory(state);
  }
  state.fishBasket = state.fishBasket.map((entry) => normalizeFishEntry(entry, state.day));
  rebuildJournalFromBasket(state);
  state.stats.totalFishCaught = state.fishBasket.length;
  if (state.stats.totalFishCaught > 0) {
    state.progress.firstCatchDone = true;
  }
  syncInventoryFromFishBasket(state);
}

export function addCaughtFish(state, catchResult, context = {}) {
  ensureFishState(state);
  const entry = createFishEntry(catchResult, state.day, context);
  const fish = getFishData(entry.fishId);
  entry.catchCategory = classifyCatchSize(entry.fishId, entry.weightGrams);
  entry.trophyTier = classifyTrophyCatch(entry, fish);
  state.fishBasket.push(entry);
  state.stats.totalFishCaught = (state.stats.totalFishCaught ?? 0) + 1;
  if (!state.progress.firstCatchDone) {
    state.progress.firstCatchDone = true;
    pushFeedback(state, 'feedbackFirstCatch', {}, 'trophy');
  }
  updateCatchJournal(state, entry);
  syncGrandmaTrust(state);
  syncInventoryFromFishBasket(state);
  return entry;
}

export function getFishEntries(state, status) {
  ensureFishState(state);
  return state.fishBasket.filter((entry) => entry.status === status);
}

export function countFishByStatus(state, status) {
  return getFishEntries(state, status).length;
}

export function getFishEntriesBySpecies(state, status) {
  const counts = Object.fromEntries(fishIds.map((fishId) => [fishId, 0]));
  for (const entry of getFishEntries(state, status)) {
    counts[entry.fishId] += 1;
  }
  return counts;
}

export function takeFreshFish(state) {
  ensureFishState(state);
  const entry = state.fishBasket.find((fish) => fish.status === 'fresh');
  if (!entry) {
    return null;
  }

  entry.status = 'cleaned';
  syncInventoryFromFishBasket(state);
  return entry;
}

export function advanceFishStatus(state, fromStatus, toStatus, amount = 1, predicate = null) {
  ensureFishState(state);
  const moved = [];

  for (const entry of state.fishBasket) {
    if (entry.status === fromStatus && (!predicate || predicate(entry))) {
      entry.status = toStatus;
      moved.push(entry);
      if (moved.length >= amount) {
        break;
      }
    }
  }

  syncInventoryFromFishBasket(state);
  return moved;
}

export function sellFishByStatus(state, status) {
  return takeFishEntries(state, (entry) => entry.status === status);
}

export function takeFishEntry(state, fishEntryId, predicate = null) {
  ensureFishState(state);
  const index = state.fishBasket.findIndex((entry) => (
    entry.id === fishEntryId &&
    (!predicate || predicate(entry))
  ));
  if (index < 0) {
    return null;
  }

  const [entry] = state.fishBasket.splice(index, 1);
  syncInventoryFromFishBasket(state);
  return entry;
}

export function takeFishEntries(state, predicate) {
  ensureFishState(state);
  const keptEntries = [];
  const takenEntries = [];

  for (const entry of state.fishBasket) {
    if (predicate(entry)) {
      takenEntries.push(entry);
      continue;
    }
    keptEntries.push(entry);
  }

  if (takenEntries.length === 0) {
    return [];
  }

  state.fishBasket = keptEntries;
  syncInventoryFromFishBasket(state);
  return takenEntries;
}

export function markFishAsLiveBait(state, fishEntryId) {
  ensureFishState(state);
  const entry = state.fishBasket.find((fish) => fish.id === fishEntryId && fish.status === 'fresh' && fish.isLiveBaitEligible);
  if (!entry) {
    return null;
  }

  entry.status = 'live_bait';
  syncInventoryFromFishBasket(state);
  return entry;
}

export function releaseFish(state, fishEntryId) {
  ensureFishState(state);
  const entry = state.fishBasket.find((fish) => fish.id === fishEntryId);
  if (!entry) {
    return null;
  }

  state.fishBasket = state.fishBasket.filter((fish) => fish.id !== fishEntryId);
  syncInventoryFromFishBasket(state);
  pushLog(state, 'logReleasedFish', { fishKey: getFishData(entry.fishId)?.nameKey ?? entry.fishId });
  return entry;
}

export function releaseSmallFishOfSpecies(state, fishId) {
  ensureFishState(state);
  const fish = getFishData(fishId);
  if (!fish) {
    return [];
  }

  const threshold = Math.round(fish.minWeight + (fish.maxWeight - fish.minWeight) * 0.35);
  const released = state.fishBasket.filter((entry) => (
    entry.fishId === fishId &&
    entry.status === 'fresh' &&
    entry.weightGrams <= threshold
  ));

  if (released.length === 0) {
    return [];
  }

  const releaseIds = new Set(released.map((entry) => entry.id));
  state.fishBasket = state.fishBasket.filter((entry) => !releaseIds.has(entry.id));
  syncInventoryFromFishBasket(state);
  pushLog(state, 'logReleasedSmallFish', { count: released.length, fishKey: fish.nameKey });
  return released;
}

export function getKeepnetSummary(state) {
  ensureFishState(state);
  const entries = state.fishBasket.filter((entry) => entry.status === 'fresh' || entry.status === 'live_bait');
  const species = new Map();

  for (const entry of entries) {
    const current = species.get(entry.fishId) ?? {
      fishId: entry.fishId,
      count: 0,
      totalWeight: 0,
      bestWeight: 0,
      entries: [],
    };
    current.count += 1;
    current.totalWeight += entry.weightGrams;
    current.bestWeight = Math.max(current.bestWeight, entry.weightGrams);
    current.entries.push(entry);
    species.set(entry.fishId, current);
  }

  return {
    totalFish: entries.length,
    totalWeight: entries.reduce((total, entry) => total + entry.weightGrams, 0),
    species: [...species.values()].sort((a, b) => b.totalWeight - a.totalWeight),
  };
}

export function getCatchJournal(state) {
  ensureFishState(state);
  return fishIds.map((fishId) => ({
    fishId,
    ...(state.catchJournal[fishId] ?? {
      discovered: false,
      firstCatchDay: null,
      totalCaught: 0,
      bestWeight: 0,
      bestCatchSpotId: null,
      bestBait: null,
    }),
  }));
}

export function syncInventoryFromFishBasket(state) {
  state.inventory ??= {};

  for (const fishId of fishIds) {
    state.inventory[fishId] = 0;
  }

  for (const status of trackedStatuses) {
    if (status === 'fresh' || status === 'live_bait') {
      continue;
    }

    const inventoryKey = getInventoryKeyForStatus(status);
    if (inventoryKey) {
      state.inventory[inventoryKey] = 0;
    }
  }

  for (const entry of state.fishBasket ?? []) {
    if (entry.status === 'fresh' || entry.status === 'live_bait') {
      state.inventory[entry.fishId] += 1;
      continue;
    }

    const inventoryKey = getInventoryKeyForStatus(entry.status);
    if (inventoryKey) {
      state.inventory[inventoryKey] += 1;
    }
  }
}

function getInventoryKeyForStatus(status) {
  const inventoryKeys = {
    cleaned: 'cleanedFish',
    salted: 'saltedFish',
    drying: 'dryingFish',
    taranka: 'taranka',
    smoked: 'smokedFish',
  };

  return inventoryKeys[status] ?? null;
}

function migrateLegacyFishInventory(state) {
  for (const fishId of fishIds) {
    const count = state.inventory?.[fishId] ?? 0;
    for (let index = 0; index < count; index += 1) {
      state.fishBasket.push(createLegacyEntry(fishId, 'fresh', state.day));
    }
  }

  for (const [status, inventoryKey] of Object.entries({
    cleaned: 'cleanedFish',
    salted: 'saltedFish',
    drying: 'dryingFish',
    taranka: 'taranka',
    smoked: 'smokedFish',
  })) {
    const count = state.inventory?.[inventoryKey] ?? 0;
    for (let index = 0; index < count; index += 1) {
      state.fishBasket.push(createLegacyEntry('crucian', status, state.day));
    }
  }
}

function createLegacyEntry(fishId, status, day) {
  const fish = getFishData(fishId);
  return {
    id: `legacy-${status}-${fishId}-${Math.random().toString(16).slice(2)}`,
    fishId,
    weightGrams: Math.round((fish.minWeight + fish.maxWeight) / 2),
    caughtAtDay: day,
    catchSpotId: null,
    method: null,
    bait: null,
    value: fish.basePrice,
    status,
    isLiveBaitEligible: isLiveBaitEligible(fishId, Math.round((fish.minWeight + fish.maxWeight) / 2)),
  };
}

function normalizeFishEntry(entry, day) {
  const fish = getFishData(entry.fishId) ?? getFishData('crucian');
  return {
    id: entry.id ?? `fish-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fishId: entry.fishId ?? fish.id,
    weightGrams: entry.weightGrams ?? Math.round((fish.minWeight + fish.maxWeight) / 2),
    value: entry.value ?? fish.basePrice,
    caughtAtDay: entry.caughtAtDay ?? day,
    catchSpotId: entry.catchSpotId ?? null,
    method: entry.method ?? null,
    bait: entry.bait ?? null,
    status: trackedStatuses.includes(entry.status) ? entry.status : 'fresh',
    isLiveBaitEligible: entry.isLiveBaitEligible ?? isLiveBaitEligible(entry.fishId, entry.weightGrams),
    catchCategory: entry.catchCategory ?? classifyCatchSize(entry.fishId, entry.weightGrams),
    trophyTier: entry.trophyTier ?? null,
  };
}

function rebuildJournalFromBasket(state) {
  const journal = {};
  for (const entry of state.fishBasket) {
    updateJournalEntry(journal, entry);
  }
  state.catchJournal = journal;
}

function updateCatchJournal(state, entry) {
  const before = state.catchJournal[entry.fishId];
  updateJournalEntry(state.catchJournal, entry);
  const after = state.catchJournal[entry.fishId];
  const fish = getFishData(entry.fishId);
  if (!fish) {
    return;
  }

  const trophies = [];
  if (!before?.discovered) {
    trophies.push('trophyFirstSpecies');
  }
  if ((before?.bestWeight ?? 0) < after.bestWeight && before?.discovered) {
    trophies.push('trophyPersonalBest');
  }
  if (['rarityRare', 'rarityVeryRare'].includes(fish.rarityKey)) {
    trophies.push('trophyRareFish');
  }
  if (entry.weightGrams >= fish.maxWeight * 0.88) {
    trophies.push('trophyLargeFish');
  }
  if (entry.trophyTier) {
    trophies.push(trophyKeyForTier(entry.trophyTier));
    state.achievements ??= {};
    state.achievements.trophyBySpecies ??= {};
    state.achievements.trophyBySpecies[entry.fishId] ??= {};
    state.achievements.trophyBySpecies[entry.fishId][entry.trophyTier] = {
      weightGrams: Math.max(
        entry.weightGrams,
        state.achievements.trophyBySpecies[entry.fishId][entry.trophyTier]?.weightGrams ?? 0,
      ),
      caughtAtDay: entry.caughtAtDay,
    };
  }

  for (const trophyKey of trophies) {
    state.trophies.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      key: trophyKey,
      fishId: entry.fishId,
      weightGrams: entry.weightGrams,
      caughtAtDay: entry.caughtAtDay,
      tier: entry.trophyTier,
    });
    pushFeedback(state, trophyKey, { fishKey: fish.nameKey }, 'trophy');
  }

  state.trophies = state.trophies.slice(0, 24);
}

export function classifyTrophyCatch(entry, fish = getFishData(entry?.fishId)) {
  void fish;
  return trophyTierForCategory(entry?.catchCategory ?? classifyCatchSize(entry?.fishId, entry?.weightGrams ?? 0));
}

export function trophyKeyForTier(tier) {
  return {
    normal: 'trophyTierNormal',
    very_rare: 'trophyTierVeryRare',
    rarest: 'trophyTierRarest',
  }[tier] ?? 'trophyLargeFish';
}

export function isLiveBaitEligible(fishId, weightGrams) {
  if (fishId === 'loach') return true;
  if (['gudgeon', 'crucian', 'plotytsia'].includes(fishId)) return weightGrams <= 50;
  return false;
}

function updateJournalEntry(journal, entry) {
  const current = journal[entry.fishId] ?? {
    discovered: false,
    firstCatchDay: entry.caughtAtDay,
    totalCaught: 0,
    bestWeight: 0,
    bestCatchSpotId: null,
    bestBait: null,
  };

  current.discovered = true;
  current.firstCatchDay = Math.min(current.firstCatchDay ?? entry.caughtAtDay, entry.caughtAtDay);
  current.totalCaught += 1;
  if (entry.weightGrams >= current.bestWeight) {
    current.bestWeight = entry.weightGrams;
    current.bestCatchSpotId = entry.catchSpotId;
    current.bestBait = entry.bait;
  }
  journal[entry.fishId] = current;
}
