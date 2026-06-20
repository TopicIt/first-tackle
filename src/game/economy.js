import { getFishData } from './fishData.js';
import { sellFishByStatus, takeFishEntries, takeFishEntry } from './fishInventory.js';
import { ensureMarketState, getFishSaleValue } from './market.js';
import { ownTackleComponent } from './tackle.js';
import { pushFeedback, pushLog, queueSound, shopItems } from './state.js';
import { addItem } from './inventory.js';

export function sellAllFish(state) {
  ensureMarketState(state);
  completeSale(state, sellFishByStatus(state, 'fresh'), 'logNoFishToSell', 'logSoldFish');
}

export function sellSingleFish(state, fishEntryId) {
  ensureMarketState(state);
  const entry = takeFishEntry(state, fishEntryId, (fish) => fish.status === 'fresh');
  completeSale(state, entry ? [entry] : [], 'logNoFishToSell', 'logSoldFish');
}

export function sellFishSpecies(state, fishId) {
  ensureMarketState(state);
  const soldEntries = takeFishEntries(state, (entry) => entry.status === 'fresh' && entry.fishId === fishId);
  completeSale(state, soldEntries, 'logNoFishToSell', 'logSoldFish');
}

export function sellTaranka(state) {
  ensureMarketState(state);
  completeSale(state, sellFishByStatus(state, 'taranka'), 'logNoTaranka', 'logSoldTaranka');
}

export function sellSmokedFish(state) {
  ensureMarketState(state);
  completeSale(state, sellFishByStatus(state, 'smoked'), 'logNoSmokedFish', 'logSoldSmokedFish');
}

export function buyShopItem(state, itemId) {
  const item = shopItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }

  const alreadyOwned = state.purchased[itemId];
  if (item.type !== 'consumable' && alreadyOwned) {
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
    state.travel.greadaUnlocked = true;
    state.travel.visitedWaters = {
      ...(state.travel.visitedWaters ?? {}),
      canal: true,
    };
  }
  const componentByItem = {
    betterLine: 'better_line',
    simpleFloat: 'cheap_float',
    properFloat: 'proper_float',
    properSinker: 'proper_sinker',
    sharperHook: 'sharper_hook',
    properRod: 'proper_rod',
  };
  if (componentByItem[itemId]) {
    ownTackleComponent(state, componentByItem[itemId]);
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
    properFloat: 'componentProperFloat',
    properSinker: 'componentProperSinker',
    sharperHook: 'componentSharperHook',
    properRod: 'componentProperRod',
    bicycle: 'itemBicycle',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
  };
  return labels[itemId] ?? itemId;
}

function completeSale(state, soldEntries, emptyLogKey, successLogKey) {
  const sold = soldEntries.length;
  if (sold === 0) {
    pushLog(state, emptyLogKey);
    return;
  }

  const earned = soldEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);
  state.money += earned;
  pushFeedback(state, 'feedbackCoins', { coins: earned }, 'coins');
  pushLog(state, successLogKey, { count: sold, coins: earned });
  state.ui.catchResult = null;
  queueSound(state, 'coins');
  queueSound(state, 'sell_item');
}
