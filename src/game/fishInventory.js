import { fishIds } from './inventory.js';
import { getFishData } from './fishData.js';

const trackedStatuses = ['fresh', 'cleaned', 'salted', 'drying', 'taranka', 'live_bait'];

export function createFishEntry(catchResult, caughtAtDay) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fishId: catchResult.id,
    weightGrams: catchResult.weightGrams,
    caughtAtDay,
    value: catchResult.value,
    status: 'fresh',
    isLiveBaitEligible: ['bleak', 'roach', 'rudd'].includes(catchResult.id),
  };
}

export function ensureFishState(state) {
  state.fishBasket ??= [];
  state.day ??= 1;
  if (state.fishBasket.length === 0) {
    migrateLegacyFishInventory(state);
  }
  syncInventoryFromFishBasket(state);
}

export function addCaughtFish(state, catchResult) {
  ensureFishState(state);
  state.fishBasket.push(createFishEntry(catchResult, state.day));
  syncInventoryFromFishBasket(state);
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
    value: fish.basePrice,
    status,
    isLiveBaitEligible: ['bleak', 'roach', 'rudd'].includes(fishId),
  };
}
