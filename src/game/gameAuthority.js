import { resolveCatchOnServer } from '../api/gameApi.js';
import { SERVER_AUTHORITATIVE_CATCH } from '../config/featureFlags.js';
import {
  addCaughtFish,
  getKeepnetSummary,
  releaseFish,
  releaseSmallFishOfSpecies,
  syncInventoryFromFishBasket,
} from './fishInventory.js';
import {
  buyShopItem,
  sellAllFish,
  sellFishSpecies,
  sellSingleFish,
  sellSmokedFish,
  sellTaranka,
} from './economy.js';

let localRevision = 0;

export function getAuthorityMode() {
  return SERVER_AUTHORITATIVE_CATCH ? 'server-catch' : 'local';
}

export async function resolveCatch({ state, serverPayload = {}, localResolve }) {
  if (SERVER_AUTHORITATIVE_CATCH) {
    const serverResult = await resolveCatchOnServer(serverPayload);
    if (serverResult.ok) {
      const result = normalizeServerCatchResult(state, serverResult.result);
      return {
        ok: true,
        mode: 'server',
        result,
        metadata: authorityMetadata('server', true, result.serverRevision),
      };
    }
  }

  const result = typeof localResolve === 'function' ? localResolve() : { caught: false };
  const mode = SERVER_AUTHORITATIVE_CATCH ? 'fallback-local' : 'local';
  return {
    ok: true,
    mode,
    result: {
      ...result,
      localRevision,
    },
    metadata: authorityMetadata(mode, false, localRevision),
  };
}

export function addFishToStorage({ state, catchResult, context = {} }) {
  const before = snapshotPlayerState(state);
  const entry = addCaughtFish(state, catchResult, context);
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  localRevision += 1;

  return {
    ok: true,
    mode: 'local',
    result: {
      caught: true,
      fish: fishResult(catchResult, entry),
      entry,
      catchResult,
      rewards: rewardDiff(before, after),
      playerStatePatch: patch,
      localRevision,
    },
    metadata: authorityMetadata('local', false, localRevision),
  };
}

export function removeFishFromStorage({ state, fishEntryId, fishId, reason = 'release' }) {
  const before = snapshotPlayerState(state);
  const removed = fishEntryId ? releaseFish(state, fishEntryId) : releaseSmallFishOfSpecies(state, fishId);
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  if (removed && (!Array.isArray(removed) || removed.length > 0)) {
    localRevision += 1;
  }

  return {
    ok: Boolean(removed && (!Array.isArray(removed) || removed.length > 0)),
    mode: 'local',
    removal: {
      reason,
      fishEntryId,
      fishId,
      removed,
    },
    playerStatePatch: patch,
    localRevision,
    metadata: authorityMetadata('local', false, localRevision),
  };
}

export function buyItem({ state, itemId }) {
  const before = snapshotPlayerState(state);
  buyShopItem(state, itemId);
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  const changed = hasPatchChanges(patch);
  if (changed) {
    localRevision += 1;
  }

  return {
    ok: changed,
    mode: 'local',
    purchase: {
      itemId,
      applied: changed,
    },
    playerStatePatch: patch,
    localRevision,
    error: changed ? null : 'Purchase was not applied',
    metadata: authorityMetadata('local', false, localRevision),
  };
}

export function sellFish({ state, saleType = 'all', fishEntryId = null, fishId = null }) {
  const before = snapshotPlayerState(state);
  if (saleType === 'entry') {
    sellSingleFish(state, fishEntryId);
  } else if (saleType === 'species') {
    sellFishSpecies(state, fishId);
  } else if (saleType === 'taranka') {
    sellTaranka(state);
  } else if (saleType === 'smoked') {
    sellSmokedFish(state);
  } else {
    sellAllFish(state);
  }
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  const changed = hasPatchChanges(patch);
  if (changed) {
    localRevision += 1;
  }

  return {
    ok: changed,
    mode: 'local',
    sale: {
      saleType,
      fishEntryId,
      fishId,
      coinsEarned: Math.max(0, after.coins - before.coins),
      fishRemoved: Math.max(0, before.fishStorageSummary.totalFish - after.fishStorageSummary.totalFish),
    },
    playerStatePatch: patch,
    localRevision,
    error: changed ? null : 'Sale was not applied',
    metadata: authorityMetadata('local', false, localRevision),
  };
}

