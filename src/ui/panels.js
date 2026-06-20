import { fishData } from '../game/fishData.js';
import { countFishByStatus, getCatchJournal, getFishEntries, getKeepnetSummary } from '../game/fishInventory.js';
import { getFishGuideEntries, waterGuide } from '../game/guideData.js';
import { getFishSaleValue, getFreshnessInfo, getMarketPriceInfo } from '../game/market.js';
import { getCastSpot } from '../game/bitePatterns.js';
import { shopItems } from '../game/state.js';
import { componentLabels, tackleComponents } from '../game/tackle.js';
import { countItem, itemLabels } from '../game/inventory.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';

const inventoryOrder = [
  'thread',
  'simpleHook',
  'primitiveTackle',
  'stickRod',
  'bicycle',
  'worms',
  'larvae',
  'cleanedFish',
  'saltedFish',
  'dryingFish',
  'taranka',
  'smokedFish',
  'salt',
  'hooksPack',
  'rotan',
  'crucian',
  'bleak',
  'roach',
  'rudd',
  'loach',
  'pike',
  'canadian_catfish',
];

const itemImages = {
  betterLine: '/assets/items/better_line.png',
  simpleFloat: '/assets/items/fishing_float.png',
  properFloat: '/assets/items/fishing_float.png',
  properSinker: '/assets/items/proper_sinker.png',
  sharperHook: '/assets/items/hooks_box.png',
  hooksPack: '/assets/items/hooks_box.png',
  salt: '/assets/items/salt_bag.png',
  bicycle: '/assets/items/bicycle.png',
  primitiveTackle: '/assets/items/primitive_tackle.png',
  stickRod: '/assets/items/tackle_components.png',
  taranka: '/assets/items/taranka_drying.png',
  smokedFish: '/assets/items/smoker.png',
  smoker: '/assets/items/smoker.png',
};

const waterImages = {
  greada: '/assets/locations/greada_location_concept.png',
  home_canal: '/assets/locations/pond_location_concept.png',
  old_pond: '/assets/locations/pond_location_concept.png',
};

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
      const owned = item.type !== 'consumable' && (item.id === 'smoker' ? state.hasSmoker : state.purchased[item.id]);
      return `
        <li class="row">
          <span>${getShopItemLabel(item.id)}</span>
          <strong>${owned ? t('owned') : `${item.price} ${t('coins').toLowerCase()}`}</strong>
        </li>
      `;
    })
    .join('');
}

export function fishPricesMarkup(state) {
  return fishData
    .map((fish) => {
      const price = getMarketPriceInfo(state, fish.id);
      return `
        <li class="row price-row trend-${price.trend}">
          <span>${t(fish.nameKey)}</span>
          <strong>${trendArrow(price.trend)} ${price.currentPrice} (${price.multiplier.toFixed(2)}x)</strong>
          <small>${t(trendKey(price.trend))}</small>
        </li>
      `;
    })
    .join('');
}

