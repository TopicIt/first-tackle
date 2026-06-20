import { fishData } from './fishData.js';

export const waterGuide = [
  {
    id: 'home_canal',
    nameKey: 'waterHomeCanal',
    descriptionKey: 'waterHomeCanalDesc',
    fishIds: ['rotan', 'crucian', 'bleak', 'roach', 'loach'],
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideCanalTackle',
    baitKey: 'guideWormLarvae',
    unlocked: true,
  },
  {
    id: 'old_pond',
    nameKey: 'oldPond',
    descriptionKey: 'waterOldPondDesc',
    fishIds: ['crucian', 'rudd', 'roach', 'pike'],
    bestTimeKey: 'timeMorningEvening',
    tackleKey: 'guideRodFloat',
    baitKey: 'guideWormLarvaeLive',
    unlockKey: 'buyBicycleToReachWaters',
  },
  {
    id: 'greada',
    nameKey: 'waterGreada',
    descriptionKey: 'waterGreadaDesc',
    fishIds: ['crucian', 'rotan', 'canadian_catfish', 'loach'],
    bestTimeKey: 'timeEveningNight',
    tackleKey: 'guideGreadaTackle',
    baitKey: 'guideWormBunch',
    unlockKey: 'buyBicycleToReachWaters',
  },
];

export function getFishGuideEntries() {
  return fishData.map((fish) => ({
    fishId: fish.id,
    nameKey: fish.nameKey,
    descriptionKey: fish.descriptionKey,
    livesKey: `guideLives_${fish.id}`,
    timeKey: `guideTime_${fish.id}`,
    baitKey: `guideBait_${fish.id}`,
    tipsKey: `guideTips_${fish.id}`,
    economyKey: `guideEconomy_${fish.id}`,
  }));
}
