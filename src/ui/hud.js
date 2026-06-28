import {
  catchJournalMarkup,
  achievementsMarkup,
  guideMarkup,
  inventoryMarkup,
  keepnetMarkup,
  logMarkup,
  mapViewerMarkup,
  profileMarkup,
  questsMarkup,
  tackleMarkup,
  avatarButtonMarkup,
} from './panels.js';
import { locationSceneMarkup } from './locationScene.js';
import { locationTransitionMarkup } from './locationTransition.js';
import { mapOverlayMarkup } from './mapOverlay.js';
import { syncFishingLineOverlay } from './fishingMinigame.js';
import { syncFishingPrototype3d } from './fishingPrototype3d.js';
import { getLanguage, t } from '../i18n/i18n.js';
import { buildInfo } from '../buildInfo.js';
import { DEFAULT_AVATAR, GAME_TITLE } from '../game/state.js';
import { profileAvatars, tutorialSteps } from '../game/profile.js';
import { assetPath } from '../utils/assetPath.js';

export function createHud(root, handlers) {
  const shownFeedbackIds = new Set();
  const preservedScrollPositions = new Map();
  let mobileMenuOpen = false;
  let pendingScrollRestore = null;

  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-audio-setting]');
    if (input) {
      handlers.onAudioSetting(input.dataset.audioSetting, input.value);
      return;
    }

    const profileName = event.target.closest('[data-profile-name-input]');
    if (profileName) {
      handlers.onProfileNameDraft?.(profileName.value);
    }
  });

  root.addEventListener('change', (event) => {
    const importInput = event.target.closest('input[data-save-import]');
    if (importInput?.files?.[0]) {
      const reader = new FileReader();
      reader.addEventListener('load', () => handlers.onImportSave?.(String(reader.result ?? '')));
      reader.readAsText(importInput.files[0]);
      importInput.value = '';
      return;
    }

    const viewModeInput = event.target.closest('[data-view-mode-setting]');
    if (viewModeInput) {
      handlers.onViewModeSetting(viewModeInput.value);
      return;
    }

    const checkbox = event.target.closest('input[data-audio-setting][type="checkbox"]');
    if (!checkbox) {
      return;
    }

    handlers.onAudioSetting(checkbox.dataset.audioSetting, checkbox.checked ? 'true' : 'false');
  });

  root.addEventListener('toggle', (event) => {
    if (event.target.matches('.mobile-menu')) {
      mobileMenuOpen = event.target.open;
    }
  }, true);

  root.addEventListener('scroll', (event) => {
    const el = event.target instanceof Element ? event.target.closest('[data-scroll-preserve]') : null;
    if (!el || !root.contains(el)) {
      return;
    }

    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      preservedScrollPositions.set(el.dataset.scrollPreserve, {
        key: el.dataset.scrollPreserve,
        top: el.scrollTop,
        left: el.scrollLeft,
      });
    } else {
      preservedScrollPositions.delete(el.dataset.scrollPreserve);
    }
  }, true);

  root.addEventListener('pointerdown', (event) => {
    const dragHandle = event.target.closest('[data-tutorial-drag]');
    if (dragHandle) {
      startTutorialDrag(event, root, handlers);
      return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) {
      return;
    }

    const preservedScroll = capturePreservedScroll(root, button.dataset.action, preservedScrollPositions, button);
    rememberPreservedScroll(preservedScrollPositions, preservedScroll);
    pendingScrollRestore = preservedScroll;
  }, true);

  root.addEventListener('submit', (event) => {
    const profileForm = event.target.closest('[data-profile-form]');
    if (profileForm) {
      event.preventDefault();
      const data = new FormData(profileForm);
      handlers.onProfileSubmit?.({
        name: data.get('name'),
      });
      return;
    }

    const form = event.target.closest('[data-cheat-form]');
    if (!form) {
      return;
    }

    event.preventDefault();
    const input = form.querySelector('[data-cheat-input]');
    handlers.onCheat(input?.value ?? '');
    if (input) {
      input.value = '';
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('.illustrated-map') && !event.target.closest('button[data-action]')) {
      root.querySelector('.mobile-menu[open]')?.removeAttribute('open');
      mobileMenuOpen = false;
      return;
    }

    const closeButton = event.target.closest('button[data-scene-close]');
    if (closeButton) {
      handlers.onDismissStartupTitle?.();
      handlers.onCloseScene();
      return;
    }

    const languageButton = event.target.closest('button[data-language-toggle]');
    if (languageButton) {
      handlers.onDismissStartupTitle?.();
      languageButton.closest('.mobile-menu')?.removeAttribute('open');
      mobileMenuOpen = false;
      handlers.onToggleLanguage();
      return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) {
      return;
    }

    const action = button.dataset.action;
    const mobileMenu = button.closest('.mobile-menu');
    const preservedScroll = capturePreservedScroll(root, action, preservedScrollPositions, button);
    rememberPreservedScroll(preservedScrollPositions, preservedScroll);
    if (preservedScroll) {
      pendingScrollRestore = preservedScroll;
    }
    const panelToggleFromMobileMenu = action.startsWith('panel:toggle:') && Boolean(mobileMenu);
    const keepMobileMenuOpen = action.startsWith('panel:toggle:')
      && !panelToggleFromMobileMenu
      && (mobileMenuOpen || Boolean(root.querySelector('.mobile-menu[open]')) || Boolean(mobileMenu));
    handlers.onDismissStartupTitle?.();
    if (!action.startsWith('panel:toggle:') || panelToggleFromMobileMenu) {
      mobileMenu?.removeAttribute('open');
      mobileMenuOpen = false;
    } else if (keepMobileMenuOpen || mobileMenu) {
      mobileMenuOpen = true;
    }

    if (action === 'save') handlers.onSave();
    else if (action === 'load') handlers.onLoad();
    else if (action === 'reset') handlers.onReset();
    else if (action === 'transition:skip') handlers.onTransitionDone();
    else handlers.onAction(action);

    restoreMobileMenu(root, keepMobileMenuOpen);
    if (preservedScroll) {
      restorePreservedScroll(root, preservedScroll);
    }
    if (pendingScrollRestore) {
      restorePreservedScroll(root, pendingScrollRestore);
      pendingScrollRestore = null;
    }
  });

  return {
    render(state, context) {
      const visibleFeedback = (state.feedback ?? []).filter((feedback) => !shownFeedbackIds.has(feedback.id));
      const renderState = { ...state, feedback: visibleFeedback };
      const collapsedPanels = state.ui?.collapsedPanels ?? {};
      const statusCollapsed = collapsedPanels.status ? ' is-collapsed' : '';
      const profileCollapsed = collapsedPanels.profile ? ' is-collapsed' : '';
      const inventoryCollapsed = collapsedPanels.inventory ? ' is-collapsed' : '';
      const keepnetCollapsed = collapsedPanels.keepnet ? ' is-collapsed' : '';
      const journalCollapsed = collapsedPanels.journal ? ' is-collapsed' : '';
      const tackleCollapsed = collapsedPanels.tackle ? ' is-collapsed' : '';
      const guideCollapsed = collapsedPanels.guide ? ' is-collapsed' : '';
      const settingsCollapsed = collapsedPanels.settings ? ' is-collapsed' : '';
      const achievementsCollapsed = collapsedPanels.achievements ? ' is-collapsed' : '';
      const questsCollapsed = collapsedPanels.quests ? ' is-collapsed' : '';
      const mapViewerCollapsed = collapsedPanels.mapViewer ? ' is-collapsed' : '';

      root.innerHTML = `
        ${mapOverlayMarkup(renderState)}
        ${state.ui?.startupTitleDismissed ? '' : `<div class="startup-title" aria-hidden="true">${t('appTitle')}</div>`}
        <div class="coin-hud" aria-label="${t('coins')}">
          <span class="coin-hud__icon" aria-hidden="true"></span>
          <strong>${state.money}</strong>
        </div>
        <button class="quest-notebook-button${collapsedPanels.quests ? '' : ' is-open'}" data-action="panel:toggle:quests" type="button" aria-label="${t('activeQuests')}">
          <span aria-hidden="true"></span>
          <strong>${t('activeQuests')}</strong>
        </button>

        <section class="panel glass-menu status-panel${statusCollapsed}">
          <div class="panel-toggle-row">
            <h1 class="title">${t('appTitle')}</h1>
            <button class="panel-toggle" data-action="panel:toggle:status" type="button" aria-label="${panelToggleLabel(collapsedPanels.status)}">
              ${panelToggleIcon(collapsedPanels.status)}
            </button>
          </div>
          <div class="panel-collapsible">
            <p class="hint"><strong>${context.zoneLabel}</strong><br>${context.hint}</p>
            <p class="clock-line">${t('dayLabel', { day: state.day })} · ${t(`timePhase${toPascalCase(context.timePhase ?? 'morning')}`)} · ${context.clock ?? ''}</p>
            <details class="mobile-menu"${mobileMenuOpen ? ' open' : ''}>
              <summary aria-label="${t('menu')}" title="${t('menu')}">
                <span></span><span></span><span></span>
              </summary>
              <div class="mobile-menu__sheet">
                <nav class="mobile-menu__list">
                  ${menuButton('profile', 'profile', collapsedPanels)}
                  ${menuButton('inventory', 'inventory', collapsedPanels)}
                  ${menuButton('keepnet', 'keepnet', collapsedPanels)}
                  ${menuButton('tackle', 'tackle', collapsedPanels)}
                  ${menuButton('guide', 'fishermanGuide', collapsedPanels)}
                  ${menuButton('journal', 'catchJournal', collapsedPanels)}
                  ${menuButton('quests', 'activeQuests', collapsedPanels)}
                  ${menuButton('achievements', 'achievements', collapsedPanels)}
                  ${menuButton('mapViewer', 'map', collapsedPanels)}
                  ${menuButton('settings', 'settings', collapsedPanels)}
                </nav>
                <div class="mobile-menu__service">
                  <button data-action="save" type="button">${t('save')}</button>
                  <button data-action="load" type="button">${t('load')}</button>
                  <button data-action="reset" type="button">${t('reset')}</button>
                  <button data-language-toggle="true" type="button" aria-label="Switch language">${getLanguage().toUpperCase()} / ${t('languageToggle')}</button>
                </div>
              </div>
            </details>
            <nav class="main-menu">
              ${menuButton('profile', 'profile', collapsedPanels)}
              ${menuButton('inventory', 'inventory', collapsedPanels)}
              ${menuButton('keepnet', 'keepnet', collapsedPanels)}
              ${menuButton('tackle', 'tackle', collapsedPanels)}
              ${menuButton('guide', 'fishermanGuide', collapsedPanels)}
              ${menuButton('journal', 'catchJournal', collapsedPanels)}
              ${menuButton('quests', 'activeQuests', collapsedPanels)}
              ${menuButton('achievements', 'achievements', collapsedPanels)}
              ${menuButton('mapViewer', 'map', collapsedPanels)}
              ${menuButton('settings', 'settings', collapsedPanels)}
            </nav>
            <div class="save-row">
              <button data-action="save" type="button">${t('save')}</button>
              <button data-action="load" type="button">${t('load')}</button>
              <button data-action="reset" type="button">${t('reset')}</button>
              <button data-language-toggle="true" type="button" aria-label="Switch language">${getLanguage().toUpperCase()} / ${t('languageToggle')}</button>
            </div>
          </div>
        </section>

        <section class="panel glass-menu side-detail-panel profile-panel${profileCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('profile')}</p>
            <button class="panel-toggle" data-action="panel:toggle:profile" type="button" aria-label="${panelToggleLabel(collapsedPanels.profile)}">
              ${panelToggleIcon(collapsedPanels.profile)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${profileMarkup(state)}
          </div>
        </section>

        <section class="panel glass-menu side-detail-panel inventory-panel${inventoryCollapsed}">
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

        <section class="panel glass-menu side-detail-panel keepnet-panel${keepnetCollapsed}">
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

        <section class="panel glass-menu side-detail-panel journal-panel${journalCollapsed}">
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

        <section class="panel glass-menu side-detail-panel tackle-panel${tackleCollapsed}">
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

        <section class="panel glass-menu side-detail-panel journal-panel achievements-panel${achievementsCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('achievements')}</p>
            <button class="panel-toggle" data-action="panel:toggle:achievements" type="button" aria-label="${panelToggleLabel(collapsedPanels.achievements)}">
              ${panelToggleIcon(collapsedPanels.achievements)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${achievementsMarkup(state)}
          </div>
        </section>

        <section class="panel glass-menu side-detail-panel journal-panel quests-panel${questsCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('activeQuests')}</p>
            <button class="panel-toggle" data-action="panel:toggle:quests" type="button" aria-label="${panelToggleLabel(collapsedPanels.quests)}">
              ${panelToggleIcon(collapsedPanels.quests)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${questsMarkup(state)}
          </div>
        </section>

        <section class="panel glass-menu side-detail-panel guide-panel map-viewer-panel${mapViewerCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('map')}</p>
            <button class="panel-toggle" data-action="panel:toggle:mapViewer" type="button" aria-label="${panelToggleLabel(collapsedPanels.mapViewer)}">
              ${panelToggleIcon(collapsedPanels.mapViewer)}
            </button>
          </div>
          <div class="panel-collapsible">
            ${mapViewerMarkup(state)}
          </div>
        </section>

        <section class="panel glass-menu side-detail-panel guide-panel${guideCollapsed}">
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

        <section class="panel glass-menu side-detail-panel settings-panel${settingsCollapsed}">
          <div class="panel-toggle-row">
            <p class="section-label">${t('settings')}</p>
            <button class="panel-toggle" data-action="panel:toggle:settings" type="button" aria-label="${panelToggleLabel(collapsedPanels.settings)}">
              ${panelToggleIcon(collapsedPanels.settings)}
            </button>
          </div>
          <div class="panel-collapsible">
            <section class="settings-block">
              <p class="section-label">${t('viewMode')}</p>
              <div class="view-mode-grid">
                ${['auto', 'mobile', 'desktop'].map((mode) => `
                  <label class="view-mode-option${(state.settings?.viewMode ?? 'auto') === mode ? ' is-selected' : ''}">
                    <input data-view-mode-setting type="radio" name="view-mode" value="${mode}"${(state.settings?.viewMode ?? 'auto') === mode ? ' checked' : ''} />
                    <span>${t(`viewMode${toPascalCase(mode)}`)}</span>
                  </label>
                `).join('')}
              </div>
              <small>${t('viewModeHint')}</small>
            </section>
            <section class="settings-block">
              <p class="section-label">${t('language')}</p>
              <div class="settings-flag-card">
                <div>
                  <strong>${getLanguage().toUpperCase()}</strong>
                  <small>${t('languageToggle')}</small>
                </div>
                <button data-language-toggle="true" type="button">${t('languageToggle')}</button>
              </div>
            </section>
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
            <section class="settings-block">
              <p class="section-label">${t('transitionAnimations')}</p>
              <div class="settings-flag-card">
                <div>
                  <strong>${state.settings?.transitions?.enabled === false ? t('disabled') : t('enabled')}</strong>
                  <small>${t('transitionAnimationsHint')}</small>
                </div>
                <button data-action="transitions:toggle" type="button">
                  ${state.settings?.transitions?.enabled === false ? t('enableTransitions') : t('disableTransitions')}
                </button>
              </div>
            </section>
            <section class="settings-block">
              <p class="section-label">${t('introSettings')}</p>
              <div class="settings-action-row settings-action-row--stack">
                <button data-action="intro:replay" type="button">${t('replayIntro')}</button>
                <button data-action="intro:showOnStartup" type="button">
                  ${state.settings?.intro?.showOnStartup ? t('introStartupOn') : t('introStartupOff')}
                </button>
              </div>
            </section>
            <section class="settings-block">
              <p class="section-label">${t('saveManagement')}</p>
              <div class="settings-action-row settings-action-row--stack">
                <button data-action="save:now" type="button">${t('saveNow')}</button>
                <button data-action="save:export" type="button">${t('exportSave')}</button>
                <label class="file-import-button">
                  <input data-save-import type="file" accept="application/json,.json" />
                  <span>${t('importSave')}</span>
                </label>
                <button class="danger" data-action="save:reset" type="button">${t('resetProgress')}</button>
              </div>
            </section>
            <section class="settings-block">
              <p class="section-label">${t('cheats')}</p>
              <div class="settings-action-row settings-action-row--stack">
                <button data-action="debug:unlockAllLocations" type="button">${t('unlockAllLocations')}</button>
              </div>
              <form class="cheat-form" data-cheat-form>
                <input data-cheat-input type="text" inputmode="text" placeholder="+1000" autocomplete="off" />
                <button type="submit">${t('apply')}</button>
              </form>
              <small>${t('cheatsHint')}</small>
            </section>
            <section class="settings-block build-info">
              <p class="section-label">${t('buildInfo')}</p>
              <dl>
                <div><dt>${t('buildBranch')}</dt><dd>${buildInfo.branch}</dd></div>
                <div><dt>${t('buildCommit')}</dt><dd>${buildInfo.commit}</dd></div>
                <div><dt>${t('buildTime')}</dt><dd>${buildInfo.time}</dd></div>
              </dl>
            </section>
            <section class="settings-block">
              <p class="section-label">${t('sound')}</p>
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
            </section>
          </div>
        </section>

        ${state.ui?.fishingMinigame?.open || !state.ui?.activeScene ? '' : `<section class="panel glass-menu actions-panel">
          <div class="action-grid">
            ${context.actions.map(actionButtonMarkup).join('')}
          </div>
        </section>`}

        <section class="panel glass-menu log-panel">
          <p class="section-label">${t('log')}</p>
          <ul class="log-list">${logMarkup(state)}</ul>
        </section>

        ${locationSceneMarkup(renderState, context)}
        ${locationTransitionMarkup(state.ui?.locationTransition)}
        ${tutorialPromptMarkup(state)}
        ${startupOverlayMarkup(state)}
      `;

      restoreMobileMenu(root, mobileMenuOpen);
      const scrollRestore = pendingScrollRestore ?? getRememberedScroll(preservedScrollPositions);
      if (scrollRestore) {
        restorePreservedScroll(root, scrollRestore);
        pendingScrollRestore = null;
      }

      for (const feedback of visibleFeedback) {
        shownFeedbackIds.add(feedback.id);
      }

      setupLocationTransition(root, state, handlers);
      setupStartupVideo(root, handlers);
      syncFishingPrototype3d(root, state);
      syncFishingLineOverlay(root);
      window.requestAnimationFrame(() => syncFishingLineOverlay(root));
    },
  };

}

