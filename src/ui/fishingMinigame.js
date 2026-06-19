import './fishingMinigame.css';
import { getFishData } from '../game/fishData.js';
import { getAvailableBaits } from '../game/fishingMinigameLogic.js';
import { t } from '../i18n/i18n.js';

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

  return `
    <section class="fishing-minigame" aria-label="${t('fishingTitle')}">
      <div class="fishing-minigame__backdrop">
        <img class="fishing-minigame__base" src="/assets/fishing/canal_fishing_base.png" alt="" />
        <img class="fishing-minigame__zones" src="/assets/fishing/canal_fishing_cast_zones.png" alt="" />
        ${minigame.phase === 'waiting' || minigame.phase === 'animating'
          ? '<img class="fishing-minigame__state-art" src="/assets/fishing/canal_fishing_waiting_bobber.png" alt="" />'
          : ''}
        ${minigame.phase === 'strike_window'
          ? '<img class="fishing-minigame__state-art fishing-minigame__state-art--bite" src="/assets/fishing/canal_fishing_bite.png" alt="" />'
          : ''}
      </div>

      <div class="fishing-minigame__shell">
        <header class="fishing-minigame__header">
          <div>
            <p class="section-label">${t('fishingTitle')}</p>
            <h2>${t(methodKeys[minigame.method])}</h2>
            <p class="fishing-minigame__status">${t(minigame.statusKey)}</p>
          </div>
          <button class="scene-close" data-action="minigame:back" type="button">${t('backToPond')}</button>
        </header>

        <div class="fishing-minigame__layout">
          <aside class="fishing-minigame__controls">
            <section class="fishing-panel">
              <p class="section-label">${t('chooseBait')}</p>
              <div class="bait-grid">
                ${getAvailableBaits(state).map((bait) => baitButtonMarkup(bait, minigame.selectedBait)).join('')}
              </div>
              <img class="fishing-panel__art" src="/assets/items/bait_types_clean.png" alt="" />
            </section>

            <section class="fishing-panel">
              <p class="section-label">${t('chooseCastZone')}</p>
              <div class="zone-grid">
                ${Object.keys(castZoneKeys).map((zoneId) => zoneButtonMarkup(zoneId, minigame.selectedZone)).join('')}
              </div>
            </section>

            <section class="fishing-panel fishing-panel__actions">
              <button data-action="minigame:cast" type="button">${t('cast')}</button>
              ${minigame.phase === 'strike_window'
                ? `<button class="strike" data-action="minigame:strike" type="button">${t('strike')}</button>`
                : ''}
            </section>
          </aside>

          <section class="fishing-minigame__stage">
            <div class="fishing-stage">
              <div class="fishing-stage__rings fishing-stage__rings--${minigame.bobberState}"></div>
              <div
                class="fishing-stage__bobber fishing-stage__bobber--${minigame.bobberState}"
                style="${bobberStyle(minigame)}"
              >
                <span class="fishing-stage__bobber-top"></span>
                <span class="fishing-stage__bobber-bottom"></span>
                <span class="fishing-stage__line"></span>
              </div>
            </div>
          </section>

          ${fish ? catchResultCardMarkup(state, fish, result, minigame) : resultStatusMarkup(minigame)}
        </div>
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

function zoneButtonMarkup(zoneId, selectedZone) {
  const selected = zoneId === selectedZone ? ' is-selected' : '';
  return `
    <button class="zone-button${selected}" data-action="zone:${zoneId}" type="button">
      ${t(castZoneKeys[zoneId])}
    </button>
  `;
}

function catchResultCardMarkup(state, fish, result, minigame) {
  const image = getCatchImage(result.id);
  const entry = state.fishBasket?.find((item) => item.id === minigame.currentCatchEntryId);
  const liveBaitDisabled = !entry?.isLiveBaitEligible ? ' disabled' : '';

  return `
    <section class="fishing-result">
      <div class="fishing-result__frame">
        <img src="${image}" alt="" />
      </div>
      <div class="fishing-result__copy">
        <p class="section-label">${t('caught')}</p>
        <h3>${t(fish.nameKey)}</h3>
        <ul>
          <li>${t('weight')}: <strong>${result.weightGrams}g</strong></li>
          <li>${t('rarity')}: <strong>${t(fish.rarityKey)}</strong></li>
          <li>${t('value')}: <strong>${result.value} ${t('coins').toLowerCase()}</strong></li>
        </ul>
        <p>${t(fish.descriptionKey)}</p>
      </div>
      <div class="fishing-result__actions">
        <button data-action="minigame:keep" type="button">${t('keep')}</button>
        <button data-action="minigame:liveBait" type="button"${liveBaitDisabled}>${t('useAsLiveBait')}</button>
        <button data-action="minigame:castAgain" type="button">${t('castAgain')}</button>
        <button data-action="minigame:back" type="button">${t('backToPond')}</button>
      </div>
    </section>
  `;
}

function resultStatusMarkup(minigame) {
  if (minigame.phase !== 'result' || minigame.result?.outcome === 'caught') {
    return '';
  }

  return `
    <section class="fishing-result fishing-result--compact">
      <div class="fishing-result__copy">
        <p class="section-label">${t('caught')}</p>
        <h3>${t(minigame.statusKey)}</h3>
      </div>
      <div class="fishing-result__actions">
        <button data-action="minigame:castAgain" type="button">${t('castAgain')}</button>
        <button data-action="minigame:back" type="button">${t('backToPond')}</button>
      </div>
    </section>
  `;
}

function bobberStyle(minigame) {
  const target = minigame.castTarget ?? { x: 18, y: 68 };
  return `--bobber-x:${target.x}%;--bobber-y:${target.y}%;`;
}

function getCatchImage(fishId) {
  if (fishId === 'rotan') {
    return '/assets/fish/catch_rotan_card.png';
  }

  if (fishId === 'crucian') {
    return '/assets/fish/catch_crucian_card.png';
  }

  return '/assets/fish/catch_result_frame.png';
}

function toPascalCase(value) {
  return value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}
