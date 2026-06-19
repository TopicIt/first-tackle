import * as THREE from 'three';
import '../style.css';
import { createInitialState, pushLog } from './game/state.js';
import { createWorld } from './game/world.js';
import { createPlayerController } from './game/player.js';
import { getInteractionContext, getLocationSceneContext, runAction } from './game/interactions.js';
import { loadGame, resetGame, saveGame } from './game/save.js';
import { createHud } from './ui/hud.js';
import { getLanguage, toggleLanguage } from './i18n/i18n.js';

const canvas = document.querySelector('#game');
const hudRoot = document.querySelector('#hud');

let gameState = loadGame() ?? createInitialState();
pushLog(gameState, 'logMorning');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const world = createWorld();
const player = createPlayerController(world.scene, gameState.player);
const clock = new THREE.Clock();
let lastHudSnapshot = '';

const hud = createHud(hudRoot, {
  onAction(actionId) {
    if (actionId.startsWith('open:')) {
      const sceneId = actionId.replace('open:', '');
      gameState.ui.activeScene = sceneId;
      gameState.ui.selectedHotspot = sceneId;
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
    gameState.ui.activeScene = null;
    renderHud();
  },
  onToggleLanguage() {
    toggleLanguage();
    lastHudSnapshot = '';
    renderHud();
  },
  onSave() {
    gameState.player = player.snapshot();
    saveGame(gameState);
    pushLog(gameState, 'logSaved');
    renderHud();
  },
  onLoad() {
    const loaded = loadGame();
    if (loaded) {
      gameState = loaded;
      player.restore(gameState.player);
      pushLog(gameState, 'logLoaded');
    } else {
      pushLog(gameState, 'logNoSave');
    }
    renderHud();
  },
  onReset() {
    resetGame();
    gameState = createInitialState();
    player.restore(gameState.player);
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

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  player.update(delta, world.bounds);
  world.updateCamera(player.position);
  world.animate(delta);
  syncPlayerToState();
  renderHud();
  renderer.render(world.scene, world.camera);
}

animate();