function capturePreservedScroll(root, action, rememberedEntries, actionElement) {
  if (!shouldPreserveScroll(action)) {
    return null;
  }

  const closestEntry = scrollEntryForElement(actionElement?.closest('[data-scroll-preserve]'));
  if (closestEntry) {
    return [closestEntry];
  }

  const entries = [...root.querySelectorAll('[data-scroll-preserve]')]
    .map(scrollEntryForElement)
    .filter(Boolean);

  return entries.length ? entries : getRememberedScroll(rememberedEntries);
}

function startupOverlayMarkup(state) {
  const step = state.ui?.startupStep;
  if (!step) {
    return '';
  }

  if (step === 'loading') {
    return `
      <section class="startup-flow" aria-label="${t('loading')}">
        <div class="startup-flow__panel">
          <img class="startup-flow__logo" src="${assetPath('/assets/logo/logo-mark.png')}" onerror="this.style.display='none'" alt="" />
          <h1>${GAME_TITLE}</h1>
          <span class="startup-flow__loader" aria-hidden="true"></span>
        </div>
      </section>
    `;
  }

  if (step === 'introChoice') {
    return `
      <section class="startup-flow" aria-label="${t('introChoice')}">
        <div class="startup-flow__panel startup-flow__panel--choice">
          <img class="startup-flow__logo" src="${assetPath('/assets/logo/logo-mark.png')}" onerror="this.style.display='none'" alt="" />
          <h1>${GAME_TITLE}</h1>
          <div class="startup-flow__actions">
            <button data-action="startup:intro:watch" type="button">${t('watchIntro')}</button>
            <button data-action="startup:intro:skip" type="button">${t('skipIntro')}</button>
          </div>
        </div>
      </section>
    `;
  }

  if (step === 'introVideo') {
    const sources = [
      `<source src="${assetPath('/assets/intro/intro-childhood-fishing.webm')}" type="video/webm" />`,
      `<source src="${assetPath('/assets/intro/intro-childhood-fishing.mp4')}" type="video/mp4" />`,
    ].join('');
    return `
      <section class="startup-flow startup-flow--video" aria-label="${t('watchIntro')}">
        <video class="startup-flow__video" data-intro-video playsinline preload="metadata">
          ${sources}
        </video>
        <div class="startup-flow__video-actions">
          <button class="icon-toggle${state.settings?.transitions?.enabled === false ? '' : ' is-on'}" data-action="transitions:toggle" type="button" aria-label="${t('transitionAnimations')}">●</button>
          <button data-action="startup:intro:done" type="button">${t('skipIntro')}</button>
        </div>
      </section>
    `;
  }

  if (step === 'profile') {
    const selectedAvatar = state.playerProfile?.avatar ?? DEFAULT_AVATAR;
    return `
      <section class="startup-flow" aria-label="${t('profile')}">
        <form class="startup-flow__panel profile-form" data-profile-form>
          <img class="startup-flow__logo" src="${assetPath('/assets/logo/logo-mark.png')}" onerror="this.style.display='none'" alt="" />
          <h1>${GAME_TITLE}</h1>
          <img class="profile-form__selected" src="${assetPath(selectedAvatar)}" onerror="this.src='${assetPath(DEFAULT_AVATAR)}'" alt="" />
          <input data-profile-name-input name="name" type="text" autocomplete="name" value="${escapeHtml(state.playerProfile?.name ?? '')}" placeholder="${t('defaultPlayerName')}" />
          <div class="avatar-grid">
            ${profileAvatars.map((avatar) => avatarButtonMarkup(avatar, selectedAvatar)).join('')}
          </div>
          <button type="submit">${t('next')}</button>
        </form>
      </section>
    `;
  }

  return '';
}

