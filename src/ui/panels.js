import { fishData } from '../game/fishData.js';
import { shopItems } from '../game/state.js';
import { countItem, itemLabels } from '../game/inventory.js';
import { t, translateEntry } from '../i18n/i18n.js';

const inventoryOrder = [
  'thread',
  'simpleHook',
  'primitiveTackle',
  'stickRod',
  'worms',
  'larvae',
  'cleanedFish',
  'saltedFish',
  'dryingFish',
  'taranka',
  'salt',
  'hooksPack',
  'rotan',
  'crucian',
  'bleak',
  'roach',
  'rudd',
  'loach',
  'pike',
];

export function inventoryMarkup(state) {
  const rows = inventoryOrder
    .filter((itemId) => countItem(state, itemId) > 0 || itemId === 'worms')
    .map(
      (itemId) => `
        <li class="row">
          <span>${getItemLabel(itemId)}</span>
          <strong>${countItem(state, itemId)}</strong>
        </li>
      `,
    )
    .join('');

  return rows || '<li class="row"><span>Empty</span><strong>0</strong></li>';
}

export function shopMarkup(state) {
  return shopItems
    .map((item) => {
      const owned = item.type !== 'consumable' && state.purchased[item.id];
      return `
        <li class="row">
          <span>${getShopItemLabel(item.id)}</span>
          <strong>${owned ? t('owned') : `${item.price} ${t('coins').toLowerCase()}`}</strong>
        </li>
      `;
    })
    .join('');
}

export function fishPricesMarkup() {
  return fishData
    .map(
      (fish) => `
        <li class="row">
          <span>${t(fish.nameKey)}</span>
          <strong>${fish.basePrice}</strong>
        </li>
      `,
    )
    .join('');
}

export function logMarkup(state) {
  return (state.log ?? []).map((entry) => {
    const text = translateEntry(entry);
    const count = typeof entry === 'object' && entry.count > 1 ? ` x${entry.count}` : '';
    return `<li>${text}${count}</li>`;
  }).join('');
}

export function getItemLabel(itemId) {
  if (itemLabels[itemId]) {
    return t(itemLabels[itemId]);
  }

  const fish = fishData.find((entry) => entry.id === itemId);
  return fish ? t(fish.nameKey) : itemId;
}

export function getShopItemLabel(itemId) {
  const labels = {
    shovel: 'itemShovel',
    betterLine: 'itemBetterLine',
    simpleFloat: 'itemSimpleFloat',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
  };
  return t(labels[itemId] ?? itemId);
}
