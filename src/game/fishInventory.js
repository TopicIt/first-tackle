import { fishIds } from './inventory.js';
import { getFishData } from './fishData.js';
import { pushFeedback, pushLog } from './state.js';

const trackedStatuses = ['fresh', 'cleaned', 'salted', 'drying', 'taranka', 'live_bait'];
const liveBaitSpecies = ['bleak', 'roach', 'rudd'];

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
    isLiveBaitEligible: liveBaitSpecies.includes(catchResult.id),
  };
}

export function ensureFishState(state) {
  state.fishBasket ??= [];
  state.catchJournal ??= {};
  state.trophies ??= [];
  state.day ??= 1;
  if (state.fishBasket.length === 0) {
    migrateLegacyFishInventory(state);
  }
  state.fishBasket = state.fishBasket.map((entry) => normalizeFishEntry(entry, state.day));
  rebuildJournalFromBasket(state);
  syncInventoryFromFishBasket(state);
}

export function addCaughtFish(state, catchResult, context = {}) {
  ensureFishState(state);
  const entry = createFishEntry(catchResult, state.day, context);
  state.fishBasket.push(entry);
  updateCatchJournal(state, entry);
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

export function advanceFishStatus(state, fromStatus, toStatus, amount = 1) {
  ensureFishState(state);
  const moved = [];

  for (const entry of state.fishBasket) {
    if (entry.status === fromStatus) {
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
  ensureFishState(state);
  const soldEntries = state.fishBasket.filter((entry) => entry.status === status);
  state.fishBasket = state.fishBasket.filter((entry) => entry.status !== status);
  syncInventoryFromFishBasket(state);
  return soldEntries;
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
    isLiveBaitEligible: liveBaitSpecies.includes(fishId),
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
    isLiveBaitEligible: entry.isLiveBaitEligible ?? liveBaitSpecies.includes(entry.fishId),
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

  for (const trophyKey of trophies) {
    state.trophies.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      key: trophyKey,
      fishId: entry.fishId,
      weightGrams: entry.weightGrams,
      caughtAtDay: entry.caughtAtDay,
    });
    pushFeedback(state, trophyKey, { fishKey: fish.nameKey }, 'trophy');
  }

  state.trophies = state.trophies.slice(0, 24);
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
