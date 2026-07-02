import { fishData } from './fishData.js';
import { getPlayerState } from './playerState.js';

const MOCK_LEADERBOARDS = {
  'biggest-fish': [
    createFishRecord('Дмитро', 'carp', 2.4, 'fire_ponds', 'Ставки', 'Кукурудза', '2026-06-28', true),
    createFishRecord('Олег', 'pike', 1.9, 'canal', 'Канава', 'Блешня', '2026-06-27', true),
    createFishRecord('Марина', 'bream', 1.6, 'sluice', 'Шлюз', 'Мастирка', '2026-06-26', true),
    createFishRecord('Іра', 'lynok', 1.4, 'greada', 'Гряда', 'Личинки', '2026-06-25', false),
    createFishRecord('Сашко', 'som', 3.1, 'mining_lake', 'Карʼєр', 'Живець', '2026-06-24', true),
  ],
  trophies: [
    createFishRecord('Дмитро', 'carp', 2.4, 'fire_ponds', 'Ставки', 'Кукурудза', '2026-06-28', true),
    createFishRecord('Сашко', 'som', 3.1, 'mining_lake', 'Карʼєр', 'Живець', '2026-06-24', true),
    createFishRecord('Олег', 'pike', 1.9, 'canal', 'Канава', 'Блешня', '2026-06-27', true),
    createFishRecord('Марина', 'bream', 1.6, 'sluice', 'Шлюз', 'Мастирка', '2026-06-26', false),
  ],
  coins: [
    createCoinRecord('Дмитро', 4820, '2026-06-28', true),
    createCoinRecord('Марина', 4310, '2026-06-27', true),
    createCoinRecord('Іра', 3975, '2026-06-26', false),
    createCoinRecord('Олег', 3840, '2026-06-25', true),
    createCoinRecord('Сашко', 3620, '2026-06-24', true),
  ],
  'by-location': [
    createFishRecord('Олег', 'pike', 1.9, 'canal', 'Канава', 'Блешня', '2026-06-27', true),
    createFishRecord('Марина', 'bream', 1.6, 'sluice', 'Шлюз', 'Мастирка', '2026-06-26', true),
    createFishRecord('Іра', 'lynok', 1.4, 'greada', 'Гряда', 'Личинки', '2026-06-25', false),
    createFishRecord('Сашко', 'som', 3.1, 'mining_lake', 'Карʼєр', 'Живець', '2026-06-24', true),
  ],
};

export function normalizeLeaderboardType(type = 'biggest-fish') {
  const aliases = {
    biggestFish: 'biggest-fish',
    biggest: 'biggest-fish',
    trophies: 'trophies',
    coins: 'coins',
    byLocation: 'by-location',
    location: 'by-location',
  };

  return aliases[type] ?? type;
}

export function getMockLeaderboard(type = 'biggest-fish', state = null) {
  const normalizedType = normalizeLeaderboardType(type);
  const records = [...(MOCK_LEADERBOARDS[normalizedType] ?? MOCK_LEADERBOARDS['biggest-fish'])];
  const localRecord = state ? getLocalPlayerLeaderboardRecord(state, normalizedType) : null;
  if (localRecord) {
    records.unshift(localRecord);
  }
  return records.slice(0, 8);
}

export function getLocalPlayerLeaderboardRecord(state, type = 'biggest-fish') {
  const normalizedType = normalizeLeaderboardType(type);
  const playerState = getPlayerState(state);
  const playerName = playerState.profile?.playerName || 'Гість';

  if (normalizedType === 'coins') {
    const coins = playerState.economy?.totalCoinsEarned ?? 0;
    if (!coins) {
      return null;
    }
    return createCoinRecord(playerName, coins, 'Локально', false, true);
  }

  const biggestFish = playerState.stats?.biggestFish;
  if (!biggestFish?.fishId || !biggestFish.weightGrams) {
    return null;
  }

  const catchesByLocation = playerState.stats?.catchesByLocation ?? {};
  const locationName = Object.keys(catchesByLocation)[0] ?? 'Невідомо';
  return {
    playerName,
    fishId: biggestFish.fishId,
    fishName: fishName(biggestFish.fishId),
    weightKg: Number((biggestFish.weightGrams / 1000).toFixed(2)),
    locationId: locationName,
    locationName,
    baitId: null,
    baitName: 'Локальний запис',
    tackleSummary: 'Поточна снасть',
    caughtAt: biggestFish.caughtAtDay ? `День ${biggestFish.caughtAtDay}` : 'Локально',
    verified: false,
    localPlayer: true,
  };
}

function createFishRecord(playerName, fishId, weightKg, locationId, locationName, baitName, caughtAt, verified) {
  return {
    playerName,
    fishId,
    fishName: fishName(fishId),
    weightKg,
    locationId,
    locationName,
    baitId: null,
    baitName,
    tackleSummary: 'Поплавок',
    caughtAt,
    verified,
    localPlayer: false,
  };
}

function createCoinRecord(playerName, coins, caughtAt, verified, localPlayer = false) {
  return {
    playerName,
    fishId: null,
    fishName: null,
    weightKg: null,
    locationId: null,
    locationName: 'Всі водойми',
    baitId: null,
    baitName: null,
    tackleSummary: `${coins} монет`,
    caughtAt,
    verified,
    localPlayer,
    coins,
  };
}

function fishName(fishId) {
  return fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId;
}
