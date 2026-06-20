import {
  catchJournalMarkup,
  guideMarkup,
  inventoryMarkup,
  keepnetMarkup,
  logMarkup,
  marketMarkup,
  tackleMarkup,
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
      const keepnetCollapsed = collapsedPanels.keepnet ? ' is-collapsed' : '';
      const journalCollapsed = collapsedPanels.journal ? ' is-collapsed' : '';
      const tackleCollapsed = collapsedPanels.tackle ? ' is-collapsed' : '';
      const guideCollapsed = collapsedPanels.guide ? ' is-collapsed' : '';
      const marketCollapsed = collapsedPanels.market ? ' is-collapsed' : '';
      const profileCollapsed = collapsedPanels.profile ? ' is-collapsed' : '';
      const settingsCollapsed = collapsedPanels.settings ? ' is-collapsed' : '';

      root.innerHTML = `
        ${mapOverlayMarkup(renderState)}

        <section class="panel status-panel${statusCollapsed}">
          <div class="panel-toggle-row">
            <h1 class="title">${t('appTitle')}</h1>
            <button class="panel-toggle" data-action="panel:toggle:status" type="button" aria-label="${panelToggleLabel(collapsedPanels.status)}">
              ${panelToggleIcon(collapsedPanels.status)}
            </button>
          </div>
          <div class="panel-collapsible">
            <div class="money">
              <span>${t('coins')}</span>
              <strong>${state.money}</strong>
            </div>
            <p class="hint"><strong>${context.zoneLabel}</strong><br>${context.hint}</p>
            <p class="clock-line">${t('dayLabel', { day: state.day })} · ${t(`timePhase${toPascalCase(context.timePhase ?? 'morning')}`)} · ${context.clock ?? ''}</p>
            <details class="mobile-menu">
              <summary>${t('menu')}</summary>
              <nav class="mobile-menu__list">
                ${menuButton('inventory', 'inventory', collapsedPanels)}
                ${menuButton('keepnet', 'keepnet', collapsedPanels)}
                ${menuButton('tackle', 'tackle', collapsedPanels)}
                ${menuButton('market', 'market', collapsedPanels)}
                ${menuButton('guide', 'fishermanGuide', collapsedPanels)}
                ${menuButton('journal', 'catchJournal', collapsedPanels)}
                ${menuButton('profile', 'profile', collapsedPanels)}
                ${menuButton('settings', 'settings', collapsedPanels)}
              </nav>
              <div class="mobile-menu__service">
                <button data-action="save" type="button">${t('save')}</button>
                <button data-action="load" type="button">${t('load')}</button>
                <button data-action="reset" type="button">${t('reset')}</button>
                <button data-language-toggle="true" type="button" aria-label="Switch language">${getLanguage().toUpperCase()} / ${t('languageToggle')}</button>
              </div>
            </details>
            <nav class="main-menu">
              ${menuButton('inventory', 'inventory', collapsedPanels)}
              ${menuButton('keepnet', 'keepnet', collapsedPanels)}
              ${menuButton('tackle', 'tackle', collapsedPanels)}
              ${menuButton('market', 'market', collapsedPanels)}
              ${menuButton('guide', 'fishermanGuide', collapsedPanels)}
              ${menuButton('journal', 'catchJournal', collapsedPanels)}
              ${menuButton('profile', 'profile', collapsedPanels)}
              ${menuButton('settings', 'settings', collapsedPanels)}
            </nav>
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
          </div>
        </section>

        <section class="panel inventory-panel${inventoryCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('inventory')}</p>
            <button class="panel-toggle" data-action="panel:toggle:inventory" type="button" aria-label="${panelToggleLabel(collapsedPanels.inventory)}">
              ${panelToggleIcon(collapsedPanels.inventory)}
            </button>
          </div>
          <div class="panel-collapsible">
            <ul class="inventory-list">${inventoryMarkup(state)}</ul>
          </div>
        </section>

        <section class="panel market-panel${marketCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('market')}</p>
            <button class="panel-toggle" data-action="panel:toggle:market" type="button" aria-label="${panelToggleLabel(collapsedPanels.market)}">
              ${panelToggleIcon(collapsedPanels.market)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${marketMarkup(state)}
          </div>
        </section>

        <section class="panel keepnet-panel${keepnetCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('fishBasket')}</p>
            <button class="panel-toggle" data-action="panel:toggle:keepnet" type="button" aria-label="${panelToggleLabel(collapsedPanels.keepnet)}">
              ${panelToggleIcon(collapsedPanels.keepnet)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${keepnetMarkup(state)}
          </div>
        </section>

        <section class="panel journal-panel${journalCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('catchJournal')}</p>
            <button class="panel-toggle" data-action="panel:toggle:journal" type="button" aria-label="${panelToggleLabel(collapsedPanels.journal)}">
              ${panelToggleIcon(collapsedPanels.journal)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${catchJournalMarkup(state)}
          </div>
        </section>

        <section class="panel tackle-panel${tackleCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('tackle')}</p>
            <button class="panel-toggle" data-action="panel:toggle:tackle" type="button" aria-label="${panelToggleLabel(collapsedPanels.tackle)}">
              ${panelToggleIcon(collapsedPanels.tackle)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${tackleMarkup(state)}
          </div>
        </section>

        <section class="panel guide-panel${guideCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('fishermanGuide')}</p>
            <button class="panel-toggle" data-action="panel:toggle:guide" type="button" aria-label="${panelToggleLabel(collapsedPanels.guide)}">
              ${panelToggleIcon(collapsedPanels.guide)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${guideMarkup(state)}
          </div>
        </section>

        <section class="panel profile-panel${profileCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('profile')}</p>
            <button class="panel-toggle" data-action="panel:toggle:profile" type="button" aria-label="${panelToggleLabel(collapsedPanels.profile)}">
              ${panelToggleIcon(collapsedPanels.profile)}
            </button>
          </div>
          <div class="panel-collapsible">
            <div class="profile-grid">
              <span>${t('coins')} <strong>${state.money}</strong></span>
              <span>${t('dayLabel', { day: state.day })} <strong>${context.clock ?? ''}</strong></span>
              <span>${t('totalFish')} <strong>${state.fishBasket?.length ?? 0}</strong></span>
            </div>
          </div>
        </section>

        <section class="panel settings-panel${settingsCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('settings')}</p>
            <button class="panel-toggle" data-action="panel:toggle:settings" type="button" aria-label="${panelToggleLabel(collapsedPanels.settings)}">
              ${panelToggleIcon(collapsedPanels.settings)}
            </button>
          </div>
          <div class="panel-collapsible">
            <section class="settings-block">
              <p class="section-label">${t('biteHints')}</p>
              <div class="hint-mode-grid">
                ${['beginner', 'subtle', 'off'].map((mode) => `
                  <button class="hint-mode${state.settings?.fishing?.biteHints === mode ? ' is-selected' : ''}" data-action="biteHints:${mode}" type="button">
                    ${t(`biteHints${toPascalCase(mode)}`)}
                  </button>
                `).join('')}
              </div>
            </section>
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

        ${state.ui?.fishingMinigame?.open ? '' : `<section class="panel actions-panel">
          <div class="action-grid">
            ${context.actions.map(actionButtonMarkup).join('')}
          </div>
        </section>`}

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

function menuButton(panelId, labelKey, collapsedPanels) {
  const open = !collapsedPanels[panelId];
  return `<button class="${open ? 'is-active' : ''}" data-action="panel:toggle:${panelId}" type="button">${t(labelKey)}</button>`;
}

function panelToggleIcon(isCollapsed) {
  return isCollapsed ? '&#9656;' : '&#9662;';
}

function panelToggleLabel(isCollapsed) {
  return isCollapsed ? t('show') : t('hide');
}

function toPascalCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
