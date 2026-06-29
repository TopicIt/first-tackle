import { fishData } from '../game/fishData.js';
import { countFishByStatus, getCatchJournal, getFishEntries, getKeepnetSummary, trophyKeyForTier } from '../game/fishInventory.js';
import { getFishGuideEntries, waterGuide } from '../game/guideData.js';
import { biteProfiles } from '../game/bitePatterns.js';
import { fishSizeProfiles } from '../game/fishSizeProfiles.js';
import { getFishSaleValue, getFreshnessInfo, getMarketPriceInfo } from '../game/market.js';
import { castSpots, getCastSpot } from '../game/bitePatterns.js';
import { shopItems } from '../game/state.js';
import { getQuestRows } from '../game/quests.js';
import { getCafeOrderRows } from '../game/cafeOrders.js';
import { profileAvatars } from '../game/profile.js';
import { componentDescriptions, componentLabels, requiredTackleSlots, tackleComponents } from '../game/tackle.js';
import { resolveFishCatchCardImage } from '../game/fishCardImages.js';
import { countItem, itemLabels } from '../game/inventory.js';
import {
  TROPHY_TIERS,
  getSelectedProfileStar,
  getSpeciesTrophyProgress,
  getUnlockedStars,
} from '../game/achievementStars.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import { getWorldMapAsset } from '../utils/worldMapAsset.js';

