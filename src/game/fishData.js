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
