import { fishData } from '../game/fishData.js';
import { countFishByStatus, getCatchJournal, getFishEntries, getKeepnetSummary, trophyKeyForTier } from '../game/fishInventory.js';
import { getFishGuideEntries, waterGuide } from '../game/guideData.js';
import { getFishSaleValue, getFreshnessInfo, getMarketPriceInfo } from '../game/market.js';
import { getCastSpot } from '../game/bitePatterns.js';
import { shopItems } from '../game/state.js';
import { componentLabels, getActiveRig, getAvailableRigs, tackleComponents } from '../game/tackle.js';
import { countItem, itemLabels } from '../game/inventory.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import { getWorldMapAsset } from '../utils/worldMapAsset.js';

const inventoryOrder = [
  'thread',
  'simpleHook',
  'primitiveTackle',
  'stickRod',
  'bicycle',
  'worms',
  'larvae',
  'bread',
  'mastyrka',
  'corn',
  'dough',
  'nightcrawler',
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
  'okun',
  'lynok',
  'sudak',
  'som',
  'canadian_catfish',
  'carp',
  'grass_carp',
  'silver_carp',
  'white_bream',
  'bream',
  'plotytsia',
  'gudgeon',
  'eel',
];

const itemImages = {
  thread: '/assets/items/grandma_thread.png',
  shovel: '/assets/items/item_shovel.png',
  betterLine: '/assets/items/better_line.png',
  simpleFloat: '/assets/items/float-cheap.png',
  cheap_float: '/assets/items/float-cheap.png',
  properFloat: '/assets/items/float-proper.png',
  proper_float: '/assets/items/float-proper.png',
  properSinker: '/assets/items/proper_sinker.png',
  proper_sinker: '/assets/items/proper_sinker.png',
  sharperHook: '/assets/items/sharp-hook.png',
  sharper_hook: '/assets/items/sharp-hook.png',
  hooksPack: '/assets/items/hooks_box.png',
  salt: '/assets/items/salt_bag.png',
  bicycle: '/assets/items/bicycle.png',
  betterBicycle: '/assets/items/bicycle-better.png',
  bestBicycle: '/assets/items/bicycle-best.png',
  primitiveTackle: '/assets/items/primitive_tackle.png',
  stickRod: '/assets/items/simple_stick_rod.png',
  simple_stick_rod: '/assets/items/simple_stick_rod.png',
  properRod: '/assets/items/proper_rod.png',
  proper_rod: '/assets/items/proper_rod.png',
  grandma_thread: '/assets/items/grandma_thread.png',
  taranka: '/assets/items/taranka_drying.png',
  smokedFish: '/assets/items/taranka_drying.png',
  baitBread: '/assets/items/bait_bread.png',
  gooseFeatherFloat: '/assets/items/fishing_float.png',
  baitLarvae: '/assets/items/bait_larvae.png',
  baitWorms: '/assets/items/bait_worm.png',
  baitMastyrka: '/assets/items/bait_mastyrka.png',
  baitCorn: '/assets/items/bait_corn.png',
  baitDough: '/assets/items/bait_dough.png',
  baitNightcrawler: '/assets/items/bait_nightcrawler.png',
  bread: '/assets/items/bait_bread.png',
  larvae: '/assets/items/bait_larvae.png',
  worms: '/assets/items/bait_worm.png',
  mastyrka: '/assets/items/bait_mastyrka.png',
  corn: '/assets/items/bait_corn.png',
  dough: '/assets/items/bait_dough.png',
  nightcrawler: '/assets/items/bait_nightcrawler.png',
};

const waterImages = {
  canal: '/assets/locations/fishing-canal.webp',
  sluice: '/assets/locations/shliuz.png',
  fire_ponds: '/assets/locations/stavky-pozhara.png',
  greada: '/assets/locations/gryada.png',
  lake_tur: '/assets/locations/ozero-tur.png',
  mining_lake: '/assets/locations/hirnytske-ozero.png',
};

const fishImages = {
  okun: '/assets/fish/okun.png',
  lynok: '/assets/fish/lynok.png',
  som: '/assets/fish/som.png',
  sudak: '/assets/fish/sudak.png',
};