export function marketMarkup(state) {
  const tab = state.ui?.marketTab ?? 'sell';
  return `
    <div class="market-tabs">
      ${['sell', 'buy', 'prices'].map((id) => `
        <button class="${tab === id ? 'is-selected' : ''}" data-action="market:tab:${id}" type="button">${t(`marketTab${toPascalCase(id)}`)}</button>
      `).join('')}
    </div>
    <div class="market-body">
      ${tab === 'buy' ? marketBuyMarkup(state) : tab === 'prices' ? marketPricesMarkup(state) : marketSellMarkup(state)}
    </div>
  `;
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
      ${summary.species.map((group) => keepnetSpeciesMarkup(state, group, expanded[group.fishId])).join('')}
    </div>
  `;
}

export function catchJournalMarkup(state) {
  const entries = getCatchJournal(state).filter((entry) => entry.discovered);
  const trophies = state.trophies ?? [];

  if (entries.length === 0) {
    return `<p class="empty-panel">${t('catchJournalEmpty')}</p>`;
  }

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

export function tackleMarkup(state) {
  const equipped = state.tackle?.equipped ?? {};
  const owned = state.tackle?.owned ?? {};
  return `
    <div class="tackle-grid">
      ${Object.entries(tackleComponents).map(([slot, options]) => `
        <section class="tackle-slot">
          <p class="section-label">${t(`tackleSlot${toPascalCase(slot)}`)}</p>
          <strong>${t(componentLabels[equipped[slot]] ?? equipped[slot] ?? 'componentNone')}</strong>
          <div class="tackle-options">
            ${options.filter((id) => owned[id]).map((id) => `
              <button class="${equipped[slot] === id ? 'is-selected' : ''}" data-action="tackle:equip:${slot}:${id}" type="button">
                ${t(componentLabels[id] ?? id)}
              </button>
            `).join('')}
          </div>
        </section>
      `).join('')}
    </div>
    ${owned.simple_stick_rod || equipped.rod === 'simple_stick_rod' ? `<p class="tackle-warning">${t('homemadeRodWarning')}</p>` : ''}
  `;
}

export function guideMarkup(state) {
  const tab = state.ui?.guideTab ?? 'fish';
  return `
    <div class="guide-tabs">
      ${['fish', 'waters', 'baits', 'tackle', 'processing'].map((id) => `
        <button class="${tab === id ? 'is-selected' : ''}" data-action="guide:tab:${id}" type="button">${t(`guideTab${toPascalCase(id)}`)}</button>
      `).join('')}
    </div>
    <div class="guide-body">
      ${tab === 'waters' ? watersGuideMarkup(state) : tab === 'fish' ? fishGuideMarkup(state) : guideSimpleMarkup(tab)}
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
    properFloat: 'componentProperFloat',
    properSinker: 'componentProperSinker',
    sharperHook: 'componentSharperHook',
    properRod: 'componentProperRod',
    bicycle: 'itemBicycle',
    smoker: 'itemSmoker',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
  };
  return t(labels[itemId] ?? itemId);
}

function keepnetSpeciesMarkup(state, group, isExpanded) {
  const fish = fishData.find((entry) => entry.id === group.fishId);
  const entries = [...group.entries].sort((a, b) => b.weightGrams - a.weightGrams);
  return `
    <article class="keepnet-group">
      <button class="keepnet-group__head" data-action="panel:toggle:keepnetSpecies:${group.fishId}" type="button">
        <img src="${speciesImage(group.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <span>${t(fish?.nameKey ?? group.fishId)}</span>
        <strong>${t('keepnetGroupSummary', {
          count: group.count,
          total: group.totalWeight,
          best: group.bestWeight,
        })}</strong>
      </button>
      ${isExpanded ? `
        <div class="keepnet-entry-list">
          ${entries.map((entry) => keepnetEntryMarkup(state, entry)).join('')}
          <button class="keepnet-release-small" data-action="keepnet:releaseSmall:${group.fishId}" type="button">
            ${t('releaseSmallFish')}
          </button>
        </div>
      ` : ''}
    </article>
  `;
}

function keepnetEntryMarkup(state, entry) {
  const freshness = getFreshnessInfo(state, entry);
  return `
    <div class="keepnet-entry">
      <span>${entry.weightGrams}g · ${t(statusKey(entry.status))}</span>
      <small>${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
      <small>${t('freshness')}: ${t(freshness.key)}</small>
      <button data-action="keepnet:release:${entry.id}" type="button">${t('release')}</button>
    </div>
  `;
}

