import { fishPricesMarkup, inventoryMarkup, logMarkup, shopMarkup } from './panels.js';
import { locationSceneMarkup } from './locationScene.js';
import { mapOverlayMarkup } from './mapOverlay.js';
import { getLanguage, t } from '../i18n/i18n.js';

export function createHud(root, handlers) {
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
      root.innerHTML = `
        ${mapOverlayMarkup(state)}

        <section class="panel status-panel">
          <h1 class="title">${t('appTitle')}</h1>
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
        </section>

        <section class="panel inventory-panel">
          <p class="section-label">${t('inventory')}</p>
          <ul class="inventory-list">${inventoryMarkup(state)}</ul>
          <p class="section-label">${t('shop')}</p>
          <ul class="shop-list">${shopMarkup(state)}</ul>
          <p class="section-label">${t('fishPrices')}</p>
          <ul class="shop-list">${fishPricesMarkup()}</ul>
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

        ${locationSceneMarkup(state, context)}
      `;
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
