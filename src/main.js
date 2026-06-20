import * as THREE from 'three';
import '../style.css';
import { createInitialState, pushLog } from './game/state.js';
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
import { createHud } from './ui/hud.js';
import { updateMapOverlayMotion } from './ui/mapOverlay.js';
import { getLanguage, toggleLanguage } from './i18n/i18n.js';

const canvas = document.querySelector('#game');
const hudRoot = document.querySelector('#hud');

let gameState = loadGame() ?? createInitialState();
ensureFishState(gameState);
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

const hud = createHud(hudRoot, {
  onAction(actionId) {
    audio.activate();

    if (actionId.startsWith('open:')) {
      const sceneId = actionId.replace('open:', '');
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

      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        [panelId]: !gameState.ui.collapsedPanels?.[panelId],
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('minigame:start:')) {
      const method = actionId.replace('minigame:start:', '');
      const normalizedMethod = method === 'liveBait' ? 'liveBait' : method;
      openFishingMinigame(gameState, normalizedMethod);
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
      castLine(gameState, performance.now());
      renderHud();
      return;
    }

    if (actionId === 'minigame:strike') {
      strikeLine(gameState, performance.now());
      renderHud();
      return;
    }

    if (actionId === 'minigame:keep') {
      keepCatch(gameState);
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
      castAgain(gameState);
      renderHud();
      return;
    }

    if (actionId === 'minigame:recast') {
      recastLine(gameState);
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

    const context = gameState.ui.activeScene
      ? getLocationSceneContext(gameState, gameState.ui.activeScene)
      : getInteractionContext(gameState, player.position);
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
    player.restore(gameState.player);
    audio.syncSettings(gameState.settings.audio);
    pushLog(gameState, 'logFreshMorning');
    renderHud();
  },
});

function syncPlayerToState() {
  gameState.player = player.snapshot();
}

function renderHud() {
  const context = gameState.ui.activeScene
    ? getLocationSceneContext(gameState, gameState.ui.activeScene)
    : getInteractionContext(gameState, player.position);
  const hudSnapshot = JSON.stringify({
    money: gameState.money,
    language: getLanguage(),
    inventory: gameState.inventory,
    purchased: gameState.purchased,
    audio: gameState.settings.audio,
    fishingSettings: gameState.settings.fishing,
    fishBasket: gameState.fishBasket,
    catchJournal: gameState.catchJournal,
    trophies: gameState.trophies,
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
  renderer.setSize(width, height, false);
  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
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
  syncPlayerToState();
  renderHud();
  audio.syncSettings(gameState.settings.audio);
  audio.drainQueue(gameState);
  renderer.render(world.scene, world.camera);
}

animate();
