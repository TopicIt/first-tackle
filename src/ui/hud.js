import {
  catchJournalMarkup,
  fishPricesMarkup,
  inventoryMarkup,
  keepnetMarkup,
  logMarkup,
  shopMarkup,
} from './panels.js';
import { locationSceneMarkup } from './locationScene.js';
import { mapOverlayMarkup } from './mapOverlay.js';
import { getLanguage, t } from '../i18n/i18n.js';

export function createHud(root, handlers) {
  const shownFeedbackIds = new Set();

  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-audio-setting]');
    if (!input) {
      return;
    }

    handlers.onAudioSetting(input.dataset.audioSetting, input.value);
  });

  root.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-audio-setting][type="checkbox"]');
    if (!checkbox) {
      return;
    }

    handlers.onAudioSetting(checkbox.dataset.audioSetting, checkbox.checked ? 'true' : 'false');
  });

  root.addEventListener('click', (event) => {
    const closeButton = event.target.closest('button[data-scene-close]');
    if (closeButton) {
      handlers.onCloseScene();
      return;
    }

    const languageButton = event.target.closest('button[data-language-toggle]');
    if (languageButton) {
      handlers.onToggleLanguage();
      return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) {
      return;
    }

    const action = button.dataset.action;
    if (action === 'save') handlers.onSave();
    else if (action === 'load') handlers.onLoad();
    else if (action === 'reset') handlers.onReset();
    else handlers.onAction(action);
  });

  return {
    render(state, context) {
      const visibleFeedback = (state.feedback ?? []).filter((feedback) => !shownFeedbackIds.has(feedback.id));
      const renderState = { ...state, feedback: visibleFeedback };
      const collapsedPanels = state.ui?.collapsedPanels ?? {};
      const statusCollapsed = collapsedPanels.status ? ' is-collapsed' : '';
      const inventoryCollapsed = collapsedPanels.inventory ? ' is-collapsed' : '';
      const shopCollapsed = collapsedPanels.shop ? ' is-collapsed' : '';
      const fishPricesCollapsed = collapsedPanels.fishPrices ? ' is-collapsed' : '';
      const keepnetCollapsed = collapsedPanels.keepnet ? ' is-collapsed' : '';
      const journalCollapsed = collapsedPanels.journal ? ' is-collapsed' : '';

      root.innerHTML = `
        ${mapOverlayMarkup(renderState)}

        <section class="panel status-panel${statusCollapsed}">
          <div class="panel-toggle-row">
            <h1 class="title">${t('appTitle')}</h1>
            <button class="panel-toggle" data-action="panel:toggle:status" type="button">
              ${collapsedPanels.status ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            <div class="money">
              <span>${t('coins')}</span>
              <strong>${state.money}</strong>
            </div>
            <p class="hint"><strong>${context.zoneLabel}</strong><br>${context.hint}</p>
            <div class="debug-line">
              <span>${t('currentZone')}: <strong>${context.zoneLabel}</strong></span>
              <span>${t('availableActions')}: <strong>${context.availableActionLabels.join(', ')}</strong></span>
            </div>
            <div class="save-row">
              <button data-action="save" type="button">${t('save')}</button>
              <button data-action="load" type="button">${t('load')}</button>
              <button data-action="reset" type="button">${t('reset')}</button>
              <button data-language-toggle="true" type="button" aria-label="Switch language">${getLanguage().toUpperCase()} / ${t('languageToggle')}</button>
            </div>
            <div class="audio-settings">
              <label class="audio-toggle">
                <input data-audio-setting="soundEnabled" type="checkbox"${state.settings.audio.soundEnabled ? ' checked' : ''} />
                <span>${t('sound')}</span>
              </label>
              <label class="audio-toggle">
                <input data-audio-setting="musicEnabled" type="checkbox"${state.settings.audio.musicEnabled ? ' checked' : ''} />
                <span>${t('music')}</span>
              </label>
              <label class="audio-range">
                <span>${t('sfxVolume')}</span>
                <input data-audio-setting="sfxVolume" type="range" min="0" max="1" step="0.05" value="${state.settings.audio.sfxVolume}" />
              </label>
              <label class="audio-range">
                <span>${t('musicVolume')}</span>
                <input data-audio-setting="musicVolume" type="range" min="0" max="1" step="0.05" value="${state.settings.audio.musicVolume}" />
              </label>
            </div>
          </div>
        </section>

        <section class="panel inventory-panel${inventoryCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('inventory')}</p>
            <button class="panel-toggle" data-action="panel:toggle:inventory" type="button">
              ${collapsedPanels.inventory ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            <ul class="inventory-list">${inventoryMarkup(state)}</ul>
          </div>
        </section>

        <section class="panel shop-panel${shopCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('shop')}</p>
            <button class="panel-toggle" data-action="panel:toggle:shop" type="button">
              ${collapsedPanels.shop ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            <ul class="shop-list">${shopMarkup(state)}</ul>
          </div>
        </section>

        <section class="panel fish-prices-panel${fishPricesCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('fishPrices')}</p>
            <button class="panel-toggle" data-action="panel:toggle:fishPrices" type="button">
              ${collapsedPanels.fishPrices ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            <p class="market-forecast">${t('tomorrowForecast')}</p>
            <ul class="shop-list">${fishPricesMarkup(state)}</ul>
          </div>
        </section>

        <section class="panel keepnet-panel${keepnetCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('fishBasket')}</p>
            <button class="panel-toggle" data-action="panel:toggle:keepnet" type="button">
              ${collapsedPanels.keepnet ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            ${keepnetMarkup(state)}
          </div>
        </section>

        <section class="panel journal-panel${journalCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('catchJournal')}</p>
            <button class="panel-toggle" data-action="panel:toggle:journal" type="button">
              ${collapsedPanels.journal ? t('show') : t('hide')}
            </button>
          </div>
          <div class="panel-collapsible">
            ${catchJournalMarkup(state)}
          </div>
        </section>

        <section class="panel actions-panel">
          <div class="action-grid">
            ${context.actions.map(actionButtonMarkup).join('')}
          </div>
        </section>

        <section class="panel log-panel">
          <p class="section-label">${t('log')}</p>
          <ul class="log-list">${logMarkup(state)}</ul>
        </section>

        ${locationSceneMarkup(renderState, context)}
      `;

      for (const feedback of visibleFeedback) {
        shownFeedbackIds.add(feedback.id);
      }
    },
  };
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
