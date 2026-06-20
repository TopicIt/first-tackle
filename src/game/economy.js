import { getFishData } from './fishData.js';
import { sellFishByStatus } from './fishInventory.js';
import { ensureMarketState, getFishSaleValue } from './market.js';
import { pushFeedback, pushLog, queueSound, shopItems } from './state.js';
import { addItem } from './inventory.js';

export function sellAllFish(state) {
  ensureMarketState(state);
  const soldEntries = sellFishByStatus(state, 'fresh');
  const sold = soldEntries.length;
  const earned = soldEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);

  if (sold === 0) {
    pushLog(state, 'logNoFishToSell');
    return;
  }

  state.money += earned;
  pushFeedback(state, 'feedbackCoins', { coins: earned }, 'coins');
  pushLog(state, 'logSoldFish', { count: sold, coins: earned });
  state.ui.catchResult = null;
  queueSound(state, 'coins');
  queueSound(state, 'sell_item');
}

export function sellTaranka(state) {
  ensureMarketState(state);
  const soldEntries = sellFishByStatus(state, 'taranka');
  const amount = soldEntries.length;
  if (amount === 0) {
    pushLog(state, 'logNoTaranka');
    return;
  }

  const earned = soldEntries.reduce((total, entry) => total + Math.max(14, Math.round((entry.value + 5) * 1.08)), 0);
  state.money += earned;
  pushFeedback(state, 'feedbackCoins', { coins: earned }, 'coins');
  pushLog(state, 'logSoldTaranka', { count: amount, coins: earned });
  queueSound(state, 'coins');
  queueSound(state, 'sell_item');
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
    queueSound(state, 'buy_item');
    return;
  }

  state.purchased[itemId] = true;
  if (itemId === 'bicycle') {
    state.travel ??= {};
    state.travel.farWatersUnlocked = true;
  }
  pushFeedback(state, getShopItemKey(itemId), {}, 'item');
  pushLog(state, 'logBought', { itemKey: getShopItemKey(itemId) });
  queueSound(state, 'buy_item');
}

function getShopItemKey(itemId) {
  const labels = {
    shovel: 'itemShovel',
    betterLine: 'itemBetterLine',
    simpleFloat: 'itemSimpleFloat',
    bicycle: 'itemBicycle',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
  };
  return labels[itemId] ?? itemId;
}