const inventoryOrder = [
  'thread',
  'simpleHook',
  'primitiveTackle',
  'stickRod',
  'scooter',
  'bicycle',
  'smallWorms',
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
  smallHook: '/assets/items/hooks_box.png',
  mediumHook: '/assets/items/hooks_box.png',
  largeHook: '/assets/items/sharp-hook.png',
  small_hook: '/assets/items/hooks_box.png',
  medium_hook: '/assets/items/hooks_box.png',
  large_hook: '/assets/items/sharp-hook.png',
  sharperHook: '/assets/items/sharp-hook.png',
  sharper_hook: '/assets/items/sharp-hook.png',
  hooksPack: '/assets/items/hooks_box.png',
  salt: '/assets/items/salt_bag.png',
  scooter: '/assets/items/scooter.jpg',
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
  baitSmallWorms: '/assets/items/bait_nightcrawler.png',
  baitBread: '/assets/items/bait_bread.png',
  gooseFeatherFloat: '/assets/items/fishing_float.png',
  baitLarvae: '/assets/items/bait_larvae.png',
  baitWorms: '/assets/items/bait_nightcrawler.png',
  baitMastyrka: '/assets/items/bait_mastyrka.png',
  baitCorn: '/assets/items/bait_corn.png',
  baitDough: '/assets/items/bait_dough.png',
  baitNightcrawler: '/assets/items/bait_worm.png',
  baitLarvae: '/assets/items/bait_larvae.png',
  smallWorms: '/assets/items/bait_nightcrawler.png',
  bread: '/assets/items/bait_bread.png',
  larvae: '/assets/items/bait_larvae.png',
  worms: '/assets/items/bait_nightcrawler.png',
  mastyrka: '/assets/items/bait_mastyrka.png',
  corn: '/assets/items/bait_corn.png',
  dough: '/assets/items/bait_dough.png',
  nightcrawler: '/assets/items/bait_worm.png',
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

const guideTabIcons = {
  baits: '/assets/items/bait_nightcrawler.png',
  tackle: '/assets/items/tackle_components.png',
  processing: '/assets/items/taranka_drying.png',
};

const guideCardImages = {
  baits: [
    '/assets/items/bait_nightcrawler.png',
    '/assets/items/bait_nightcrawler.png',
    '/assets/items/bait_larvae.png',
    '/assets/items/bait_bread.png',
    '/assets/items/bait_dough.png',
    '/assets/items/bait_mastyrka.png',
    '/assets/items/bait_corn.png',
    '/assets/items/bait_worm.png',
    '/assets/fish/catch_result_frame.png',
  ],
  tackle: [
    '/assets/items/better_line.png',
    '/assets/items/hooks_box.png',
    '/assets/items/hooks_box.png',
    '/assets/items/tackle_components.png',
    '/assets/items/sharp-hook.png',
    '/assets/items/proper_sinker.png',
    '/assets/items/float-proper.png',
    '/assets/items/proper_rod.png',
    '/assets/items/fishing_float.png',
  ],
  processing: [
    '/assets/items/tackle_components.png',
    '/assets/items/salt_bag.png',
    '/assets/items/taranka_drying.png',
    '/assets/fish/catch_result_frame.png',
    '/assets/locations/market_location_concept.png',
  ],
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

export function profileMarkup(state) {
  const profile = state.playerProfile ?? {};
  const keepnetSummary = getKeepnetSummary(state);
  const totalTrophies = (state.trophies ?? []).filter((entry) => entry.tier).length;
  const unlockedStars = getUnlockedStars(state);
  const selectedStar = getSelectedProfileStar(state);
  const biggestFishId = state.stats?.biggestFishSpecies;
  const biggestWeight = state.stats?.biggestFishWeight ?? 0;
  const biggestFish = fishData.find((fish) => fish.id === biggestFishId);
  const unlockedWaters = Object.entries(state.travel?.visitedWaters ?? {})
    .filter(([, visited]) => visited)
    .map(([waterId]) => waterGuide.find((water) => water.id === waterId)?.nameKey)
    .filter(Boolean);

  return `
    <div class="profile-card">
      <div class="profile-card__avatar-wrap">
        <img class="profile-card__avatar" src="${profileImageSrc(profile)}" onerror="this.src='${assetPath(profileAvatars[0])}'" alt="" />
        ${selectedStar ? `<span class="profile-star profile-star--selected" style="--star-color:${selectedStar.color}" title="${t('selectedStar')}">&#9733;</span>` : ''}
      </div>
      <div>
        <h3>${escapeHtml(profile.name ?? '')}</h3>
        <p>${t('coins')}: <strong>${state.money}</strong></p>
        <small>${t('earnedStars')}: <strong>${unlockedStars.length}</strong></small>
      </div>
    </div>
    ${state.ui?.editingProfile ? `
      <form class="profile-form profile-form--inline" data-profile-form>
        <input data-profile-name-input name="name" type="text" autocomplete="name" value="${escapeHtml(profile.name ?? '')}" placeholder="${t('defaultPlayerName')}" />
        <details class="avatar-selector">
          <summary>${t('changeAvatar')}</summary>
          <div class="avatar-grid avatar-grid--small">
            ${profileAvatars.map((avatar) => avatarButtonMarkup(avatar, profile.avatar)).join('')}
          </div>
        </details>
        <label class="profile-upload">
          <span>${t('uploadPhoto')}</span>
          <input data-profile-photo-input type="file" accept="image/*" />
        </label>
        <div class="profile-form__actions">
          <button type="submit">${t('saveProfile')}</button>
          <button data-action="profile:cancelEdit" type="button">${t('close')}</button>
        </div>
      </form>
    ` : `<button class="profile-edit-button" data-action="profile:edit" type="button">${t('editProfile')}</button>`}
    <dl class="profile-stats">
      <div><dt>${t('daysFishing')}</dt><dd>${state.day ?? 1}</dd></div>
      <div><dt>${t('totalFishCaught')}</dt><dd>${state.stats?.totalFishCaught ?? 0}</dd></div>
      <div><dt>${t('fishInKeepnet')}</dt><dd>${keepnetSummary.totalFish}</dd></div>
      <div><dt>${t('totalTrophies')}</dt><dd>${totalTrophies}</dd></div>
      <div><dt>${t('earnedStars')}</dt><dd>${unlockedStars.length}</dd></div>
      <div><dt>${t('biggestFish')}</dt><dd>${biggestFish && biggestWeight ? `${t(biggestFish.nameKey)} ${biggestWeight}g` : t('none')}</dd></div>
      <div><dt>${t('favoriteWater')}</dt><dd>${favoriteWaterLabel(state)}</dd></div>
      <div><dt>${t('unlockedWaters')}</dt><dd>${unlockedWaters.length ? unlockedWaters.map((key) => t(key)).join(', ') : t('waterCanal')}</dd></div>
    </dl>
    <section class="profile-stars">
      <p class="section-label">${t('selectedStar')}</p>
      ${unlockedStars.length ? `
        <div class="profile-star-grid">
          ${unlockedStars.map((star) => starOptionMarkup(star, profile.selectedStarId)).join('')}
        </div>
      ` : `<p class="empty-panel">${t('noStarsYet')}</p>`}
    </section>
    <section class="profile-achievements">
      <p class="section-label">${t('achievements')}</p>
      ${achievementsMarkup(state)}
    </section>
  `;
}

export function marketMarkup(state) {
  const tab = state.ui?.marketTab ?? 'sell';
  return `
    <details class="market-description">
      <summary>${t('marketInfo')}</summary>
      <p>${t('sceneMarketDescription')}</p>
    </details>
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

export function cafeMarkup(state) {
  const rows = getCafeOrderRows(state);
  return `
    <div class="market-description cafe-description">
      <p>${t('cafeOrderHint')}</p>
    </div>
    <div class="quest-list cafe-order-list">
      ${rows.map((order) => `
        <article class="quest-card cafe-order-card${order.complete ? ' is-complete' : ''}">
          <div>
            <div class="cafe-order-card__top">
              <p class="section-label">${t('cafeOrder')}</p>
              <strong class="cafe-order-card__timer">${t('cafeTimeLeft', { minutes: order.timerText ?? order.minutesLeft })}</strong>
            </div>
            <h3>${t(order.titleKey)}</h3>
            <p>${t(order.descriptionKey)}</p>
            <strong>${order.progress}/${order.required} · ${t(order.fishNameKey)}${order.minWeight ? ` ${order.minWeight}g+` : ''}</strong>
            <small class="cafe-order-card__reward">${t('reward')}: ${order.rewardCoins} ${t('coins').toLowerCase()}</small>
          </div>
          <button data-action="cafe:complete:${order.id}" type="button"${order.complete ? '' : ' disabled'}>
            ${order.complete ? t('completeOrder') : t('inProgress')}
          </button>
        </article>
      `).join('')}
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
    const progress = getSpeciesTrophyProgress(state, fish.id);
    const star = state.achievements?.completedSpeciesStars?.[fish.id];

    return `
      <article class="achievement-card${progress.complete ? ' is-complete' : ''}">
        <img src="${speciesImage(fish.id)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <div>
          <h3>${t(fish.nameKey)} ${star ? `<span class="profile-star" style="--star-color:${star.color}">&#9733;</span>` : ''}</h3>
          <div class="trophy-badge-row">
            ${TROPHY_TIERS.map((tier) => trophyBadgeMarkup(tier, tiers[tier]?.weightGrams, !tiers[tier])).join('')}
          </div>
          <small>${progress.completedCount}/${progress.totalTiers} &middot; ${progress.complete ? t('speciesStarUnlocked') : t('achievementTrophyGoal')}</small>
        </div>
      </article>
    `;
  }).join('');

  return rows || `<p class="empty-panel">${t('achievementsEmpty')}</p>`;
}

function starOptionMarkup(star, selectedStarId) {
  const fish = fishData.find((entry) => entry.id === star.fishId);
  const selected = star.id === selectedStarId ? ' is-selected' : '';
  return `
    <button class="profile-star-option${selected}" data-action="profile:star:${star.id}" type="button" style="--star-color:${star.color}" aria-label="${t('selectStar')} ${t(fish?.nameKey ?? star.fishId)}">
      <span>&#9733;</span>
      <strong>${t(fish?.nameKey ?? star.fishId)}</strong>
    </button>
  `;
}

export function questsMarkup(state) {
  const rows = getQuestRows(state);
  return `
    <div class="quest-list">
      ${rows.map((quest) => `
        <article class="quest-card${quest.complete ? ' is-complete' : ''}${quest.claimed ? ' is-claimed' : ''}">
          <div>
            <p class="section-label">${quest.waterId ? t(getWaterNameKey(quest.waterId)) : t('activeQuests')}</p>
            <h3>${t(quest.titleKey)}</h3>
            <p>${t(quest.descriptionKey)}</p>
            <strong>${quest.progress}/${quest.required}</strong>
            <small>${t('reward')}: ${t(quest.rewardKey)}</small>
          </div>
          <button data-action="quest:claim:${quest.id}" type="button"${quest.complete && !quest.claimed ? '' : ' disabled'}>
            ${quest.claimed ? t('claimed') : quest.complete ? t('claimReward') : t('inProgress')}
          </button>
        </article>
      `).join('')}
      <p class="quest-list-note">${t('questsCafeNote')}</p>
    </div>
  `;
}

export function mapViewerMarkup(state) {
  const zoom = state.ui?.mapViewerZoom ?? 1;
  const mapAsset = getWorldMapAsset('desktop', state, { useTimeOfDay: false });
  return `
    <h3 class="map-viewer-title">${t('appTitle')}</h3>
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
  return `
    <section class="active-tackle">
      <p class="section-label">${t('activeTackle')}</p>
      <strong>${t('activeTackleComponents')}</strong>
      <p>${t('activeTackleComponentsDesc')}</p>
    </section>
    <div class="tackle-grid">
      ${Object.entries(tackleComponents).map(([slot, options]) => `
        <section class="tackle-slot">
          <p class="section-label">${t(`tackleSlot${toPascalCase(slot)}`)}</p>
          <strong class="tackle-slot__equipped">
            ${tackleComponentVisualMarkup(equipped[slot])}
            <span>${t(componentLabels[equipped[slot]] ?? equipped[slot] ?? 'componentNone')}</span>
          </strong>
          <small>${t(componentDescriptions[equipped[slot]] ?? componentDescriptions.none)}</small>
          <div class="tackle-options">
            ${options.filter((id) => owned[id] && !(requiredTackleSlots.includes(slot) && id === 'none')).map((id) => `
              <button class="${equipped[slot] === id ? 'is-selected' : ''}" data-action="tackle:equip:${slot}:${id}" type="button">
                ${tackleComponentVisualMarkup(id)}
                <span>
                  <strong>${t(componentLabels[id] ?? id)}</strong>
                  <small>${t(componentDescriptions[id] ?? componentDescriptions.none)}</small>
                </span>
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
      ${tab === 'waters' || tab === 'fish' ? guideTimeNoteMarkup(state) : ''}
      ${tab === 'waters' ? watersGuideAccordionMarkup(state) : tab === 'fish' ? fishGuideAccordionMarkup(state) : guideAccordionMarkup(tab, state)}
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
    smallHook: 'componentSmallHook',
    mediumHook: 'componentMediumHook',
    largeHook: 'componentLargeHook',
    sharperHook: 'componentSharperHook',
    properRod: 'componentProperRod',
    bicycle: 'itemBicycle',
    scooter: 'itemScooter',
    betterBicycle: 'itemBetterBicycle',
    bestBicycle: 'itemBestBicycle',
    salt: 'itemSalt',
    hooksPack: 'itemHooksPack',
    baitSmallWorms: 'itemSmallWorms',
    baitBread: 'itemBread',
    baitWorms: 'itemWorms',
    baitMastyrka: 'itemMastyrka',
    baitCorn: 'itemCorn',
    baitDough: 'itemDough',
    baitNightcrawler: 'itemNightcrawler',
    baitLarvae: 'itemLarvae',
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
      <img class="keepnet-entry__image" src="${entry.selectedCardImage ?? resolveFishCatchCardImage(entry.fishId, entry)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
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

export function trophyBadgeMarkup(tier, weightGrams = null, locked = false) {
  const stars = { normal: '*', very_rare: '**', rarest: '***' }[tier] ?? '*';
  const weight = weightGrams ? ` ${weightGrams}g` : '';
  return `<span class="trophy-badge trophy-badge--${tier}${locked ? ' is-locked' : ''}" title="${t(trophyKeyForTier(tier))}">${locked ? '□' : stars}${weight || (locked ? ` ${t('locked')}` : '')}</span>`;
}

function profileImageSrc(profile) {
  const custom = profile?.customAvatarDataUrl;
  if (profile?.avatarType === 'custom' && typeof custom === 'string' && custom.startsWith('data:image/')) {
    return escapeHtml(custom);
  }
  return assetPath(profile?.avatar ?? profileAvatars[0]);
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

function guideSpeciesImage(fishId) {
  if (fishId === 'crucian') {
    return assetPath('/assets/guide/fish/karas.png');
  }

  return speciesImage(fishId);
}

function getWaterNameKey(waterId) {
  return {
    canal: 'waterCanal',
    sluice: 'waterSluice',
    fire_ponds: 'waterFirePonds',
    greada: 'waterGreada',
    lake_tur: 'waterLakeTur',
    mining_lake: 'waterMiningLake',
  }[waterId] ?? 'location';
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
    small_hook: 'small_hook',
    medium_hook: 'medium_hook',
    large_hook: 'large_hook',
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

function marketSellMarkup(state) {
  const freshEntries = getMarketableFishEntries(state);
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
      <strong>${t('marketableFish')}: ${freshEntries.length} · ${freshValue} ${t('coins').toLowerCase()}</strong>
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
      <span class="market-card__image-wrap">
        <img src="${itemImage(item.id)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        ${item.amount && item.amount > 1 ? `<span class="market-card__qty-badge">×${item.amount}</span>` : ''}
      </span>
      <div class="market-card__content">
        <h3>${getShopItemLabel(item.id)}</h3>
        <p>${t(shopDescriptionKey(item.id))}</p>
        <div class="market-card__meta">
          <strong>${owned ? t('owned') : `${item.price} ${t('coins').toLowerCase()}`}</strong>
          ${item.amount && item.amount > 1 ? `<span class="market-card__qty">×${item.amount}</span>` : ''}
        </div>
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
    smallHook: 'shopDescSmallHook',
    mediumHook: 'shopDescMediumHook',
    largeHook: 'shopDescLargeHook',
    sharperHook: 'shopDescSharperHook',
    properRod: 'shopDescProperRod',
    bicycle: 'shopDescBicycle',
    scooter: 'shopDescScooter',
    betterBicycle: 'shopDescBetterBicycle',
    bestBicycle: 'shopDescBestBicycle',
    salt: 'shopDescSalt',
    hooksPack: 'shopDescHooks',
    baitSmallWorms: 'shopDescBaitSmallWorms',
    baitBread: 'shopDescBaitBread',
    baitWorms: 'shopDescBaitWorms',
    baitMastyrka: 'shopDescBaitMastyrka',
    baitCorn: 'shopDescBaitCorn',
    baitDough: 'shopDescBaitDough',
    baitNightcrawler: 'shopDescBaitNightcrawler',
    baitLarvae: 'shopDescBaitLarvae',
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
        <span>${entry.weightGrams}g · ${entry.status === 'cleaned' ? t('cleanedMarker') : t('freshness')}: ${entry.status === 'cleaned' ? '+5%' : t(freshness.key)}</span>
        <small>${price.currentPrice} ${t('uahPerKg')} В· ${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
      </div>
      <strong>${getFishSaleValue(state, entry)} ${t('coins').toLowerCase()}</strong>
      <button data-action="sell:entry:${entry.id}" type="button">${t('sell')}</button>
    </div>
  `;
}

function getFreshFishSaleGroups(state) {
  const species = new Map();
  for (const entry of getMarketableFishEntries(state)) {
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

function getMarketableFishEntries(state) {
  return [
    ...getFishEntries(state, 'fresh'),
    ...getFishEntries(state, 'cleaned'),
  ];
}

function fishGuideAccordionMarkup(state) {
  const journal = state.catchJournal ?? {};
  const expanded = state.ui?.expandedGuideCards ?? {};
  return getFishGuideEntries().map((entry) => `
    <article class="guide-card guide-card--accordion${expanded[`fish:${entry.fishId}`] ? ' is-open' : ''}">
      <button class="guide-card__summary" data-action="guide:toggle:fish:${entry.fishId}" type="button">
        <img src="${guideSpeciesImage(entry.fishId)}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <span>
          <h3>${t(entry.nameKey)}${journal[entry.fishId]?.discovered ? '' : ` - ${t('undiscoveredFish')}`}</h3>
          <small>${t(entry.livesKey)}</small>
        </span>
        <strong class="guide-card__expand">${expanded[`fish:${entry.fishId}`] ? '-' : '+'}</strong>
      </button>
      ${expanded[`fish:${entry.fishId}`] ? `<div class="guide-card__body">
        <p>${t(entry.descriptionKey)}</p>
        <dl>
          <div><dt>${t('whereItLives')}</dt><dd>${t(entry.livesKey)}</dd></div>
          <div><dt>${t('bestTime')}</dt><dd>${t(entry.timeKey)}</dd></div>
          <div><dt>${t('preferredBait')}</dt><dd>${favoriteBaitsMarkup(entry.fishId)}</dd></div>
          <div><dt>${t('weakerBaits')}</dt><dd>${weakerBaitsMarkup(entry.fishId)}</dd></div>
          <div><dt>${t('depthPreference')}</dt><dd>${depthPreferenceMarkup(entry.fishId)}</dd></div>
          <div><dt>${t('trophyThresholds')}</dt><dd>${thresholdMarkup(entry.fishId)}</dd></div>
        </dl>
      </div>` : ''}
    </article>
  `).join('');
}

function watersGuideAccordionMarkup(state) {
  const expanded = state.ui?.expandedGuideCards ?? {};
  return waterGuide.map((water) => {
    const unlocked = water.unlocked
      || Boolean(state.travel?.visitedWaters?.[water.id])
      || (water.access === 'bicycle' && state.purchased?.bicycle);
    return `
      <article class="guide-card guide-card--accordion guide-card--wide${expanded[`water:${water.id}`] ? ' is-open' : ''}">
        <button class="guide-card__summary" data-action="guide:toggle:water:${water.id}" type="button">
          <img src="${assetPath(waterImages[water.id] ?? '/assets/locations/pond_location_concept.png')}" onerror="this.src='${assetPath('/assets/locations/pond_location_concept.png')}'" alt="" />
          <span>
            <h3>${t(water.nameKey)} ${unlocked ? '' : `- ${t('locked')}`}</h3>
            <small>${t(water.bestTimeKey)}</small>
          </span>
          <strong class="guide-card__expand">${expanded[`water:${water.id}`] ? '-' : '+'}</strong>
        </button>
        ${expanded[`water:${water.id}`] ? `<div class="guide-card__body">
          <p>${t(water.descriptionKey)}</p>
          <dl>
            <div><dt>${t('fishSpecies')}</dt><dd>${water.fishIds.map((fishId) => t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId)).join(', ')}</dd></div>
            <div><dt>${t('bestTime')}</dt><dd>${t(water.bestTimeKey)}</dd></div>
            <div><dt>${t('tackle')}</dt><dd>${t(water.tackleKey)}</dd></div>
            <div><dt>${t('preferredBait')}</dt><dd>${t(water.baitKey)}</dd></div>
            <div><dt>${t('recommendedDepths')}</dt><dd>${waterDepthsMarkup(water.id)}</dd></div>
            <div><dt>${t('castingSpots')}</dt><dd>${waterCastSpotsMarkup(water.id)}</dd></div>
            ${unlocked ? '' : `<div><dt>${t('unlock')}</dt><dd>${t(water.unlockKey)}</dd></div>`}
          </dl>
        </div>` : ''}
      </article>
    `;
  }).join('');
}

function guideAccordionMarkup(tab, state = {}) {
  const expanded = state.ui?.expandedGuideCards ?? {};
  const cards = {
    baits: [
      ['itemSmallWorms', 'shopDescBaitSmallWorms'],
      ['guideBaitCardWormsTitle', 'guideBaitCardWormsText'],
      ['guideBaitCardLarvaeTitle', 'guideBaitCardLarvaeText'],
      ['guideBaitCardBreadTitle', 'guideBaitCardBreadText'],
      ['guideBaitCardDoughTitle', 'guideBaitCardDoughText'],
      ['guideBaitCardMastyrkaTitle', 'guideBaitCardMastyrkaText'],
      ['guideBaitCardCornTitle', 'guideBaitCardCornText'],
      ['guideBaitCardNightcrawlerTitle', 'guideBaitCardNightcrawlerText'],
      ['guideBaitCardLiveTitle', 'guideBaitCardLiveText'],
    ],
    tackle: [
      ['guideTackleCardLineTitle', 'guideTackleCardLineText'],
      ['guideTackleCardHookTitle', 'guideTackleCardHookText'],
      ['componentSmallHook', 'guideTackleSmallHookText'],
      ['componentMediumHook', 'guideTackleMediumHookText'],
      ['componentLargeHook', 'guideTackleLargeHookText'],
      ['guideTackleCardSinkerTitle', 'guideTackleCardSinkerText'],
      ['guideTackleCardFloatTitle', 'guideTackleCardFloatText'],
      ['guideTackleCardRodTitle', 'guideTackleCardRodText'],
      ['guideTackleCardDepthTitle', 'guideTackleCardDepthText'],
    ],
    processing: [
      ['guideProcessingCardCleanTitle', 'guideProcessingCardCleanText'],
      ['guideProcessingCardSaltTitle', 'guideProcessingCardSaltText'],
      ['guideProcessingCardDryTitle', 'guideProcessingCardDryText'],
      ['guideProcessingCardLiveTitle', 'guideProcessingCardLiveText'],
      ['guideProcessingCardMarketTitle', 'guideProcessingCardMarketText'],
    ],
  }[tab] ?? [];

  return cards.map(([titleKey, bodyKey], index) => {
    const key = `${tab}:${index}`;
    return `
    <article class="guide-card guide-card--accordion guide-card--text${expanded[key] ? ' is-open' : ''}">
      <button class="guide-card__summary" data-action="guide:toggle:${key}" type="button">
        <img src="${assetPath(guideCardImages[tab]?.[index] ?? guideTabIcons[tab] ?? '/assets/items/tackle_components.png')}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        <span>
          <h3>${t(titleKey)}</h3>
          <small>${t(`guideTab${toPascalCase(tab)}`)}</small>
        </span>
        <strong class="guide-card__expand">${expanded[key] ? '-' : '+'}</strong>
      </button>
      ${expanded[key] ? `<div class="guide-card__body">
        <p>${t(bodyKey)}</p>
      </div>` : ''}
    </article>
  `;
  }).join('');
}

function guideTimeNoteMarkup(state) {
  const expanded = state.ui?.expandedGuideCards ?? {};
  const key = 'time:periods';
  return `
    <article class="guide-card guide-card--accordion guide-card--time-note${expanded[key] ? ' is-open' : ''}">
      <button class="guide-card__summary" data-action="guide:toggle:${key}" type="button">
        <img src="${assetPath('/assets/items/fishing_float.png')}" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />
        <span>
          <h3>${t('guideTimeTitle')}</h3>
          <small>${t('guideTimeSummary')}</small>
        </span>
        <strong class="guide-card__expand">${expanded[key] ? '-' : '+'}</strong>
      </button>
      ${expanded[key] ? `<div class="guide-card__body guide-time-note__body">
        <div class="guide-time-note__rows">
          <span>${t('guideTimeDawnDusk')}</span>
          <span>${t('guideTimeDay')}</span>
          <span>${t('guideTimeNight')}</span>
        </div>
        <p>${t('guideTimeExplanation')}</p>
      </div>` : ''}
    </article>
  `;
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
          <div><dt>${t('preferredBait')}</dt><dd>${favoriteBaitsMarkup(entry.fishId)}</dd></div>
          <div><dt>${t('weakerBaits')}</dt><dd>${weakerBaitsMarkup(entry.fishId)}</dd></div>
          <div><dt>${t('trophyThresholds')}</dt><dd>${thresholdMarkup(entry.fishId)}</dd></div>
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

function favoriteBaitsMarkup(fishId) {
  const baits = biteProfiles[fishId]?.preferred?.baits ?? [];
  return baits.length ? baits.map((bait) => t(`bait${toPascalCase(bait)}`)).join(', ') : t('none');
}

function weakerBaitsMarkup(fishId) {
  const favorites = new Set(biteProfiles[fishId]?.preferred?.baits ?? []);
  const predator = ['pike', 'sudak', 'som', 'eel'].includes(fishId);
  const baits = ['worms', 'larvae', 'bread', 'dough', 'mastyrka', 'corn', 'nightcrawler', 'live_bait']
    .filter((bait) => !favorites.has(bait))
    .filter((bait) => !predator || ['worms', 'nightcrawler', 'live_bait'].includes(bait))
    .slice(0, 4);
  return baits.length ? baits.map((bait) => t(`bait${toPascalCase(bait)}`)).join(', ') : t('none');
}

function thresholdMarkup(fishId) {
  const profile = fishSizeProfiles[fishId];
  if (!profile) {
    return t('none');
  }
  return `0 < ${profile.common[0]}g В· * ${profile.common[0]}g В· ${t('catchCategoryTrophy')} ${profile.trophyWeight}g В· ** ${Math.round(profile.trophyWeight * 1.45)}g В· *** ${profile.legendaryWeight}g`;
}

function depthPreferenceMarkup(fishId) {
  const fish = fishData.find((entry) => entry.id === fishId);
  const preference = fish?.depthPreference ?? 'middle';
  if (fishId === 'crucian') {
    return `${t('depthSurface')} - ${t('catchCategorySmall')}; ${t('depthMiddle')}; ${t('depthBottom')} - ${t('catchCategoryTrophy')}`;
  }
  return t(`depth${toPascalCase(preference === 'any' ? 'middle' : preference)}`);
}

function waterDepthsMarkup(waterId) {
  const fishIds = waterGuide.find((water) => water.id === waterId)?.fishIds ?? [];
  const preferences = new Set(fishIds.map((fishId) => fishData.find((fish) => fish.id === fishId)?.depthPreference ?? 'middle'));
  if (preferences.has('bottom')) {
    return `${t('depthBottom')}, ${t('depthMiddle')}`;
  }
  if (preferences.has('surface')) {
    return `${t('depthSurface')}, ${t('depthMiddle')}`;
  }
  return t('depthMiddle');
}

function waterCastSpotsMarkup(waterId) {
  const spots = castSpots
    .filter((spot) => (spot.waterId ?? 'canal') === waterId)
    .slice(0, 4)
    .map((spot) => t(spot.labelKey));
  return spots.length ? spots.join(', ') : t('none');
}

function favoriteWaterLabel(state) {
  const waterCounts = {};
  for (const entry of state.fishBasket ?? []) {
    const waterId = entry.waterId ?? state.travel?.selectedWater ?? 'canal';
    waterCounts[waterId] = (waterCounts[waterId] ?? 0) + 1;
  }
  const waterId = Object.entries(waterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'canal';
  const water = waterGuide.find((entry) => entry.id === waterId);
  return water ? t(water.nameKey) : t('waterCanal');
}

export function avatarButtonMarkup(avatar, selectedAvatar) {
  const selected = avatar === selectedAvatar ? ' is-selected' : '';
  return `
    <button class="avatar-button${selected}" data-action="profile:avatar:${avatar}" type="button" aria-label="${t('selectAvatar')}">
      <img src="${assetPath(avatar)}" onerror="this.closest('button').style.display='none'" alt="" />
    </button>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
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
