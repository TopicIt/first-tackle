import { fishData } from '../game/fishData.js';
import { getCatchJournal, getKeepnetSummary } from '../game/fishInventory.js';
import { getCastSpot } from '../game/bitePatterns.js';
import { shopItems } from '../game/state.js';
import { countItem, itemLabels } from '../game/inventory.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';

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

export function keepnetMarkup(state) {
  const summary = getKeepnetSummary(state);
  const expanded = state.ui?.expandedKeepnetSpecies ?? {};

  if (summary.totalFish === 0) {
    return `<p class="empty-panel">${t('keepnetEmpty')}</p>`;
  }

  return `
    <div class="keepnet-totals">
      <span>${t('totalFish')}: <strong>${summary.totalFish}</strong></span>
      <span>${t('totalWeight')}: <strong>${summary.totalWeight}g</strong></span>
    </div>
    <div class="keepnet-species">
      ${summary.species.map((group) => keepnetSpeciesMarkup(group, expanded[group.fishId])).join('')}
    </div>
  `;
}

export function catchJournalMarkup(state) {
  const entries = getCatchJournal(state);
  const trophies = state.trophies ?? [];

  return `
    <div class="journal-grid">
      ${entries.map(journalSpeciesMarkup).join('')}
    </div>
    <div class="trophy-strip">
      <p class="section-label">${t('trophyCatch')}</p>
      ${trophies.slice(0, 4).map(trophyMarkup).join('') || `<p class="empty-panel">${t('noTrophiesYet')}</p>`}
    </div>
  `;
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

function keepnetSpeciesMarkup(group, isExpanded) {
  const fish = fishData.find((entry) => entry.id === group.fishId);
  const entries = [...group.entries].sort((a, b) => b.weightGrams - a.weightGrams);
  return `
    <article class="keepnet-group">
      <button class="keepnet-group__head" data-action="panel:toggle:keepnetSpecies:${group.fishId}" type="button">
        <img src="${speciesImage(group.fishId)}" alt="" />
        <span>${t(fish?.nameKey ?? group.fishId)}</span>
        <strong>${t('keepnetGroupSummary', {
          count: group.count,
          total: group.totalWeight,
          best: group.bestWeight,
        })}</strong>
      </button>
      ${isExpanded ? `
        <div class="keepnet-entry-list">
          ${entries.map(keepnetEntryMarkup).join('')}
          <button class="keepnet-release-small" data-action="keepnet:releaseSmall:${group.fishId}" type="button">
            ${t('releaseSmallFish')}
          </button>
        </div>
      ` : ''}
    </article>
  `;
}

function keepnetEntryMarkup(entry) {
  return `
    <div class="keepnet-entry">
      <span>${entry.weightGrams}g · ${t(statusKey(entry.status))}</span>
      <small>${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
      <button data-action="keepnet:release:${entry.id}" type="button">${t('release')}</button>
    </div>
  `;
}

function journalSpeciesMarkup(entry) {
  const fish = fishData.find((item) => item.id === entry.fishId);
  const discovered = entry.discovered;
  return `
    <article class="journal-species${discovered ? '' : ' is-undiscovered'}">
      <img src="${speciesImage(entry.fishId)}" alt="" />
      <div>
        <h3>${discovered ? t(fish?.nameKey ?? entry.fishId) : t('undiscoveredFish')}</h3>
        <p>${discovered
          ? t('journalSpeciesStats', {
            day: entry.firstCatchDay,
            count: entry.totalCaught,
            best: entry.bestWeight,
          })
          : t('journalNotCaughtYet')}</p>
        ${discovered ? `<small>${t('bestSpot')}: ${entry.bestCatchSpotId ? t(getCastSpot(entry.bestCatchSpotId).labelKey) : t('unknownSpot')} · ${t('bestBait')}: ${entry.bestBait ? t(`bait${toPascalCase(entry.bestBait)}`) : t('none')}</small>` : ''}
      </div>
    </article>
  `;
}

function trophyMarkup(trophy) {
  const fish = fishData.find((entry) => entry.id === trophy.fishId);
  return `
    <div class="trophy-item">
      <strong>${t(trophy.key)}</strong>
      <span>${t(fish?.nameKey ?? trophy.fishId)} · ${trophy.weightGrams}g</span>
    </div>
  `;
}

function speciesImage(fishId) {
  return assetPath(`/assets/fish/species/${fishId}.png`);
}

function statusKey(status) {
  const keys = {
    fresh: 'statusFresh',
    live_bait: 'statusLiveBait',
    cleaned: 'itemCleanedFish',
    salted: 'itemSaltedFish',
    drying: 'itemDryingFish',
    taranka: 'itemTaranka',
  };
  return keys[status] ?? 'statusFresh';
}

function toPascalCase(value) {
  return value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}
