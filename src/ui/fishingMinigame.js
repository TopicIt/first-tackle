import './fishingMinigame.css';
import { getFishData } from '../game/fishData.js';
import { getAvailableBaits, getAvailableCastSpots, getFishingContextAction } from '../game/fishingMinigameLogic.js';
import { getCastSpot } from '../game/bitePatterns.js';
import { catchCategoryBadgeMarkup, catchJournalMarkup, keepnetMarkup } from './panels.js';
import { resolveFishCatchCardImage } from '../game/fishCardImages.js';
import { t } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import { getFishingLocation } from '../game/locations.js';
import { getLocationImage, getLocationImageFallback } from '../utils/locationAsset.js';

const castZoneKeys = {
  near_bank: 'castZoneNearBank',
  mid_water: 'castZoneMidWater',
  reed_edge: 'castZoneReedEdge',
};

const methodKeys = {
  handline: 'fishingMethodHandline',
  stickRod: 'fishingMethodStickRod',
  liveBait: 'fishingMethodLiveBait',
};

const fishingLineFallbackAnchors = {
  handline: { x: 24, y: 65 },
  stickRod: { x: 43, y: 42 },
  liveBait: { x: 43, y: 42 },
};

export function fishingMinigameMarkup(state) {
  const minigame = state.ui?.fishingMinigame;
  if (!minigame?.open) {
    return '';
  }

  const result = state.ui?.catchResult;
  const fish = result ? getFishData(result.id) : null;
  const collapsedPanels = state.ui?.collapsedPanels ?? {};
  const controlsCollapsed = collapsedPanels.fishingControls ? ' is-controls-collapsed' : '';
  const resultCollapsed = collapsedPanels.fishingResult ? ' is-result-collapsed' : '';
  const hintMode = state.settings?.fishing?.biteHints ?? 'subtle';
  const contextAction = getFishingContextAction(state);
  const floatStyle = state.tackle?.equipped?.float ?? 'none';
  const activeFishing = isActiveFishingPhase(minigame.phase);
  const waterImage = getFishingWaterImage(state);

  return `
    <section class="fishing-minigame" aria-label="${t('fishingTitle')}">
      <div class="fishing-minigame__backdrop">
        <img
          class="fishing-minigame__base"
          src="${waterImage.src}"
          onerror="this.onerror=null;this.src='${waterImage.fallback}'"
          alt=""
        />
      </div>

      <div class="fishing-minigame__shell">
        <header class="fishing-minigame__header">
          <div>
            <p class="section-label">${t('fishingTitle')}</p>
            <h2>${t(methodKeys[minigame.method])}</h2>
            <p class="fishing-minigame__status">${t(minigame.statusKey)}</p>
          </div>
          <div class="fishing-minigame__header-actions">
            <button class="fishing-minigame__map" data-action="minigame:menu" type="button">${t('backToMap')}</button>
            <button class="fishing-minigame__close" data-action="minigame:back" type="button" aria-label="${t('close')}" title="${t('close')}">&times;</button>
          </div>
        </header>

        <div class="fishing-minigame__layout${controlsCollapsed}${resultCollapsed}">
          <aside class="fishing-minigame__controls">
            <div class="fishing-minigame__panel-heading">
            <p class="section-label">${t('controls')}</p>
              <button class="panel-toggle" data-action="panel:toggle:fishingControls" type="button" aria-label="${panelToggleLabel(collapsedPanels.fishingControls)}">
                ${panelToggleIcon(collapsedPanels.fishingControls)}
              </button>
            </div>
            <div class="fishing-minigame__controls-body">
            <section class="fishing-panel fishing-panel__quick-nav">
              <button data-action="panel:toggle:tackle" type="button">${t('tackle')}</button>
              <button data-action="panel:toggle:keepnet" type="button">${t('keepnet')}</button>
              <button data-action="panel:toggle:quests" type="button">${t('activeQuests')}</button>
              <button data-action="panel:toggle:guide" type="button">${t('fishermanGuide')}</button>
            </section>

            <section class="fishing-panel">
              <p class="section-label">${t('chooseBait')}</p>
              <div class="bait-grid">
                ${getAvailableBaits(state).map((bait) => baitButtonMarkup(bait, minigame.selectedBait)).join('')}
              </div>
              <img class="fishing-panel__art" src="${assetPath('/assets/items/bait_types_clean.png')}" alt="" />
            </section>

            <section class="fishing-panel">
              <p class="section-label">${t('chooseDepth')}</p>
              <div class="depth-selector">
                ${['bottom', 'middle', 'surface'].map((depth) => depthButtonMarkup(depth, minigame.selectedDepth ?? 'middle')).join('')}
              </div>
            </section>

            <section class="fishing-panel">
              <p class="section-label">${t('chooseCastSpot')}</p>
              <div class="spot-list">
                ${getAvailableCastSpots(state, minigame.method).map((spot) => spotListButtonMarkup(spot, minigame.selectedSpot)).join('')}
              </div>
            </section>

            <section class="fishing-panel fishing-panel__actions">
              <button data-action="minigame:cast" type="button"${canCast(minigame) ? '' : ' disabled'}>${t('cast')}</button>
              ${canStrike(minigame)
                ? `<button class="${strikeButtonClass(minigame, hintMode)}" data-action="minigame:strike" type="button">${t(minigame.phase === 'strike_window' ? 'strikeNow' : 'strike')}</button>`
                : ''}
              ${canRecast(minigame) ? `<button data-action="minigame:recast" type="button">${t('recast')}</button>` : ''}
              <button data-action="minigame:observe" type="button">${t('observeWater')}</button>
            </section>
            </div>
          </aside>

          <section class="fishing-minigame__stage">
            ${fishingStageMarkup(state, minigame, {
              hintMode,
              contextAction,
              floatStyle,
              activeFishing,
            })}
          </section>

          ${sidePanelMarkup(state, minigame, collapsedPanels)}
        </div>

        ${fish ? catchResultModalMarkup(state, fish, result, minigame) : ''}
      </div>
    </section>
  `;
}

