import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME } from './state.js';
import { getRealTrophyHistory, isRealTrophyEntry } from './fishInventory.js';
import { getPlayerState } from './playerState.js';

export const leaderboardTypes = ['biggest-fish', 'monthly-trophies'];
export const LEADERBOARD_RECENT_DAYS = 30;
export const LEADERBOARD_RECORD_LIMIT = 50;

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
  if (!isRecordWithinRecentDays(biggestFish, state, LEADERBOARD_RECENT_DAYS)) {
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
    caughtAtDay: biggestFish.caughtAtDay ?? state.stats?.biggestFishCaughtAtDay ?? null,
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
  const groups = new Map();

  for (const trophy of getRealTrophyHistory(state, { days: 30 })) {
    const fishId = trophy?.fishId;
    if (!fishId) {
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
      topTrophies: [],
      caughtAt: 'Останні 30 днів',
      verified: false,
      localPlayer: true,
      realTrophy: true,
      level: state.playerProfile?.level ?? 1,
      xp: state.playerProfile?.xp ?? 0,
      totalFishCaught: state.playerProfile?.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0,
    };
    current.trophyCount += 1;
    current.trophies = current.trophyCount;
    current.topTrophies.push(trophy);
    current.bestTrophyWeightGrams = Math.max(current.bestTrophyWeightGrams, Number(trophy.weightGrams ?? 0));
    current.bestTrophyWeightKg = current.bestTrophyWeightGrams
      ? Number((current.bestTrophyWeightGrams / 1000).toFixed(3))
      : null;
    groups.set(fishId, current);
  }

  return [...groups.values()]
    .map((record) => ({
      ...record,
      topTrophies: record.topTrophies
        .sort((a, b) => Number(b.weightGrams ?? 0) - Number(a.weightGrams ?? 0))
        .slice(0, 10),
    }))
    .sort((a, b) => (
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

export function isRealTrophyLeaderboardRecord(record) {
  return Boolean(
    record?.fishId
    && (
      record.realTrophy === true
      || record.isTrophy === true
      || record.trophyTier
      || record.tier
      || record.trophyStars
      || String(record.key ?? '').startsWith('trophyTier')
      || isRealTrophyEntry(record)
    )
  );
}

export function filterRealTrophyLeaderboardRecords(records = []) {
  return limitLeaderboardRecords(records
    .filter(isRealTrophyLeaderboardRecord)
    .sort((a, b) => (
      Number(b.bestTrophyWeightGrams ?? b.weightGrams ?? 0) - Number(a.bestTrophyWeightGrams ?? a.weightGrams ?? 0)
      || Number(b.trophyCount ?? b.trophies ?? 0) - Number(a.trophyCount ?? a.trophies ?? 0)
    )));
}

export function filterLeaderboardRecords(records = [], type = 'biggest-fish', state = null) {
  const normalizedType = normalizeLeaderboardType(type);
  const recentRecords = records.filter((record) => isRecordWithinRecentDays(record, state, LEADERBOARD_RECENT_DAYS));
  if (normalizedType === 'monthly-trophies') {
    return filterRealTrophyLeaderboardRecords(recentRecords);
  }

  return limitLeaderboardRecords(recentRecords
    .filter((record) => record?.fishId && Number(record.weightGrams ?? (Number(record.weightKg ?? 0) * 1000)) > 0)
    .sort((a, b) => Number(b.weightGrams ?? (Number(b.weightKg ?? 0) * 1000)) - Number(a.weightGrams ?? (Number(a.weightKg ?? 0) * 1000))));
}

export function limitLeaderboardRecords(records = [], limit = LEADERBOARD_RECORD_LIMIT) {
  return records.slice(0, limit);
}

export function isRecordWithinRecentDays(record, state = null, days = LEADERBOARD_RECENT_DAYS) {
  const currentDay = Number(state?.day ?? 1);
  const caughtAtDay = Number(record?.caughtAtDay ?? record?.day ?? record?.caughtDay ?? record?.stats?.biggestFishCaughtAtDay);
  if (Number.isFinite(caughtAtDay) && caughtAtDay > 0) {
    return caughtAtDay >= Math.max(1, currentDay - (days - 1));
  }

  const caughtAt = parseRecordDate(record?.caughtAt ?? record?.createdAt ?? record?.updatedAt ?? record?.serverUpdatedAt);
  if (caughtAt) {
    return Date.now() - caughtAt.getTime() <= days * 24 * 60 * 60 * 1000;
  }

  return Boolean(record?.localPlayer);
}

function parseRecordDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
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
