export const waterFishDistribution = {
  canal: {
    fishIds: ['rotan', 'crucian', 'bleak', 'roach', 'loach'],
    weights: { rotan: 2.15, crucian: 2.55, bleak: 1.45, roach: 1.1, loach: 0.18 },
    size: { crucian: [0.92, 1.08], rotan: [0.9, 1.05] },
  },
  sluice: {
    fishIds: ['okun', 'pike', 'crucian', 'gudgeon', 'plotytsia', 'white_bream'],
    weights: { okun: 2.9, pike: 0.36, crucian: 1.35, gudgeon: 1.8, plotytsia: 2.25, white_bream: 1.35 },
    size: { okun: [1.02, 1.16], pike: [1.04, 1.16] },
  },
  fire_ponds: {
    fishIds: ['crucian', 'carp', 'grass_carp', 'silver_carp'],
    weights: { crucian: 5.6, carp: 0.46, grass_carp: 0.12, silver_carp: 0.1 },
    size: { crucian: [1.14, 1.34], carp: [1.08, 1.24], grass_carp: [1.08, 1.22], silver_carp: [1.08, 1.22] },
  },
  greada: {
    fishIds: ['crucian', 'rotan', 'lynok', 'canadian_catfish', 'loach'],
    weights: { crucian: 2.6, rotan: 0.5, lynok: 0.6, canadian_catfish: 2.15, loach: 0.75 },
    size: { canadian_catfish: [1.08, 1.24], lynok: [1.06, 1.18] },
  },
  lake_tur: {
    fishIds: ['crucian', 'bleak', 'rudd', 'loach', 'pike', 'okun', 'lynok', 'sudak', 'som', 'canadian_catfish', 'gudgeon', 'white_bream', 'bream', 'plotytsia'],
    weights: {
      crucian: 1.2,
      bleak: 1.3,
      rudd: 2.2,
      loach: 0.42,
      pike: 0.75,
      okun: 2.4,
      lynok: 1.05,
      sudak: 0.72,
      som: 0.46,
      canadian_catfish: 2.35,
      gudgeon: 0.75,
      white_bream: 1.4,
      bream: 0.85,
      plotytsia: 1.5,
    },
    size: { som: [1.16, 1.48], canadian_catfish: [1.12, 1.32], sudak: [1.08, 1.22], pike: [1.08, 1.22] },
  },
  mining_lake: {
    fishIds: ['okun', 'crucian', 'lynok', 'canadian_catfish', 'white_bream', 'bream', 'plotytsia', 'eel'],
    weights: { okun: 4.2, crucian: 1.25, lynok: 1.1, canadian_catfish: 1.4, white_bream: 1.65, bream: 1.15, plotytsia: 2.15, eel: 0.38 },
    size: { okun: [1.08, 1.24], lynok: [1.04, 1.16], bream: [1.04, 1.18] },
  },
};

export function getWaterFishDistribution(waterId = 'canal') {
  return waterFishDistribution[waterId] ?? waterFishDistribution.canal;
}

export function getWaterFishIds(waterId = 'canal') {
  return getWaterFishDistribution(waterId).fishIds;
}

export function getWaterFishWeights(waterId = 'canal', spotWeights = {}) {
  const distribution = getWaterFishDistribution(waterId);
  const weights = {};

  for (const fishId of distribution.fishIds) {
    const baseWeight = distribution.weights[fishId] ?? 1;
    const spotScale = spotWeights[fishId] ?? 1;
    weights[fishId] = Number((baseWeight * spotScale).toFixed(3));
  }

  return weights;
}

export function getWaterSizeRange(waterId, fishId) {
  return getWaterFishDistribution(waterId).size?.[fishId] ?? null;
}