function baitButtonMarkup(bait, selectedBait) {
  const selected = bait.id === selectedBait ? ' is-selected' : '';
  const disabled = bait.disabled ? ' disabled' : '';
  return `
    <button class="bait-button${selected}" data-action="bait:${bait.id}" type="button"${disabled}>
      ${t(`bait${toPascalCase(bait.id)}`)}
      <strong>${bait.count}</strong>
    </button>
  `;
}

function depthButtonMarkup(depth, selectedDepth) {
  const selected = depth === selectedDepth ? ' is-selected' : '';
  return `
    <button class="depth-button${selected}" data-action="depth:${depth}" type="button">
      ${t(`depth${toPascalCase(depth)}`)}
    </button>
  `;
}

function spotListButtonMarkup(spot, selectedSpot) {
  const selected = spot.id === selectedSpot ? ' is-selected' : '';
  const disabled = spot.allowed ? '' : ' disabled';
  return `
    <button class="zone-button${selected}" data-action="spot:${spot.id}" type="button"${disabled} title="${spot.reasonKey ? t(spot.reasonKey) : ''}">
      <span>${t(spot.labelKey)}</span>
      <small>${spot.reasonKey ? t(spot.reasonKey) : t(castZoneKeys[spot.zone])}</small>
    </button>
  `;
}

function castSpotMarkup(spot, selectedSpot) {
  const selected = spot.id === selectedSpot ? ' is-selected' : '';
  const disabled = spot.allowed ? '' : ' is-disabled';
  return `
    <button
      class="cast-spot${selected}${disabled}"
      data-action="spot:${spot.id}"
      style="--spot-x:${spot.target.x}%;--spot-y:${spot.target.y}%;--spot-scale:${spot.scale};"
      data-selected-label="${t(spot.labelKey)}"
      type="button"
      title="${spot.reasonKey ? t(spot.reasonKey) : t(spot.labelKey)}"
      ${spot.allowed ? '' : 'disabled'}
    >
      <span>${t(spot.labelKey)}</span>
    </button>
  `;
}

function selectedScatterMarkup(state, minigame) {
  const spot = getAvailableCastSpots(state, minigame.method).find((entry) => entry.id === minigame.selectedSpot);
  if (!spot?.allowed) {
    return '';
  }

  const radius = spot.scatterRadius ?? spot.radius ?? { x: 8, y: 5 };
  return `
    <span
      class="cast-scatter"
      style="--scatter-x:${spot.target.x}%;--scatter-y:${spot.target.y}%;--scatter-w:${radius.x * 2}%;--scatter-h:${radius.y * 2}%;"
      aria-hidden="true"
    ></span>
  `;
}

function selectedSpotChip(minigame) {
  const spot = minigame.selectedSpot ? getCastSpot(minigame.selectedSpot) : null;
  return spot ? `<span class="fishing-spot-chip">${t(spot.labelKey)}</span>` : '';
}

function isActiveFishingPhase(phase) {
  return ['cast', 'waiting', 'animating', 'strike_window'].includes(phase);
}

