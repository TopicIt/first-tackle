import * as THREE from 'three';
import '../style.css';
import { DEFAULT_AVATAR, GAME_TITLE, createInitialState, pushFeedback, pushLog } from './game/state.js';
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
  selectFishingDepth,
  selectFishingSpot,
  selectFishingZone,
  setBiteHintMode,
  strikeLine,
  tickFishingMinigame,
  useCatchAsLiveBait,
} from './game/fishingMinigameLogic.js';
import { getInteractionContext, getLocationSceneContext, runAction } from './game/interactions.js';
import { exportSave, importSave, loadGame, resetGame, saveGame } from './game/save.js';
import { createAudioManager } from './audio/audioManager.js';
import { ensureMarketState, freshFishAtRisk } from './game/market.js';
import { addItem } from './game/inventory.js';
import { ensureTackleState, equipTackleComponent, getRigMethod } from './game/tackle.js';
import { ensureTimeState, formatGameTime, getTimeOfDayBucket, getTimePhase } from './game/time.js';
import { canOpenWaterFromMap, canSelectWaterForFishing, canUseBusStation, getFishingLocation, getLockedReasonKey, isFishingLocation } from './game/locations.js';
import {
  INTRO_VIDEO_ANIMATION_ID,
  canPlayLimitedAnimation,
  getLocationTransition,
  markLocationTransitionVisit,
  normalizeAnimationLimits,
  recordLimitedAnimationPlay,
  resetAnimationLimits,
  shouldUseLocationTransitions,
} from './game/locationTransitions.js';
import { selectProfileStar, syncCompletedSpeciesStars } from './game/achievementStars.js';
import { arriveAtWater } from './game/travel.js';
import { claimQuestReward, ensureQuestState, syncQuestProgress, unlockAllLocationsForDebug } from './game/quests.js';
import { completeCafeOrder, ensureCafeOrders } from './game/cafeOrders.js';
import {
  completeTutorialStep,
  advanceTutorialForAction,
  ensureProfileState,
  grantPrimitiveTackle,
  selectAvatar,
  skipTutorial,
  startTutorial,
  syncGrandmaTrust,
  updateProfileDraftName,
  setCustomAvatar,
  updateProfile,
} from './game/profile.js';
import {
  ensureStarterTackleDrawerState,
  findDrawerItem,
  hasStarterTackleDrawerCompleted,
} from './game/starterTackleDrawer.js';
import {
  claimWormDiggingReward,
  closeWormDiggingGame,
  digWormSoil,
  openWormDiggingGame,
  searchWormDigSpot,
} from './game/wormDigging.js';
import { createHud } from './ui/hud.js';
import { updateMapOverlayMotion } from './ui/mapOverlay.js';
import {
  applyViewModeToDocument,
  loadStoredViewMode,
  normalizeViewMode,
  persistViewMode,
} from './ui/viewMode.js';
import { getLanguage, t, toggleLanguage } from './i18n/i18n.js';
import { assetPath } from './utils/assetPath.js';
import { getWorldMapAsset } from './utils/worldMapAsset.js';

const canvas = document.querySelector('#game');
const hudRoot = document.querySelector('#hud');

let gameState = loadGame() ?? createInitialState();
ensureFishState(gameState);
ensureMarketState(gameState);
ensureTackleState(gameState);
ensureStarterTackleDrawerState(gameState);
ensureTimeState(gameState);
ensureProfileState(gameState);
ensureQuestState(gameState);
ensureCafeOrders(gameState);
syncGrandmaTrust(gameState);
syncCompletedSpeciesStars(gameState);
normalizeTransitionSettings(gameState);
applyPerformanceSettings(gameState);
normalizeAnimationLimits(gameState);
normalizeViewModeSettings(gameState);
resetLaunchUiState(gameState);
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
let lastHudRenderAt = 0;
let rememberedMarketScrollTop = 0;
let lastAutosaveAt = 0;
let lastAutosaveSignature = '';
let autosaveTimer = null;

