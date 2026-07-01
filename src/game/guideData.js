import { fishData } from './fishData.js';
import { getFishingLocationList } from './locations.js';

export const waterGuide = getFishingLocationList().map((location) => ({
  id: location.id,
  nameKey: location.guideNameKey,
  descriptionKey: location.guideDescriptionKey,
  fishIds: location.fishIds,
  bestTimeKey: location.bestTimeKey,
  tackleKey: location.tackleKey,
  baitKey: location.baitKey,
  unlockKey: location.unlockKey,
  access: location.access,
  unlocked: location.unlocked,
}));

export function getFishGuideEntries() {
  return fishData.map((fish) => ({
    fishId: fish.id,
    nameKey: fish.nameKey,
    descriptionKey: fish.descriptionKey,
    livesKey: `guideLives_${fish.id}`,
    timeKey: `guideTime_${fish.id}`,
    baitKey: `guideBait_${fish.id}`,
    economyKey: `guideEconomy_${fish.id}`,
  }));
}