export function applyPlayerStatePatch(state, patch = {}) {
  if (!patch || typeof patch !== 'object') {
    return state;
  }

  if (patch.coins != null) {
    state.money = patch.coins;
  }
  if (patch.money != null) {
    state.money = patch.money;
  }
  if (patch.inventory && typeof patch.inventory === 'object') {
    state.inventory = {
      ...(state.inventory ?? {}),
      ...patch.inventory,
    };
  }
  if (patch.purchased && typeof patch.purchased === 'object') {
    state.purchased = {
      ...(state.purchased ?? {}),
      ...patch.purchased,
    };
  }
  if (Array.isArray(patch.fishBasket)) {
    state.fishBasket = patch.fishBasket;
    syncInventoryFromFishBasket(state);
  }
  for (const key of ['playerProfile', 'stats', 'travel', 'quests', 'achievements', 'tackle']) {
    if (patch[key] && typeof patch[key] === 'object') {
      state[key] = {
        ...(state[key] ?? {}),
        ...patch[key],
      };
    }
  }

  return state;
}

function normalizeServerCatchResult(state, response) {
  const result = response?.result ?? response ?? {};
  const patch = result.playerStatePatch ?? {};
  applyPlayerStatePatch(state, patch);
  const catchResult = catchResultFromServerFish(result.fish);
  return {
    caught: Boolean(result.caught ?? result.fish),
    fish: result.fish ?? null,
    catchResult,
    entry: null,
    rewards: result.rewards ?? {},
    playerStatePatch: patch,
    serverTimestamp: result.serverTimestamp ?? response?.serverTimestamp ?? null,
    serverRevision: result.serverRevision ?? response?.serverRevision ?? null,
  };
}

function catchResultFromServerFish(fish) {
  if (!fish?.id) {
    return null;
  }

  const weightGrams = fish.weightGrams ?? Math.round((fish.weightKg ?? 0) * 1000);
  return {
    id: fish.id,
    weightGrams,
    value: fish.value ?? 0,
    catchCategory: fish.rarity ?? null,
    authorityMode: 'server',
    verified: true,
  };
}

function snapshotPlayerState(state) {
  return {
    coins: state.money ?? 0,
    inventory: { ...(state.inventory ?? {}) },
    purchased: { ...(state.purchased ?? {}) },
    fishBasketCount: state.fishBasket?.length ?? 0,
    fishStorageSummary: getKeepnetSummary(state),
    fishCaughtTotal: state.playerProfile?.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0,
    totalCoinsEarned: state.playerProfile?.totalCoinsEarned ?? 0,
  };
}

function diffPlayerState(before, after) {
  const patch = {};
  if (before.coins !== after.coins) {
    patch.coins = after.coins;
  }
  if (before.fishCaughtTotal !== after.fishCaughtTotal) {
    patch.fishCaughtTotal = after.fishCaughtTotal;
  }
  if (before.totalCoinsEarned !== after.totalCoinsEarned) {
    patch.totalCoinsEarned = after.totalCoinsEarned;
  }
  if (before.fishBasketCount !== after.fishBasketCount) {
    patch.fishStorageSummary = after.fishStorageSummary;
  }

  const inventoryPatch = objectDiff(before.inventory, after.inventory);
  if (Object.keys(inventoryPatch).length > 0) {
    patch.inventory = inventoryPatch;
  }
  const purchasedPatch = objectDiff(before.purchased, after.purchased);
  if (Object.keys(purchasedPatch).length > 0) {
    patch.purchased = purchasedPatch;
  }

  return patch;
}

function objectDiff(before = {}, after = {}) {
  const patch = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (before[key] !== after[key]) {
      patch[key] = after[key];
    }
  }
  return patch;
}

function rewardDiff(before, after) {
  return {
    coins: Math.max(0, after.coins - before.coins),
    xp: 0,
  };
}

function fishResult(catchResult, entry) {
  return {
    id: catchResult.id,
    weightGrams: catchResult.weightGrams,
    weightKg: Number(((catchResult.weightGrams ?? 0) / 1000).toFixed(3)),
    rarity: catchResult.catchCategory ?? entry?.catchCategory ?? null,
    value: catchResult.value ?? entry?.value ?? 0,
    trophyTier: entry?.trophyTier ?? null,
  };
}

function authorityMetadata(authorityMode, verified, revision) {
  return {
    authorityMode,
    verified,
    revision,
  };
}

function hasPatchChanges(patch) {
  return Object.keys(patch ?? {}).length > 0;
}