function tutorialPromptMarkup(state) {
  if (!state.playerProfile?.setupComplete || state.tutorialState?.completed || state.tutorialState?.skipped || state.tutorialState?.closed || state.ui?.startupStep) {
    return '';
  }

  if (state.tutorialState?.started) {
    const step = tutorialSteps[state.tutorialState.step ?? 0];
    if (!step) {
      return '';
    }
    const collapsed = state.tutorialState?.collapsed;
    const position = state.tutorialState?.position ?? {};
    const style = position.x != null && position.y != null
      ? ` style="left:${position.x}px;top:${position.y}px;right:auto;bottom:auto;transform:none;"`
      : '';
    const label = t(step.labelKey ?? 'firstTackleTutorial');
    return `
      <aside class="tutorial-float tutorial-float--helper${collapsed ? ' is-collapsed' : ''}" data-tutorial-panel${style}>
        <div class="tutorial-float__row" data-tutorial-drag>
          <p class="section-label">${t('firstTackleTutorial')}</p>
          <div>
            <button class="tutorial-float__tiny" data-action="tutorial:toggle" type="button" aria-label="${collapsed ? t('show') : t('hide')}">${collapsed ? '&#9656;' : '&#9662;'}</button>
            <button class="tutorial-float__tiny" data-action="tutorial:close" type="button" aria-label="${t('close')}">&times;</button>
          </div>
        </div>
        ${collapsed ? `
          <button class="tutorial-float__mini" data-action="tutorial:toggle" type="button">
            ${label}
          </button>
        ` : `
          <h2>${label}</h2>
          <p>${t(step.placeKey ?? 'tutorialCollectHint')}</p>
          <small>${t('tutorialPressButton', { button: t(tutorialActionLabelKey(step.actionId)) })}</small>
        `}
      </aside>
    `;
  }

  if (state.tutorialState?.promptDismissed) {
    return '';
  }

  return `
    <aside class="tutorial-float tutorial-float--prompt">
      <button class="tutorial-float__close" data-action="tutorial:close" type="button" aria-label="${t('close')}">&times;</button>
      <p>${t('tutorialDrawerImmediateHint')}</p>
      <button class="tutorial-float__start" data-action="tutorial:start" type="button">${t('startTutorial')}</button>
    </aside>
  `;
}

