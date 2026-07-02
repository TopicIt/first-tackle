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
import {
  getPlayerRevision,
  setPlayerState,
  syncPlayerStateFromGameState,
} from './playerState.js';

let localRevision = 0;

export function getAuthorityMode() {
  return SERVER_AUTHORITATIVE_CATCH ? 'server-catch' : 'local';
}

export async function resolveCatch({ state, serverPayload = {}, localResolve }) {
  let fallbackReason = null;
  if (SERVER_AUTHORITATIVE_CATCH) {
    const serverResult = await resolveCatchOnServer(serverPayload);
    if (serverResult.ok) {
      const result = normalizeServerCatchResult(state, serverResult.result);
      const playerStatePatch = buildAuthorityPatch(state, result.playerStatePatch ?? {});
      return {
        ok: true,
        mode: 'server',
        verified: true,
        result,
        playerStatePatch,
        serverRevision: result.serverRevision ?? null,
        metadata: authorityMetadata('server', true, result.serverRevision),
      };
    }
    fallbackReason = serverResult.error?.message ?? 'server-catch-unavailable';
  }

  const result = typeof localResolve === 'function' ? localResolve() : { caught: false };
  const mode = SERVER_AUTHORITATIVE_CATCH ? 'fallback-local' : 'local';
  const revision = getPlayerRevision(state);
  return {
    ok: true,
    mode,
    verified: false,
    fallbackReason,
    result: {
      ...result,
      localRevision: revision,
    },
    playerStatePatch: buildAuthorityPatch(state, result.playerStatePatch ?? {}),
    revision,
    metadata: authorityMetadata(mode, false, revision),
  };
}

export function addFishToStorage({ state, catchResult, context = {} }) {
  const before = snapshotPlayerState(state);
  const entry = addCaughtFish(state, catchResult, context);
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  const playerState = syncPlayerStateFromGameState(state, { incrementRevision: true, reason: 'fish-caught' });
  localRevision = playerState.revision;
  const playerStatePatch = buildAuthorityPatch(state, patch);

  return {
    ok: true,
    mode: 'local',
    verified: false,
    result: {
      caught: true,
      fish: fishResult(catchResult, entry),
      entry,
      catchResult,
      rewards: rewardDiff(before, after),
      playerStatePatch,
      localRevision,
    },
    playerStatePatch,
    revision: localRevision,
    metadata: authorityMetadata('local', false, localRevision),
  };
}

export function removeFishFromStorage({ state, fishEntryId, fishId, reason = 'release' }) {
  const before = snapshotPlayerState(state);
  const removed = fishEntryId ? releaseFish(state, fishEntryId) : releaseSmallFishOfSpecies(state, fishId);
  const after = snapshotPlayerState(state);
  const patch = diffPlayerState(before, after);
  if (removed && (!Array.isArray(removed) || removed.length > 0)) {
    const removedCount = Array.isArray(removed) ? removed.length : 1;
    const previousReleased = state.playerState?.stats?.fishReleasedTotal ?? 0;
    const playerState = syncPlayerStateFromGameState(state, { incrementRevision: true, reason });
    playerState.stats.fishReleasedTotal = previousReleased + removedCount;
    localRevision = playerState.revision;
  }
  const playerStatePatch = buildAuthorityPatch(state, patch);

  return {
    ok: Boolean(removed && (!Array.isArray(removed) || removed.length > 0)),
    mode: 'local',
    verified: false,
    result: {
      removal: {
        reason,
        fishEntryId,
        fishId,
        removed,
      },
      playerStatePatch,
      localRevision,
    },
    removal: {
      reason,
      fishEntryId,
      fishId,
      removed,
    },
    playerStatePatch,
    revision: localRevision,
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
    const spent = Math.max(0, before.coins - after.coins);
    const playerState = syncPlayerStateFromGameState(state, { incrementRevision: true, reason: 'item-bought' });
    playerState.economy.totalCoinsSpent = (playerState.economy.totalCoinsSpent ?? 0) + spent;
    localRevision = playerState.revision;
  }
  const playerStatePatch = buildAuthorityPatch(state, patch);

  return {
    ok: changed,
    mode: 'local',
    verified: false,
    result: {
      purchase: {
        itemId,
        applied: changed,
      },
      playerStatePatch,
      localRevision,
    },
    purchase: {
      itemId,
      applied: changed,
    },
    playerStatePatch,
    revision: localRevision,
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
    const soldCount = Math.max(0, before.fishStorageSummary.totalFish - after.fishStorageSummary.totalFish);
    const previousSold = state.playerState?.stats?.fishSoldTotal ?? 0;
    const playerState = syncPlayerStateFromGameState(state, { incrementRevision: true, reason: 'fish-sold' });
    playerState.stats.fishSoldTotal = previousSold + soldCount;
    localRevision = playerState.revision;
  }
  const playerStatePatch = buildAuthorityPatch(state, patch);

  return {
    ok: changed,
    mode: 'local',
    verified: false,
    result: {
      sale: {
        saleType,
        fishEntryId,
        fishId,
        coinsEarned: Math.max(0, after.coins - before.coins),
        fishRemoved: Math.max(0, before.fishStorageSummary.totalFish - after.fishStorageSummary.totalFish),
      },
      playerStatePatch,
      localRevision,
    },
    sale: {
      saleType,
      fishEntryId,
      fishId,
      coinsEarned: Math.max(0, after.coins - before.coins),
      fishRemoved: Math.max(0, before.fishStorageSummary.totalFish - after.fishStorageSummary.totalFish),
    },
    playerStatePatch,
    revision: localRevision,
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
  if (patch.playerState && typeof patch.playerState === 'object') {
    setPlayerState(state, patch.playerState);
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
  if (result.playerState) {
    setPlayerState(state, {
      ...result.playerState,
      authority: {
        ...(result.playerState.authority ?? {}),
        mode: 'server',
        verified: true,
        lastServerRevision: result.serverRevision ?? response?.serverRevision ?? result.playerState.revision ?? null,
        lastSyncAt: result.serverTimestamp ?? response?.serverTimestamp ?? new Date().toISOString(),
      },
    });
  } else {
    syncPlayerStateFromGameState(state, { incrementRevision: false });
  }
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

function buildAuthorityPatch(state, legacyPatch = {}) {
  const playerState = syncPlayerStateFromGameState(state, { incrementRevision: false });
  return {
    ...(legacyPatch ?? {}),
    playerState,
  };
}
