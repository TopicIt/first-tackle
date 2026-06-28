import './locationScene.css';
import { cafeMarkup, logMarkup, marketMarkup } from './panels.js';
import { fishingMinigameMarkup } from './fishingMinigame.js';
import { starterDrawerMarkup } from './starterDrawer.js';
import { wormDiggingGameMarkup } from './wormDiggingGame.js';
import { getFishData } from '../game/fishData.js';
import { getFishingLocation, isFishingLocation } from '../game/locations.js';
import { tutorialSteps } from '../game/profile.js';
import { t, translateEntry } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import { getLocationImage, getLocationImageFallback } from '../utils/locationAsset.js';

const sceneConfigs = {
  house: {
    titleKey: 'sceneHouseTitle',
    descriptionKey: 'sceneHouseDescription',
    image: getLocationImage('house'),
    fallbackImage: getLocationImageFallback('house'),
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
  market: {
    titleKey: 'sceneMarketTitle',
    descriptionKey: 'sceneMarketDescription',
    image: assetPath('/assets/locations/market_location_concept.png'),
    bgClass: 'scene-bg--slow-pan',
    effects: ['scene-road-dust', 'scene-light-sweep'],
  },
  cafe: {
    titleKey: 'sceneCafeTitle',
    descriptionKey: 'sceneCafeDescription',
    image: assetPath('/assets/locations/market_location_concept.png'),
    bgClass: 'scene-bg--slow-pan',
    effects: ['scene-road-dust', 'scene-light-sweep'],
  },
  bus_station: {
    titleKey: 'sceneBusStationTitle',
    descriptionKey: 'sceneBusStationDescription',
    image: assetPath('/assets/locations/market_location_concept.png'),
    bgClass: 'scene-bg--slow-pan',
    effects: ['scene-road-dust', 'scene-light-sweep'],
  },
  fishing_select: {
    titleKey: 'sceneFishingSelectTitle',
    descriptionKey: 'sceneFishingSelectDescription',
    image: getLocationImage('canal'),
    fallbackImage: getLocationImageFallback('canal'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-cloud-shadow'],
  },
  sluice_map: {
    titleKey: 'sceneSluiceTitle',
    descriptionKey: 'sceneSluiceDescription',
    image: getLocationImage('sluice'),
    fallbackImage: getLocationImageFallback('sluice'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-cloud-shadow'],
  },
  fire_ponds_map: {
    titleKey: 'sceneFirePondsTitle',
    descriptionKey: 'sceneFirePondsDescription',
    image: getLocationImage('firePonds'),
    fallbackImage: getLocationImageFallback('firePonds'),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-cloud-shadow'],
  },
};

export function locationSceneMarkup(state, context) {
  const sceneId = state.ui?.activeScene;
  const config = sceneConfigs[sceneId] ?? fishingSceneConfig(sceneId);
  if (!config) {
    return '';
  }

  return `
    <section class="location-scene location-scene--${sceneId}" aria-label="${t(config.titleKey)} ${t('location')}">
      <div
        class="scene-bg ${config.bgClass}"
        style="${sceneBackgroundStyle(config)}"
        aria-hidden="true"
      ></div>
      <div class="scene-vignette" aria-hidden="true"></div>
      ${config.effects.map(effectMarkup).join('')}

      <div class="scene-shell">
        <header class="scene-header">
          <div>
            <h2>${t(config.titleKey)}</h2>
            <details class="scene-description">
              <summary>${t('locationDescription')}</summary>
              <p>${t(config.descriptionKey)}</p>
            </details>
          </div>
          <div class="scene-header__actions">
            <button class="scene-map" data-action="scene:map" type="button">${t('backToMap')}</button>
            <button class="scene-close" data-scene-close="true" type="button" aria-label="${t('close')}">&times;</button>
          </div>
        </header>

        <div class="scene-body">
          ${sceneId === 'market' || sceneId === 'cafe' ? '' : `<section class="scene-actions">
            <div class="scene-action-grid">
              ${context.sceneActions.map((action) => actionButtonMarkup(action, state)).join('')}
            </div>
          </section>`}

          ${sceneId === 'market' ? `
            <section class="scene-actions scene-market">
              ${marketMarkup(state)}
            </section>
          ` : ''}

          ${sceneId === 'cafe' ? `
            <section class="scene-actions scene-market scene-cafe">
              ${cafeMarkup(state)}
            </section>
          ` : ''}

          ${fishResultMarkup(state)}

          <section class="scene-log">
            <p class="section-label">${t('log')}</p>
            <ul class="log-list">${logMarkup(state)}</ul>
          </section>

        </div>
      </div>

      <div class="scene-feedback" aria-hidden="true">
        ${(state.feedback ?? []).map(feedbackMarkup).join('')}
      </div>

      ${fishingMinigameMarkup(state)}
      ${starterDrawerMarkup(state)}
      ${wormDiggingGameMarkup(state)}
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

function actionButtonMarkup(action, state) {
  const variant = action.variant ? ` ${action.variant}` : '';
  const tutorialTarget = isTutorialTarget(state, action.id) ? ' is-tutorial-target' : '';
  const disabled = action.disabled ? ' disabled' : '';
  return `
    <button class="${`${variant}${tutorialTarget}`.trim()}" data-action="${action.id}" type="button"${disabled}>
      ${action.label}
      ${action.reason ? `<small>${action.reason}</small>` : ''}
    </button>
  `;
}

function isTutorialTarget(state, actionId) {
  const tutorial = state.tutorialState;
  if (!tutorial?.started || tutorial.completed || tutorial.skipped || tutorial.collapsed) {
    return false;
  }
  return actionId === tutorialSteps[tutorial.step ?? 0]?.actionId;
}

function feedbackMarkup(feedback) {
  return `<span class="feedback-pop ${feedback.type}">${translateEntry(feedback)}</span>`;
}

function fishResultMarkup(state) {
  if (!isFishingLocation(state.ui?.activeScene) || state.ui?.fishingMinigame?.open) {
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

function fishingSceneConfig(sceneId) {
  const location = getFishingLocation(sceneId);
  if (!location) {
    return null;
  }

  return {
    titleKey: location.titleKey,
    descriptionKey: location.descriptionKey,
    image: getLocationImage(location.fishingImageId ?? location.imageId),
    fallbackImage: getLocationImageFallback(location.fishingImageId ?? location.imageId),
    bgClass: 'scene-bg--slow-zoom',
    effects: ['scene-water-ripples', 'scene-bobber', 'scene-cloud-shadow'],
  };
}

function sceneBackgroundStyle(config) {
  const images = [
    config.image ? `url('${config.image}')` : '',
    config.fallbackImage ? `url('${config.fallbackImage}')` : '',
  ].filter(Boolean);

  return `background-image: ${images.join(', ')}`;
}
