import './locationScene.css';
import { logMarkup, marketMarkup } from './panels.js';
import { fishingMinigameMarkup } from './fishingMinigame.js';
import { getFishData } from '../game/fishData.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';

const sceneConfigs = {
  house: {
    titleKey: 'sceneHouseTitle',
    descriptionKey: 'sceneHouseDescription',
    image: assetPath('/assets/locations/house_location_concept.png'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-light-sweep', 'scene-floating-dust', 'scene-cloud-shadow', 'scene-warm-haze'],
  },
  garden: {
    titleKey: 'sceneGardenTitle',
    descriptionKey: 'sceneGardenDescription',
    image: assetPath('/assets/locations/garden_location_concept.png'),
    bgClass: 'scene-bg--slow-pan',
    effects: ['scene-insects', 'scene-cloud-shadow', 'scene-floating-dust'],
  },
  pond: {
    titleKey: 'scenePondTitle',
    descriptionKey: 'scenePondDescription',
    image: assetPath('/assets/locations/pond_location_concept.png'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-bobber', 'scene-cloud-shadow'],
  },
  greada: {
    titleKey: 'sceneGreadaTitle',
    descriptionKey: 'sceneGreadaDescription',
    image: assetPath('/assets/locations/greada_location_concept.png'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-bobber', 'scene-cloud-shadow', 'scene-road-dust'],
  },
  market: {
    titleKey: 'sceneMarketTitle',
    descriptionKey: 'sceneMarketDescription',
    image: assetPath('/assets/locations/market_location_concept.png'),
    bgClass: 'scene-bg--slow-pan',
    effects: ['scene-road-dust', 'scene-light-sweep'],
  },
};

export function locationSceneMarkup(state, context) {
  const sceneId = state.ui?.activeScene;
  const config = sceneConfigs[sceneId];
  if (!config) {
    return '';
  }

  return `
    <section class="location-scene" aria-label="${t(config.titleKey)} ${t('location')}">
      <div
        class="scene-bg ${config.bgClass}"
        style="background-image: url('${config.image}')"
        aria-hidden="true"
      ></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      ${config.effects.map(effectMarkup).join('')}

      <div class="scene-shell">
        <header class="scene-header">
          <div>
            <p class="section-label">${t('location')}</p>
            <h2>${t(config.titleKey)}</h2>
            <p>${t(config.descriptionKey)}</p>
          </div>
          <div class="scene-header__actions">
            <button class="scene-map" data-action="scene:map" type="button">${t('backToMap')}</button>
            <button class="scene-close" data-scene-close="true" type="button" aria-label="${t('close')}">&times;</button>
          </div>
        </header>

        <div class="scene-body">
          <section class="scene-actions">
            <p class="section-label">${t('actions')}</p>
            <div class="scene-action-grid">
              ${context.sceneActions.map(actionButtonMarkup).join('')}
            </div>
          </section>

          ${sceneId === 'market' ? `
            <section class="scene-actions scene-market">
              <p class="section-label">${t('market')}</p>
              ${marketMarkup(state)}
            </section>
          ` : ''}

          ${fishResultMarkup(state)}

          <section class="scene-log">
            <p class="section-label">${t('log')}</p>
            <ul class="log-list">${logMarkup(state)}</ul>
          </section>

          ${sceneId === 'pond' ? travelPreviewMarkup(state) : ''}
        </div>
      </div>

      <div class="scene-feedback" aria-hidden="true">
        ${(state.feedback ?? []).map(feedbackMarkup).join('')}
      </div>

      ${fishingMinigameMarkup(state)}
      ${fishingModeChoiceMarkup(state)}
    </section>
  `;
}

function travelPreviewMarkup(state) {
  const unlocked = Boolean(state.purchased?.bicycle || state.travel?.farWatersUnlocked);
  return `
    <details class="travel-preview"${unlocked ? ' open' : ''}>
      <summary>${t('travelFarther')}</summary>
      <p>${unlocked ? t('farWatersUnlocked') : t('buyBicycleToReachWaters')}</p>
      <div class="travel-preview__routes">
        <button class="${unlocked ? '' : 'is-locked'}" data-action="travel:greada" type="button"${unlocked ? '' : ' disabled'}>${t('zoneGreada')}</button>
        <span class="${unlocked ? '' : 'is-locked'}">${unlocked ? t('farWatersUnlocked') : t('requiresBicycle')}</span>
      </div>
    </details>
  `;
}

function fishingModeChoiceMarkup(state) {
  const method = state.ui?.pendingFishingMethod;
  if (!method) {
    return '';
  }

  const lastMode = state.settings?.fishing?.lastMode ?? 'classic';
  return `
    <section class="fishing-mode-choice" role="dialog" aria-label="${t('chooseFishingMode')}">
      <button class="fishing-mode-choice__backdrop" data-action="fishingMode:cancel" type="button" aria-label="${t('close')}"></button>
      <div class="fishing-mode-choice__card">
        <p class="section-label">${t('chooseFishingMode')}</p>
        <h3>${t('chooseFishingModeTitle')}</h3>
        <div class="fishing-mode-choice__actions">
          <button class="${lastMode === 'classic' ? 'is-selected' : ''}" data-action="fishingMode:classic" type="button">
            <strong>${t('classic2DFishing')}</strong>
            <small>${t('classic2DFishingNote')}</small>
          </button>
          <button class="${lastMode === 'experimental' ? 'is-selected' : ''}" data-action="fishingMode:experimental" type="button">
            <strong>${t('experimental3DFishingChoice')}</strong>
            <small>${t('experimental3DFishingNote')}</small>
          </button>
        </div>
        <button class="fishing-mode-choice__cancel" data-action="fishingMode:cancel" type="button">${t('close')}</button>
      </div>
    </section>
  `;
}

function effectMarkup(effectClass) {
  if (effectClass === 'scene-insects') {
    return `
      <div class="${effectClass}" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    `;
  }

  if (effectClass === 'scene-water-ripples') {
    return `
      <div class="${effectClass}" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `;
  }

  return `<div class="${effectClass}" aria-hidden="true"></div>`;
}

function actionButtonMarkup(action) {
  const variant = action.variant ? ` ${action.variant}` : '';
  const disabled = action.disabled ? ' disabled' : '';
  return `
    <button class="${variant.trim()}" data-action="${action.id}" type="button"${disabled}>
      ${action.label}
    </button>
  `;
}

function feedbackMarkup(feedback) {
  return `<span class="feedback-pop ${feedback.type}">${translateEntry(feedback)}</span>`;
}

function fishResultMarkup(state) {
  if (!['pond', 'greada'].includes(state.ui?.activeScene) || state.ui?.fishingMinigame?.open) {
    return '';
  }

  const result = state.ui?.catchResult;
  const fish = getFishData(result?.id);
  if (!result || !fish) {
    return '';
  }

  return `
    <section class="fish-card">
      <p class="section-label">${t('caught')}</p>
      <h3>${t(fish.nameKey)}</h3>
      <dl>
        <div>
          <dt>${t('weight')}</dt>
          <dd>${result.weightGrams}g</dd>
        </div>
        <div>
          <dt>${t('rarity')}</dt>
          <dd>${t(fish.rarityKey)}</dd>
        </div>
        <div>
          <dt>${t('value')}</dt>
          <dd>${result.value} ${t('coins').toLowerCase()}</dd>
        </div>
      </dl>
      <p>${t(fish.descriptionKey)}</p>
    </section>
  `;
}
