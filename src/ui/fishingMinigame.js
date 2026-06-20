import './fishingMinigame.css';
import { getFishData } from '../game/fishData.js';
import { getAvailableBaits, getAvailableCastSpots, getFishingContextAction } from '../game/fishingMinigameLogic.js';
import { getCastSpot } from '../game/bitePatterns.js';
import { catchJournalMarkup, keepnetMarkup } from './panels.js';
import { t } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';

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

  return `
    <section class="fishing-minigame" aria-label="${t('fishingTitle')}">
      <div class="fishing-minigame__backdrop">
        <img
          class="fishing-minigame__base"
          src="${assetPath('/assets/locations/fishing-canal.webp')}"
          onerror="this.onerror=null;this.src='${assetPath('/assets/locations/pond_location_concept.png')}'"
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
  const image = getCatchImage(result.id);
  const entry = state.fishBasket?.find((item) => item.id === minigame.currentCatchEntryId);
  const liveBaitDisabled = !entry?.isLiveBaitEligible ? ' disabled' : '';

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
            <ul>
              <li>${t('weight')}: <strong>${result.weightGrams}g</strong></li>
              <li>${t('rarity')}: <strong>${t(fish.rarityKey)}</strong></li>
              <li>${t('value')}: <strong>${result.value} ${t('coins').toLowerCase()}</strong></li>
            </ul>
            <p>${t(fish.descriptionKey)}</p>
          </div>
          <div class="fishing-result__actions">
            <button data-action="minigame:keep" type="button">${t('close')}</button>
            <button data-action="minigame:openKeepnet" type="button">${t('openKeepnet')}</button>
            <button data-action="minigame:liveBait" type="button"${liveBaitDisabled}>${t('useAsLiveBait')}</button>
            <button data-action="minigame:release" type="button">${t('release')}</button>
          </div>
        </div>
      </div>
    </section>
  `;
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

function getCatchImage(fishId) {
  if (fishId === 'rotan') {
    return assetPath('/assets/fish/catch_rotan_card.png');
  }

  if (fishId === 'crucian') {
    return assetPath('/assets/fish/catch_crucian_card.png');
  }

  return assetPath(`/assets/fish/species/${fishId}.png`);
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
    <div class="fishing-figure fishing-figure--${minigame.method} fishing-figure--${minigame.phase}" aria-hidden="true">
      <span class="fishing-figure__shadow"></span>
      <span class="fishing-figure__body"></span>
      <span class="fishing-figure__head"></span>
      <span class="fishing-figure__hat"></span>
      <span class="fishing-figure__arm"></span>
      <span class="fishing-figure__rod"></span>
      <span class="fishing-figure__line"></span>
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
