import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME } from './state.js';
import { getPlayerState } from './playerState.js';

export const leaderboardTypes = ['biggest-fish', 'monthly-trophies'];

export function normalizeLeaderboardType(type = 'biggest-fish') {
  const aliases = {
    biggestFish: 'biggest-fish',
    biggest: 'biggest-fish',
    trophies: 'monthly-trophies',
    monthly: 'monthly-trophies',
    monthlyTrophies: 'monthly-trophies',
    'monthly-trophies': 'monthly-trophies',
  };

  const normalized = aliases[type] ?? type;
  return leaderboardTypes.includes(normalized) ? normalized : 'biggest-fish';
}

export function getMockLeaderboard(type = 'biggest-fish', state = null) {
  return getLocalLeaderboard(type, state);
}

export function getLocalLeaderboard(type = 'biggest-fish', state = null) {
  if (!state) {
    return [];
  }

  const normalizedType = normalizeLeaderboardType(type);
  if (normalizedType === 'monthly-trophies') {
    return getLocalMonthlyTrophyRecords(state);
  }

  const localRecord = getLocalPlayerLeaderboardRecord(state, normalizedType);
  return localRecord ? [localRecord] : [];
}

export function getLocalPlayerLeaderboardRecord(state, type = 'biggest-fish') {
  const normalizedType = normalizeLeaderboardType(type);
  if (normalizedType === 'monthly-trophies') {
    return null;
  }

  const playerState = getPlayerState(state);
  const identity = getCurrentPlayerIdentity(state);
  const biggestFish = richestBiggestFish(state, playerState);
  if (!biggestFish?.fishId || !biggestFish.weightGrams) {
    return null;
  }

  return {
    ...identity,
    fishId: biggestFish.fishId,
    fishName: biggestFish.fishId,
    weightKg: Number((biggestFish.weightGrams / 1000).toFixed(3)),
    weightGrams: biggestFish.weightGrams,
    locationId: biggestFish.waterId ?? biggestFish.locationId ?? null,
    baitId: biggestFish.bait ?? biggestFish.baitId ?? null,
    catchSpotId: biggestFish.catchSpotId ?? null,
    depth: biggestFish.depth ?? null,
    tackleSummary: biggestFish.tackleSummary ?? null,
    caughtAt: biggestFish.caughtAtTime ?? (biggestFish.caughtAtDay ? `День ${biggestFish.caughtAtDay}` : 'Локально'),
    verified: false,
    localPlayer: true,
    level: playerState.profile?.level ?? state.playerProfile?.level ?? 1,
    xp: playerState.profile?.xp ?? state.playerProfile?.xp ?? 0,
    totalFishCaught: playerState.stats?.fishCaughtTotal ?? state.playerProfile?.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0,
    biggestFishWeightGrams: biggestFish.weightGrams ?? 0,
  };
}

export function getLocalMonthlyTrophyRecords(state) {
  const identity = getCurrentPlayerIdentity(state);
  const currentDay = Number(state.day ?? 1);
  const sinceDay = Math.max(1, currentDay - 29);
  const groups = new Map();

  for (const trophy of state.trophies ?? []) {
    const fishId = trophy?.fishId;
    if (!fishId) {
      continue;
    }

    const caughtAtDay = Number(trophy.caughtAtDay ?? currentDay);
    if (caughtAtDay < sinceDay) {
      continue;
    }

    const current = groups.get(fishId) ?? {
      ...identity,
      fishId,
      fishName: fishId,
      trophyCount: 0,
      trophies: 0,
      bestTrophyWeightGrams: 0,
      bestTrophyWeightKg: null,
      caughtAt: 'Останні 30 днів',
      verified: false,
      localPlayer: true,
      level: state.playerProfile?.level ?? 1,
      xp: state.playerProfile?.xp ?? 0,
      totalFishCaught: state.playerProfile?.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0,
    };
    current.trophyCount += 1;
    current.trophies = current.trophyCount;
    current.bestTrophyWeightGrams = Math.max(current.bestTrophyWeightGrams, Number(trophy.weightGrams ?? 0));
    current.bestTrophyWeightKg = current.bestTrophyWeightGrams
      ? Number((current.bestTrophyWeightGrams / 1000).toFixed(3))
      : null;
    groups.set(fishId, current);
  }

  return [...groups.values()].sort((a, b) => (
    (b.trophyCount ?? 0) - (a.trophyCount ?? 0)
    || (b.bestTrophyWeightGrams ?? 0) - (a.bestTrophyWeightGrams ?? 0)
  ));
}

export function getCurrentPlayerIdentity(state) {
  const profile = state.playerProfile ?? {};
  const playerState = state.playerState?.profile ?? {};
  const name = profile.name || profile.playerName || playerState.playerName || DEFAULT_PLAYER_NAME;
  return {
    playerId: state.playerState?.profile?.accountId ?? state.playerState?.profile?.userId ?? 'local-player',
    playerName: name,
    displayName: name,
    avatar: profile.avatar || playerState.avatarId || DEFAULT_AVATAR,
    avatarId: profile.avatarId || profile.avatar || playerState.avatarId || DEFAULT_AVATAR,
    avatarType: profile.avatarType ?? 'preset',
    customAvatarDataUrl: profile.customAvatarDataUrl ?? null,
  };
}

function richestBiggestFish(state, playerState) {
  const basketBest = [...(state.fishBasket ?? [])]
    .filter((entry) => Number(entry.weightGrams ?? 0) > 0)
    .sort((a, b) => Number(b.weightGrams ?? 0) - Number(a.weightGrams ?? 0))[0];
  if (basketBest) {
    return basketBest;
  }

  return playerState.stats?.biggestFish;
}
