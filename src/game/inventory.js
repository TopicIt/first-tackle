export const itemLabels = {
  thread: 'itemThread',
  simpleHook: 'itemSimpleHook',
  worms: 'itemWorms',
  larvae: 'itemLarvae',
  primitiveTackle: 'itemPrimitiveTackle',
  stickRod: 'itemStickRod',
  bicycle: 'itemBicycle',
  cleanedFish: 'itemCleanedFish',
  saltedFish: 'itemSaltedFish',
  dryingFish: 'itemDryingFish',
  taranka: 'itemTaranka',
  salt: 'itemSalt',
  hooksPack: 'itemHooksPack',
};

export const fishIds = ['rotan', 'crucian', 'bleak', 'roach', 'rudd', 'loach', 'pike', 'canadian_catfish'];

export function countItem(state, itemId) {
  return state.inventory[itemId] ?? 0;
}

export function addItem(state, itemId, amount = 1) {
  state.inventory[itemId] = countItem(state, itemId) + amount;
}

export function removeItem(state, itemId, amount = 1) {
  const current = countItem(state, itemId);
  if (current < amount) {
    return false;
  }

  state.inventory[itemId] = current - amount;
  return true;
}

export function hasItem(state, itemId, amount = 1) {
  return countItem(state, itemId) >= amount;
}

export function getFishCount(state) {
  return fishIds.reduce((total, fishId) => total + countItem(state, fishId), 0);
}

export function removeOneFish(state) {
  const fishId = fishIds.find((id) => countItem(state, id) > 0);
  if (!fishId) {
    return null;
  }

  removeItem(state, fishId);
  return fishId;
}
