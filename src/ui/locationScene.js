import './locationScene.css';
import { logMarkup } from './panels.js';
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
  market: {
    titleKey: 'sceneMarketTitle',
    descriptionKey: 'sceneMarketDescription',
    image: assetPath('/assets/locations/world_map_concept.png'),
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
          <button class="scene-close" data-scene-close="true" type="button" aria-label="${t('close')}">${t('close')}</button>
        </header>

        <div class="scene-body">
          <section class="scene-actions">
            <p class="section-label">${t('actions')}</p>
            <div class="scene-action-grid">
              ${context.sceneActions.map(actionButtonMarkup).join('')}
            </div>
          </section>

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
  if (state.ui?.activeScene !== 'pond' || state.ui?.fishingMinigame?.open) {
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