export function inventoryMarkup(state) {
  const rows = inventoryOrder
    .filter((itemId) => countItem(state, itemId) > 0 || itemId === 'worms')
    .map(
      (itemId) => `
        <li class="row">
          <span class="row__label">
            ${itemVisualMarkup(itemId)}
            <span>${getItemLabel(itemId)}</span>
          </span>
          <strong>${countItem(state, itemId)}</strong>
        </li>
      `,
    )
    .join('');

  return rows || '<li class="row"><span>Empty</span><strong>0</strong></li>';
}

export function marketMarkup(state) {
  const tab = state.ui?.marketTab ?? 'sell';
  return `
    <div class="market-tabs">
      ${['sell', 'buy', 'prices'].map((id) => `
        <button class="${tab === id ? 'is-selected' : ''}" data-action="market:tab:${id}" type="button">${t(`marketTab${toPascalCase(id)}`)}</button>
      `).join('')}
    </div>
    <div class="market-body" data-scroll-preserve="market-body">
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
      ${trophies.slice(0, 4).map(trophyCardMarkup).join('') || `<p class="empty-panel">${t('noTrophiesYet')}</p>`}
    </div>
  `;
}

export function achievementsMarkup(state) {
  const trophyBySpecies = state.achievements?.trophyBySpecies ?? {};
  const rows = fishData.map((fish) => {
    const tiers = trophyBySpecies[fish.id] ?? {};
    const achieved = ['normal', 'very_rare', 'rarest'].filter((tier) => tiers[tier]);
    if (achieved.length === 0) {
      return '';
    }

    return `
      <article class="achievement-card">
        <img src="${speciesImage(fish.id)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <div>
          <h3>${t(fish.nameKey)}</h3>
          <div class="trophy-badge-row">
            ${achieved.map((tier) => trophyBadgeMarkup(tier, tiers[tier].weightGrams)).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');

  return rows || `<p class="empty-panel">${t('achievementsEmpty')}</p>`;
}

export function mapViewerMarkup(state) {
  const zoom = state.ui?.mapViewerZoom ?? 1;
  const mapAsset = getWorldMapAsset(state.ui?.resolvedViewMode ?? 'mobile');
  return `
    <div class="map-viewer-tools">
      <button data-action="mapViewer:zoomOut" type="button">-</button>
      <strong>${Math.round(zoom * 100)}%</strong>
      <button data-action="mapViewer:zoomIn" type="button">+</button>
    </div>
    <div class="map-viewer-scroll">
      <img
        class="map-viewer-image"
        style="--map-viewer-zoom:${zoom};"
        src="${mapAsset.primary}"
        onerror="this.onerror=null;this.src='${mapAsset.fallback}'"
        alt="${t('map')}"
      />
    </div>
  `;
}

export function tackleMarkup(state) {
  const equipped = state.tackle?.equipped ?? {};
  const owned = state.tackle?.owned ?? {};
  const activeRig = getActiveRig(state);
  const rigs = getAvailableRigs(state);
  return `
    <section class="active-tackle">
      <p class="section-label">${t('activeTackle')}</p>
      <strong>${t('activeTackleValue', { rig: t(activeRig.labelKey) })}</strong>
      <div class="rig-grid">
        ${rigs.map((rig) => `
          <article class="rig-card${activeRig.id === rig.id ? ' is-selected' : ''}${rig.available ? '' : ' is-disabled'}">
            <div class="rig-card__copy">
              ${rigVisualMarkup(rig.id)}
              <div>
                <h3>${t(rig.labelKey)}</h3>
                <p>${t(rig.descriptionKey)}</p>
              </div>
            </div>
            <button data-action="tackle:rig:${rig.id}" type="button"${rig.available ? '' : ' disabled'}>
              ${activeRig.id === rig.id ? t('selected') : t('useThisTackle')}
            </button>
          </article>
        `).join('')}
      </div>
    </section>
    <div class="tackle-grid">
      ${Object.entries(tackleComponents).map(([slot, options]) => `
        <section class="tackle-slot">
          <p class="section-label">${t(`tackleSlot${toPascalCase(slot)}`)}</p>
          <strong class="tackle-slot__equipped">
            ${tackleComponentVisualMarkup(equipped[slot])}
            <span>${t(componentLabels[equipped[slot]] ?? equipped[slot] ?? 'componentNone')}</span>
          </strong>
          <div class="tackle-options">
            ${options.filter((id) => owned[id]).map((id) => `
              <button class="${equipped[slot] === id ? 'is-selected' : ''}" data-action="tackle:equip:${slot}:${id}" type="button">
                ${tackleComponentVisualMarkup(id)}
                <span>${t(componentLabels[id] ?? id)}</span>
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
    betterBicycle: 'itemBetterBicycle',
    bestBicycle: 'itemBestBicycle',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
    baitBread: 'itemBread',
    baitWorms: 'itemWorms',
    baitMastyrka: 'itemMastyrka',
    baitCorn: 'itemCorn',
    baitDough: 'itemDough',
    baitNightcrawler: 'itemNightcrawler',
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
      ${catchCategoryBadgeMarkup(entry.catchCategory, entry.weightGrams)}
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
    <div class="trophy-item${trophy.tier ? ` trophy-item--${trophy.tier}` : ''}">
      <strong>${t(trophy.key)}</strong>
      <span>${t(fish?.nameKey ?? trophy.fishId)} · ${trophy.weightGrams}g</span>
    </div>
  `;
}

export function trophyBadgeMarkup(tier, weightGrams = null) {
  const stars = { normal: '*', very_rare: '**', rarest: '***' }[tier] ?? '*';
  const weight = weightGrams ? ` ${weightGrams}g` : '';
  return `<span class="trophy-badge trophy-badge--${tier}" title="${t(trophyKeyForTier(tier))}">${stars}${weight}</span>`;
}

function trophyCardMarkup(trophy) {
  const fish = fishData.find((entry) => entry.id === trophy.fishId);
  return `
    <div class="trophy-item${trophy.tier ? ` trophy-item--${trophy.tier}` : ''}">
      <img src="${speciesImage(trophy.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
      <div>
        <strong>${t(trophy.key)}</strong>
        <span>${t(fish?.nameKey ?? trophy.fishId)} В· ${trophy.weightGrams}g</span>
      </div>
    </div>
  `;
}

export function catchCategoryBadgeMarkup(category, weightGrams = null) {
  const stars = {
    small: '0',
    ordinary: '*',
    trophy: '*',
    very_rare: '**',
    legendary: '***',
  }[category] ?? '*';
  const weight = weightGrams ? ` ${weightGrams}g` : '';
  return `<span class="catch-category-badge catch-category-badge--${category ?? 'ordinary'}" title="${t(catchCategoryKey(category))}">${stars}${weight}</span>`;
}

function speciesImage(fishId) {
  if (fishImages[fishId]) {
    return assetPath(fishImages[fishId]);
  }

  return assetPath(`/assets/fish/species/${fishId}.png`);
}

function itemImage(itemId) {
  return itemImages[itemId] ? assetPath(itemImages[itemId]) : assetPath('/assets/items/tackle_components.png');
}

function itemVisualMarkup(itemId) {
  const isFish = fishData.some((fish) => fish.id === itemId);
  const image = isFish ? speciesImage(itemId) : itemImage(itemId);
  const fallback = isFish
    ? assetPath('/assets/fish/catch_result_frame.png')
    : assetPath('/assets/items/tackle_components.png');
  return `<img class="item-chip__icon" src="${image}" onerror="this.src='${fallback}'" alt="" />`;
}

function tackleComponentVisualMarkup(componentId) {
  if (!componentId || componentId === 'none' || componentId === 'small_stone') {
    return '<span class="item-chip__icon item-chip__icon--placeholder" aria-hidden="true"></span>';
  }

  const componentImageIds = {
    grandma_thread: 'grandma_thread',
    better_line: 'betterLine',
    old_dull_hook: 'hooksPack',
    sharper_hook: 'sharper_hook',
    proper_sinker: 'proper_sinker',
    goose_feather_float: 'gooseFeatherFloat',
    cheap_float: 'cheap_float',
    proper_float: 'proper_float',
    simple_stick_rod: 'simple_stick_rod',
    proper_rod: 'proper_rod',
  };

  return `<img class="item-chip__icon" src="${itemImage(componentImageIds[componentId] ?? componentId)}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />`;
}

function rigVisualMarkup(rigId) {
  const imageId = {
    handline: 'grandma_thread',
    first_rod: 'simple_stick_rod',
    proper_rod: 'proper_rod',
  }[rigId];

  return imageId
    ? `<img class="item-chip__icon item-chip__icon--large" src="${itemImage(imageId)}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />`
    : '';
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
      <button data-action="sell:fish" type="button"${freshEntries.length === 0 ? ' disabled' : ''}>${t('sellAllFish')}</button>
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
        <img src="${assetPath('/assets/items/taranka_drying.png')}" alt="" />
        <div>
          <h3>${t('sellTaranka')}</h3>
          <p>${t('marketTarankaNote')}</p>
          <strong>${countFishByStatus(state, 'taranka')} · ${tarankaValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:taranka" type="button"${tarankaEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(tarankaEntries.length === 0 ? t('reasonNoTaranka') : '')}
      </article>
      ${smokedEntries.length > 0 ? `
      <article class="market-card">
        <img src="${itemImage('smokedFish')}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        <div>
          <h3>${t('sellSmokedFish')}</h3>
          <p>${t('marketSmokedNote')}</p>
          <strong>${smokedEntries.length} · ${smokedValue} ${t('coins').toLowerCase()}</strong>
        </div>
        <button data-action="sell:smoked" type="button"${smokedEntries.length === 0 ? ' disabled' : ''}>${t('sell')}</button>
        ${marketReasonMarkup(smokedEntries.length === 0 ? t('reasonNoSmokedFish') : '')}
      </article>
      ` : ''}
    </div>
  `;
}

function marketBuyMarkup(state) {
  const categories = [
    ['bait', 'marketCategoryBait'],
    ['tackle', 'marketCategoryTackle'],
    ['other', 'marketCategoryOther'],
  ];
  return `
    <div class="market-buy-categories">
      ${categories.map(([category, labelKey]) => `
        <section class="market-buy-category">
          <h3>${t(labelKey)}</h3>
          <div class="market-card-grid market-card-grid--compact">
            ${shopItems.filter((item) => (item.category ?? 'other') === category).map((item) => marketBuyCardMarkup(state, item)).join('')}
          </div>
        </section>
      `).join('')}
    </div>
  `;
}

function marketBuyCardMarkup(state, item) {
  const owned = item.type !== 'consumable' && state.purchased[item.id];
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
            <strong>${trendArrow(price.trend)} ${price.currentPrice} ${t('uahPerKg')}</strong>
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
    betterBicycle: 'shopDescBetterBicycle',
    bestBicycle: 'shopDescBestBicycle',
    salt: 'shopDescSalt',
    hooksPack: 'shopDescHooks',
    baitBread: 'shopDescBaitBread',
    baitWorms: 'shopDescBaitWorms',
    baitMastyrka: 'shopDescBaitMastyrka',
    baitCorn: 'shopDescBaitCorn',
    baitDough: 'shopDescBaitDough',
    baitNightcrawler: 'shopDescBaitNightcrawler',
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
  const price = getMarketPriceInfo(state, entry.fishId);
  return `
    <div class="market-fish-entry">
      <div>
        <span>${entry.weightGrams}g · ${t('freshness')}: ${t(freshness.key)}</span>
        <small>${price.currentPrice} ${t('uahPerKg')} В· ${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
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
    const unlocked = water.unlocked
      || Boolean(state.travel?.visitedWaters?.[water.id])
      || (water.access === 'bicycle' && state.purchased?.bicycle);
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

function catchCategoryKey(category) {
  return {
    small: 'catchCategorySmall',
    ordinary: 'catchCategoryOrdinary',
    trophy: 'catchCategoryTrophy',
    very_rare: 'catchCategoryVeryRare',
    legendary: 'catchCategoryLegendary',
  }[category] ?? 'catchCategoryOrdinary';
}
