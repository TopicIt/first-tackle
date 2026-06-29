import { fishIds } from './inventory.js';
import { biteProfiles } from './bitePatterns.js';
import { getFishData } from './fishData.js';
import { pushFeedback, pushLog } from './state.js';
import { classifyCatchSize, trophyTierForCategory } from './fishSizeProfiles.js';
import { persistCatchCardImage } from './fishCardImages.js';
import { syncGrandmaTrust } from './profile.js';
import { syncQuestProgress } from './quests.js';

const trackedStatuses = ['fresh', 'cleaned', 'salted', 'drying', 'ready_taranka', 'taranka', 'smoked', 'live_bait'];
const liveBaitSpecies = ['gudgeon', 'crucian', 'plotytsia', 'loach', 'bleak'];

export function createFishEntry(catchResult, caughtAtDay, context = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fishId: catchResult.id,
    weightGrams: catchResult.weightGrams,
    caughtAtDay,
    caughtAtTime: context.caughtAtTime ?? null,
    catchSpotId: context.catchSpotId ?? null,
    method: context.method ?? null,
    bait: context.bait ?? null,
    depth: context.depth ?? null,
    waterId: context.waterId ?? null,
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
  state.progress.firstTackleReady = Boolean(state.progress.firstTackleReady);
  state.progress.firstCatchDone = Boolean(state.progress.firstCatchDone ?? state.stats.totalFishCaught > 0);
  ensureCatchStats(state);
  if (state.fishBasket.length === 0) {
    migrateLegacyFishInventory(state);
  }
  state.fishBasket = state.fishBasket.map((entry) => normalizeFishEntry(entry, state.day));
  state.catchJournal = mergeCatchJournals(state.catchJournal, buildJournalFromEntries(state.fishBasket));
  syncStatsFromJournal(state);
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
  persistCatchCardImage(entry);
  state.fishBasket.push(entry);
  state.stats.totalFishCaught = Math.max(0, state.stats.totalFishCaught ?? 0) + 1;
  updateAllTimeBiggestFish(state, entry);
  if (!state.progress.firstCatchDone) {
    state.progress.firstCatchDone = true;
    pushFeedback(state, 'feedbackFirstCatch', {}, 'trophy');
  }
  updateCatchJournal(state, entry);
  syncGrandmaTrust(state);
  syncQuestProgress(state);
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
  entry.liveBaitSourceFishId = entry.fishId;
  entry.liveBaitQuality = entry.weightGrams <= 50 ? 'small' : 'sturdy';
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
  const normalized = {
    id: entry.id ?? `fish-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fishId: entry.fishId ?? fish.id,
    weightGrams: entry.weightGrams ?? Math.round((fish.minWeight + fish.maxWeight) / 2),
    value: entry.value ?? fish.basePrice,
    caughtAtDay: entry.caughtAtDay ?? day,
    caughtAtTime: entry.caughtAtTime ?? null,
    catchSpotId: entry.catchSpotId ?? null,
    method: entry.method ?? null,
    bait: entry.bait ?? null,
    depth: entry.depth ?? null,
    waterId: entry.waterId ?? null,
    status: trackedStatuses.includes(entry.status) ? entry.status : 'fresh',
    isLiveBaitEligible: entry.isLiveBaitEligible ?? isLiveBaitEligible(entry.fishId, entry.weightGrams),
    catchCategory: entry.catchCategory ?? classifyCatchSize(entry.fishId, entry.weightGrams),
    trophyTier: entry.trophyTier ?? null,
    selectedCardImage: entry.selectedCardImage ?? null,
    liveBaitSourceFishId: entry.liveBaitSourceFishId ?? (entry.status === 'live_bait' ? entry.fishId : null),
    liveBaitQuality: entry.liveBaitQuality ?? (entry.status === 'live_bait' ? 'small' : null),
  };
  persistCatchCardImage(normalized);
  return normalized;
}

function buildJournalFromEntries(entries) {
  const journal = {};
  for (const entry of entries) {
    updateJournalEntry(journal, entry);
  }
  return journal;
}

function mergeCatchJournals(existing = {}, fromBasket = {}) {
  const journal = { ...existing };
  for (const [fishId, basketEntry] of Object.entries(fromBasket)) {
    const current = journal[fishId] ?? {};
    const bestFromBasket = basketEntry.bestWeight ?? 0;
    const bestExisting = current.bestWeight ?? 0;
    journal[fishId] = {
      ...basketEntry,
      ...current,
      discovered: Boolean(current.discovered || basketEntry.discovered),
      firstCatchDay: minNullable(current.firstCatchDay, basketEntry.firstCatchDay),
      totalCaught: Math.max(current.totalCaught ?? 0, basketEntry.totalCaught ?? 0),
      bestWeight: Math.max(bestExisting, bestFromBasket),
      bestCatchSpotId: bestExisting >= bestFromBasket ? current.bestCatchSpotId ?? null : basketEntry.bestCatchSpotId ?? null,
      bestBait: bestExisting >= bestFromBasket ? current.bestBait ?? null : basketEntry.bestBait ?? null,
    };
  }
  return journal;
}

function ensureCatchStats(state) {
  state.stats ??= {};
  state.stats.totalFishCaught = Math.max(0, state.stats.totalFishCaught ?? 0);
  state.stats.biggestFishWeight = Math.max(0, state.stats.biggestFishWeight ?? 0);
  state.stats.biggestFishSpecies ??= null;
  state.stats.biggestFishCaughtAtDay ??= null;
  state.stats.biggestFishCaughtAtTime ??= null;
}

function syncStatsFromJournal(state) {
  ensureCatchStats(state);
  const journalRows = Object.entries(state.catchJournal ?? {});
  const journalTotal = journalRows.reduce((total, [, entry]) => total + (entry.totalCaught ?? 0), 0);
  state.stats.totalFishCaught = Math.max(
    state.stats.totalFishCaught ?? 0,
    journalTotal,
    state.fishBasket?.length ?? 0,
    state.progress?.firstCatchDone ? 1 : 0,
  );

  const journalBest = journalRows.reduce((best, [fishId, entry]) => {
    const weight = entry.bestWeight ?? 0;
    return weight > (best?.weight ?? 0) ? { fishId, weight, day: entry.firstCatchDay ?? null } : best;
  }, null);
  if ((journalBest?.weight ?? 0) > (state.stats.biggestFishWeight ?? 0)) {
    state.stats.biggestFishWeight = journalBest.weight;
    state.stats.biggestFishSpecies = journalBest.fishId;
    state.stats.biggestFishCaughtAtDay = journalBest.day;
    state.stats.biggestFishCaughtAtTime = null;
  }
}

function updateAllTimeBiggestFish(state, entry) {
  ensureCatchStats(state);
  if ((entry.weightGrams ?? 0) < (state.stats.biggestFishWeight ?? 0)) {
    return;
  }
  state.stats.biggestFishWeight = entry.weightGrams ?? 0;
  state.stats.biggestFishSpecies = entry.fishId;
  state.stats.biggestFishCaughtAtDay = entry.caughtAtDay ?? state.day ?? null;
  state.stats.biggestFishCaughtAtTime = entry.caughtAtTime ?? null;
}

function minNullable(a, b) {
  if (a == null) return b ?? null;
  if (b == null) return a;
  return Math.min(a, b);
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
    const wasCaught = Boolean(state.achievements.trophyBySpecies[entry.fishId][entry.trophyTier]);
    state.achievements.trophyBySpecies[entry.fishId][entry.trophyTier] = {
      weightGrams: Math.max(
        entry.weightGrams,
        state.achievements.trophyBySpecies[entry.fishId][entry.trophyTier]?.weightGrams ?? 0,
      ),
      caughtAtDay: entry.caughtAtDay,
    };
    awardTrophyReward(state, entry, wasCaught);
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
  if (entry?.depth === 'surface') {
    return null;
  }
  const favoriteBaits = biteProfiles[entry?.fishId]?.preferred?.baits ?? [];
  if (!favoriteBaits.includes(entry?.bait)) {
    return null;
  }
  return trophyTierForCategory(entry?.catchCategory ?? classifyCatchSize(entry?.fishId, entry?.weightGrams ?? 0));
}

export function trophyKeyForTier(tier) {
  return {
    normal: 'trophyTierNormal',
    very_rare: 'trophyTierVeryRare',
    rarest: 'trophyTierRarest',
  }[tier] ?? 'trophyLargeFish';
}

function awardTrophyReward(state, entry, wasCaught) {
  if (wasCaught || !entry?.trophyTier) {
    return;
  }

  const reward = {
    normal: 50,
    very_rare: 100,
    rarest: 200,
  }[entry.trophyTier] ?? 0;
  if (!reward) {
    return;
  }

  state.achievements ??= {};
  state.achievements.claimedTrophyRewards ??= {};
  const key = `${entry.fishId}:${entry.trophyTier}`;
  if (state.achievements.claimedTrophyRewards[key]) {
    return;
  }

  state.achievements.claimedTrophyRewards[key] = true;
  state.money = (state.money ?? 0) + reward;
  pushFeedback(state, 'feedbackCoins', { coins: reward }, 'coins');
  pushLog(state, 'logTrophyReward', { coins: reward });
}

export function isLiveBaitEligible(fishId, weightGrams) {
  return liveBaitSpecies.includes(fishId) && weightGrams <= 80;
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
