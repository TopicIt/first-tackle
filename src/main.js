import * as THREE from 'three';
import '../style.css';
import { createInitialState, pushFeedback, pushLog } from './game/state.js';
import { createWorld } from './game/world.js';
import { createPlayerController } from './game/player.js';
import { ensureFishState } from './game/fishInventory.js';
import {
  castAgain,
  castLine,
  closeFishingMinigame,
  keepCatch,
  observeWater,
  openFishingMinigame,
  recastLine,
  releaseCurrentCatch,
  releaseKeepnetFish,
  releaseSmallFish,
  runFishingContextAction,
  selectFishingBait,
  selectFishingSpot,
  selectFishingZone,
  setBiteHintMode,
  strikeLine,
  tickFishingMinigame,
  useCatchAsLiveBait,
} from './game/fishingMinigameLogic.js';
import { getInteractionContext, getLocationSceneContext, runAction } from './game/interactions.js';
import { loadGame, resetGame, saveGame } from './game/save.js';
import { createAudioManager } from './audio/audioManager.js';
import { ensureMarketState, freshFishAtRisk } from './game/market.js';
import { ensureTackleState, equipTackleComponent, getRigMethod, selectActiveRig } from './game/tackle.js';
import { ensureTimeState, formatGameTime, getTimePhase } from './game/time.js';
import { canOpenWaterFromMap, getFishingLocation, getLockedReasonKey, isFishingLocation } from './game/locations.js';
import { getLocationTransition, markLocationTransitionVisit, shouldUseLocationTransitions } from './game/locationTransitions.js';
import { arriveAtWater } from './game/travel.js';
import { createHud } from './ui/hud.js';
import { updateMapOverlayMotion } from './ui/mapOverlay.js';
import {
  applyViewModeToDocument,
  loadStoredViewMode,
  normalizeViewMode,
  persistViewMode,
} from './ui/viewMode.js';
import { getLanguage, t, toggleLanguage } from './i18n/i18n.js';

const canvas = document.querySelector('#game');
const hudRoot = document.querySelector('#hud');

let gameState = loadGame() ?? createInitialState();
ensureFishState(gameState);
ensureMarketState(gameState);
ensureTackleState(gameState);
ensureTimeState(gameState);
normalizeTransitionSettings(gameState);
normalizeViewModeSettings(gameState);
applyViewModeToDocument(gameState);
normalizePanelStateForViewport(gameState);
pushLog(gameState, 'logMorning');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const world = createWorld();
const player = createPlayerController(world.scene, gameState.player);
const clock = new THREE.Clock();
let lastHudSnapshot = '';
const audio = createAudioManager(gameState.settings.audio);
let spaceIsDown = false;
let fishingActionLockedUntil = 0;

