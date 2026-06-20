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
  },
  {
    id: 'pike',
    nameKey: 'fishPike',
    rarityKey: 'rarityRare',
    minWeight: 300,
    maxWeight: 900,
    basePrice: 22,
    weight: 1,
    descriptionKey: 'descPike',
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

  return Math.max(fish.basePrice, Math.round(fish.basePrice * (fishResult.weightGrams / fish.maxWeight)));
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

export function rollFishById(fishId) {
  const fish = getFishData(fishId) ?? fishData[0];
  return {
    id: fish.id,
    weightGrams: randomInt(fish.minWeight, fish.maxWeight),
    value: 0,
  };
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
