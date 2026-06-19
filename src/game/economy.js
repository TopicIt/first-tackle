import { getFishData } from './fishData.js';
import { pushFeedback, pushLog, shopItems } from './state.js';
import { addItem, countItem, fishIds } from './inventory.js';

export function sellAllFish(state) {
  let earned = 0;
  let sold = 0;

  for (const fishId of fishIds) {
    const fish = getFishData(fishId);
    const amount = countItem(state, fishId);
    if (!fish || amount === 0) {
      continue;
    }

    sold += amount;
    earned += amount * fish.basePrice;
    state.inventory[fishId] = 0;
  }

  if (sold === 0) {
    pushLog(state, 'logNoFishToSell');
    return;
  }

  state.money += earned;
  pushFeedback(state, 'feedbackCoins', { coins: earned }, 'coins');
  pushLog(state, 'logSoldFish', { count: sold, coins: earned });
}

export function sellTaranka(state) {
  const amount = countItem(state, 'taranka');
  if (amount === 0) {
    pushLog(state, 'logNoTaranka');
    return;
  }

  const earned = amount * 12;
  state.inventory.taranka = 0;
  state.money += earned;
  pushFeedback(state, 'feedbackCoins', { coins: earned }, 'coins');
  pushLog(state, 'logSoldTaranka', { count: amount, coins: earned });
}

export function buyShopItem(state, itemId) {
  const item = shopItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }

  if (item.type !== 'consumable' && state.purchased[itemId]) {
    pushLog(state, 'logAlreadyOwned', { itemKey: getShopItemKey(itemId) });
    return;
  }

  if (state.money < item.price) {
    pushLog(state, 'logCosts', { itemKey: getShopItemKey(itemId), coins: item.price });
    return;
  }

  state.money -= item.price;
  if (item.type === 'consumable') {
    addItem(state, item.itemId, item.amount);
    pushFeedback(state, 'feedbackItems', { count: item.amount, itemKey: getShopItemKey(itemId) }, 'item');
    pushLog(state, 'logBought', { itemKey: getShopItemKey(itemId) });
    return;
  }

  state.purchased[itemId] = true;
  pushFeedback(state, getShopItemKey(itemId), {}, 'item');
  pushLog(state, 'logBought', { itemKey: getShopItemKey(itemId) });
}

function getShopItemKey(itemId) {
  const labels = {
    shovel: 'itemShovel',
    betterLine: 'itemBetterLine',
    simpleFloat: 'itemSimpleFloat',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
  };
  return labels[itemId] ?? itemId;
}