const hud = createHud(hudRoot, {
  onAction(actionId) {
    audio.activate();

    if (actionId.startsWith('open:')) {
      const sceneId = actionId.replace('open:', '');
      if (isFishingLocation(sceneId)) {
        if (!canOpenWaterFromMap(gameState, sceneId)) {
          pushLog(gameState, getLockedReasonKey(gameState, sceneId) === 'requiresBusTicket' ? 'logNeedBusTicket' : 'logNeedBicycleForTravel');
          renderHud();
          return;
        }
        arriveAtWater(gameState, sceneId);
        renderHud();
        return;
      }
      if (startLocationTransition(sceneId)) {
        return;
      }
      gameState.ui.activeScene = sceneId;
      gameState.ui.selectedHotspot = sceneId;
      gameState.audioQueue.push('open_scene');
      renderHud();
      return;
    }

    if (actionId.startsWith('panel:toggle:')) {
      const panelId = actionId.replace('panel:toggle:', '');
      if (panelId.startsWith('keepnetSpecies:')) {
        const fishId = panelId.replace('keepnetSpecies:', '');
        gameState.ui.expandedKeepnetSpecies = {
          ...(gameState.ui.expandedKeepnetSpecies ?? {}),
          [fishId]: !gameState.ui.expandedKeepnetSpecies?.[fishId],
        };
        gameState.audioQueue.push('ui_click');
        renderHud();
        return;
      }

      if (panelId.startsWith('marketSpecies:')) {
        const fishId = panelId.replace('marketSpecies:', '');
        gameState.ui.expandedMarketSpecies = {
          ...(gameState.ui.expandedMarketSpecies ?? {}),
          [fishId]: !gameState.ui.expandedMarketSpecies?.[fishId],
        };
        gameState.audioQueue.push('ui_click');
        renderHud();
        return;
      }

      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        [panelId]: !gameState.ui.collapsedPanels?.[panelId],
      };
      if (!gameState.ui.collapsedPanels[panelId]) {
        closeSiblingPanels(gameState, panelId);
      }
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'scene:map') {
      gameState.ui.activeScene = null;
      closeFishingMinigame(gameState);
      renderHud();
      return;
    }

    if (actionId.startsWith('market:tab:')) {
      gameState.ui.marketTab = actionId.replace('market:tab:', '');
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('guide:tab:')) {
      gameState.ui.guideTab = actionId.replace('guide:tab:', '');
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('tackle:equip:')) {
      const [, , slot, componentId] = actionId.split(':');
      equipTackleComponent(gameState, slot, componentId);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('tackle:rig:')) {
      selectActiveRig(gameState, actionId.replace('tackle:rig:', ''));
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('minigame:start:')) {
      const method = actionId.replace('minigame:start:', '');
      const normalizedMethod = method === 'active' ? getRigMethod(gameState) : method === 'liveBait' ? 'liveBait' : method;
      if (method === 'handline') {
        selectActiveRig(gameState, 'handline');
      }
      if (method === 'stickRod') {
        selectActiveRig(gameState, 'first_rod') || selectActiveRig(gameState, 'proper_rod');
      }
      openFishingMinigame(gameState, normalizedMethod);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('bait:')) {
      selectFishingBait(gameState, actionId.replace('bait:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('zone:')) {
      selectFishingZone(gameState, actionId.replace('zone:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('spot:')) {
      selectFishingSpot(gameState, actionId.replace('spot:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('biteHints:')) {
      setBiteHintMode(gameState, actionId.replace('biteHints:', ''));
      renderHud();
      return;
    }

    if (actionId === 'transitions:toggle') {
      gameState.settings.transitions = {
        ...(gameState.settings.transitions ?? {}),
        enabled: !gameState.settings.transitions?.enabled,
        explicit: true,
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('keepnet:releaseSmall:')) {
      releaseSmallFish(gameState, actionId.replace('keepnet:releaseSmall:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('keepnet:release:')) {
      releaseKeepnetFish(gameState, actionId.replace('keepnet:release:', ''));
      renderHud();
      return;
    }

    if (actionId === 'minigame:cast') {
      runLockedFishingAction(() => castLine(gameState, performance.now()));
      renderHud();
      return;
    }

    if (actionId === 'minigame:context') {
      runLockedFishingAction(() => runFishingContextAction(gameState, performance.now()));
      renderHud();
      return;
    }

    if (actionId === 'minigame:strike') {
      runLockedFishingAction(() => strikeLine(gameState, performance.now()));
      renderHud();
      return;
    }

    if (actionId === 'minigame:keep') {
      keepCatch(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:openKeepnet') {
      keepCatch(gameState);
      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        keepnet: false,
      };
      closeSiblingPanels(gameState, 'keepnet');
      renderHud();
      return;
    }

    if (actionId === 'minigame:release') {
      releaseCurrentCatch(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:liveBait') {
      useCatchAsLiveBait(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:castAgain') {
      runLockedFishingAction(() => castAgain(gameState));
      renderHud();
      return;
    }

    if (actionId === 'minigame:recast') {
      runLockedFishingAction(() => recastLine(gameState));
      renderHud();
      return;
    }

    if (actionId === 'minigame:observe') {
      observeWater(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:back') {
      closeFishingMinigame(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:menu') {
      gameState.ui.activeScene = null;
      closeFishingMinigame(gameState);
      renderHud();
      return;
    }

    const context = actionId.startsWith('buy:') || actionId.startsWith('sell:')
      ? getLocationSceneContext(gameState, 'market')
      : gameState.ui.activeScene
      ? getLocationSceneContext(gameState, gameState.ui.activeScene)
      : getInteractionContext(gameState, player.position);
    if (actionId === 'wait:tomorrow' && freshFishAtRisk(gameState) && !window.confirm(t('freshFishMayLoseValueConfirm'))) {
      return;
    }
    if (actionId.startsWith('ticket:buy:')) {
      const location = getFishingLocation(actionId.replace('ticket:buy:', ''));
      if (location && !window.confirm(t('ticketConfirm', { destination: t(location.labelKey), coins: location.ticketCost ?? 0 }))) {
        return;
      }
    }
    runAction(actionId, gameState, context);
    syncPlayerToState();
    renderHud();
  },
  onCloseScene() {
    audio.activate();
    gameState.ui.activeScene = null;
    closeFishingMinigame(gameState);
    renderHud();
  },
  onToggleLanguage() {
    audio.activate();
    toggleLanguage();
    gameState.audioQueue.push('ui_click');
    lastHudSnapshot = '';
    renderHud();
  },
  onAudioSetting(settingId, value) {
    audio.activate();
    if (settingId === 'soundEnabled' || settingId === 'musicEnabled') {
      gameState.settings.audio[settingId] = value === 'true';
      gameState.audioQueue.push('ui_click');
    } else {
      gameState.settings.audio[settingId] = Number(value);
    }
    audio.syncSettings(gameState.settings.audio);
    renderHud();
  },
  onTransitionDone() {
    finishLocationTransition();
  },
  onViewModeSetting(value) {
    audio.activate();
    gameState.settings.viewMode = normalizeViewMode(value);
    persistViewMode(gameState.settings.viewMode);
    applyViewModeToDocument(gameState);
    normalizePanelStateForViewport(gameState);
    gameState.audioQueue.push('ui_click');
    lastHudSnapshot = '';
    renderHud();
  },
  onCheat(value) {
    const match = String(value).trim().match(/^\+(\d{1,7})$/);
    const coins = match ? Number(match[1]) : 0;
    if (!Number.isSafeInteger(coins) || coins <= 0) {
      pushLog(gameState, 'logCheatInvalid');
      renderHud();
      return;
    }

    gameState.money += coins;
    pushFeedback(gameState, 'feedbackCoins', { coins }, 'coins');
    pushLog(gameState, 'logCheatCoins', { coins });
    gameState.audioQueue.push('coins');
    renderHud();
  },
  onSave() {
    audio.activate();
    gameState.player = player.snapshot();
    saveGame(gameState);
    pushLog(gameState, 'logSaved');
    renderHud();
  },
  onLoad() {
    audio.activate();
    const loaded = loadGame();
    if (loaded) {
      gameState = loaded;
      ensureFishState(gameState);
      ensureMarketState(gameState);
      ensureTackleState(gameState);
      ensureTimeState(gameState);
      normalizeTransitionSettings(gameState);
      normalizeViewModeSettings(gameState);
      applyViewModeToDocument(gameState);
      normalizePanelStateForViewport(gameState);
      player.restore(gameState.player);
      audio.syncSettings(gameState.settings.audio);
      pushLog(gameState, 'logLoaded');
    } else {
      pushLog(gameState, 'logNoSave');
    }
    renderHud();
  },
  onReset() {
    audio.activate();
    resetGame();
    gameState = createInitialState();
    ensureFishState(gameState);
    ensureMarketState(gameState);
    ensureTackleState(gameState);
    ensureTimeState(gameState);
    normalizeTransitionSettings(gameState);
    normalizeViewModeSettings(gameState);
    applyViewModeToDocument(gameState);
    normalizePanelStateForViewport(gameState);
    player.restore(gameState.player);
    audio.syncSettings(gameState.settings.audio);
    pushLog(gameState, 'logFreshMorning');
    renderHud();
  },
});

function syncPlayerToState() {
  gameState.player = player.snapshot();
}

function closeSiblingPanels(state, openedPanelId) {
  const exclusivePanels = ['inventory', 'keepnet', 'tackle', 'guide', 'journal', 'settings'];
  if (!exclusivePanels.includes(openedPanelId)) {
    return;
  }

  state.ui.collapsedPanels ??= {};
  for (const panelId of exclusivePanels) {
    if (panelId !== openedPanelId) {
      state.ui.collapsedPanels[panelId] = true;
    }
  }
}

function normalizePanelStateForViewport(state) {
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
  };

  const resolvedViewMode = applyViewModeToDocument(state);
  if (resolvedViewMode !== 'mobile') {
    return;
  }

  state.ui.collapsedPanels.status = false;

  for (const panelId of ['inventory', 'keepnet', 'tackle', 'guide', 'journal', 'settings']) {
    state.ui.collapsedPanels[panelId] = true;
  }
}

function normalizeViewModeSettings(state) {
  state.settings ??= {};
  state.settings.viewMode = normalizeViewMode(loadStoredViewMode() ?? state.settings.viewMode ?? 'auto');
}

function normalizeTransitionSettings(state) {
  state.settings ??= {};
  state.settings.transitions = {
    enabled: true,
    explicit: false,
    ...(state.settings.transitions ?? {}),
  };

  if (
    typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    && !state.settings.transitions.explicit
  ) {
    state.settings.transitions.enabled = false;
  }
}

function startLocationTransition(sceneId) {
  gameState.ui.transitionVisits ??= {};
  const transition = getLocationTransition(sceneId, gameState);
  if (!transition || !shouldUseLocationTransitions(gameState)) {
    return false;
  }

  markLocationTransitionVisit(gameState, transition);
  gameState.ui.locationTransition = transition;
  gameState.ui.selectedHotspot = sceneId;
  gameState.audioQueue.push('open_scene');
  renderHud();
  return true;
}

function finishLocationTransition() {
  const transition = gameState.ui.locationTransition;
  if (!transition) {
    return;
  }

  gameState.ui.locationTransition = null;
  if (transition.type === 'reward') {
    renderHud();
    return;
  }

  gameState.ui.activeScene = transition.targetScene;
  gameState.ui.selectedHotspot = transition.targetScene;
  gameState.audioQueue.push('open_scene');
  renderHud();
}

function renderHud() {
  const context = gameState.ui.activeScene
    ? getLocationSceneContext(gameState, gameState.ui.activeScene)
    : getInteractionContext(gameState, player.position);
  context.clock = formatGameTime(gameState);
  context.timePhase = getTimePhase(gameState);
  const hudSnapshot = JSON.stringify({
    money: gameState.money,
    language: getLanguage(),
    inventory: gameState.inventory,
    purchased: gameState.purchased,
    audio: gameState.settings.audio,
    fishingSettings: gameState.settings.fishing,
    transitionSettings: gameState.settings.transitions,
    viewMode: gameState.settings.viewMode,
    resolvedViewMode: gameState.ui.resolvedViewMode,
    fishBasket: gameState.fishBasket,
    catchJournal: gameState.catchJournal,
    trophies: gameState.trophies,
    market: gameState.market,
    travel: gameState.travel,
    ui: gameState.ui,
    feedback: gameState.feedback,
    log: gameState.log,
    zoneId: context.zoneId,
    zoneLabel: context.zoneLabel,
    hint: context.hint,
    actions: context.actions,
    sceneActions: context.sceneActions,
    availableActionLabels: context.availableActionLabels,
  });

  if (hudSnapshot !== lastHudSnapshot) {
    lastHudSnapshot = hudSnapshot;
    hud.render(gameState, context);
    updateMapOverlayMotion(performance.now());
  }
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const previousViewMode = gameState.ui?.resolvedViewMode;
  applyViewModeToDocument(gameState);
  if (previousViewMode !== gameState.ui?.resolvedViewMode) {
    normalizePanelStateForViewport(gameState);
    lastHudSnapshot = '';
    renderHud();
  }
  renderer.setSize(width, height, false);
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
}

function runLockedFishingAction(action) {
  const now = performance.now();
  if (now < fishingActionLockedUntil) {
    return false;
  }
  fishingActionLockedUntil = now + 500;
  action();
  return true;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || !gameState.ui.fishingMinigame?.open) {
    return;
  }

  if (event.repeat || spaceIsDown) {
    event.preventDefault();
    return;
  }

  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return;
  }

  event.preventDefault();
  spaceIsDown = true;
  audio.activate();
  runLockedFishingAction(() => runFishingContextAction(gameState, performance.now()));
  renderHud();
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    spaceIsDown = false;
  }
});
resize();
renderHud();
window.setInterval(() => {
  updateMapOverlayMotion(performance.now());
}, 250);

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  player.update(delta, world.bounds);
  world.updateCamera(player.position);
  world.animate(delta);
  tickFishingMinigame(gameState, performance.now());
  updateMapOverlayMotion(performance.now());
  gameState.settings.audio.musicTrackId = audio.getCurrentTrackId();
  syncPlayerToState();
  renderHud();
  audio.drainQueue(gameState);
  renderer.render(world.scene, world.camera);
}

animate();
