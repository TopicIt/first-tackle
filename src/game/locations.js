import { getWaterFishIds } from './waterFishDistribution.js';

export const FISHING_LOCATION_IDS = [
  'canal',
  'sluice',
  'fire_ponds',
  'greada',
  'lake_tur',
  'mining_lake',
];

export const BICYCLE_WATER_IDS = ['fire_ponds', 'greada'];
export const MOBILITY_WATER_IDS = ['sluice', 'fire_ponds', 'greada'];
export const BUS_WATER_IDS = ['greada', 'lake_tur', 'mining_lake'];

export const fishingLocations = {
  canal: {
    id: 'canal',
    order: 1,
    access: 'walk',
    labelKey: 'zoneCanal',
    titleKey: 'sceneCanalTitle',
    descriptionKey: 'sceneCanalDescription',
    guideNameKey: 'waterCanal',
    guideDescriptionKey: 'waterCanalDesc',
    imageId: 'canal',
    fishIds: getWaterFishIds('canal'),
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideCanalTackle',
    baitKey: 'guideWormLarvae',
    unlocked: true,
  },
  sluice: {
    id: 'sluice',
    order: 2,
    labelKey: 'zoneSluice',
    titleKey: 'sceneSluiceTitle',
    descriptionKey: 'sceneSluiceDescription',
    guideNameKey: 'waterSluice',
    guideDescriptionKey: 'waterSluiceDesc',
    access: 'scooter_or_bicycle',
    imageId: 'sluice',
    fishingImageId: 'sluiceFishing',
    fishIds: getWaterFishIds('sluice'),
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideSluiceTackle',
    baitKey: 'guideWormLarvaeLive',
    unlockKey: 'requiresScooterOrBicycle',
  },
  fire_ponds: {
    id: 'fire_ponds',
    order: 3,
    access: 'bicycle',
    labelKey: 'zoneFirePonds',
    titleKey: 'sceneFirePondsTitle',
    descriptionKey: 'sceneFirePondsDescription',
    guideNameKey: 'waterFirePonds',
    guideDescriptionKey: 'waterFirePondsDesc',
    imageId: 'firePonds',
    fishingImageId: 'firePondsFishing',
    fishIds: getWaterFishIds('fire_ponds'),
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideRodFloat',
    baitKey: 'guideWormLarvaeLive',
    unlockKey: 'buyBicycleToReachWaters',
  },
  greada: {
    id: 'greada',
    order: 4,
    access: 'bicycle_or_bus',
    ticketCost: 25,
    labelKey: 'zoneGreada',
    titleKey: 'sceneGreadaTitle',
    descriptionKey: 'sceneGreadaDescription',
    guideNameKey: 'waterGreada',
    guideDescriptionKey: 'waterGreadaDesc',
    imageId: 'greada',
    fishIds: getWaterFishIds('greada'),
    bestTimeKey: 'timeEveningNight',
    tackleKey: 'guideGreadaTackle',
    baitKey: 'guideWormBunch',
    unlockKey: 'busTicketUnlock',
  },
  lake_tur: {
    id: 'lake_tur',
    order: 5,
    access: 'bus',
    ticketCost: 100,
    labelKey: 'zoneLakeTur',
    titleKey: 'sceneLakeTurTitle',
    descriptionKey: 'sceneLakeTurDescription',
    guideNameKey: 'waterLakeTur',
    guideDescriptionKey: 'waterLakeTurDesc',
    imageId: 'lakeTur',
    fishIds: getWaterFishIds('lake_tur'),
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideLakeTurTackle',
    baitKey: 'guideWormLarvaeLive',
    unlockKey: 'busTicketUnlock',
  },
  mining_lake: {
    id: 'mining_lake',
    order: 6,
    access: 'bus',
    ticketCost: 50,
    labelKey: 'zoneMiningLake',
    titleKey: 'sceneMiningLakeTitle',
    descriptionKey: 'sceneMiningLakeDescription',
    guideNameKey: 'waterMiningLake',
    guideDescriptionKey: 'waterMiningLakeDesc',
    imageId: 'miningLake',
    fishIds: getWaterFishIds('mining_lake'),
    bestTimeKey: 'timeEveningNight',
    tackleKey: 'guideMiningLakeTackle',
    baitKey: 'guideWormBunch',
    unlockKey: 'busTicketUnlock',
  },
};

export function getFishingLocation(locationId) {
  const waterId = normalizeWaterId(locationId, null);
  return waterId ? fishingLocations[waterId] : undefined;
}

export function isFishingLocation(locationId) {
  return Boolean(getFishingLocation(locationId));
}

export function getFishingLocationList() {
  return FISHING_LOCATION_IDS.map((id) => fishingLocations[id]);
}

export function normalizeWaterId(locationId, fallback = 'canal') {
  if (locationId === 'pond' || locationId === 'home_canal') {
    return 'canal';
  }

  if (locationId === 'old_pond') {
    return 'fire_ponds';
  }

  return fishingLocations[locationId] ? locationId : fallback;
}

export function canOpenWaterFromMap(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location) {
    return false;
  }

  if (location.access === 'walk') {
    return true;
  }

  if (location.access === 'bicycle') {
    return hasUsableBicycle(state);
  }

  if (location.access === 'scooter_or_bicycle') {
    return hasMobilityForSluice(state);
  }

  if (location.access === 'bicycle_or_bus') {
    return hasUsableBicycle(state) || state.travel?.selectedWater === location.id;
  }

  if (location.access === 'bus') {
    return state.travel?.selectedWater === location.id;
  }

  return false;
}

export function canSelectWaterForFishing(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location) {
    return false;
  }

  if (location.access === 'walk') {
    return true;
  }

  if (location.access === 'bicycle') {
    return hasUsableBicycle(state);
  }

  if (location.access === 'scooter_or_bicycle') {
    return hasMobilityForSluice(state);
  }

  if (location.access === 'bicycle_or_bus') {
    return hasUsableBicycle(state) || state.travel?.selectedWater === location.id;
  }

  return state.travel?.selectedWater === location.id;
}

export function getLockedReasonKey(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location) {
    return 'locked';
  }

  if (location.access === 'bus') {
    return 'requiresBusTicket';
  }

  if (location.access === 'scooter_or_bicycle' && !hasMobilityForSluice(state)) {
    return 'requiresScooterOrBicycle';
  }

  if ((location.access === 'bicycle' || location.access === 'bicycle_or_bus') && !hasUsableBicycle(state)) {
    return 'requiresBicycle';
  }

  return 'locked';
}

export function hasUsableBicycle(state) {
  return Boolean(state.purchased?.bestBicycle)
    || Boolean((state.travel?.bicycleTripsLeft ?? 0) > 0);
}

export function hasScooter(state) {
  return Boolean(state.purchased?.scooter);
}

export function hasMobilityForSluice(state) {
  return hasScooter(state) || hasUsableBicycle(state);
}

export function getGrandmaTrustProgress(state) {
  const required = state.progress?.grandmaTrust?.required ?? 5;
  const caught = Math.min(required, state.progress?.grandmaTrust?.canadianCatfishCaught ?? state.catchJournal?.canadian_catfish?.totalCaught ?? 0);
  return {
    caught,
    required,
    unlocked: Boolean(state.travel?.busStationUnlocked || caught >= required),
  };
}

export function canUseBusStation(state) {
  return getGrandmaTrustProgress(state).unlocked;
}