function catchResultModalMarkup(state, fish, result, minigame) {
  const entry = state.fishBasket?.find((item) => item.id === minigame.currentCatchEntryId);
  const image = entry?.selectedCardImage ?? resolveFishCatchCardImage(result.id, {
    ...result,
    trophyTier: entry?.trophyTier,
    catchCategory: entry?.catchCategory ?? result.catchCategory,
  });

  return `
    <section class="fishing-result-modal">
      <button class="fishing-result-modal__backdrop" data-action="minigame:keep" type="button" aria-label="${t('close')}"></button>
      <div class="fishing-result">
        <div class="fishing-result__header">
          <p class="section-label">${t('caught')}</p>
          <button class="fishing-result__close" data-action="minigame:keep" type="button" aria-label="${t('close')}">&times;</button>
        </div>
        <div class="fishing-result__body">
          <div class="fishing-result__frame">
            <img src="${image}" onerror="this.src='${assetPath('/assets/fish/catch_result_frame.png')}'" alt="" />
          </div>
          <div class="fishing-result__copy">
            <h3>${t(fish.nameKey)}</h3>
            ${catchCategoryBadgeMarkup(entry?.catchCategory ?? result.catchCategory, entry?.weightGrams ?? result.weightGrams)}
            <ul>
              <li>${t('weight')}: <strong>${result.weightGrams}g</strong></li>
              <li>${t('rarity')}: <strong>${t(fish.rarityKey)}</strong></li>
              <li>${t('value')}: <strong>${result.value} ${t('coins').toLowerCase()}</strong></li>
            </ul>
            <p>${t(fish.descriptionKey)}</p>
            ${questProgressUpdateMarkup(state)}
          </div>
          <div class="fishing-result__actions">
            <button data-action="minigame:keep" type="button">${t('close')}</button>
            <button data-action="minigame:openKeepnet" type="button">${t('openKeepnet')}</button>
            ${entry?.isLiveBaitEligible ? `<button data-action="minigame:liveBait" type="button">${t('useAsLiveBait')}</button>` : ''}
            <button data-action="minigame:release" type="button">${t('release')}</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function questProgressUpdateMarkup(state) {
  const updates = state.ui?.questProgressUpdates ?? [];
  if (updates.length === 0) {
    return '';
  }

  const update = updates[updates.length - 1];
  return `<p class="fishing-result__quest-update">${t('questUpdated', {
    quest: t(update.titleKey),
    progress: update.progress,
    required: update.required,
  })}</p>`;
}

function sidePanelMarkup(state, minigame, collapsedPanels) {
  return `
    <section class="fishing-result fishing-result--compact">
      <div class="fishing-minigame__panel-heading">
        <p class="section-label">${minigame.phase === 'result' ? t('status') : t('fishBasket')}</p>
        <button class="panel-toggle" data-action="panel:toggle:fishingResult" type="button" aria-label="${panelToggleLabel(collapsedPanels.fishingResult)}">
          ${panelToggleIcon(collapsedPanels.fishingResult)}
        </button>
      </div>
      <div class="fishing-result__body">
        ${minigame.phase === 'result' && minigame.result?.outcome !== 'caught' ? `
          <div class="fishing-result__copy">
            <p class="section-label">${t('caught')}</p>
            <h3>${t(minigame.statusKey)}</h3>
          </div>
          <div class="fishing-result__actions">
            <button data-action="minigame:castAgain" type="button">${t('castAgain')}</button>
          </div>
        ` : `
          <div class="fishing-side-scroll">
            ${keepnetMarkup(state)}
            <p class="section-label">${t('catchJournal')}</p>
            ${catchJournalMarkup(state)}
          </div>
        `}
      </div>
    </section>
  `;
}

function bobberStyle(minigame) {
  if (minigame.phase === 'result' && minigame.bobberState === 'hidden') {
    return '--bobber-x:12%;--bobber-y:112%;--bobber-scale:0.9;--ripple-scale:0.9;';
  }

  const target = minigame.castTarget ?? { x: 18, y: 68 };
  const scale = minigame.selectedSpot ? getCastSpot(minigame.selectedSpot).scale : getZoneScale(minigame.selectedZone);
  return `--bobber-x:${target.x}%;--bobber-y:${target.y}%;--bobber-scale:${scale};--ripple-scale:${scale};`;
}

function canCast(minigame) {
  return Boolean(minigame.selectedBait && minigame.selectedSpot && ['setup', 'result'].includes(minigame.phase));
}

function getZoneScale(zone) {
  if (zone === 'near_bank') {
    return 1.15;
  }

  if (zone === 'reed_edge') {
    return 0.82;
  }

  return 1;
}

function canStrike(minigame) {
  return ['waiting', 'animating', 'strike_window'].includes(minigame.phase);
}

function canRecast(minigame) {
  return ['waiting', 'animating', 'strike_window'].includes(minigame.phase);
}

function strikeButtonClass(minigame, hintMode) {
  if (minigame.phase !== 'strike_window') {
    return 'strike strike--quiet';
  }

  if (hintMode === 'beginner') {
    return 'strike strike--clear';
  }

  if (hintMode === 'subtle') {
    return 'strike strike--subtle';
  }

  return 'strike strike--quiet';
}

function getBobberHintKey(minigame, hintMode) {
  if (hintMode === 'beginner' && minigame.biteCycleTotal > 0 && ['animating', 'strike_window'].includes(minigame.phase)) {
    return 'fishingBiteCycle';
  }

  if (hintMode === 'subtle' && minigame.phase === 'strike_window') {
    return 'fishingSomethingHappening';
  }

  if (minigame.phase === 'strike_window') {
    return 'fishingStrikeNow';
  }

  if (minigame.bobberState === 'tiny_nibble') {
    return 'fishingSmallMovement';
  }

  if (['lift', 'slow_dip', 'sideways_pull', 'submerged'].includes(minigame.bobberState)) {
    return 'fishingCarefulBite';
  }

  if (minigame.bobberState === 'hard_dip') {
    return 'fishingStrongBite';
  }

  return minigame.statusKey;
}

function getFishingWaterImage(state) {
  const waterId = state.travel?.selectedWater ?? 'canal';
  const location = getFishingLocation(waterId);
  const imageId = location?.fishingImageId ?? location?.imageId ?? 'canal';
  return {
    src: getLocationImage(imageId),
    fallback: getLocationImageFallback(imageId) ?? assetPath('/assets/locations/pond_location_concept.png'),
  };
}

function toPascalCase(value) {
  return value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}

function panelToggleIcon(isCollapsed) {
  return isCollapsed ? '&#9656;' : '&#9662;';
}

function panelToggleLabel(isCollapsed) {
  return isCollapsed ? t('show') : t('hide');
}

function fishingStageMarkup(state, minigame, options) {
  const { activeFishing, contextAction, floatStyle, hintMode } = options;
  const stageBody = `
    <div class="fishing-ambience" aria-hidden="true">
      <span class="bird bird--one"></span>
      <span class="bird bird--two"></span>
      <span class="dragonfly dragonfly--one"></span>
      <span class="dragonfly dragonfly--two"></span>
      <span class="dragonfly dragonfly--rare${(minigame.rareInsectActiveUntil ?? 0) > performance.now() ? ' is-active' : ''}"></span>
      <span class="surface-ring surface-ring--one"></span>
      <span class="surface-ring surface-ring--two"></span>
      <span class="reed reed--one"></span>
      <span class="reed reed--two"></span>
      <span class="reed reed--three"></span>
    </div>
    <div class="fishing-stage__prototype-3d" aria-hidden="true">
      <canvas class="fishing-stage__prototype-3d-canvas" data-fishing-prototype-canvas></canvas>
    </div>
    <!-- Temporary 2D fallback fisherman. Disable this block later once the 3D prototype fully replaces it. -->
    <div class="fishing-figure fishing-figure--${minigame.method} fishing-figure--${minigame.phase}" aria-hidden="true">
      <span class="fishing-figure__shadow"></span>
      <span class="fishing-figure__body"></span>
      <span class="fishing-figure__head"></span>
      <span class="fishing-figure__hat"></span>
      <span class="fishing-figure__arm"></span>
      <span class="fishing-figure__rod"></span>
    </div>
    <div class="cast-spot-layer">
      ${getAvailableCastSpots(state, minigame.method).map((spot) => castSpotMarkup(spot, minigame.selectedSpot)).join('')}
      ${selectedScatterMarkup(state, minigame)}
    </div>
    <div class="fishing-stage__waterline" aria-hidden="true"></div>
    <div class="fishing-stage__rings fishing-stage__rings--${minigame.bobberState}"></div>
    <div
      class="fishing-stage__bobber fishing-stage__bobber--${minigame.bobberState} fishing-stage__bobber--float-${floatStyle}"
      style="${bobberStyle(minigame)}"
    >
      <span class="fishing-stage__bobber-top"></span>
      <span class="fishing-stage__bobber-bottom"></span>
    </div>
    ${hintMode === 'off' ? '' : `<span class="fishing-stage__hint fishing-stage__hint--${hintMode}">${t(getBobberHintKey(minigame, hintMode))}</span>`}
  `;

  return `
    <div class="fishing-stage${activeFishing ? ' fishing-stage--active-cast' : ''}" style="${bobberStyle(minigame)}">
      ${stageBody}
      ${activeFishing ? '' : selectedSpotChip(minigame)}
      <div class="fishing-context-action">
        <button
          class="fishing-context-action__button fishing-context-action__button--${contextAction.variant}"
          data-action="minigame:context"
          type="button"
          ${contextAction.enabled ? '' : 'disabled'}
        >
          ${t(contextAction.labelKey)}
        </button>
        ${activeFishing
          ? `<button class="fishing-context-action__side" data-action="minigame:recast" type="button">${t('takeRodOut')}</button>`
          : ''}
        <span>${t('spaceAction')}</span>
      </div>
      <button class="fishing-keepnet-shortcut" data-action="panel:toggle:keepnet" type="button">${t('keepnet')}</button>
    </div>
  `;
}

export function syncFishingLineOverlay(root) {
  const stage = root.querySelector('.fishing-stage');
  const bobber = root.querySelector('.fishing-stage__bobber');
  const overlay = root.querySelector('[data-fishing-line-overlay]');
  if (!stage || !bobber || !overlay) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const bobberRect = bobber.getBoundingClientRect();
  if (stageRect.width <= 0 || stageRect.height <= 0 || bobberRect.width <= 0 || bobberRect.height <= 0) {
    return;
  }

  const method = overlay.dataset.fishingMethod ?? 'stickRod';
  const bobberState = overlay.dataset.bobberState ?? 'idle';
  const start = measuredRodTip(stage, method) ?? fishingLineFallbackAnchors[method] ?? fishingLineFallbackAnchors.stickRod;
  const end = {
    x: toStagePercent(bobberRect.left + bobberRect.width * 0.5, stageRect.left, stageRect.width),
    y: toStagePercent(bobberRect.top + bobberRect.height * 0.18, stageRect.top, stageRect.height),
  };
  const path = fishingLinePath(start, end, method, bobberState);
  const tension = lineTensionForState(bobberState, method === 'handline' ? 0.3 : 0.44);

  overlay.style.setProperty('--line-tension', tension);
  overlay.querySelector('[data-fishing-line-shadow]')?.setAttribute('d', path);
  overlay.querySelector('[data-fishing-line-path]')?.setAttribute('d', path);
}

function measuredRodTip(stage, method) {
  const stageRect = stage.getBoundingClientRect();
  const selector = method === 'handline' ? '.fishing-figure__arm' : '.fishing-figure__rod';
  const part = stage.querySelector(selector);
  if (!part || getComputedStyle(part).display === 'none') {
    return null;
  }

  const rect = part.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: toStagePercent(rect.right, stageRect.left, stageRect.width),
    y: toStagePercent(method === 'handline' ? rect.top + rect.height * 0.45 : rect.top + rect.height * 0.24, stageRect.top, stageRect.height),
  };
}

function toStagePercent(value, origin, size) {
  return Math.max(-12, Math.min(112, ((value - origin) / size) * 100));
}

function fishingLinePath(start, end, method, bobberState) {
  const distanceX = end.x - start.x;
  const distanceY = end.y - start.y;
  const baseSag = method === 'handline' ? 5.2 : method === 'liveBait' ? 6.2 : 5.8;
  const tension = lineTensionForState(bobberState, method === 'handline' ? 0.3 : 0.44);
  const sag = baseSag + Math.max(0, distanceX) * 0.025 + Math.max(0, distanceY) * 0.018;
  const controlOne = {
    x: start.x + distanceX * 0.32,
    y: start.y + distanceY * 0.2 + sag * (1 - tension),
  };
  const controlTwo = {
    x: start.x + distanceX * 0.72,
    y: start.y + distanceY * 0.78 + sag * (1.22 - tension),
  };

  return `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(controlOne.x)} ${fmt(controlOne.y)}, ${fmt(controlTwo.x)} ${fmt(controlTwo.y)}, ${fmt(end.x)} ${fmt(end.y)}`;
}

function lineTensionForState(bobberState, baseTension) {
  const adjustments = {
    idle: 0,
    tiny_nibble: 0.05,
    lift: 0.12,
    slow_dip: 0.1,
    hard_dip: 0.2,
    sideways_pull: 0.18,
    strike_window: 0.26,
    hooked: 0.34,
    submerged: 0.28,
    missed: -0.04,
    line_break: -0.16,
  };
  return Math.max(0.12, Math.min(0.88, baseTension + (adjustments[bobberState] ?? 0)));
}

function fmt(value) {
  return Number(value).toFixed(2);
}
