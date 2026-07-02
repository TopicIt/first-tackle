import { getFishPricePerKg } from './fishEconomy.js';

export const fishData = [
  {
    id: 'rotan',
    nameKey: 'fishRotan',
    rarityKey: 'rarityCommon',
    minWeight: 35,
    maxWeight: 130,
    basePrice: 4,
    weight: 38,
    descriptionKey: 'descRotan',
    depthPreference: 'bottom',
    surfaceBite: false,
  },
  {
    id: 'crucian',
    nameKey: 'fishCrucian',
    rarityKey: 'rarityCommon',
    minWeight: 60,
    maxWeight: 210,
    basePrice: 7,
    weight: 28,
    descriptionKey: 'descCrucian',
    depthPreference: 'any',
  },
  {
    id: 'bleak',
    nameKey: 'fishBleak',
    rarityKey: 'rarityCommon',
    minWeight: 15,
    maxWeight: 55,
    basePrice: 5,
    weight: 24,
    descriptionKey: 'descBleak',
    depthPreference: 'surface',
  },
  {
    id: 'roach',
    nameKey: 'fishRoach',
    rarityKey: 'rarityUncommon',
    minWeight: 70,
    maxWeight: 240,
    basePrice: 9,
    weight: 8,
    descriptionKey: 'descRoach',
    depthPreference: 'middle',
  },
  {
    id: 'rudd',
    nameKey: 'fishRudd',
    rarityKey: 'rarityRare',
    minWeight: 80,
    maxWeight: 260,
    basePrice: 12,
    weight: 5,
    descriptionKey: 'descRudd',
    depthPreference: 'surface',
  },
  {
    id: 'loach',
    nameKey: 'fishLoach',
    rarityKey: 'rarityVeryRare',
    minWeight: 25,
    maxWeight: 90,
    basePrice: 15,
    weight: 2,
    descriptionKey: 'descLoach',
    depthPreference: 'bottom',
  },
  {
    id: 'pike',
    nameKey: 'fishPike',
    rarityKey: 'rarityUncommon',
    minWeight: 300,
    maxWeight: 900,
    basePrice: 22,
    weight: 1.45,
    descriptionKey: 'descPike',
    depthPreference: 'middle',
  },
  {
    id: 'okun',
    nameKey: 'fishOkun',
    rarityKey: 'rarityUncommon',
    minWeight: 90,
    maxWeight: 420,
    basePrice: 13,
    weight: 7,
    descriptionKey: 'descOkun',
    depthPreference: 'middle',
    surfaceBite: false,
  },
  {
    id: 'lynok',
    nameKey: 'fishLynok',
    rarityKey: 'rarityRare',
    minWeight: 180,
    maxWeight: 760,
    basePrice: 24,
    weight: 3,
    descriptionKey: 'descLynok',
    depthPreference: 'bottom',
  },
  {
    id: 'sudak',
    nameKey: 'fishSudak',
    rarityKey: 'rarityRare',
    minWeight: 350,
    maxWeight: 1200,
    basePrice: 30,
    weight: 2,
    descriptionKey: 'descSudak',
    depthPreference: 'bottom',
  },
  {
    id: 'som',
    nameKey: 'fishSom',
    rarityKey: 'rarityVeryRare',
    minWeight: 850,
    maxWeight: 2800,
    basePrice: 46,
    weight: 1,
    descriptionKey: 'descSom',
    depthPreference: 'bottom',
  },
  {
    id: 'canadian_catfish',
    nameKey: 'fishCanadianCatfish',
    rarityKey: 'rarityRare',
    minWeight: 180,
    maxWeight: 720,
    basePrice: 18,
    weight: 4,
    descriptionKey: 'descCanadianCatfish',
    depthPreference: 'bottom',
  },
  {
    id: 'carp',
    nameKey: 'fishCarp',
    rarityKey: 'rarityRare',
    minWeight: 700,
    maxWeight: 2600,
    basePrice: 42,
    weight: 1,
    descriptionKey: 'descCarp',
    depthPreference: 'bottom',
  },
  {
    id: 'grass_carp',
    nameKey: 'fishGrassCarp',
    rarityKey: 'rarityVeryRare',
    minWeight: 900,
    maxWeight: 3200,
    basePrice: 55,
    weight: 0.4,
    descriptionKey: 'descGrassCarp',
    depthPreference: 'middle',
  },
  {
    id: 'silver_carp',
    nameKey: 'fishSilverCarp',
    rarityKey: 'rarityVeryRare',
    minWeight: 950,
    maxWeight: 3600,
    basePrice: 58,
    weight: 0.35,
    descriptionKey: 'descSilverCarp',
    depthPreference: 'middle',
  },
  {
    id: 'white_bream',
    nameKey: 'fishWhiteBream',
    rarityKey: 'rarityUncommon',
    minWeight: 80,
    maxWeight: 360,
    basePrice: 11,
    weight: 6,
    descriptionKey: 'descWhiteBream',
    depthPreference: 'middle',
  },
  {
    id: 'bream',
    nameKey: 'fishBream',
    rarityKey: 'rarityRare',
    minWeight: 260,
    maxWeight: 1200,
    basePrice: 26,
    weight: 2,
    descriptionKey: 'descBream',
    depthPreference: 'bottom',
  },
  {
    id: 'plotytsia',
    nameKey: 'fishPlotytsia',
    rarityKey: 'rarityCommon',
    minWeight: 45,
    maxWeight: 180,
    basePrice: 7,
    weight: 10,
    descriptionKey: 'descPlotytsia',
    depthPreference: 'middle',
  },
  {
    id: 'gudgeon',
    nameKey: 'fishGudgeon',
    rarityKey: 'rarityCommon',
    minWeight: 20,
    maxWeight: 95,
    basePrice: 5,
    weight: 8,
    descriptionKey: 'descGudgeon',
    depthPreference: 'bottom',
  },
  {
    id: 'eel',
    nameKey: 'fishEel',
    rarityKey: 'rarityRare',
    minWeight: 120,
    maxWeight: 4500,
    basePrice: 900,
    weight: 0.8,
    descriptionKey: 'descEel',
    depthPreference: 'bottom',
  },
];

export function getFishData(fishId) {
  return fishData.find((fish) => fish.id === fishId);
}

export function getFreshFishValue(fishResult) {
  if (!fishResult) {
    return 0;
  }

  const fish = getFishData(fishResult.id);
  if (!fish) {
    return 0;
  }

  const weightKg = Math.max(0.001, (fishResult.weightGrams ?? 0) / 1000);
  return Math.max(1, Math.ceil(weightKg * getFishPricePerKg(fish.id)));
}

export function rollFish() {
  const totalWeight = fishData.reduce((total, fish) => total + fish.weight, 0);
  const roll = Math.random() * totalWeight;
  let cursor = 0;
  const fish = fishData.find((entry) => {
    cursor += entry.weight;
    return roll <= cursor;
  }) ?? fishData[0];

  return {
    id: fish.id,
    weightGrams: randomInt(fish.minWeight, fish.maxWeight),
    value: 0,
  };
}

export function rollFishById(fishId, options = {}) {
  const fish = getFishData(fishId) ?? fishData[0];
  return {
    id: fish.id,
    weightGrams: options.rollWeight ? options.rollWeight(fish.id, options) : randomInt(fish.minWeight, fish.maxWeight),
    value: 0,
  };
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
