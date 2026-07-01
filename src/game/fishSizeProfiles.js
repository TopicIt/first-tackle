const defaultWeights = { common: 78, uncommon: 17, rare: 4, legendary: 1 };

export const waterQualitySizeBonus = {
  canal: 0,
  sluice: 0.015,
  fire_ponds: 0.015,
  greada: 0.025,
  lake_tur: 0.045,
  mining_lake: 0.045,
};

export const baitSizeBonus = {
  small_worms: -0.025,
  bread: 0.01,
  worms: 0.01,
  larvae: 0.005,
  mastyrka: 0.02,
  corn: 0.025,
  dough: 0.015,
  nightcrawler: 0.025,
  live_bait: 0.03,
};

export const depthSizeBonus = {
  surface: -0.12,
  middle: 0,
  bottom: 0.08,
};

export const fishSizeProfiles = {
  rotan: profile(25, [35, 90], [90, 150], [150, 260], 180, 240, 320),
  crucian: profile(25, [45, 120], [120, 380], [380, 950], 400, 1000, 1250, { common: 76, uncommon: 20, rare: 3.5, legendary: 0.5 }),
  bleak: profile(10, [15, 45], [45, 70], [70, 95], 70, 95, 110),
  roach: profile(35, [60, 170], [170, 360], [360, 650], 360, 650, 800),
  rudd: profile(45, [70, 190], [190, 420], [420, 800], 400, 750, 900),
  loach: profile(20, [30, 90], [90, 150], [150, 260], 150, 240, 320),
  pike: profile(180, [300, 850], [850, 1800], [1800, 4500], 1800, 4000, 6500, { common: 70, uncommon: 23, rare: 6, legendary: 1 }),
  okun: profile(40, [70, 210], [210, 520], [520, 1050], 500, 900, 1300),
  lynok: profile(80, [150, 420], [420, 900], [900, 1600], 850, 1400, 1900),
  sudak: profile(220, [400, 950], [950, 2200], [2200, 5200], 2000, 4500, 7000, { common: 70, uncommon: 23, rare: 6, legendary: 1 }),
  som: profile(350, [700, 1800], [1800, 5000], [5000, 14000], 4500, 11000, 22000, { common: 66, uncommon: 25, rare: 7.5, legendary: 1.5 }),
  canadian_catfish: profile(90, [160, 420], [420, 850], [850, 1600], 750, 1350, 1900),
  carp: profile(350, [700, 1600], [1600, 4200], [4200, 9000], 3500, 7500, 12000, { common: 68, uncommon: 24, rare: 7, legendary: 1 }),
  grass_carp: profile(500, [900, 2200], [2200, 5200], [5200, 11000], 4500, 9000, 15000, { common: 68, uncommon: 24, rare: 7, legendary: 1 }),
  silver_carp: profile(600, [950, 2600], [2600, 6500], [6500, 14000], 5500, 11000, 18000, { common: 68, uncommon: 24, rare: 7, legendary: 1 }),
  white_bream: profile(35, [70, 190], [190, 420], [420, 850], 400, 750, 1000),
  bream: profile(90, [180, 520], [520, 1300], [1300, 3200], 1200, 2600, 4200),
  plotytsia: profile(25, [45, 130], [130, 260], [260, 520], 260, 480, 650),
  gudgeon: profile(10, [20, 55], [55, 90], [90, 150], 90, 140, 180),
  eel: profile(120, [250, 700], [700, 1400], [1400, 3200], 1200, 2600, 4500, { common: 64, uncommon: 25, rare: 9, legendary: 2 }),
};

export function rollFishWeight(fishId, options = {}) {
  const sizeProfile = fishSizeProfiles[fishId] ?? fishSizeProfiles.crucian;
  const roll = Math.random() * 100;
  const weights = sizeProfile.weights ?? defaultWeights;
  let range = sizeProfile.common;
  if (roll > weights.common + weights.uncommon + weights.rare) {
    range = sizeProfile.legendary;
  } else if (roll > weights.common + weights.uncommon) {
    range = sizeProfile.rare;
  } else if (roll > weights.common) {
    range = sizeProfile.uncommon;
  }

  const base = randomInt(range[0], range[1]);
  const baitBonus = options.baitFits ? (baitSizeBonus[options.baitId] ?? 0) : 0;
  const waterBonus = waterQualitySizeBonus[options.waterId] ?? 0;
  const tackleBonus = options.tackleTrophyBonus ?? 0;
  const depthBonus = depthSizeBonus[options.depth] ?? 0;
  const multiplier = 1 + baitBonus + waterBonus + tackleBonus + depthBonus;
  const minWeight = Math.max(sizeProfile.min, options.minWeight ?? 0);
  const capped = Math.min(sizeProfile.max, Math.round(base * multiplier));
  return Math.max(minWeight, capped);
}

export function classifyCatchSize(fishId, weightGrams) {
  const sizeProfile = fishSizeProfiles[fishId] ?? fishSizeProfiles.crucian;
  if (weightGrams >= sizeProfile.legendaryWeight) return 'legendary';
  if (weightGrams >= sizeProfile.trophyWeight * 1.45) return 'very_rare';
  if (weightGrams >= sizeProfile.trophyWeight) return 'trophy';
  if (weightGrams < sizeProfile.common[0] * 1.15) return 'small';
  return 'ordinary';
}

export function trophyTierForCategory(category) {
  return {
    trophy: 'normal',
    very_rare: 'very_rare',
    legendary: 'rarest',
  }[category] ?? null;
}

function profile(min, common, uncommon, rare, trophyWeight, legendaryWeight, max, weights = defaultWeights) {
  return {
    min,
    common,
    uncommon,
    rare,
    legendary: [legendaryWeight, max],
    trophyWeight,
    legendaryWeight,
    max,
    weights,
  };
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
