export const TROPHY_POPULATION_THRESHOLD = 10;

const POPULATION_WEIGHT_SCALE = 0.1;

export const waterFishDistribution = {
  canal: {
    // Local/common name "rohal" maps to the existing canadian_catfish species in other waters.
    fishIds: ['rotan', 'crucian', 'rudd', 'plotytsia', 'roach', 'loach', 'pike'],
    population: { rotan: 22, crucian: 26, rudd: 5, plotytsia: 11, roach: 9, loach: 2, pike: 1 },
    size: { crucian: [0.92, 1.08], rotan: [0.9, 1.05] },
  },
  sluice: {
    fishIds: ['okun', 'pike', 'crucian', 'gudgeon', 'plotytsia', 'roach', 'rudd', 'white_bream', 'bleak'],
    population: { okun: 20, pike: 10, crucian: 15, gudgeon: 15, plotytsia: 8, roach: 15, rudd: 10, white_bream: 8, bleak: 15 },
    size: { okun: [1.02, 1.16], pike: [1.04, 1.16] },
  },
  fire_ponds: {
    fishIds: ['crucian', 'roach', 'rudd', 'carp', 'grass_carp', 'silver_carp'],
    population: { crucian: 56, roach: 12, rudd: 17, carp: 15, grass_carp: 10, silver_carp: 10 },
    size: { crucian: [1.14, 1.34], carp: [1.08, 1.24], grass_carp: [1.08, 1.22], silver_carp: [1.08, 1.22] },
  },
  greada: {
    fishIds: ['crucian', 'rotan', 'lynok', 'canadian_catfish', 'loach'],
    population: { crucian: 25, rotan: 5, lynok: 6, canadian_catfish: 30, loach: 8 },
    size: { canadian_catfish: [1.1, 1.28], lynok: [1.06, 1.18] },
  },
  lake_tur: {
    fishIds: ['crucian', 'bleak', 'rudd', 'loach', 'pike', 'okun', 'lynok', 'sudak', 'som', 'canadian_catfish', 'gudgeon', 'white_bream', 'bream', 'plotytsia'],
    population: {
      crucian: 12,
      bleak: 13,
      rudd: 22,
      loach: 10,
      pike: 10,
      okun: 24,
      lynok: 11,
      sudak: 10,
      som: 10,
      canadian_catfish: 24,
      gudgeon: 10,
      white_bream: 14,
      bream: 10,
      plotytsia: 15,
    },
    size: { som: [1.16, 1.48], canadian_catfish: [1.12, 1.32], sudak: [1.08, 1.22], pike: [1.08, 1.22] },
  },
  mining_lake: {
    fishIds: ['okun', 'crucian', 'lynok', 'canadian_catfish', 'white_bream', 'bream', 'plotytsia', 'eel'],
    population: { okun: 42, crucian: 13, lynok: 11, canadian_catfish: 14, white_bream: 17, bream: 12, plotytsia: 22, eel: 4 },
    size: { okun: [1.08, 1.24], lynok: [1.04, 1.16], bream: [1.04, 1.18] },
  },
};

export function getWaterFishDistribution(waterId = 'canal') {
  return waterFishDistribution[waterId] ?? waterFishDistribution.canal;
}

export function getWaterFishIds(waterId = 'canal') {
  return getWaterFishDistribution(waterId).fishIds;
}

export function getWaterFishPopulation(waterId = 'canal') {
  return { ...(getWaterFishDistribution(waterId).population ?? {}) };
}

export function getWaterPopulationIndex(waterId = 'canal', fishId) {
  return Number(getWaterFishDistribution(waterId).population?.[fishId] ?? 0);
}

export function canCatchTrophyInWater(waterId = 'canal', fishId) {
  return getWaterPopulationIndex(waterId, fishId) >= TROPHY_POPULATION_THRESHOLD;
}

export function getWaterFishWeights(waterId = 'canal', spotWeights = {}) {
  const distribution = getWaterFishDistribution(waterId);
  const weights = {};

  for (const fishId of distribution.fishIds) {
    const baseWeight = getWaterPopulationIndex(waterId, fishId) * POPULATION_WEIGHT_SCALE;
    const spotScale = spotWeights[fishId] ?? 1;
    weights[fishId] = Number((baseWeight * spotScale).toFixed(3));
  }

  return weights;
}

export function getWaterSizeRange(waterId, fishId) {
  return getWaterFishDistribution(waterId).size?.[fishId] ?? null;
}