function startTutorialDrag(event, root, handlers) {
  const panel = event.target.closest('[data-tutorial-panel]');
  if (!panel || event.target.closest('button')) {
    return;
  }

  event.preventDefault();
  panel.setPointerCapture?.(event.pointerId);
  const startRect = panel.getBoundingClientRect();
  const offsetX = event.clientX - startRect.left;
  const offsetY = event.clientY - startRect.top;

  const move = (moveEvent) => {
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const x = Math.min(window.innerWidth - width - 8, Math.max(8, moveEvent.clientX - offsetX));
    const y = Math.min(window.innerHeight - height - 8, Math.max(8, moveEvent.clientY - offsetY));
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
  };

  const stop = () => {
    root.removeEventListener('pointermove', move, true);
    root.removeEventListener('pointerup', stop, true);
    root.removeEventListener('pointercancel', stop, true);
    handlers.onTutorialPosition?.({
      x: Math.round(panel.getBoundingClientRect().left),
      y: Math.round(panel.getBoundingClientRect().top),
    });
  };

  root.addEventListener('pointermove', move, true);
  root.addEventListener('pointerup', stop, true);
  root.addEventListener('pointercancel', stop, true);
}

function setupStartupVideo(root, handlers) {
  const video = root.querySelector('[data-intro-video]');
  if (!video) {
    return;
  }

  const done = () => handlers.onAction?.('startup:intro:done');
  video.addEventListener('ended', done, { once: true });
  video.addEventListener('error', done, { once: true });
  const play = () => video.play().catch(() => {});
  if (video.readyState >= 2) {
    play();
  } else {
    video.addEventListener('loadeddata', play, { once: true });
    video.load();
  }
}