const hud = createHud(hudRoot, {
  onAction(actionId) {
    dismissStartupTitle();
    audio.activate();

    if (actionId.startsWith('startup:')) {
      handleStartupAction(actionId);
      renderHud();
      return;
    }

    if (actionId.startsWith('profile:avatar:')) {
      selectAvatar(gameState, actionId.replace('profile:avatar:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('profile:star:')) {
      selectProfileStar(gameState, actionId.replace('profile:star:', ''));
      renderHud();
      return;
    }

    if (actionId === 'profile:edit') {
      gameState.ui.editingProfile = true;
      renderHud();
      return;
    }

    if (actionId === 'profile:open') {
      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        profile: false,
      };
      closeSiblingPanels(gameState, 'profile');
      renderHud();
      return;
    }

    if (actionId === 'profile:cancelEdit') {
      gameState.ui.editingProfile = false;
      renderHud();
      return;
    }

    if (actionId === 'tutorial:start') {
      startTutorial(gameState);
      gameState.tutorialState.collapsed = true;
      renderHud();
      return;
    }

    if (actionId === 'tutorial:skip') {
      skipTutorial(gameState);
      saveGame(gameState);
      renderHud();
      return;
    }

    if (actionId === 'tutorial:close') {
      skipTutorial(gameState);
      saveGame(gameState);
      renderHud();
      return;
    }

    if (actionId === 'tutorial:toggle') {
      gameState.tutorialState = {
        ...(gameState.tutorialState ?? {}),
        collapsed: !gameState.tutorialState?.collapsed,
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'tutorial:step') {
      completeTutorialStep(gameState);
      renderHud();
      return;
    }

    if (actionId === 'drawer:open') {
      if (!hasStarterTackleDrawerCompleted(gameState)) {
        gameState.ui.starterTackleDrawerOpen = true;
        gameState.ui.starterTackleDrawerMessage = 'drawerHint';
      }
      advanceTutorialForAction(gameState, actionId);
      renderHud();
      return;
    }

    if (actionId === 'drawer:close') {
      gameState.ui.starterTackleDrawerOpen = false;
      renderHud();
      return;
    }

    if (actionId === 'drawer:goCanal') {
      gameState.ui.starterTackleDrawerOpen = false;
      enterFishingWater('canal');
      advanceTutorialForAction(gameState, 'open:canal');
      renderHud();
      return;
    }

    if (actionId.startsWith('drawer:find:')) {
      const itemId = actionId.replace('drawer:find:', '');
      findDrawerItem(gameState, itemId);
      gameState.ui.starterTackleDrawerMessage = gameState.progress?.starterTackleDrawerCompleted
        ? 'drawerCompletedMessage'
        : `drawerFound${itemId.charAt(0).toUpperCase()}${itemId.slice(1)}`;
      if (gameState.progress?.starterTackleDrawerCompleted) {
        advanceTutorialForAction(gameState, 'drawer:complete');
      }
      renderHud();
      return;
    }

    if (actionId.startsWith('drawer:junk:')) {
      gameState.ui.starterTackleDrawerMessage = 'drawerJunkMessage';
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'worms:open') {
      gameState.ui.activeScene = 'garden';
      openWormDiggingGame(gameState);
      renderHud();
      return;
    }

    if (actionId === 'worms:close') {
      closeWormDiggingGame(gameState);
      renderHud();
      return;
    }

    if (actionId.startsWith('worms:spot:')) {
      searchWormDigSpot(gameState, actionId.replace('worms:spot:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('worms:dig:')) {
      const [, , x, y] = actionId.split(':');
      digWormSoil(gameState, x, y);
      renderHud();
      return;
    }

    if (actionId === 'worms:claim') {
      claimWormDiggingReward(gameState);
      renderHud();
      return;
    }

    if (actionId.startsWith('mapWater:')) {
      const waterId = actionId.replace('mapWater:', '');
      if (!canOpenWaterFromMap(gameState, waterId)) {
        pushLog(gameState, lockedLogKey(waterId));
        renderHud();
        return;
      }
      if (waterId === 'sluice' || waterId === 'fire_ponds') {
        gameState.ui.activeScene = `${waterId}_map`;
        closeFishingMinigame(gameState);
        renderHud();
        return;
      }
      if (startLocationTransition(waterId)) {
        return;
      }
      enterFishingWater(waterId);
      renderHud();
      return;
    }

    if (actionId === 'map:toggleHotspots') {
      gameState.ui.mapHotspotsHidden = !gameState.ui.mapHotspotsHidden;
      renderHud();
      return;
    }

    if (actionId === 'save:now') {
      gameState.player = player.snapshot();
      saveGame(gameState);
      pushLog(gameState, 'logSaved');
      renderHud();
      return;
    }

    if (actionId === 'save:export') {
      exportCurrentSave();
      renderHud();
      return;
    }

    if (actionId === 'save:reset') {
      if (!window.confirm(t('resetProgressConfirm'))) {
        return;
      }
      resetToFreshState();
      renderHud();
      return;
    }

    if (actionId === 'intro:replay') {
      if (!canPlayLimitedAnimation(gameState, INTRO_VIDEO_ANIMATION_ID)) {
        gameState.audioQueue.push('ui_click');
        renderHud();
        return;
      }
      recordLimitedAnimationPlay(gameState, INTRO_VIDEO_ANIMATION_ID);
      gameState.ui.startupStep = 'introVideo';
      renderHud();
      return;
    }

    if (actionId === 'intro:showOnStartup') {
      gameState.settings.intro = {
        ...(gameState.settings.intro ?? {}),
        showOnStartup: !gameState.settings.intro?.showOnStartup,
      };
      renderHud();
      return;
    }

    if (actionId.startsWith('open:')) {
      const sceneId = actionId.replace('open:', '');
      if (sceneId === 'bus_station' && !canUseBusStation(gameState)) {
        pushLog(gameState, 'logBusStationLocked');
        renderHud();
        return;
      }
      if (isFishingLocation(sceneId)) {
        if (!canOpenWaterFromMap(gameState, sceneId)) {
          pushLog(gameState, lockedLogKey(sceneId));
          renderHud();
          return;
        }
        if (startLocationTransition(sceneId)) {
          return;
        }
        enterFishingWater(sceneId);
        renderHud();
        return;
      }
      if (startLocationTransition(sceneId)) {
        advanceTutorialForAction(gameState, actionId);
        return;
      }
      gameState.ui.activeScene = sceneId;
      gameState.ui.selectedHotspot = sceneId;
      gameState.audioQueue.push('open_scene');
      advanceTutorialForAction(gameState, actionId);
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
      if (panelId === 'quests') {
        gameState.ui.questAutoExpandUntil = 0;
      }
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
      keepQuestsCollapsed(gameState);
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

    if (actionId.startsWith('guide:toggle:')) {
      const guideKey = actionId.replace('guide:toggle:', '');
      gameState.ui.expandedGuideCards = {
        ...(gameState.ui.expandedGuideCards ?? {}),
        [guideKey]: !gameState.ui.expandedGuideCards?.[guideKey],
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'mapViewer:zoomIn' || actionId === 'mapViewer:zoomOut') {
      const delta = actionId === 'mapViewer:zoomIn' ? 0.25 : -0.25;
      gameState.ui.mapViewerZoom = Math.min(2.4, Math.max(1, (gameState.ui.mapViewerZoom ?? 1) + delta));
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
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('minigame:start:')) {
      const method = actionId.replace('minigame:start:', '');
      const normalizedMethod = method === 'active' ? getRigMethod(gameState) : method === 'liveBait' ? 'liveBait' : method;
      openFishingMinigame(gameState, normalizedMethod);
      advanceTutorialForAction(gameState, actionId);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('bait:')) {
      selectFishingBait(gameState, actionId.replace('bait:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('depth:')) {
      selectFishingDepth(gameState, actionId.replace('depth:', ''));
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

    if (actionId.startsWith('submap:fish:')) {
      const waterId = actionId.replace('submap:fish:', '');
      if (startLocationTransition(waterId)) {
        return;
      }
      enterFishingWater(waterId);
      renderHud();
      return;
    }

    if (actionId.startsWith('biteHints:')) {
      setBiteHintMode(gameState, actionId.replace('biteHints:', ''));
      renderHud();
      return;
    }

    if (actionId === 'transitions:toggle') {
      const nextEnabled = !gameState.settings.transitions?.enabled;
      gameState.settings.transitions = {
        ...(gameState.settings.transitions ?? {}),
        enabled: nextEnabled,
        explicit: true,
      };
      if (nextEnabled) {
        resetAnimationLimits(gameState);
      }
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'animations:resetLimits') {
      resetAnimationLimits(gameState);
      gameState.settings.transitions = {
        ...(gameState.settings.transitions ?? {}),
        enabled: true,
        explicit: true,
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'lowPower:toggle') {
      gameState.settings.performance = {
        ...(gameState.settings.performance ?? {}),
        lowPower: !gameState.settings.performance?.lowPower,
      };
      applyPerformanceSettings(gameState);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'debug:unlockAllLocations') {
      unlockAllLocationsForDebug(gameState);
      renderHud();
      return;
    }

    if (actionId === 'debug:readyFishingKit') {
      gameState.progress = {
        ...(gameState.progress ?? {}),
        firstTackleReady: true,
        starterTackleDrawerCompleted: true,
      };
      addItem(gameState, 'primitiveTackle', Math.max(0, 1 - (gameState.inventory?.primitiveTackle ?? 0)));
      addItem(gameState, 'worms', Math.max(0, 25 - (gameState.inventory?.worms ?? 0)));
      gameState.tackle ??= {};
      gameState.tackle.owned = {
        ...(gameState.tackle?.owned ?? {}),
        grandma_thread: true,
        old_dull_hook: true,
        small_stone: true,
        goose_feather_float: true,
        simple_stick_rod: true,
      };
      gameState.tackle.equipped = {
        ...(gameState.tackle?.equipped ?? {}),
        line: 'grandma_thread',
        hook: 'old_dull_hook',
        sinker: 'small_stone',
        float: 'goose_feather_float',
        rod: 'simple_stick_rod',
      };
      unlockAllLocationsForDebug(gameState);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('debug:timeOfDay:')) {
      const bucket = actionId.replace('debug:timeOfDay:', '');
      gameState.settings.debug = {
        ...(gameState.settings.debug ?? {}),
        timeOfDayBucket: ['dawn_dusk', 'day', 'night'].includes(bucket) ? bucket : null,
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('debug:setTime:')) {
      const [hour, minute] = actionId.replace('debug:setTime:', '').split(':').map(Number);
      if (Number.isInteger(hour) && Number.isInteger(minute)) {
        gameState.settings.debug = {
          ...(gameState.settings.debug ?? {}),
          timeOfDayBucket: null,
        };
        gameState.time.minutes = (hour * 60) + minute;
        gameState.audioQueue.push('ui_click');
      }
      renderHud();
      return;
    }

    if (actionId.startsWith('quest:claim:')) {
      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        quests: false,
      };
      claimQuestReward(gameState, actionId.replace('quest:claim:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('cafe:complete:')) {
      completeCafeOrder(gameState, actionId.replace('cafe:complete:', ''));
      renderHud();
      return;
    }

    if (actionId.startsWith('select:water:')) {
      const waterId = actionId.replace('select:water:', '');
      if (!canSelectWaterForFishing(gameState, waterId)) {
        pushLog(gameState, lockedLogKey(waterId));
        renderHud();
        return;
      }
      if (startLocationTransition(waterId)) {
        return;
      }
      enterFishingWater(waterId);
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
      keepQuestsCollapsed(gameState);
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
    const marketScrollTop = captureMarketScroll(actionId);
    runAction(actionId, gameState, context);
    if (
      (actionId.startsWith('travel:water:') || actionId.startsWith('ticket:buy:'))
      && isFishingLocation(gameState.ui?.activeScene)
      && !gameState.ui?.fishingMinigame?.open
    ) {
      openFishingMinigame(gameState, getRigMethod(gameState));
    }
    advanceTutorialForAction(gameState, actionId);
    syncPlayerToState();
    renderHud();
    restoreMarketScroll(marketScrollTop, actionId);
  },
  onCloseScene() {
    dismissStartupTitle();
    audio.activate();
    gameState.ui.activeScene = null;
    closeFishingMinigame(gameState);
    keepQuestsCollapsed(gameState);
    renderHud();
  },
  onToggleLanguage() {
    dismissStartupTitle();
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
  onTutorialPosition(position) {
    gameState.tutorialState = {
      ...(gameState.tutorialState ?? {}),
      position,
    };
    renderHud();
  },
  onCheat(value) {
    dismissStartupTitle();
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
    dismissStartupTitle();
    audio.activate();
    gameState.player = player.snapshot();
    saveGame(gameState);
    pushLog(gameState, 'logSaved');
    renderHud();
  },
  onLoad() {
    dismissStartupTitle();
    audio.activate();
    const loaded = loadGame();
    if (loaded) {
      gameState = loaded;
      ensureRuntimeState(gameState);
      player.restore(gameState.player);
      audio.syncSettings(gameState.settings.audio);
      pushLog(gameState, 'logLoaded');
    } else {
      pushLog(gameState, 'logNoSave');
    }
    renderHud();
  },
  onReset() {
    dismissStartupTitle();
    audio.activate();
    if (!window.confirm(t('resetProgressConfirm'))) {
      return;
    }
    resetToFreshState();
    renderHud();
  },
  onDismissStartupTitle() {
    dismissStartupTitle();
  },
  onProfileSubmit(profile) {
    updateProfile(gameState, {
      name: profile.name,
      avatar: gameState.playerProfile?.avatar || DEFAULT_AVATAR,
      nameCustom: true,
    });
    gameState.ui.editingProfile = false;
    advanceStartupAfterProfile();
    renderHud();
  },
  onProfilePhotoUpload(dataUrl) {
    setCustomAvatar(gameState, dataUrl);
    gameState.ui.editingProfile = true;
    renderHud();
  },
  onProfileNameDraft(name) {
    updateProfileDraftName(gameState, name);
  },
  onImportSave(rawText) {
    try {
      gameState = importSave(rawText);
      ensureRuntimeState(gameState);
      player.restore(gameState.player);
      audio.syncSettings(gameState.settings.audio);
      pushLog(gameState, 'logImportedSave');
    } catch {
      pushLog(gameState, 'logImportSaveFailed');
    }
    renderHud();
  },
});

startBootFlow();

function syncPlayerToState() {
  gameState.player = player.snapshot();
}

function closeSiblingPanels(state, openedPanelId) {
  const exclusivePanels = ['profile', 'inventory', 'keepnet', 'tackle', 'guide', 'journal', 'quests', 'achievements', 'mapViewer', 'settings'];
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

function keepQuestsCollapsed(state) {
  state.ui ??= {};
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    quests: true,
  };
  state.ui.questAutoExpandUntil = 0;
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

  for (const panelId of ['profile', 'inventory', 'keepnet', 'tackle', 'guide', 'journal', 'quests', 'achievements', 'mapViewer', 'settings']) {
    state.ui.collapsedPanels[panelId] = true;
  }
}

function normalizeViewModeSettings(state) {
  state.settings ??= {};
  state.settings.viewMode = normalizeViewMode(loadStoredViewMode() ?? state.settings.viewMode ?? 'auto');
}

function resetLaunchUiState(state) {
  state.ui ??= {};
  state.ui.startupTitleDismissed = false;
  state.ui.startupStep = 'loading';
  state.ui.editingProfile = false;
}

function dismissStartupTitle() {
  if (gameState.ui?.startupTitleDismissed) {
    return;
  }
  gameState.ui ??= {};
  gameState.ui.startupTitleDismissed = true;
  lastHudSnapshot = '';
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

function normalizePerformanceSettings(state) {
  state.settings ??= {};
  const savedLowPower = state.settings.performance?.lowPower;
  state.settings.performance = {
    ...(state.settings.performance ?? {}),
    lowPower: typeof savedLowPower === 'boolean'
      ? savedLowPower
      : window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  };
}

function applyPerformanceSettings(state) {
  normalizePerformanceSettings(state);
  document.documentElement.classList.toggle('low-power-mode', Boolean(state.settings.performance.lowPower));
}

function startLocationTransition(sceneId) {
  gameState.ui.transitionVisits ??= {};
  const transition = getLocationTransition(sceneId, gameState);
  if (!transition || !shouldUseLocationTransitions(gameState)) {
    return false;
  }

  recordLimitedAnimationPlay(gameState, transition);
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

  if (isFishingLocation(transition.targetScene)) {
    enterFishingWater(transition.targetScene);
    renderHud();
    return;
  }

  gameState.ui.activeScene = transition.targetScene;
  gameState.ui.selectedHotspot = transition.targetScene;
  gameState.audioQueue.push('open_scene');
  renderHud();
}

function enterFishingWater(waterId) {
  arriveAtWater(gameState, waterId);
  openFishingMinigame(gameState, getRigMethod(gameState));
  gameState.ui.selectedHotspot = waterId;
}

function lockedLogKey(waterId) {
  const reasonKey = getLockedReasonKey(gameState, waterId);
  if (reasonKey === 'requiresScooterOrBicycle') {
    return 'logNeedScooterOrBicycle';
  }
  if (reasonKey === 'requiresBusTicket') {
    return 'logNeedBusTicket';
  }
  return 'logNeedBicycleForTravel';
}

function renderHud() {
  syncQuestProgress(gameState);
  ensureCafeOrders(gameState);
  const timeOfDayBucket = getTimeOfDayBucket(gameState);
  const context = gameState.ui.activeScene
    ? getLocationSceneContext(gameState, gameState.ui.activeScene)
    : getInteractionContext(gameState, player.position);
  context.clock = formatGameTime(gameState);
  context.timePhase = getTimePhase(gameState);
  context.timeOfDayBucket = timeOfDayBucket;
  const hudSnapshot = JSON.stringify({
    timeOfDayBucket,
    day: gameState.day,
    timeMinutes: gameState.time?.minutes,
    money: gameState.money,
    language: getLanguage(),
    inventory: gameState.inventory,
    purchased: gameState.purchased,
    tackle: gameState.tackle,
    audio: gameState.settings.audio,
    fishingSettings: gameState.settings.fishing,
    debugSettings: gameState.settings.debug,
    transitionSettings: gameState.settings.transitions,
    performanceSettings: gameState.settings.performance,
    viewMode: gameState.settings.viewMode,
    resolvedViewMode: gameState.ui.resolvedViewMode,
    fishBasket: gameState.fishBasket,
    catchJournal: gameState.catchJournal,
    stats: gameState.stats,
    trophies: gameState.trophies,
    market: gameState.market,
    travel: gameState.travel,
    playerProfile: gameState.playerProfile,
    tutorialState: gameState.tutorialState,
    seenEvents: gameState.seenEvents,
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
    world.updateMapTexture(getWorldMapAsset(gameState.ui.resolvedViewMode ?? 'mobile', gameState));
    hud.render(gameState, context);
    updateMapOverlayMotion(performance.now());
    queueAutosave();
  }
}

function ensureRuntimeState(state) {
  ensureFishState(state);
  ensureMarketState(state);
  ensureTackleState(state);
  ensureStarterTackleDrawerState(state);
  ensureTimeState(state);
  ensureProfileState(state);
  syncGrandmaTrust(state);
  ensureQuestState(state);
  ensureCafeOrders(state);
  normalizeTransitionSettings(state);
  applyPerformanceSettings(state);
  normalizeAnimationLimits(state);
  syncCompletedSpeciesStars(state);
  normalizeViewModeSettings(state);
  applyViewModeToDocument(state);
  normalizePanelStateForViewport(state);
}

function resetToFreshState() {
  resetGame();
  gameState = createInitialState();
  ensureRuntimeState(gameState);
  resetLaunchUiState(gameState);
  player.restore(gameState.player);
  audio.syncSettings(gameState.settings.audio);
  pushLog(gameState, 'logFreshMorning');
  startBootFlow();
}

function startBootFlow() {
  gameState.ui ??= {};
  gameState.ui.startupStep = 'loading';
  preloadCriticalAssets().finally(() => {
    if (gameState.ui?.startupStep !== 'loading') {
      return;
    }
    gameState.ui.startupStep = getNextStartupStep();
    lastHudSnapshot = '';
    renderHud();
  });
}

function getNextStartupStep() {
  const shouldOfferIntro = !gameState.seenEvents?.introResolved
    || (gameState.settings?.intro?.showOnStartup && gameState.playerProfile?.setupComplete);
  if (shouldOfferIntro) {
    return 'introChoice';
  }
  if (!gameState.playerProfile?.setupComplete) {
    return 'profile';
  }
  return null;
}

function handleStartupAction(actionId) {
  if (actionId === 'startup:intro:watch') {
    if (!canPlayLimitedAnimation(gameState, INTRO_VIDEO_ANIMATION_ID)) {
      gameState.seenEvents.introResolved = true;
      gameState.seenEvents.introSkipped = true;
      gameState.settings.intro.showOnStartup = false;
      gameState.ui.startupStep = gameState.playerProfile?.setupComplete ? null : 'profile';
      return;
    }
    recordLimitedAnimationPlay(gameState, INTRO_VIDEO_ANIMATION_ID);
    gameState.ui.startupStep = 'introVideo';
    return;
  }

  if (actionId === 'startup:intro:skip') {
    gameState.seenEvents.introResolved = true;
    gameState.seenEvents.introSkipped = true;
    gameState.settings.intro.showOnStartup = false;
    gameState.ui.startupStep = gameState.playerProfile?.setupComplete ? null : 'profile';
    return;
  }

  if (actionId === 'startup:intro:done') {
    gameState.seenEvents.introResolved = true;
    gameState.seenEvents.introWatched = true;
    gameState.settings.intro.showOnStartup = false;
    gameState.ui.startupStep = gameState.playerProfile?.setupComplete ? null : 'profile';
    return;
  }
}

function advanceStartupAfterProfile() {
  if (gameState.tutorialState?.completed || gameState.tutorialState?.skipped) {
    gameState.ui.startupStep = null;
    return;
  }
  gameState.ui.startupStep = null;
}

function preloadCriticalAssets() {
  const assets = [
    assetPath('/assets/logo/logo-mark.png'),
    assetPath('/assets/logo/logo-ua.png'),
    assetPath('/assets/locations/world_map_concept1.png'),
    assetPath('/assets/locations/fishing-canal.webp'),
    assetPath('/assets/items/primitive_tackle.png'),
    assetPath('/assets/items/bait_worm.png'),
    assetPath('/assets/items/bait_larvae.png'),
    ...['grandson-1.png', 'granddaughter-1.png', 'boy-1.png', 'girl-1.png'].map((name) => assetPath(`/assets/profile/${name}`)),
  ];

  return Promise.race([
    Promise.allSettled(assets.map(preloadImage)),
    new Promise((resolve) => window.setTimeout(resolve, 900)),
  ]);
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

function exportCurrentSave() {
  gameState.player = player.snapshot();
  saveGame(gameState);
  const blob = new Blob([exportSave(gameState)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'rybalka-save.json';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  pushLog(gameState, 'logExportedSave');
}

function queueAutosave() {
  if (!gameState.playerProfile?.setupComplete) {
    return;
  }

  const signature = JSON.stringify({
    version: gameState.version,
    playerProfile: gameState.playerProfile,
    day: gameState.day,
    time: gameState.time,
    money: gameState.money,
    inventory: gameState.inventory,
    fishBasket: gameState.fishBasket,
    stats: gameState.stats,
    tackle: gameState.tackle,
    travel: gameState.travel,
    trophyLog: gameState.trophies,
    catchStats: gameState.catchJournal,
    settings: gameState.settings,
    seenEvents: gameState.seenEvents,
    tutorialState: gameState.tutorialState,
    progress: gameState.progress,
    quests: gameState.quests,
    achievements: gameState.achievements,
  });
  if (signature === lastAutosaveSignature) {
    return;
  }
  lastAutosaveSignature = signature;

  const now = performance.now();
  const saveNow = () => {
    autosaveTimer = null;
    lastAutosaveAt = performance.now();
    gameState.player = player.snapshot();
    saveGame(gameState);
  };

  if (now - lastAutosaveAt > 1200) {
    saveNow();
    return;
  }

  if (!autosaveTimer) {
    autosaveTimer = window.setTimeout(saveNow, 1200);
  }
}

function captureMarketScroll(actionId) {
  if (!actionId.startsWith('buy:') && !actionId.startsWith('sell:')) {
    return null;
  }

  const marketBody = document.querySelector('[data-scroll-preserve="market-body"]');
  return marketBody?.scrollTop > 0 ? marketBody.scrollTop : rememberedMarketScrollTop || null;
}

function restoreMarketScroll(scrollTop, actionId) {
  if (!scrollTop && !actionId.startsWith('buy:')) {
    return;
  }

  const apply = () => {
    const marketBody = document.querySelector('[data-scroll-preserve="market-body"]');
    if (!marketBody) {
      return;
    }

    if (scrollTop) {
      marketBody.scrollTop = scrollTop;
      return;
    }

    const target = marketBody.querySelector(`button[data-action="${actionId}"]`)?.closest('.market-card');
    if (target) {
      marketBody.scrollTop = Math.max(0, target.offsetTop - (marketBody.clientHeight / 2) + (target.clientHeight / 2));
    }
  };

  window.requestAnimationFrame(() => {
    apply();
    window.requestAnimationFrame(apply);
    window.setTimeout(apply, 40);
    window.setTimeout(apply, 140);
    window.setTimeout(apply, 320);
  });
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
document.addEventListener('scroll', (event) => {
  const marketBody = event.target instanceof Element ? event.target.closest('[data-scroll-preserve="market-body"]') : null;
  if (marketBody) {
    rememberedMarketScrollTop = marketBody.scrollTop;
  }
}, true);
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
  if (gameState.settings?.performance?.lowPower) {
    return;
  }
  updateMapOverlayMotion(performance.now());
}, 250);

function animate() {
  requestAnimationFrame(animate);

  if (document.hidden) {
    clock.getDelta();
    return;
  }

  const delta = Math.min(clock.getDelta(), 0.05);
  const minigameOpen = Boolean(gameState.ui?.fishingMinigame?.open);
  const activeSceneOpen = Boolean(gameState.ui?.activeScene);
  if (!activeSceneOpen || minigameOpen) {
    player.update(delta, world.bounds);
    world.updateCamera(player.position);
    if (!gameState.settings?.performance?.lowPower) {
      world.animate(delta);
    }
  }
  tickFishingMinigame(gameState, performance.now());
  if (!activeSceneOpen && !gameState.settings?.performance?.lowPower) {
    updateMapOverlayMotion(performance.now());
  }
  gameState.settings.audio.musicTrackId = audio.getCurrentTrackId();
  syncPlayerToState();
  const now = performance.now();
  const renderEveryMs = minigameOpen ? 120 : activeSceneOpen ? 500 : 180;
  if (now - lastHudRenderAt >= renderEveryMs) {
    lastHudRenderAt = now;
    renderHud();
  }
  audio.drainQueue(gameState);
  renderer.render(world.scene, world.camera);
}

animate();
