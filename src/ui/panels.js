import { fishData } from '../game/fishData.js';
import { countFishByStatus, getCatchJournal, getFishEntries, getKeepnetSummary, trophyKeyForTier } from '../game/fishInventory.js';
import { getFishGuideEntries, waterGuide } from '../game/guideData.js';
import { biteProfiles } from '../game/bitePatterns.js';
import { fishSizeProfiles } from '../game/fishSizeProfiles.js';
import { getFishSaleValue, getFreshnessInfo, getMarketPriceInfo } from '../game/market.js';
import { castSpots, getCastSpot } from '../game/bitePatterns.js';
import { getQuestRows } from '../game/quests.js';
import { getCafeOrderRows } from '../game/cafeOrders.js';
import { getLevelProgress, profileAvatars } from '../game/profile.js';
import { componentDescriptions, componentLabels, requiredTackleSlots, tackleComponents } from '../game/tackle.js';
import { resolveFishCatchCardImage } from '../game/fishCardImages.js';
import { countItem, itemLabels } from '../game/inventory.js';
import {
  TROPHY_TIERS,
  getSelectedProfileStar,
  getSpeciesTrophyProgress,
  getUnlockedStars,
} from '../game/achievementStars.js';
import { getLanguage, t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import { getWorldMapAsset } from '../utils/worldMapAsset.js';
import { loadCloudSession } from '../api/client.js';
import { getActiveItemModifiers } from '../game/itemEffects.js';
import { filterLeaderboardRecords, getLocalLeaderboard, normalizeLeaderboardType } from '../game/leaderboards.js';
import { getPlayerState } from '../game/playerState.js';
import { getFishingLocation } from '../game/locations.js';
import {
  TROPHY_POPULATION_THRESHOLD,
  canCatchTrophyInWater,
  getTrophyPopulationThreshold,
  getWaterFishIds,
  getWaterFishPopulation,
  getWaterPopulationIndex,
} from '../game/waterFishDistribution.js';
import { isLayoutDebugEnabled } from '../utils/debugFlags.js';
import {
  getCatalogMarketItems,
  getItemById,
  getItemDisplayName,
  getItemFullDescription,
  getItemShortDescription,
} from '../data/itemCatalog.js';
import {
  formatItemPrice,
  getCatalogCategoryLabel,
  itemIconMarkup,
  renderItemBonusChips,
  renderItemCompactSummary,
  renderItemDetails,
} from './itemRenderers.js';

const specialGuideFishIds = ['loach', 'pike', 'canadian_catfish', 'sudak', 'som', 'eel', 'carp', 'grass_carp', 'silver_carp'];
const predatorGuideFishIds = ['pike', 'sudak', 'som', 'eel'];
const guideFishColors = {
  crucian: '#f0a735',
  rotan: '#d98b24',
  roach: '#8edc75',
  plotytsia: '#5dd6b3',
  rudd: '#58a7f3',
  loach: '#a679ff',
  pike: '#e05b98',
  okun: '#f2c04c',
  lynok: '#c58cff',
  sudak: '#d75575',
  som: '#b65ad6',
  canadian_catfish: '#c060b8',
  carp: '#f08d4e',
  grass_carp: '#76c869',
  silver_carp: '#90d5df',
  white_bream: '#c8d87a',
  bream: '#d5ab5d',
  bleak: '#7fc7ff',
  gudgeon: '#baa26a',
  eel: '#8b63d9',
};

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
  const playerState = getPlayerState(state);
  const keepnetSummary = getKeepnetSummary(state);
  const totalTrophies = (state.trophies ?? []).filter((entry) => entry.tier).length;
  const unlockedStars = getUnlockedStars(state);
  const selectedStar = getSelectedProfileStar(state);
  const biggestFishId = state.stats?.biggestFishSpecies;
  const biggestWeight = state.stats?.biggestFishWeight ?? 0;
  const biggestFish = fishData.find((fish) => fish.id === biggestFishId);
  const levelProgress = getLevelProgress(profile);
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
        <p>${t('levelLabel')}: <strong>${playerState.profile.level ?? levelProgress.level}</strong></p>
        <small>${t('coins')}: <strong>${playerState.economy.coins ?? state.money}</strong> &middot; ${t('totalFishCaught')}: <strong>${playerState.stats.fishCaughtTotal ?? profile.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0}</strong></small>
      </div>
    </div>
    <div class="profile-xp">
      <div class="profile-xp__row">
        <span>${t('xpLabel')}</span>
        <strong>${levelProgress.earnedThisLevel}/${levelProgress.neededThisLevel}</strong>
      </div>
      <div class="profile-xp__bar" role="progressbar" aria-valuemin="0" aria-valuemax="${levelProgress.neededThisLevel}" aria-valuenow="${levelProgress.earnedThisLevel}" aria-label="${t('xpLabel')}">
        <span style="width:${levelProgress.percent}%"></span>
      </div>
      <small>${t('totalXpLabel')}: ${levelProgress.xp}</small>
    </div>
    ${profileProgressStateMarkup(state)}
    ${profileCloudSaveMarkup(state)}
    <div class="profile-inline-actions">
      <button class="profile-edit-button" data-action="panel:toggle:leaderboard" type="button">Лідери</button>
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
      <div><dt>${t('fishCaughtTotal')}</dt><dd>${playerState.stats.fishCaughtTotal ?? profile.fishCaughtTotal ?? state.stats?.totalFishCaught ?? 0}</dd></div>
      <div><dt>${t('totalCoinsEarned')}</dt><dd>${playerState.economy.totalCoinsEarned ?? profile.totalCoinsEarned ?? 0}</dd></div>
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
    <details class="profile-achievements">
      <summary class="section-label">${t('achievements')}</summary>
      ${achievementsMarkup(state)}
    </details>
  `;
}

function profileProgressStateMarkup(state) {
  const session = loadCloudSession();
  const playerState = getPlayerState(state);
  const loggedIn = Boolean(session?.accessToken);
  const metadata = session?.saveMetadata;
  const debug = isLayoutDebugEnabled();
  const lastCloudSave = formatCloudSaveTime(metadata?.serverUpdatedAt);

  return `
    <section class="profile-progress-card${loggedIn ? ' is-connected' : ''}" aria-label="Стан прогресу">
      <div>
        <p class="section-label">Стан прогресу</p>
        <strong>${loggedIn ? 'Акаунт підключено' : 'Гість'}</strong>
        <span>${loggedIn ? 'Хмарне автозбереження увімкнено' : 'Прогрес зберігається локально'}</span>
        <small>${loggedIn ? `Останнє хмарне збереження: ${escapeHtml(lastCloudSave)}` : 'Увійдіть, щоб синхронізувати'}</small>
      </div>
      ${debug ? `<em>Ревізія: ${playerState.revision ?? 0}</em>` : ''}
    </section>
  `;
}
function profileCloudSaveMarkup(state) {
  const session = loadCloudSession();
  const profile = session?.profile;
  const metadata = session?.saveMetadata;
  const message = state.ui?.cloudSave?.message ?? session?.lastMessage ?? '';
  const busy = Boolean(state.ui?.cloudSave?.busy);
  const loggedIn = Boolean(session?.accessToken);
  const status = busy
    ? t('cloudSaveSyncing')
    : loggedIn
      ? t('cloudSaveConnected')
      : t('cloudSaveOffline');
  const account = profile?.email || profile?.displayName || t('cloudSaveConnected');
  const lastCloudSave = formatCloudSaveTime(metadata?.serverUpdatedAt);

  return `
    <section class="profile-cloud-save${loggedIn ? ' is-connected' : ''}${busy ? ' is-syncing' : ''}" aria-label="${t('cloudSave')}">
      <div class="profile-cloud-save__head">
        <span>${t('cloudSave')}</span>
        <strong>${escapeHtml(status)}</strong>
      </div>
      <dl class="profile-cloud-save__status">
        <div><dt>${t('cloudSaveAccount')}</dt><dd>${loggedIn ? escapeHtml(account) : t('cloudSaveOfflineHint')}</dd></div>
        <div><dt>${t('cloudSaveLastSave')}</dt><dd>${escapeHtml(lastCloudSave)}</dd></div>
      </dl>
      <div class="profile-cloud-save__actions">
        ${loggedIn ? `
          <button data-action="cloud:upload" type="button"${busy ? ' disabled' : ''}>Зберегти зараз</button>
          <button data-action="cloud:download" type="button"${busy ? ' disabled' : ''}>Завантажити останнє збереження</button>
          <button data-action="cloud:logout" type="button"${busy ? ' disabled' : ''}>${t('cloudSaveLogoutShort')}</button>
        ` : `
          <button data-action="cloud:open" type="button"${busy ? ' disabled' : ''}>Увійти для хмари</button>
        `}
      </div>
      ${message ? `<small>${escapeHtml(message)}</small>` : ''}
    </section>
  `;
}

function formatCloudSaveTime(value) {
  if (!value) {
    return t('cloudSaveNoCloudSave');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const trophies = (state.trophies ?? []).filter((entry) => entry?.isTrophy || entry?.tier || entry?.trophyTier || String(entry?.key ?? '').startsWith('trophyTier'));

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
    <div class="tackle-grid">
      ${Object.entries(tackleComponents).map(([slot, options]) => `
        <section class="tackle-slot">
          <p class="section-label">${t(`tackleSlot${toPascalCase(slot)}`)}</p>
          <strong class="tackle-slot__equipped">
            ${tackleComponentVisualMarkup(equipped[slot])}
            <span>${componentDisplayName(equipped[slot])}</span>
          </strong>
          <small>${componentShortDescription(equipped[slot])}</small>
          ${renderItemBonusChips(equipped[slot], { limit: 2 })}
          <div class="tackle-options">
            ${options.filter((id) => owned[id] && !((requiredTackleSlots.includes(slot) || slot === 'float') && id === 'none')).map((id) => `
              <button class="${equipped[slot] === id ? 'is-selected' : ''}" data-action="tackle:equip:${slot}:${id}" type="button">
                ${tackleComponentVisualMarkup(id)}
                <span>
                  <strong>${componentDisplayName(id)}</strong>
                  <small>${componentShortDescription(id)}</small>
                  ${renderItemBonusChips(id, { limit: 2 })}
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
      ${tab === 'fish' ? fishGuideAccordionMarkup(state) : tab === 'waters' ? guideWaterDashboardMarkup(state) : guideAccordionMarkup(tab, state)}
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
  const catalogItem = getItemById(itemId);
  if (catalogItem) {
    return getItemDisplayName(catalogItem, getLanguage());
  }

  if (itemLabels[itemId]) {
    return t(itemLabels[itemId]);
  }

  const fish = fishData.find((entry) => entry.id === itemId);
  return fish ? t(fish.nameKey) : itemId;
}

export function getShopItemLabel(itemId) {
  const catalogItem = getItemById(itemId);
  if (catalogItem) {
    return getItemDisplayName(catalogItem, getLanguage());
  }

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

function componentDisplayName(componentId) {
  if (!componentId || componentId === 'none') {
    return t('componentNone');
  }

  const catalogItem = getItemById(componentId);
  return catalogItem
    ? getItemDisplayName(catalogItem, getLanguage())
    : t(componentLabels[componentId] ?? componentId);
}

function componentShortDescription(componentId) {
  if (!componentId || componentId === 'none') {
    return t(componentDescriptions.none);
  }

  const catalogItem = getItemById(componentId);
  return catalogItem
    ? getItemShortDescription(catalogItem, getLanguage())
    : t(componentDescriptions[componentId] ?? componentDescriptions.none);
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
      <img class="keepnet-entry__image" src="${assetPath(entry.selectedCardImage ?? resolveFishCatchCardImage(entry.fishId, entry))}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
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
        <span>${t(fish?.nameKey ?? trophy.fishId)} · ${trophy.weightGrams}g</span>
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
  const catalogItem = getItemById(itemId);
  if (catalogItem?.icon) {
    return assetPath(catalogItem.icon);
  }

  return itemImages[itemId] ? assetPath(itemImages[itemId]) : assetPath('/assets/items/tackle_components.png');
}

function itemVisualMarkup(itemId) {
  const isFish = fishData.some((fish) => fish.id === itemId);
  const image = isFish ? speciesImage(itemId) : itemImage(itemId);
  const fallback = isFish
    ? assetPath('/assets/fish/catch_result_frame.png')
    : assetPath('/assets/items/tackle_components.png');
  return `<img class="item-chip__icon" src="${image}" loading="lazy" decoding="async" onerror="this.src='${fallback}'" alt="" />`;
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

  return `<img class="item-chip__icon" src="${itemImage(componentImageIds[componentId] ?? componentId)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/items/tackle_components.png')}'" alt="" />`;
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
    ['tackle', t('marketCategoryTackle')],
    ['bait', t('marketCategoryBait')],
    ['other', t('marketCategoryOther')],
  ];
  const selectedCategory = state.ui?.marketBuyCategory ?? 'tackle';
  const items = getCatalogMarketItems().filter((item) => marketCategoryForItem(item) === selectedCategory);
  return `
    <div class="market-buy-category-tabs" role="tablist" aria-label="Категорії ринку">
      ${categories.map(([category, label]) => `
        <button class="market-buy-category-tab${selectedCategory === category ? ' is-selected' : ''}" data-action="market:buyCategory:${category}" type="button">${label}</button>
      `).join('')}
    </div>
    <div class="market-buy-categories">
      <section class="market-buy-category">
        <div class="market-card-grid market-card-grid--compact">
          ${items.map((item) => marketBuyCardMarkup(state, item)).join('')}
        </div>
      </section>
    </div>
  `;
}

function marketBuyCardMarkup(state, item) {
  const owned = item.type !== 'consumable' && state.purchased?.[item.id];
  const disabledReason = owned
    ? t('reasonAlreadyOwned')
    : state.money < item.price
      ? t('reasonNeedMoreCoins', { coins: item.price - state.money })
      : '';
  const activeModifiers = getActiveItemModifiers(state);
  const isActive = activeModifiers.activeItemIds.includes(item.id);
  const isExpanded = Boolean(state.ui?.expandedMarketItems?.[item.id]);
  return `
    <article class="market-card market-card--buy${isExpanded ? ' is-expanded' : ''}">
      <span class="market-card__image-wrap">
        ${itemIconMarkup(item, { className: 'market-card__image' })}
        ${item.amount && item.amount > 1 ? `<span class="market-card__qty-badge">×${item.amount}</span>` : ''}
      </span>
      <div class="market-card__content">
        ${renderItemCompactSummary(item, { bonusLimit: 2 })}
        <div class="market-card__meta">
          <strong>${owned ? t('owned') : formatItemPrice(item)}</strong>
          ${isActive ? '<span class="market-card__status">Активно</span>' : ''}
        </div>
      </div>
      <div class="market-card__actions">
        <button class="market-card__details-toggle" data-action="market:details:${item.id}" type="button" aria-expanded="${isExpanded}">
          <span aria-hidden="true">${isExpanded ? '-' : '+'}</span>
          <span class="sr-only">${isExpanded ? 'Collapse details' : 'Show details'}</span>
        </button>
        <button class="market-card__buy-button" data-action="buy:${item.id}" type="button"${owned || state.money < item.price ? ' disabled' : ''}>${owned ? t('owned') : t('buy')}</button>
      </div>
      ${isExpanded ? renderItemDetails(item) : ''}
      ${marketReasonMarkup(disabledReason)}
    </article>
  `;
}

function marketCategoryForItem(item) {
  if (['bait', 'groundbait'].includes(item.category)) {
    return 'bait';
  }
  if (['rod', 'line', 'hook', 'float', 'tackle'].includes(item.category)) {
    return 'tackle';
  }
  return 'other';
}

function marketPricesMarkup(state) {
  return `
    <p class="market-forecast">${t('tomorrowForecast')}</p>
    <div class="market-price-grid">
      ${fishData.map((fish) => {
        const price = getMarketPriceInfo(state, fish.id);
        return `
          <article class="market-price-card trend-${price.trend}">
            <img src="${speciesImage(fish.id)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
            <span>${t(fish.nameKey)}</span>
            <strong>${trendArrow(price.trend)} ${price.currentPrice} ${t('uahPerKg')}</strong>
            <small>${price.multiplier.toFixed(2)}x · ${t(trendKey(price.trend))}</small>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

export function leaderboardMarkup(state) {
  const leaderboardState = state.ui?.leaderboards ?? {};
  const type = normalizeLeaderboardType(leaderboardState.type ?? 'biggest-fish');
  const source = leaderboardState.source ?? 'local-fallback';
  const shouldUseLocalFallback = source === 'local-fallback';
  const rawRecords = leaderboardState.records?.length
    ? leaderboardState.records
    : shouldUseLocalFallback
      ? getLocalLeaderboard(type, state)
      : [];
  const filteredRecords = filterLeaderboardRecords(rawRecords, type, state);
  const displayRecords = filteredRecords.length
    ? filteredRecords
    : shouldUseLocalFallback
      ? getLocalLeaderboard(type, state)
      : [];
  const records = normalizeLeaderboardRecords(displayRecords, type, state);
  const busy = Boolean(leaderboardState.busy);
  const fallbackMessage = leaderboardState.message
    ? ` ${escapeHtml(leaderboardState.message)}`
    : '';
  const isServerSource = source === 'server' || source === 'server-empty' || String(source).startsWith('server');
  const statusTitle = shouldUseLocalFallback
    ? '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044f'
    : source === 'server-empty'
      ? '\u0413\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044f \u043f\u043e\u0440\u043e\u0436\u043d\u044f'
      : '\u0413\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044f';
  const statusNote = busy
    ? '\u041e\u043d\u043e\u0432\u043b\u044e\u0454\u043c\u043e \u0441\u043f\u0438\u0441\u043e\u043a...'
    : isServerSource
      ? '\u0414\u0430\u043d\u0456 \u0437 \u0445\u043c\u0430\u0440\u043d\u0438\u0445 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u044c \u0433\u0440\u0430\u0432\u0446\u0456\u0432.'
      : `\u0421\u0435\u0440\u0432\u0435\u0440 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0438\u0439. \u041f\u043e\u043a\u0430\u0437\u0443\u0454\u043c\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0456 \u0440\u0435\u043a\u043e\u0440\u0434\u0438.${fallbackMessage}`;
  const tabs = [
    ['biggest-fish', 'Найбільша риба'],
    ['monthly-trophies', 'Трофеї за 30 днів'],
  ];

  return `
    <section class="leaderboard-panel">
      <div class="leaderboard-tabs" role="tablist" aria-label="Лідери">
        ${tabs.map(([tabId, label]) => `
          <button class="${type === tabId ? 'is-selected' : ''}" data-action="leaderboard:type:${tabId}" type="button">${label}</button>
        `).join('')}
      </div>
      <div class="leaderboard-status">
        <div>
          <strong>${statusTitle}</strong>
          <small>${statusNote}</small>
        </div>
        <button data-action="leaderboard:refresh" type="button"${busy ? ' disabled' : ''}>Оновити таблицю лідерів</button>
      </div>
      <div class="leaderboard-list">
        ${records.length
          ? type === 'monthly-trophies'
            ? monthlyTrophyLeaderboardMarkup(records, state)
            : records.map((record, index) => leaderboardRecordMarkup(record, index)).join('')
          : leaderboardEmptyMarkup(type)}
      </div>
      ${publicProfileModalMarkup(state)}
    </section>
  `;
}

function leaderboardEmptyMarkup(type = 'biggest-fish') {
  return `
    <article class="leaderboard-empty">
      <strong>Таблиця ще порожня</strong>
      <span>${type === 'monthly-trophies'
        ? 'Злови трофеї цього місяця і збережи прогрес у хмару.'
        : 'Злови велику рибу і збережи прогрес у хмару, щоб потрапити в таблицю.'}</span>
    </article>
  `;
}

function monthlyTrophyLeaderboardMarkup(records, state) {
  const expanded = state.ui?.expandedLeaderboardSpecies ?? {};
  const groups = groupLeaderboardRecordsByFish(records);
  return groups.map((group) => {
    const isOpen = Boolean(expanded[group.fishId]);
    return `
      <article class="leaderboard-species-group${isOpen ? ' is-open' : ''}">
        <button class="leaderboard-species-group__head" data-action="leaderboard:toggleSpecies:${group.fishId}" type="button" aria-expanded="${isOpen}">
          <span>${t(fishData.find((fish) => fish.id === group.fishId)?.nameKey ?? group.fishId)}</span>
          <strong>${group.totalTrophies} троф.</strong>
          <small>${isOpen ? 'Сховати' : 'Показати'} гравців</small>
        </button>
        ${isOpen ? `<div class="leaderboard-species-group__rows">
          ${group.records.map((record) => leaderboardRecordMarkup(record, record.originalIndex, { trophyMode: true })).join('')}
        </div>` : ''}
      </article>
    `;
  }).join('') || leaderboardEmptyMarkup('monthly-trophies');
}

function leaderboardRecordMarkup(record, index, options = {}) {
  const fishId = record.fishId ?? null;
  const fishName = fishId ? t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? record.fishName ?? fishId) : '';
  const title = escapeHtml(record.displayName ?? record.playerName ?? 'Гість');
  const location = readableLocationName(record.locationId, record.locationName);
  const bait = readableBaitName(record.baitId, record.baitName);
  const depth = readableDepthName(record.depth, record.depthName);
  const castSpot = readableCastSpotName(record.catchSpotId, record.castSpotName);
  const tackle = readableTackleName(record.tackleSummary ?? record.tackleId ?? record.method, record.tackleName);
  const date = readableDateText(record.caughtAt ?? record.caughtAtDay);
  const sourceLabel = record.verified || record.serverBacked || String(record.source ?? '').startsWith('server') ? 'сервер' : 'локально';
  const trophyCount = Number(record.trophyCount ?? record.trophies ?? 0);
  const detail = options.trophyMode
    ? `${trophyCount} троф. · ${record.bestTrophyWeightKg ? `${formatKg(record.bestTrophyWeightKg)} кг` : 'без ваги'}`
    : `${fishName ? `${fishName} · ` : ''}${formatKg(record.weightKg ?? Number(record.weightGrams ?? 0) / 1000)} кг · ${location}`;
  const meta = [
    bait,
    depth,
    castSpot,
    date,
    tackle,
    record.level ? `рівень ${record.level}` : '',
    record.totalFishCaught ? `${record.totalFishCaught} риб` : '',
    sourceLabel,
  ].filter(Boolean).join(' · ');

  return `
    <article class="leaderboard-record${record.localPlayer ? ' is-local' : ''}">
      <span class="leaderboard-record__rank">#${record.rank ?? index + 1}</span>
      <button class="leaderboard-record__avatar" data-action="leaderboard:profile:${index}" type="button" aria-label="Публічний профіль ${title}">
        <img src="${leaderboardAvatarSrc(record)}" onerror="this.src='${assetPath(profileAvatars[0])}'" alt="" />
      </button>
      <div class="leaderboard-record__body">
        <button class="leaderboard-record__profile-link" data-action="leaderboard:profile:${index}" type="button">${title}</button>
        <button class="leaderboard-record__profile-link leaderboard-record__profile-link--detail" data-action="leaderboard:profile:${index}" type="button">${detail}</button>
        <small>${escapeHtml(meta)}</small>
      </div>
    </article>
  `;
}

function normalizeLeaderboardRecords(records, type, state) {
  const localIdentity = {
    avatar: state.playerProfile?.avatar,
    avatarId: state.playerProfile?.avatarId ?? state.playerProfile?.avatar,
    avatarType: state.playerProfile?.avatarType,
    customAvatarDataUrl: state.playerProfile?.customAvatarDataUrl,
  };

  return records.map((record, index) => ({
    ...record,
    rank: record.rank ?? index + 1,
    displayName: record.displayName ?? record.playerName ?? state.playerProfile?.name ?? 'Гість',
    playerName: record.playerName ?? record.displayName ?? state.playerProfile?.name ?? 'Гість',
    fishId: record.fishId ?? record.fishName ?? null,
    weightKg: record.weightKg ?? (record.weightGrams ? Number((record.weightGrams / 1000).toFixed(3)) : null),
    weightGrams: record.weightGrams ?? (record.weightKg ? Math.round(Number(record.weightKg) * 1000) : null),
    trophyCount: record.trophyCount ?? record.trophies ?? 0,
    topTrophies: Array.isArray(record.topTrophies) ? record.topTrophies.slice(0, 10) : [],
    recentCatches: Array.isArray(record.recentCatches) ? record.recentCatches.slice(0, 5) : [],
    avatar: record.avatar ?? (record.localPlayer ? localIdentity.avatar : profileAvatars[0]),
    avatarId: record.avatarId ?? (record.localPlayer ? localIdentity.avatarId : profileAvatars[0]),
    avatarType: record.avatarType ?? (record.localPlayer ? localIdentity.avatarType : 'preset'),
    customAvatarDataUrl: record.customAvatarDataUrl ?? (record.localPlayer ? localIdentity.customAvatarDataUrl : null),
    boardType: type,
  }));
}

function groupLeaderboardRecordsByFish(records) {
  const groups = new Map();
  records
    .filter((record) => record.fishId)
    .forEach((record, originalIndex) => {
      const group = groups.get(record.fishId) ?? {
        fishId: record.fishId,
        totalTrophies: 0,
        bestWeight: 0,
        records: [],
      };
      group.totalTrophies += Number(record.trophyCount ?? record.trophies ?? 0);
      group.bestWeight = Math.max(group.bestWeight, Number(record.bestTrophyWeightGrams ?? record.weightGrams ?? 0));
      group.records.push({ ...record, originalIndex });
      groups.set(record.fishId, group);
    });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      records: group.records
        .sort((a, b) => Number(b.bestTrophyWeightGrams ?? b.weightGrams ?? 0) - Number(a.bestTrophyWeightGrams ?? a.weightGrams ?? 0))
        .slice(0, 10),
    }))
    .sort((a, b) => b.totalTrophies - a.totalTrophies || b.bestWeight - a.bestWeight);
}

function publicProfileModalMarkup(state) {
  const record = state.ui?.publicProfile?.record ?? state.ui?.publicProfileRecord;
  if (!record) {
    return '';
  }

  const safeRecord = normalizeLeaderboardRecords([record], 'public-profile', state)[0];
  const notableCatches = publicProfileNotableCatches(safeRecord);
  return `
    <section class="public-profile-modal" role="dialog" aria-modal="true" aria-label="Публічний профіль">
      <button class="public-profile-modal__backdrop" data-action="leaderboard:profile:close" type="button" aria-label="${t('close')}"></button>
      <article class="public-profile-card">
        <button class="public-profile-card__close" data-action="leaderboard:profile:close" type="button" aria-label="${t('close')}">&times;</button>
        <img src="${leaderboardAvatarSrc(safeRecord)}" onerror="this.src='${assetPath(profileAvatars[0])}'" alt="" />
        <h3>${escapeHtml(safeRecord.displayName)}</h3>
        <dl>
          <div><dt>Рівень</dt><dd>${safeRecord.level ?? 1}</dd></div>
          <div><dt>Усього риб</dt><dd>${safeRecord.totalFishCaught ?? 0}</dd></div>
          <div><dt>Трофеї</dt><dd>${safeRecord.trophyCount ?? safeRecord.trophies ?? 0}</dd></div>
          <div><dt>Найбільша риба</dt><dd>${safeRecord.fishId ? `${t(fishData.find((fish) => fish.id === safeRecord.fishId)?.nameKey ?? safeRecord.fishId)} · ${formatKg(safeRecord.weightKg ?? Number(safeRecord.weightGrams ?? 0) / 1000)} кг` : 'Немає даних'}</dd></div>
        </dl>
        <div class="public-profile-card__catches">
          <strong>Помітні улови</strong>
          ${notableCatches.length
            ? `<ul>${notableCatches.map((entry) => `<li>${entry}</li>`).join('')}</ul>`
            : '<span>Немає даних про останні улови.</span>'}
        </div>
      </article>
    </section>
  `;
}

function publicProfileNotableCatches(record) {
  const fromTrophies = (record.topTrophies ?? []).map((entry) => {
    const fishId = entry.fishId ?? record.fishId;
    return `${t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId)} · ${formatKg(Number(entry.weightGrams ?? 0) / 1000)} кг`;
  });
  const fromRecent = (record.recentCatches ?? []).map((entry) => {
    const fishId = entry.fishId ?? record.fishId;
    return `${t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId)} · ${formatKg(entry.weightKg ?? Number(entry.weightGrams ?? 0) / 1000)} кг`;
  });
  if (fromTrophies.length || fromRecent.length) {
    return [...fromTrophies, ...fromRecent].slice(0, 5);
  }
  if (record.fishId && (record.weightKg || record.weightGrams)) {
    return [`${t(fishData.find((fish) => fish.id === record.fishId)?.nameKey ?? record.fishId)} · ${formatKg(record.weightKg ?? Number(record.weightGrams ?? 0) / 1000)} кг`];
  }
  return [];
}

function leaderboardAvatarSrc(record) {
  if (record.avatarType === 'custom' && String(record.customAvatarDataUrl ?? '').startsWith('data:image/')) {
    return record.customAvatarDataUrl;
  }
  return assetPath(record.avatarId ?? record.avatar ?? profileAvatars[0]);
}

function readableLocationName(locationId, fallback) {
  const water = getFishingLocation(locationId) ?? waterGuide.find((entry) => entry.id === locationId);
  const name = water?.nameKey ? t(water.nameKey) : fallback;
  return isTechnicalLabel(name) ? 'Всі водойми' : escapeHtml(name ?? 'Всі водойми');
}

function readableBaitName(baitId, fallback) {
  if (baitId) {
    const baitLabels = {
      live_bait: 'Живець',
      small_worms: t('itemSmallWorms'),
      worms: t('itemWorms'),
      nightcrawler: t('itemNightcrawler'),
      larvae: t('itemLarvae'),
    };
    if (baitLabels[baitId]) {
      return baitLabels[baitId];
    }
    return getItemDisplayName(baitId, getLanguage());
  }
  return isTechnicalLabel(fallback) ? 'Без наживки' : escapeHtml(fallback ?? 'Без наживки');
}

function readableDepthName(depthId, fallback) {
  if (depthId) {
    return t(`depth${toPascalCase(depthId)}`);
  }
  return isTechnicalLabel(fallback) ? '' : escapeHtml(fallback ?? '');
}

function readableCastSpotName(castSpotId, fallback) {
  if (castSpotId) {
    return t(getCastSpot(castSpotId).labelKey);
  }
  return isTechnicalLabel(fallback) ? '' : escapeHtml(fallback ?? '');
}

function readableTackleName(tackleId, fallback) {
  if (tackleId && !isTechnicalLabel(tackleId)) {
    return escapeHtml(tackleId);
  }
  const labels = {
    handline: 'Ручна снасть',
    stickRod: 'Палиця-вудка',
    liveBait: 'Живцева снасть',
    simple_stick_rod: 'Палиця-вудка',
    properRod: t('componentProperRod'),
    betterLine: t('itemBetterLine'),
  };
  if (tackleId && labels[tackleId]) {
    return labels[tackleId];
  }
  return isTechnicalLabel(fallback) ? '' : escapeHtml(fallback ?? '');
}

function readableDateText(value) {
  if (!value) {
    return 'Локально';
  }
  if (typeof value === 'number') {
    return `День ${value}`;
  }
  return isTechnicalLabel(value) ? 'Не вказано' : escapeHtml(value);
}

function formatKg(value) {
  return Number(value ?? 0).toFixed(2);
}

function isTechnicalLabel(value) {
  if (!value) {
    return false;
  }
  return /^[a-z0-9_:-]+$/i.test(String(value));
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
        <small>${price.currentPrice} ${t('uahPerKg')} · ${entry.catchSpotId ? t(getCastSpot(entry.catchSpotId).labelKey) : t('unknownSpot')}</small>
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

function guideWaterDashboardMarkup(state) {
  const waterId = currentGuideWaterId(state);
  const water = waterGuide.find((entry) => entry.id === waterId) ?? waterGuide[0];
  return `
    <section class="guide-dashboard" aria-label="Довідник водойми">
      <div class="guide-water-picker">
        ${waterGuide.map((entry) => `
          <button class="${entry.id === water.id ? 'is-selected' : ''}" data-action="guide:water:${entry.id}" type="button">
            ${t(entry.nameKey)}
          </button>
        `).join('')}
      </div>
      <div class="guide-dashboard__current">
        <img src="${assetPath(waterImages[water.id] ?? '/assets/locations/pond_location_concept.png')}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/locations/pond_location_concept.png')}'" alt="" />
        <div>
          <strong>${t(water.nameKey)}</strong>
          <p>${t(water.descriptionKey)}</p>
          <dl class="guide-water-facts">
            <div><dt>${t('bestTime')}</dt><dd>${t(water.bestTimeKey)}</dd></div>
            <div><dt>${t('preferredBait')}</dt><dd>${t(water.baitKey)}</dd></div>
            <div><dt>${t('tackle')}</dt><dd>${t(water.tackleKey)}</dd></div>
          </dl>
          ${waterSpotChipsMarkup(water.id)}
        </div>
      </div>
      ${guidePopulationBlockMarkup(water.id)}
      ${guideSpotMatrixBlockMarkup(water.id)}
      <div class="guide-dashboard__notes">
        <span>10+ відкриває шанс на трофей у цій водоймі.</span>
        <span>Для рідкісних видів трофейний шанс може відкриватися з 5+.</span>
      </div>
    </section>
  `;
}

function currentGuideWaterId(state) {
  const candidates = [
    state.ui?.guideWaterId,
    state.ui?.activeScene,
    state.travel?.selectedWater,
  ];
  return candidates.find((waterId) => waterGuide.some((water) => water.id === waterId)) ?? 'canal';
}

function waterSpotChipsMarkup(waterId) {
  const spots = castSpots.filter((spot) => (spot.waterId ?? 'canal') === waterId);
  if (!spots.length) {
    return '';
  }
  return `
    <div class="guide-water-spots">
      <span>${t('castSpots')}</span>
      <div>
        ${spots.map((spot) => `<i>${spotIconLabel(spot)} ${t(spot.labelKey)}</i>`).join('')}
      </div>
    </div>
  `;
}

function guidePopulationBlockMarkup(waterId) {
  const population = getWaterFishPopulation(waterId);
  const fishIdsForWater = getWaterFishIds(waterId).filter((fishId) => Number(population[fishId] ?? 0) > 0);
  const rows = fishIdsForWater
    .sort((a, b) => Number(population[b] ?? 0) - Number(population[a] ?? 0))
    .map((fishId) => {
      const fish = fishData.find((entry) => entry.id === fishId);
      const value = Math.max(0, Math.min(60, Number(population[fishId] ?? 0)));
      const percent = Math.round(Math.min(100, (value / 30) * 100));
      const threshold = getTrophyPopulationThreshold(fishId);
      const trophy = value >= threshold;
      return `
        <div class="guide-population-chart__row" style="--fish-color:${fishColor(fishId)}; --population-width:${percent}%;">
          <img src="${speciesImage(fishId)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
          <span>${t(fish?.nameKey ?? fishId)}</span>
          <div class="guide-population-chart__bar"><i></i></div>
          <strong>${value}/30${trophy ? ` · ${threshold}+` : ''}</strong>
        </div>
      `;
    })
    .join('');

  return `
    <article class="guide-dashboard-block guide-dashboard-block--population">
      <header>
        <div>
          <p class="section-label">Популяція риб</p>
          <h3>${t(waterGuide.find((water) => water.id === waterId)?.nameKey ?? 'waters')}</h3>
        </div>
      </header>
      <div class="guide-population-chart">
        ${rows || `<p>${t('none')}</p>`}
      </div>
      <div class="guide-population-legend" aria-label="Рівні популяції">
        ${['Дуже висока', 'Висока', 'Середня', 'Низька', 'Дуже низька'].map((label) => `<span>${label}</span>`).join('')}
      </div>
    </article>
  `;
}

function guideSpotMatrixBlockMarkup(waterId) {
  const spots = castSpots.filter((spot) => (spot.waterId ?? 'canal') === waterId);
  const fishIdsForWater = getWaterFishIds(waterId);
  const maxWeight = Math.max(
    0.01,
    ...spots.flatMap((spot) => fishIdsForWater.map((fishId) => Number(spot.weights?.[fishId] ?? 0))),
  );
  const gridStyle = `--matrix-columns: repeat(${fishIdsForWater.length}, minmax(34px, 38px));`;
  return `
    <article class="guide-dashboard-block guide-dashboard-block--spots">
      <header>
        <div>
          <p class="section-label">Місця закиду</p>
          <h3>Де шукати рибу</h3>
        </div>
      </header>
      <div class="guide-spot-matrix" style="${gridStyle}">
        <div class="guide-spot-matrix__scroller">
          <div class="guide-spot-matrix__head">
            <span></span>
            ${fishIdsForWater.map((fishId) => `
              <div class="guide-spot-matrix__fish" title="${escapeHtml(t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId))}" style="--fish-color:${fishColor(fishId)};">
                <img src="${speciesImage(fishId)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
              </div>
            `).join('')}
          </div>
          ${spots.map((spot) => `
            <div class="guide-spot-matrix__row">
              <strong><span>${spotIconLabel(spot)}</span>${t(spot.labelKey)}</strong>
              ${fishIdsForWater.map((fishId) => {
                const ratio = Number(spot.weights?.[fishId] ?? 0) / maxWeight;
                const level = suitabilityLevel(ratio);
                return `<span class="guide-spot-dot guide-spot-dot--${level}" style="--fish-color:${fishColor(fishId)};" title="${escapeHtml(t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId))} · ${escapeHtml(t(spot.labelKey))}"></span>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="guide-dot-legend">
        <span><i class="guide-spot-dot guide-spot-dot--very-high"></i>дуже висока</span>
        <span><i class="guide-spot-dot guide-spot-dot--high"></i>висока</span>
        <span><i class="guide-spot-dot guide-spot-dot--medium"></i>середня</span>
        <span><i class="guide-spot-dot guide-spot-dot--low"></i>низька</span>
        <span><i class="guide-spot-dot guide-spot-dot--very-low"></i>дуже низька</span>
      </div>
    </article>
  `;
}

function fishColor(fishId) {
  return guideFishColors[fishId] ?? '#9fd2c1';
}

function suitabilityLevel(ratio) {
  if (ratio >= 0.78) return 'very-high';
  if (ratio >= 0.58) return 'high';
  if (ratio >= 0.36) return 'medium';
  if (ratio >= 0.16) return 'low';
  return ratio > 0 ? 'very-low' : 'empty';
}

function spotIconLabel(spot) {
  if (/dam/i.test(spot.id)) return 'Д';
  if (/reed/i.test(spot.id)) return 'О';
  if (/lil|lily/i.test(spot.id)) return 'Л';
  if (/shadow|branch/i.test(spot.id)) return 'Г';
  if (/weed|shallow/i.test(spot.id)) return 'Т';
  if (/mud|middle|drop|shelf/i.test(spot.id)) return 'З';
  if (/stone|pit|wall/i.test(spot.id)) return 'К';
  return '•';
}

function fishGuideAccordionMarkup(state) {
  const journal = state.catchJournal ?? {};
  const expanded = state.ui?.expandedGuideCards ?? {};
  return getFishGuideEntries().map((entry) => {
    const isOpen = expanded[`fish:${entry.fishId}`];
    const discovered = Boolean(journal[entry.fishId]?.discovered);
    return `
      <article class="guide-card guide-card--accordion guide-card--fish${isOpen ? ' is-open' : ''}">
        <button class="guide-card__summary" data-action="guide:toggle:fish:${entry.fishId}" type="button">
          <img src="${guideSpeciesImage(entry.fishId)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
          <span>
            <h3>${t(entry.nameKey)}${discovered ? '' : ` - ${t('undiscoveredFish')}`}</h3>
            <small>${t(entry.livesKey)}</small>
            <small>${t('recommendedDepths')}: ${depthPreferenceMarkup(entry.fishId)}</small>
          </span>
          <strong class="guide-card__expand">${isOpen ? '-' : '+'}</strong>
        </button>
        ${isOpen ? fishGuideDetailMarkup(entry, discovered) : ''}
      </article>
    `;
  }).join('');
}

function fishGuideDetailMarkup(entry, discovered) {
  const fish = fishData.find((item) => item.id === entry.fishId);
  const status = discovered ? t(fish?.rarityKey ?? 'known') : t('undiscoveredFish');
  return `
    <div class="guide-card__body guide-fish-detail">
      <div class="guide-fish-detail__hero">
        <img src="${guideSpeciesImage(entry.fishId)}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
        <div>
          <h4>${t(entry.nameKey)}</h4>
          <span>${status}</span>
          <p>${t(entry.descriptionKey)}</p>
        </div>
      </div>
      <div class="guide-fish-detail__grid">
        ${guideInfoBlockMarkup('whereItLives', [
          guideChipGroupMarkup(fishWaterChips(entry.fishId), 'guide-chip--water'),
          fishRealCastSpotMarkup(entry.fishId),
          canadianCatfishAliasMarkup(entry.fishId),
        ].join(''))}
        ${guideInfoBlockMarkup('bestTime', guideChipGroupMarkup(timeChips(entry.timeKey), 'guide-chip--time'))}
        ${guideInfoBlockMarkup('preferredBait', guideBaitChipsMarkup(entry.fishId, true))}
        ${guideInfoBlockMarkup('weakerBaits', guideBaitChipsMarkup(entry.fishId, false))}
        ${guideInfoBlockMarkup('trophyThresholds', thresholdRowsMarkup(entry.fishId), 'guide-fish-detail__block--trophies')}
        ${guideInfoBlockMarkup('recommendedDepths', depthPreferenceDetailMarkup(entry.fishId))}
      </div>
    </div>
  `;
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
          <img src="${assetPath(waterImages[water.id] ?? '/assets/locations/pond_location_concept.png')}" loading="lazy" decoding="async" onerror="this.src='${assetPath('/assets/locations/pond_location_concept.png')}'" alt="" />
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
            <div><dt>Популяція</dt><dd>${waterPopulationHistogramMarkup(water.id)}</dd></div>
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
  const catalogCards = guideCatalogCardsMarkup(tab, expanded);
  if (catalogCards) {
    return catalogCards;
  }

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

function guideCatalogCardsMarkup(tab, expanded) {
  const items = getCatalogMarketItems()
    .filter((item) => {
      if (tab === 'baits') {
        return ['bait', 'groundbait'].includes(item.category);
      }
      if (tab === 'tackle') {
        return ['rod', 'line', 'hook', 'float', 'tackle'].includes(item.category);
      }
      if (tab === 'processing') {
        return item.tags?.some((tag) => ['processing', 'taranka', 'market'].includes(tag)) || ['salt'].includes(item.id);
      }
      return false;
    })
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  if (!items.length) {
    return '';
  }

  const locale = getLanguage();
  return items.map((item) => {
    const key = `${tab}:catalog:${item.id}`;
    const isOpen = Boolean(expanded[key]);
    return `
      <article class="guide-card guide-card--accordion guide-card--catalog${isOpen ? ' is-open' : ''}">
        <button class="guide-card__summary" data-action="guide:toggle:${key}" type="button">
          ${itemIconMarkup(item)}
          <span>
            <h3>${escapeHtml(getItemDisplayName(item, locale))}</h3>
            <small>${escapeHtml(getCatalogCategoryLabel(item.category, locale))} · ${escapeHtml(getItemShortDescription(item, locale))}</small>
          </span>
          <strong class="guide-card__expand">${isOpen ? '-' : '+'}</strong>
        </button>
        ${isOpen ? `<div class="guide-card__body guide-card__body--catalog">
          <p>${escapeHtml(getItemFullDescription(item, locale))}</p>
          ${renderItemDetails(item)}
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

function guideInfoBlockMarkup(titleKey, body, extraClass = '') {
  return `
    <section class="guide-fish-detail__block ${extraClass}">
      <h5>${t(titleKey)}</h5>
      ${body}
    </section>
  `;
}

function guideChipGroupMarkup(items, className = '') {
  const chips = items.filter(Boolean).map((item) => `<span class="guide-chip ${className}">${item}</span>`).join('');
  return chips ? `<div class="guide-chip-list">${chips}</div>` : `<p>${t('none')}</p>`;
}

function fishWaterChips(fishId) {
  return waterGuide
    .filter((water) => water.fishIds.includes(fishId))
    .map((water) => t(water.nameKey));
}

function fishRealCastSpotMarkup(fishId) {
  const rows = waterGuide
    .map((water) => {
      const population = getWaterPopulationIndex(water.id, fishId);
      if (population <= 0) {
        return '';
      }

      const zones = castSpots
        .filter((spot) => (spot.waterId ?? 'canal') === water.id && Number(spot.weights?.[fishId] ?? 0) > 0)
        .sort((a, b) => Number(b.weights?.[fishId] ?? 0) - Number(a.weights?.[fishId] ?? 0))
        .slice(0, 3)
        .map((spot) => `<span class="guide-chip guide-chip--spot">${castZoneLabel(spot.id)}</span>`)
        .join('');
      const fish = fishData.find((entry) => entry.id === fishId);
      const trophyText = canCatchTrophyInWater(water.id, fishId)
        ? `10+ · ${t('catchCategoryTrophy')}`
        : `<${TROPHY_POPULATION_THRESHOLD} · без трофеїв`;
      const depth = fish?.depthPreference ? t(`depth${toPascalCase(fish.depthPreference === 'any' ? 'middle' : fish.depthPreference)}`) : t('depthMiddle');

      return `
        <div class="guide-real-spot-row">
          <strong>${escapeHtml(t(water.nameKey))}</strong>
          <div class="guide-chip-list">
            ${zones || `<span class="guide-chip guide-chip--spot">${t('castingSpots')}</span>`}
            <span class="guide-chip guide-chip--depth">${depth}</span>
            <span class="guide-chip guide-chip--population">${population}/30 · ${trophyText}</span>
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  return rows
    ? `<div class="guide-real-spot-list">${rows}</div>`
    : `<p>${t('guideSeeWaterCastSpots')}</p>`;
}

function castZoneLabel(spotId) {
  if (/near|shore|bank|edge|reeds/i.test(spotId)) {
    return 'Ближня вода';
  }
  if (/mid|center|channel/i.test(spotId)) {
    return 'Середина';
  }
  if (/reeds|deep|far|lily/i.test(spotId)) {
    return 'Очерет / край';
  }
  return 'Середина';
}

function waterPopulationHistogramMarkup(waterId) {
  const population = getWaterFishPopulation(waterId);
  const rows = Object.entries(population)
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([fishId, value]) => {
      const fish = fishData.find((entry) => entry.id === fishId);
      const safeValue = Math.max(0, Math.min(30, Number(value)));
      const trophy = safeValue >= TROPHY_POPULATION_THRESHOLD;
      return `
        <div class="guide-population__row${trophy ? ' can-trophy' : ''}">
          <span>${t(fish?.nameKey ?? fishId)}</span>
          <div><i style="--population-width:${Math.round((safeValue / 30) * 100)}%"></i></div>
          <em>${safeValue}${trophy ? ' · 10+' : ''}</em>
          <strong>${trophy ? '*' : ''}</strong>
        </div>
      `;
    })
    .join('');

  return rows
    ? `<div class="guide-population" aria-label="Популяція риби" style="--trophy-threshold:${Math.round((TROPHY_POPULATION_THRESHOLD / 30) * 100)}%">
        <div class="guide-population__rule"><span></span><strong>10+</strong><em>трофей</em></div>
        ${rows}
        <small>10+ відкриває шанс на трофей у цій водоймі.</small>
      </div>`
    : t('none');
}
function canadianCatfishAliasMarkup(fishId) {
  if (fishId !== 'canadian_catfish') {
    return '';
  }

  return `<p class="guide-alias-note">${t('guideCanadianCatfishAlias')}</p>`;
}

function castSpotFishGroups(spot) {
  const sorted = Object.entries(spot.weights ?? {})
    .filter(([, weight]) => Number(weight) > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxWeight = Number(sorted[0]?.[1] ?? 0);
  const used = new Set();
  const special = sorted
    .filter(([fishId, weight]) => (
      specialGuideFishIds.includes(fishId)
      || Number(weight) <= maxWeight * 0.42
    ))
    .map(([fishId]) => fishId);
  const predators = special.filter((fishId) => predatorGuideFishIds.includes(fishId));
  const rare = special.filter((fishId) => !predatorGuideFishIds.includes(fishId));
  const main = sorted
    .map(([fishId]) => fishId)
    .filter((fishId) => !special.includes(fishId))
    .slice(0, 5);

  const groups = [
    ['guideCastMainFish', main],
    ['guideCastRareFish', rare],
    ['guideCastPredatorFish', predators],
  ].map(([labelKey, fishIds]) => {
    const uniqueFishIds = fishIds.filter((fishId) => {
      if (used.has(fishId)) {
        return false;
      }
      used.add(fishId);
      return true;
    });
    return uniqueFishIds.length ? [labelKey, uniqueFishIds] : null;
  }).filter(Boolean);

  const missing = sorted
    .map(([fishId]) => fishId)
    .filter((fishId) => !used.has(fishId))
    .slice(0, 4);
  if (missing.length) {
    groups.push(['guideCastOtherFish', missing]);
  }

  return groups;
}

function habitatChips(livesKey) {
  const text = t(livesKey).replace(/[.!?]+$/g, '');
  return text
    .split(/,|\s[С–iР№]\s/iu)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function timeChips(timeKey) {
  const text = t(timeKey).toLowerCase();
  const chips = [];
  if (/(morning|СЂР°РЅРѕРє|Р·СЂР°РЅРєСѓ|СЃРІС–С‚Р°РЅ)/iu.test(text)) chips.push(t('timePhaseMorning'));
  if (/(day|РґРµРЅСЊ|РІРґРµРЅСЊ)/iu.test(text)) chips.push(t('timePhaseDay'));
  if (/(evening|РІРµС‡С–СЂ|РІРІРµС‡РµСЂС–|РІРµС‡РѕСЂ)/iu.test(text)) chips.push(t('timePhaseEvening'));
  if (/(night|РЅС–С‡|РІРЅРѕС‡С–)/iu.test(text)) chips.push(t('timePhaseNight'));
  return chips.length ? [...new Set(chips)] : [t(timeKey)];
}

function guideBaitChipsMarkup(fishId, favoritesOnly) {
  const favorites = new Set(biteProfiles[fishId]?.preferred?.baits ?? []);
  const predator = ['pike', 'sudak', 'som', 'eel'].includes(fishId);
  const baitIds = favoritesOnly
    ? [...favorites]
    : ['worms', 'larvae', 'bread', 'dough', 'mastyrka', 'corn', 'nightcrawler', 'live_bait']
      .filter((bait) => !favorites.has(bait))
      .filter((bait) => !predator || ['worms', 'nightcrawler', 'live_bait'].includes(bait))
      .slice(0, 4);

  if (!baitIds.length) {
    return `<p>${t('none')}</p>`;
  }

  return `
    <div class="guide-bait-list">
      ${baitIds.map((bait) => `
        <span class="guide-bait-chip">
          ${itemVisualMarkup(baitItemId(bait))}
          <span>${t(`bait${toPascalCase(bait)}`)}</span>
        </span>
      `).join('')}
    </div>
  `;
}

function baitItemId(bait) {
  return {
    live_bait: 'rotan',
    nightcrawler: 'nightcrawler',
    small_worms: 'smallWorms',
  }[bait] ?? bait;
}

function depthPreferenceDetailMarkup(fishId) {
  const preference = fishData.find((entry) => entry.id === fishId)?.depthPreference ?? 'middle';
  const preferred = preference === 'any' ? new Set(['surface', 'middle', 'bottom']) : new Set([preference]);
  const rows = ['surface', 'middle', 'bottom'].map((depth) => {
    const label = t(`depth${toPascalCase(depth)}`);
    const note = depthGuideNoteForFish(fishId, depth, preferred.has(depth));
    return `<li class="${preferred.has(depth) ? 'is-preferred' : ''}"><strong>${label}</strong><span>${note}</span></li>`;
  }).join('');
  return `<ul class="guide-depth-list">${rows}</ul>`;
}

function depthNoteForFish(fishId, depth, preferred) {
  if (fishId === 'crucian') {
    return {
      surface: `${t('catchCategorySmall')}`,
      middle: `${t('catchCategoryOrdinary')}`,
      bottom: `${t('catchCategoryTrophy')}`,
    }[depth];
  }

  if (preferred) {
    return getLanguage() === 'uk' ? 'найкраща глибина' : 'best depth';
  }

  return depth === 'surface' ? t('catchCategorySmall') : t('catchCategoryOrdinary');
}

function depthGuideNoteForFish(fishId, depth, preferred) {
  const fish = fishData.find((entry) => entry.id === fishId);
  const language = getLanguage();
  if (fishId === 'crucian') {
    return {
      surface: language === 'uk' ? 'дрібна риба, трофеїв немає' : 'small fish, no trophies',
      middle: language === 'uk' ? 'звичайний улов' : 'ordinary catch',
      bottom: language === 'uk' ? 'кращий шанс на трофей' : 'better trophy chance',
    }[depth];
  }

  if (depth === 'surface' && fish?.surfaceBite === false) {
    return language === 'uk' ? 'не клює біля поверхні' : 'does not bite near the surface';
  }

  if (preferred) {
    return language === 'uk' ? 'найкраща глибина' : 'best depth';
  }

  if (fish?.depthPreference === 'surface' && depth === 'bottom') {
    return language === 'uk' ? 'трофейний шанс нижчий' : 'lower trophy chance';
  }

  return language === 'uk' ? 'можна ловити, але шанс нижчий' : 'can bite, but chance is lower';
}
function thresholdRowsMarkup(fishId) {
  const profile = fishSizeProfiles[fishId];
  if (!profile) {
    return `<p>${t('none')}</p>`;
  }

  const unit = getLanguage() === 'uk' ? 'г' : 'g';
  const trophy2 = Math.round(profile.trophyWeight * 1.45);
  const rows = [
    ['★', t('trophyTierNormal'), `${profile.trophyWeight}-${trophy2 - 1} ${unit}`],
    ['★★', t('trophyTierVeryRare'), `${trophy2}-${profile.legendaryWeight - 1} ${unit}`],
    ['★★★', t('trophyTierRarest'), `${profile.legendaryWeight}+ ${unit}`],
  ];

  return `
    <div class="guide-threshold-table">
      ${rows.map(([stars, label, range]) => `
        <div>
          <strong>${stars}</strong>
          <span>${label}</span>
          <em>${range}</em>
        </div>
      `).join('')}
    </div>
  `;
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
  return `0 < ${profile.common[0]}g · ★ ${profile.trophyWeight}g · ★★ ${Math.round(profile.trophyWeight * 1.45)}g · ★★★ ${profile.legendaryWeight}g`;
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
    .map((spot) => {
      const groups = castSpotFishGroups(spot)
        .map(([labelKey, fishIds]) => `
          <div class="guide-cast-spot__group">
            <span>${t(labelKey)}</span>
            <div class="guide-chip-list">
              ${fishIds.map((fishId) => `<span class="guide-chip ${specialGuideFishIds.includes(fishId) ? 'guide-chip--rare' : ''}">${t(fishData.find((fish) => fish.id === fishId)?.nameKey ?? fishId)}</span>`).join('')}
            </div>
          </div>
        `)
        .join('');

      return `
        <article class="guide-cast-spot">
          <strong>${t(spot.labelKey)}</strong>
          ${groups}
        </article>
      `;
    });
  return spots.length ? `<div class="guide-cast-spot-list">${spots.join('')}</div>` : t('none');
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