function scrollEntryForElement(el) {
  if (!el || (el.scrollTop <= 0 && el.scrollLeft <= 0)) {
    return null;
  }

  return {
    key: el.dataset.scrollPreserve,
    top: el.scrollTop,
    left: el.scrollLeft,
  };
}

function rememberPreservedScroll(rememberedEntries, entries) {
  if (!entries) {
    return;
  }

  for (const entry of entries) {
    rememberedEntries.set(entry.key, entry);
  }
}

function getRememberedScroll(rememberedEntries) {
  const entries = [...rememberedEntries.values()].filter((entry) => entry.top > 0 || entry.left > 0);
  return entries.length ? entries : null;
}

function restorePreservedScroll(root, entries) {
  if (!entries) {
    return;
  }

  const apply = () => {
    for (const entry of entries) {
      const el = root.querySelector(`[data-scroll-preserve="${entry.key}"]`);
      if (el) {
        el.scrollTop = entry.top;
        el.scrollLeft = entry.left;
      }
    }
  };

  window.requestAnimationFrame(() => {
    apply();
    window.requestAnimationFrame(apply);
    window.setTimeout(apply, 40);
    window.setTimeout(apply, 140);
  });
}

function restoreMobileMenu(root, shouldOpen) {
  if (!shouldOpen) {
    return;
  }

  window.requestAnimationFrame(() => {
    root.querySelector('.mobile-menu')?.setAttribute('open', '');
  });
}