function journalSpeciesMarkup(entry) {
  const fish = fishData.find((item) => item.id === entry.fishId);
  const discovered = entry.discovered;
  return `
    <article class="journal-species${discovered ? '' : ' is-undiscovered'}">
      <img src="${speciesImage(entry.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
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

function itemImage(itemId) {
  return itemImages[itemId] ? assetPath(itemImages[itemId]) : assetPath('/assets/items/tackle_components.png');
}

function legacyMarketSellMarkup(state) {
  const freshEntries = getFishEntries(state, 'fresh');
  const freshValue = freshEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);
  const tarankaEntries = getFishEntries(state, 'taranka');
  const tarankaValue = tarankaEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);
  const smokedEntries = getFishEntries(state, 'smoked');
  const smokedValue = smokedEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);

  return `
    <div class="market-summary">
      <p>${t('marketSellHint')}</p>
      <strong>${t('freshFish')}: ${freshEntries.length} · ${freshValue} ${t('coins').toLowerCase()}</strong>
    </div>
    <div class="market-card-grid">
      <article class="market-card">
        <img src="${assetPath('/assets/fish/catch_result_frame.png')}" alt="" />
        <div>
          <h3>${t('sellFreshFish')}</h3>
          <p>${t('marketFreshnessNote')}</p>
          <strong>${freshValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:fish" type="button"${freshEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(freshEntries.length === 0 ? t('reasonNoFreshFish') : '')}
      </article>
      <article class="market-card">
        <img src="${assetPath('/assets/items/taranka_drying.png')}" alt="" />
        <div>
          <h3>${t('sellTaranka')}</h3>
          <p>${t('marketTarankaNote')}</p>
          <strong>${countFishByStatus(state, 'taranka')} · ${tarankaValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:taranka" type="button"${tarankaEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(tarankaEntries.length === 0 ? t('reasonNoTaranka') : '')}
      </article>
      <article class="market-card">
        <img src="${itemImage('smoker')}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        <div>
          <h3>${t('sellSmokedFish')}</h3>
          <p>${t('marketSmokedNote')}</p>
          <strong>${smokedEntries.length} В· ${smokedValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:smoked" type="button"${smokedEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(smokedEntries.length === 0 ? t('reasonNoSmokedFish') : '')}
      </article>
    </div>
  `;
}

function marketSellMarkup(state) {
  const freshEntries = getFishEntries(state, 'fresh');
  const freshGroups = getFreshFishSaleGroups(state);
  const expanded = state.ui?.expandedMarketSpecies ?? {};
  const freshValue = freshEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);
  const tarankaEntries = getFishEntries(state, 'taranka');
  const tarankaValue = tarankaEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);
  const smokedEntries = getFishEntries(state, 'smoked');
  const smokedValue = smokedEntries.reduce((total, entry) => total + getFishSaleValue(state, entry), 0);

  return `
    <div class="market-summary">
      <p>${t('marketSellHint')}</p>
      <strong>${t('freshFish')}: ${freshEntries.length} · ${freshValue} ${t('coins').toLowerCase()}</strong>
    </div>
    <section class="market-keepnet-sell">
      <div class="market-keepnet-sell__head">
        <div>
          <p class="section-label">${t('sellFreshFish')}</p>
          <p>${t('marketFreshKeepnetNote')}</p>
        </div>
      </div>
      <div class="market-keepnet-sell__list">
        ${freshGroups.length
          ? freshGroups.map((group) => marketSpeciesSellMarkup(state, group, expanded[group.fishId])).join('')
          : `<p class="empty-panel">${t('reasonNoFreshFish')}</p>`}
      </div>
    </section>
    <p class="section-label">${t('marketBulkActions')}</p>
    <div class="market-card-grid">
      <article class="market-card">
        <img src="${assetPath('/assets/fish/catch_result_frame.png')}" alt="" />
        <div>
          <h3>${t('sellFreshFish')}</h3>
          <p>${t('marketFreshnessNote')}</p>
          <strong>${freshValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:fish" type="button"${freshEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(freshEntries.length === 0 ? t('reasonNoFreshFish') : '')}
      </article>
      <article class="market-card">
        <img src="${assetPath('/assets/items/taranka_drying.png')}" alt="" />
        <div>
          <h3>${t('sellTaranka')}</h3>
          <p>${t('marketTarankaNote')}</p>
          <strong>${countFishByStatus(state, 'taranka')} · ${tarankaValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:taranka" type="button"${tarankaEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(tarankaEntries.length === 0 ? t('reasonNoTaranka') : '')}
      </article>
      <article class="market-card">
        <img src="${itemImage('smoker')}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        <div>
          <h3>${t('sellSmokedFish')}</h3>
          <p>${t('marketSmokedNote')}</p>
          <strong>${smokedEntries.length} · ${smokedValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:smoked" type="button"${smokedEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(smokedEntries.length === 0 ? t('reasonNoSmokedFish') : '')}
      </article>
    </div>
  `;
}

function marketBuyMarkup(state) {
  return `
    <div class="market-card-grid">
      ${shopItems.map((item) => {
        const owned = item.type !== 'consumable' && (item.id === 'smoker' ? state.hasSmoker : state.purchased[item.id]);
        const disabledReason = owned
          ? t('reasonAlreadyOwned')
          : state.money < item.price
            ? t('reasonNeedMoreCoins', { coins: item.price - state.money })
            : '';
        return `
          <article class="market-card">
            <img src="${itemImage(item.id)}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
            <div>
              <h3>${getShopItemLabel(item.id)}</h3>
              <p>${t(shopDescriptionKey(item.id))}</p>
              <strong>${owned ? t('owned') : `${item.price} ${t('coins').toLowerCase()}`}</strong>
            </div>
            <button data-action="buy:${item.id}" type="button"${owned || state.money < item.price ? ' disabled' : ''}>${owned ? t('owned') : t('buy')}</button>
            ${marketReasonMarkup(disabledReason)}
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function marketPricesMarkup(state) {
  return `
    <p class="market-forecast">${t('tomorrowForecast')}</p>
    <div class="market-price-grid">
      ${fishData.map((fish) => {
        const price = getMarketPriceInfo(state, fish.id);
        return `
          <article class="market-price-card trend-${price.trend}">
            <img src="${speciesImage(fish.id)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
            <span>${t(fish.nameKey)}</span>
            <strong>${trendArrow(price.trend)} ${price.currentPrice}</strong>
            <small>${price.multiplier.toFixed(2)}x · ${t(trendKey(price.trend))}</small>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function shopDescriptionKey(itemId) {
  const keys = {
    shovel: 'shopDescShovel',
    betterLine: 'shopDescBetterLine',
    simpleFloat: 'shopDescFloat',
    properFloat: 'shopDescProperFloat',
    properSinker: 'shopDescProperSinker',
    sharperHook: 'shopDescSharperHook',
    properRod: 'shopDescProperRod',
    bicycle: 'shopDescBicycle',
    smoker: 'shopDescSmoker',
    salt: 'shopDescSalt',
    hooksPack: 'shopDescHooks',
  };
  return keys[itemId] ?? 'shopDescFallback';
}

function marketReasonMarkup(reason) {
  return reason ? `<small class="market-card__reason">${reason}</small>` : '';
}

function marketSpeciesSellMarkup(state, group, isExpanded) {
  const fish = fishData.find((entry) => entry.id === group.fishId);
  return `
    <article class="market-fish-group">
      <button class="market-fish-group__head" data-action="panel:toggle:marketSpecies:${group.fishId}" type="button">
        <img src="${speciesImage(group.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <span>${t(fish?.nameKey ?? group.fishId)}</span>
        <strong>${t('marketGroupSummary', {
          count: group.count,
          total: group.totalWeight,
          coins: group.totalValue,
        })}</strong>
      </button>
      <div class="market-fish-group__actions">
        <button data-action="sell:species:${group.fishId}" type="button">${t('sellSpecies')}</button>
      </div>
      ${isExpanded ? `
        <div class="market-fish-entry-list">
          ${group.entries.map((entry) => marketFishEntryMarkup(state, entry)).join('')}
        </div>
      ` : ''}
    </article>
  `;
}

function marketFishEntryMarkup(state, entry) {
  const freshness = getFreshnessInfo(state, entry);
  return `
    <div class="market-fish-entry">
      <div>
        <span>${entry.weightGrams}g · ${t('freshness')}: ${t(freshness.key)}</span>
        <small>${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
      </div>
      <strong>${getFishSaleValue(state, entry)} ${t('coins').toLowerCase()}</strong>
      <button data-action="sell:entry:${entry.id}" type="button">${t('sell')}</button>
    </div>
  `;
}

function getFreshFishSaleGroups(state) {
  const species = new Map();
  for (const entry of getFishEntries(state, 'fresh')) {
    const group = species.get(entry.fishId) ?? {
      fishId: entry.fishId,
      count: 0,
      totalWeight: 0,
      totalValue: 0,
      entries: [],
    };
    group.count += 1;
    group.totalWeight += entry.weightGrams;
    group.totalValue += getFishSaleValue(state, entry);
    group.entries.push(entry);
    species.set(entry.fishId, group);
  }

  return [...species.values()]
    .map((group) => ({
      ...group,
      entries: [...group.entries].sort((a, b) => b.weightGrams - a.weightGrams),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

function fishGuideMarkup(state) {
  const journal = state.catchJournal ?? {};
  return getFishGuideEntries().map((entry) => `
    <article class="guide-card">
      <img src="${speciesImage(entry.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
      <div>
        <h3>${t(entry.nameKey)} ${journal[entry.fishId]?.discovered ? '' : `· ${t('undiscoveredFish')}`}</h3>
        <p>${t(entry.descriptionKey)}</p>
        <dl>
          <div><dt>${t('whereItLives')}</dt><dd>${t(entry.livesKey)}</dd></div>
          <div><dt>${t('bestTime')}</dt><dd>${t(entry.timeKey)}</dd></div>
          <div><dt>${t('preferredBait')}</dt><dd>${t(entry.baitKey)}</dd></div>
          <div><dt>${t('fishingTips')}</dt><dd>${t(entry.tipsKey)}</dd></div>
          <div><dt>${t('economicNote')}</dt><dd>${t(entry.economyKey)}</dd></div>
        </dl>
      </div>
    </article>
  `).join('');
}

function watersGuideMarkup(state) {
  return waterGuide.map((water) => {
    const unlocked = water.unlocked || state.purchased?.bicycle || state.travel?.farWatersUnlocked;
    return `
      <article class="guide-card guide-card--wide">
        <img src="${assetPath(waterImages[water.id] ?? '/assets/locations/pond_location_concept.png')}" onerror="this.src='${assetPath('/assets/locations/pond_location_concept.png')}'" alt="" />
        <div>
          <h3>${t(water.nameKey)} ${unlocked ? '' : `· ${t('locked')}`}</h3>
          <p>${t(water.descriptionKey)}</p>
          <dl>
            <div><dt>${t('fishSpecies')}</dt><dd>${water.fishIds.map((fishId) => t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId)).join(', ')}</dd></div>
            <div><dt>${t('bestTime')}</dt><dd>${t(water.bestTimeKey)}</dd></div>
            <div><dt>${t('tackle')}</dt><dd>${t(water.tackleKey)}</dd></div>
            <div><dt>${t('preferredBait')}</dt><dd>${t(water.baitKey)}</dd></div>
            ${unlocked ? '' : `<div><dt>${t('unlock')}</dt><dd>${t(water.unlockKey)}</dd></div>`}
          </dl>
        </div>
      </article>
    `;
  }).join('');
}

function guideSimpleMarkup(tab) {
  const keys = {
    baits: 'guideBaitsText',
    tackle: 'guideTackleText',
    processing: 'guideProcessingText',
  };
  return `<article class="guide-card guide-card--text"><p>${t(keys[tab])}</p></article>`;
}

function statusKey(status) {
  const keys = {
    fresh: 'statusFresh',
    live_bait: 'statusLiveBait',
    cleaned: 'itemCleanedFish',
    salted: 'itemSaltedFish',
    drying: 'itemDryingFish',
    taranka: 'itemTaranka',
    smoked: 'itemSmokedFish',
  };
  return keys[status] ?? 'statusFresh';
}

function toPascalCase(value) {
  return value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}

function trendArrow(trend) {
  return { rising: '▲', falling: '▼', stable: '•' }[trend] ?? '•';
}

function trendKey(trend) {
  return {
    rising: 'priceRising',
    falling: 'priceFalling',
    stable: 'priceStable',
  }[trend] ?? 'priceStable';
}