function shouldPreserveScroll(action) {
  return action.startsWith('buy:')
    || action.startsWith('sell:')
    || action.startsWith('market:tab:')
    || action.startsWith('panel:toggle:marketSpecies:');
}

  function setupLocationTransition(root, state, handlers) {
  if (!state.ui?.locationTransition) {
    return;
  }

  const video = root.querySelector('[data-transition-video]');
  if (!video) {
    window.setTimeout(handlers.onTransitionDone, 650);
    return;
  }

  let finished = false;
  const startedAt = performance.now();
  const minVisibleMs = state.ui.locationTransition?.type === 'reward' ? 1800 : 900;
  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    const remainingMs = Math.max(0, minVisibleMs - (performance.now() - startedAt));
    window.setTimeout(handlers.onTransitionDone, remainingMs);
  };
  const fallback = () => window.setTimeout(finish, minVisibleMs);

  video.addEventListener('ended', finish, { once: true });
  video.addEventListener('error', fallback, { once: true });
  video.addEventListener('stalled', fallback, { once: true });
  video.addEventListener('abort', fallback, { once: true });

  const startPlayback = () => {
    const playResult = video.play();
    if (playResult?.catch) {
      playResult.catch(fallback);
    }
  };

  if (video.readyState >= 2) {
    startPlayback();
  } else {
    video.addEventListener('loadeddata', startPlayback, { once: true });
    video.load();
  }

  window.setTimeout(() => {
    if (!finished && video.readyState === 0) {
      fallback();
    }
  }, 1400);
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
  return `<button class="glass-menu-button${open ? ' is-active' : ''}" data-action="panel:toggle:${panelId}" type="button">${t(labelKey)}</button>`;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tutorialActionLabelKey(actionId) {
  return {
    'open:house': 'openHouse',
    'drawer:open': 'drawerCollectAction',
    'drawer:complete': 'drawerSearchAction',
    'open:canal': 'openPond',
    'minigame:start:active': 'startFishingWithTackle',
  }[actionId] ?? 'collectPart';
}
