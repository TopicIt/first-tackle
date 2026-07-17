import * as THREE from 'three';
import '../style.css';
import { DEFAULT_AVATAR, GAME_TITLE, createInitialState, pushFeedback, pushLog } from './game/state.js';
import { createWorld } from './game/world.js';
import { createPlayerController } from './game/player.js';
import { clearFishHistoryState, ensureFishState } from './game/fishInventory.js';
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
import { backupLocalSave, exportSave, importSave, loadGame, resetGame, saveGame } from './game/save.js';
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
import { waterGuide } from './game/guideData.js';
import {
  completeTutorialStep,
  advanceTutorialForAction,
  ensureProfileState,
  grantPrimitiveTackle,
  selectAvatar,
  skipTutorial,
  startTutorial,
  syncGrandmaTrust,
  syncProfileDerivedStats,
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
import {
  applyViewModeToDocument,
  loadStoredViewMode,
  normalizeViewMode,
  persistViewMode,
} from './ui/viewMode.js';
import { getLanguage, t, toggleLanguage } from './i18n/i18n.js';
import { assetPath } from './utils/assetPath.js';
import { getWorldMapAsset } from './utils/worldMapAsset.js';
import { ApiError, clearCloudSession, loadCloudSession, saveCloudSession } from './api/client.js';
import { getProfile, login, logout, refreshAuth, register, updateProfileOnServer } from './api/authApi.js';
import { loadSave as loadCloudSave, syncSave as syncCloudSave } from './api/saveApi.js';
import { fetchLeaderboard } from './api/gameApi.js';
import { primeCatalogCache } from './api/catalogApi.js';
import { syncPlayerStateFromGameState } from './game/playerState.js';
import { filterLeaderboardRecords, getLocalLeaderboard } from './game/leaderboards.js';

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
syncPlayerStateFromGameState(gameState);
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

const world = createWorld({ enablePrototypeFisherman: Boolean(gameState.settings?.graphics?.fisherman3d) });
const player = createPlayerController(world.scene, gameState.player);
const clock = new THREE.Clock();
let lastHudSnapshot = '';
const audio = createAudioManager(gameState.settings.audio);
let spaceIsDown = false;
let fishingActionLockedUntil = 0;
let lastHudRenderAt = 0;
let lastFrameWorkAt = 0;
let rememberedMarketScrollTop = 0;
let lastAutosaveAt = 0;
let lastAutosaveSignature = '';
let autosaveTimer = null;
let lastCloudAutosaveSignature = '';
let cloudAutosaveTimer = null;
let cloudAutosaveInFlight = false;
let cloudAutosavePending = false;
let lastCloudAutosaveStartedAt = 0;
let pendingCloudSaveDownload = null;

const CLOUD_SAVE_HINT_DISMISSED_KEY = 'first-tackle-cloud-save-hint-dismissed-v1';
const CLOUD_AUTOSAVE_DELAY_MS = 45000;
const CLOUD_AUTOSAVE_MIN_INTERVAL_MS = 90000;
const MOBILE_CLOUD_AUTOSAVE_DELAY_MS = 120000;
const MOBILE_CLOUD_AUTOSAVE_MIN_INTERVAL_MS = 180000;
const FULL_RESET_TOMBSTONE_KEY = 'first-tackle-reset-tombstone-v1';

queueCatalogWarmup();

const hud = createHud(hudRoot, {
  async onAction(actionId) {
    dismissStartupTitle();
    audio.activate();

    if (actionId.startsWith('startup:')) {
      handleStartupAction(actionId);
      renderHud();
      return;
    }

    if (actionId.startsWith('profile:avatar:')) {
      selectAvatar(gameState, actionId.replace('profile:avatar:', ''));
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'profile-avatar-selected' });
      syncCloudProfileFromGameState('profile-avatar-selected');
      renderHud();
      return;
    }

    if (actionId.startsWith('profile:star:')) {
      selectProfileStar(gameState, actionId.replace('profile:star:', ''));
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'profile-star-selected' });
      syncCloudProfileFromGameState('profile-star-selected');
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

    if (actionId === 'leaderboard:open') {
      gameState.ui.collapsedPanels = {
        ...(gameState.ui.collapsedPanels ?? {}),
        leaderboard: false,
      };
      closeSiblingPanels(gameState, 'leaderboard');
      loadLeaderboardRecords(gameState.ui?.leaderboards?.type ?? 'biggest-fish');
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
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'tutorial-started' });
      renderHud();
      return;
    }

    if (actionId === 'tutorial:skip') {
      skipTutorial(gameState);
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'tutorial-skipped' });
      saveGame(gameState);
      renderHud();
      return;
    }

    if (actionId === 'tutorial:close') {
      skipTutorial(gameState);
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'tutorial-closed' });
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
      syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'tutorial-step' });
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
        showLockedLocationNotice(waterId);
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

    if (actionId === 'mapLockedNotice:close') {
      gameState.ui.mapLockedNotice = null;
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
      await resetToFreshState();
      renderHud();
      return;
    }

    if (actionId === 'debug:clearFishHistory') {
      if (!window.confirm('Очистити локальну історію риби, трофеїв, довідника і таблиці лідерів?')) {
        return;
      }
      clearLocalFishHistoryForTesting();
      renderHud();
      return;
    }

    if (actionId === 'cloud:open') {
      openCloudSaveSettings();
      renderHud();
      return;
    }

    if (actionId === 'cloud:dismissHint') {
      dismissCloudSaveHint();
      renderHud();
      return;
    }

    if (actionId.startsWith('cloud:')) {
      handleCloudAction(actionId);
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
        showLockedLocationNotice(sceneId);
        renderHud();
        return;
      }
      if (isFishingLocation(sceneId)) {
        if (!canOpenWaterFromMap(gameState, sceneId)) {
          showLockedLocationNotice(sceneId);
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
        if (panelId === 'leaderboard') {
          loadLeaderboardRecords(gameState.ui?.leaderboards?.type ?? 'biggest-fish');
        }
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

    if (actionId.startsWith('market:buyCategory:')) {
      gameState.ui.marketBuyCategory = actionId.replace('market:buyCategory:', '');
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('market:details:')) {
      const itemId = actionId.replace('market:details:', '');
      gameState.ui.expandedMarketItems = {
        ...(gameState.ui.expandedMarketItems ?? {}),
        [itemId]: !gameState.ui.expandedMarketItems?.[itemId],
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('leaderboard:type:')) {
      const type = actionId.replace('leaderboard:type:', '');
      gameState.ui.leaderboards = {
        ...(gameState.ui.leaderboards ?? {}),
        type,
      };
      gameState.audioQueue.push('ui_click');
      loadLeaderboardRecords(type);
      renderHud();
      return;
    }

    if (actionId === 'leaderboard:refresh') {
      refreshLeaderboardAndMaybeSync();
      return;
    }

    if (actionId.startsWith('leaderboard:toggleSpecies:')) {
      const fishId = actionId.replace('leaderboard:toggleSpecies:', '');
      gameState.ui.expandedLeaderboardSpecies = {
        ...(gameState.ui.expandedLeaderboardSpecies ?? {}),
        [fishId]: !gameState.ui.expandedLeaderboardSpecies?.[fishId],
      };
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'leaderboard:profile:close') {
      gameState.ui.publicProfile = null;
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId.startsWith('leaderboard:profile:')) {
      const index = Number(actionId.replace('leaderboard:profile:', ''));
      const type = gameState.ui?.leaderboards?.type ?? 'biggest-fish';
      const source = gameState.ui?.leaderboards?.source ?? 'local-fallback';
      const shouldUseLocalFallback = source === 'local-fallback';
      const rawRecords = gameState.ui?.leaderboards?.records?.length
        ? gameState.ui.leaderboards.records
        : shouldUseLocalFallback
          ? getLocalLeaderboard(type, gameState)
          : [];
      const filteredRecords = filterLeaderboardRecords(rawRecords, type, gameState);
      const records = filteredRecords.length
        ? filteredRecords
        : shouldUseLocalFallback
          ? getLocalLeaderboard(type, gameState)
          : [];
      const record = records?.[index];
      gameState.ui.publicProfile = record ? { record } : null;
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

    if (actionId.startsWith('guide:water:')) {
      const waterId = actionId.replace('guide:water:', '');
      if (waterGuide.some((entry) => entry.id === waterId)) {
        gameState.ui.guideWaterId = waterId;
      }
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
        lowPowerExplicit: true,
      };
      applyPerformanceSettings(gameState);
      gameState.audioQueue.push('ui_click');
      renderHud();
      return;
    }

    if (actionId === 'fisherman3d:toggle') {
      gameState.settings.graphics = {
        ...(gameState.settings.graphics ?? {}),
        fisherman3d: !gameState.settings.graphics?.fisherman3d,
      };
      syncWorldPrototypeFisherman();
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
        showLockedLocationNotice(waterId);
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
      runLockedFishingAction(() => {
        renderAfterAuthorityAction(runFishingContextAction(gameState, performance.now()));
      });
      return;
    }

    if (actionId === 'minigame:strike') {
      runLockedFishingAction(() => {
        renderAfterAuthorityAction(strikeLine(gameState, performance.now()));
      });
      return;
    }

    if (actionId === 'minigame:keep') {
      keepCatch(gameState);
      advanceTutorialForAction(gameState, actionId);
      renderHud();
      return;
    }

    if (actionId === 'minigame:openKeepnet') {
      keepCatch(gameState);
      advanceTutorialForAction(gameState, actionId);
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
      advanceTutorialForAction(gameState, actionId);
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
    const fishBasketCountBefore = gameState.fishBasket?.length ?? 0;
    runAction(actionId, gameState, context);
    if (
      (actionId.startsWith('travel:water:') || actionId.startsWith('ticket:buy:'))
      && isFishingLocation(gameState.ui?.activeScene)
      && !gameState.ui?.fishingMinigame?.open
    ) {
      openFishingMinigame(gameState, getRigMethod(gameState));
    }
    const soldFishForTutorial = actionId.startsWith('sell:')
      && (gameState.fishBasket?.length ?? 0) < fishBasketCountBefore;
    if (!actionId.startsWith('sell:') || soldFishForTutorial) {
      advanceTutorialForAction(gameState, actionId);
    }
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
  async onReset() {
    dismissStartupTitle();
    audio.activate();
    if (!window.confirm(t('resetProgressConfirm'))) {
      return;
    }
    await resetToFreshState();
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
    syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'profile-updated' });
    syncCloudProfileFromGameState('profile-updated');
    gameState.ui.editingProfile = false;
    advanceStartupAfterProfile();
    renderHud();
  },
  onProfilePhotoUpload(dataUrl) {
    setCustomAvatar(gameState, dataUrl);
    syncPlayerStateFromGameState(gameState, { incrementRevision: true, reason: 'profile-avatar-uploaded' });
    syncCloudProfileFromGameState('profile-avatar-uploaded');
    gameState.ui.editingProfile = true;
    renderHud();
  },
  onProfileNameDraft(name) {
    gameState.ui ??= {};
    gameState.ui.profileNameDraft = String(name ?? '');
  },
  onCloudSaveSetting(settingId, enabled) {
    gameState.settings.cloudSave ??= {};
    if (settingId === 'autoLoadNewest' || settingId === 'autoSyncAfterLogin') {
      gameState.settings.cloudSave[settingId] = Boolean(enabled);
      gameState.audioQueue.push('ui_click');
      renderHud();
    }
  },
  onCloudAuth(payload) {
    handleCloudAuth(payload);
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
reconnectCloudSession();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && cloudAutosaveTimer) {
    queueCloudAutosave({ immediate: true });
  }
});

function syncPlayerToState() {
  gameState.player = player.snapshot();
}

function closeSiblingPanels(state, openedPanelId) {
  const exclusivePanels = ['profile', 'inventory', 'keepnet', 'tackle', 'guide', 'journal', 'quests', 'achievements', 'leaderboard', 'mapViewer', 'settings'];
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
  state.ui.collapsedPanels.profile ??= true;

  const resolvedViewMode = applyViewModeToDocument(state);
  if (resolvedViewMode !== 'mobile') {
    return;
  }

  state.ui.collapsedPanels.status = false;

  for (const panelId of ['profile', 'inventory', 'keepnet', 'tackle', 'guide', 'journal', 'quests', 'achievements', 'leaderboard', 'mapViewer', 'settings']) {
    state.ui.collapsedPanels[panelId] = true;
  }
}

function syncWorldPrototypeFisherman() {
  world.setPrototypeFishermanEnabled(Boolean(gameState.settings?.graphics?.fisherman3d));
}

function queueCatalogWarmup() {
  const run = () => {
    primeCatalogCache();
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 5000 });
    return;
  }
  window.setTimeout(run, 1200);
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
  state.ui.cloudSaveHintDismissed = isCloudSaveHintDismissed();
  state.ui.marketBuyCategory ??= 'tackle';
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    profile: true,
  };
  state.ui.leaderboards = {
    type: state.ui.leaderboards?.type ?? 'biggest-fish',
    records: state.ui.leaderboards?.records ?? [],
    source: state.ui.leaderboards?.source ?? 'local-fallback',
    busy: false,
  };
}

function hasOpenMenuOverlay(state) {
  if (state.ui?.startupStep || state.ui?.starterTackleDrawerOpen) {
    return true;
  }

  const panels = state.ui?.collapsedPanels ?? {};
  return ['profile', 'inventory', 'keepnet', 'tackle', 'guide', 'journal', 'quests', 'achievements', 'leaderboard', 'mapViewer', 'settings']
    .some((panelId) => panels[panelId] === false);
}

async function loadLeaderboardRecords(type = 'biggest-fish') {
  gameState.ui ??= {};
  const normalizedType = type === 'trophies' ? 'monthly-trophies' : type;
  const localRecords = getLocalLeaderboard(normalizedType, gameState);
  gameState.ui.leaderboards = {
    ...(gameState.ui.leaderboards ?? {}),
    type: normalizedType,
    busy: true,
    records: normalizedType === 'monthly-trophies' ? localRecords : gameState.ui.leaderboards?.records ?? [],
    source: normalizedType === 'monthly-trophies' ? 'local-fallback' : gameState.ui.leaderboards?.source ?? 'local-fallback',
  };
  renderHud();

  const response = await fetchLeaderboard(normalizedType);
  const serverRecords = response?.result?.records ?? response?.result?.items ?? response?.result?.rows ?? [];
  const filteredServerRecords = filterLeaderboardRecords(serverRecords, normalizedType, gameState);
  const useLocalFallback = Boolean(response?.fallback);
  const records = useLocalFallback ? localRecords : filteredServerRecords;
  const serverSource = String(response?.result?.source ?? 'server');
  const source = useLocalFallback
    ? 'local-fallback'
    : filteredServerRecords.length === 0
      ? 'server-empty'
      : serverSource.startsWith('server')
        ? 'server'
        : serverSource;
  if (response?.fallback && import.meta.env?.DEV) {
    console.warn('Leaderboard backend unavailable; using local-only fallback.', response.error ?? null);
  }
  gameState.ui.leaderboards = {
    ...(gameState.ui.leaderboards ?? {}),
    type: normalizedType,
    busy: false,
    records,
    source,
    message: response?.fallback
      ? response?.result?.message ?? response?.error?.message ?? 'Leaderboard server unavailable; showing local records.'
      : filteredServerRecords.length === 0 && serverRecords.length > 0
        ? '\u0413\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u0430 \u0442\u0430\u0431\u043b\u0438\u0446\u044f \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u0430, \u0430\u043b\u0435 \u0441\u0442\u0430\u0440\u0456 \u0430\u0431\u043e \u043d\u0435\u043f\u043e\u0432\u043d\u0456 \u0440\u044f\u0434\u043a\u0438 \u043f\u0440\u0438\u0445\u043e\u0432\u0430\u043d\u043e.'
        : '',
  };
  renderHud();
}

async function refreshLeaderboardAndMaybeSync() {
  const type = gameState.ui?.leaderboards?.type ?? 'biggest-fish';
  const session = loadCloudSession();

  if (!session?.accessToken) {
    gameState.ui.leaderboards = {
      ...(gameState.ui.leaderboards ?? {}),
      message: 'Увійдіть у хмару, щоб синхронізувати серверну таблицю. Локальні рекорди оновлено.',
    };
    await loadLeaderboardRecords(type);
    return;
  }

  setCloudBusy(true, 'Оновлюємо таблицю лідерів...');
  gameState.ui.leaderboards = {
    ...(gameState.ui.leaderboards ?? {}),
    busy: true,
    message: '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0456\u0437\u0443\u0454\u043c\u043e \u043f\u0440\u043e\u0444\u0456\u043b\u044c \u0456 \u0441\u0435\u0439\u0432 \u043f\u0435\u0440\u0435\u0434 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044f\u043c \u0442\u0430\u0431\u043b\u0438\u0446\u0456.',
  };
  renderHud();

  try {
    await syncCloudProfileFromGameState('leaderboard-refresh', { silent: true });
    const result = await syncCurrentSaveToCloud();
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      saveMetadata: result.metadata,
      lastMessage: 'Таблицю лідерів оновлено',
    });
    pendingCloudSaveDownload = null;
    gameState.ui.cloudSave = {
      ...(gameState.ui.cloudSave ?? {}),
      conflict: null,
    };
    lastCloudAutosaveSignature = getCloudSaveSignature();
    setCloudBusy(false, 'Таблицю лідерів оновлено');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const metadata = conflictMetadataFromError(error);
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        saveMetadata: metadata,
      });
      gameState.ui.cloudSave = {
        ...(gameState.ui.cloudSave ?? {}),
        conflict: { metadata, canDownload: false },
      };
    }
    setCloudBusy(false, cloudErrorMessage(error));
  }

  await loadLeaderboardRecords(type);
}

async function syncCloudProfileFromGameState(reason = 'profile-sync', options = {}) {
  const session = loadCloudSession();
  if (!session?.accessToken) {
    return null;
  }

  try {
    const profile = await updateProfileOnServer({
      displayName: gameState.playerProfile?.name,
      avatarId: gameState.playerProfile?.avatarId ?? gameState.playerProfile?.avatar,
      avatarCustomUrl: gameState.playerProfile?.avatarType === 'custom'
        ? gameState.playerProfile?.customAvatarDataUrl
        : null,
      selectedStarId: gameState.playerProfile?.selectedStarId ?? null,
    });
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      lastMessage: options.silent ? loadCloudSession()?.lastMessage : 'Профіль синхронізовано',
    });
    if (!options.silent) {
      queueCloudAutosave({ immediate: true });
    }
    return profile;
  } catch (error) {
    if (!options.silent) {
      setCloudBusy(false, cloudErrorMessage(error));
      renderHud();
    }
    if (import.meta.env?.DEV) {
      console.warn(`Could not sync cloud profile after ${reason}.`, error);
    }
    return null;
  }
}

function dismissStartupTitle() {
  if (gameState.ui?.startupTitleDismissed) {
    return;
  }
  gameState.ui ??= {};
  gameState.ui.startupTitleDismissed = true;
  lastHudSnapshot = '';
}

function isCloudSaveHintDismissed() {
  try {
    return localStorage.getItem(CLOUD_SAVE_HINT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function dismissCloudSaveHint() {
  gameState.ui ??= {};
  gameState.ui.cloudSaveHintDismissed = true;
  try {
    localStorage.setItem(CLOUD_SAVE_HINT_DISMISSED_KEY, 'true');
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function openCloudSaveSettings() {
  gameState.ui ??= {};
  gameState.ui.collapsedPanels = {
    ...(gameState.ui.collapsedPanels ?? {}),
    settings: false,
  };
  closeSiblingPanels(gameState, 'settings');
  dismissCloudSaveHint();
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

function isMobileLowPowerTarget() {
  if (typeof window === 'undefined') {
    return false;
  }

  const narrow = window.matchMedia?.('(max-width: 820px)').matches ?? window.innerWidth <= 820;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const touchCapable = navigator.maxTouchPoints > 0;
  return narrow || (coarsePointer && touchCapable);
}

function normalizePerformanceSettings(state) {
  state.settings ??= {};
  const savedPerformance = state.settings.performance ?? {};
  const savedLowPower = savedPerformance.lowPower;
  const lowPowerExplicit = savedPerformance.lowPowerExplicit === true;
  const shouldDefaultLowPower = isMobileLowPowerTarget()
    || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  state.settings.performance = {
    ...savedPerformance,
    lowPower: lowPowerExplicit && typeof savedLowPower === 'boolean'
      ? savedLowPower
      : shouldDefaultLowPower,
    lowPowerExplicit,
  };
}

function applyPerformanceSettings(state) {
  normalizePerformanceSettings(state);
  const root = document.documentElement;
  root.classList.toggle('low-power-mode', Boolean(state.settings.performance.lowPower));
  root.classList.toggle('mobile-low-power-target', isMobileLowPowerTarget());
  root.classList.toggle('menu-overlay-open', hasOpenMenuOverlay(state));
}

function startLocationTransition(sceneId) {
  gameState.ui.transitionVisits ??= {};
  const transition = getLocationTransition(sceneId, gameState);
  if (!transition || !shouldUseLocationTransitions(gameState, transition)) {
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

function showLockedLocationNotice(locationId) {
  const isBusStation = locationId === 'bus_station';
  const location = isBusStation ? null : getFishingLocation(locationId);
  const labelKey = isBusStation ? 'zoneBusStation' : location?.labelKey ?? 'locked';
  const reasonKey = isBusStation ? 'requiresGrandmaTrust' : getLockedReasonKey(gameState, locationId);

  gameState.ui ??= {};
  gameState.ui.mapLockedNotice = {
    labelKey,
    reasonKey,
    shownAt: Date.now(),
  };

  pushLog(gameState, isBusStation ? 'logBusStationLocked' : lockedLogKey(locationId));
  pushFeedback(gameState, reasonKey, {}, 'item');
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
  applyPerformanceSettings(gameState);
  syncQuestProgress(gameState);
  ensureCafeOrders(gameState);
  syncProfileDerivedStats(gameState);
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
  syncPlayerStateFromGameState(state);
  normalizeTransitionSettings(state);
  applyPerformanceSettings(state);
  normalizeAnimationLimits(state);
  syncCompletedSpeciesStars(state);
  normalizeViewModeSettings(state);
  applyViewModeToDocument(state);
  normalizePanelStateForViewport(state);
  syncProfileDerivedStats(state);
}

async function resetToFreshState() {
  const resetAt = new Date().toISOString();
  const cloudSessionBeforeReset = loadCloudSession();
  clearCloudAutosaveQueue();
  resetGame();
  clearResetStorageKeys({ keepCloudSession: Boolean(cloudSessionBeforeReset?.accessToken) });
  writeResetTombstone(resetAt);
  gameState = createInitialState();
  ensureRuntimeState(gameState);
  resetLaunchUiState(gameState);
  player.restore(gameState.player);
  audio.syncSettings(gameState.settings.audio);
  lastHudSnapshot = '';
  lastAutosaveSignature = '';
  lastCloudAutosaveSignature = '';
  saveGame(gameState);
  if (cloudSessionBeforeReset?.accessToken) {
    saveCloudSession({
      ...cloudSessionBeforeReset,
      lastMessage: '\u041f\u0440\u043e\u0433\u0440\u0435\u0441 \u0441\u043a\u0438\u043d\u0443\u0442\u043e; \u043e\u043d\u043e\u0432\u043b\u044e\u0454\u043c\u043e \u0445\u043c\u0430\u0440\u043d\u0438\u0439 \u0441\u0435\u0439\u0432.',
    });
    try {
      const result = await syncCurrentSaveToCloud();
      saveCloudSession({
        ...cloudSessionBeforeReset,
        saveMetadata: result.metadata,
        lastMessage: '\u0425\u043c\u0430\u0440\u043d\u0438\u0439 \u0441\u0435\u0439\u0432 \u0441\u043a\u0438\u043d\u0443\u0442\u043e.',
      });
      lastCloudAutosaveSignature = getCloudSaveSignature();
    } catch (error) {
      console.warn('Could not overwrite cloud save during reset.', error);
    }
  }
  clearCloudSession();
  writeResetTombstone(resetAt);
  pushLog(gameState, 'logFreshMorning');
  startBootFlow();
}

function clearResetStorageKeys({ keepCloudSession = false } = {}) {
  const preserveKeys = new Set([
    'first-tackle-language',
    'first-tackle-view-mode',
    'first-tackle-debug-layout',
    'first-tackle-mobile-debug',
    'first-tackle-debug-save',
    'first-tackle-save-debug',
    FULL_RESET_TOMBSTONE_KEY,
  ]);
  if (keepCloudSession) {
    preserveKeys.add('first-tackle-cloud-session-v1');
  }
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (const key of Object.keys(storage)) {
        if (key.startsWith('first-tackle-') && !preserveKeys.has(key)) {
          storage.removeItem(key);
        }
      }
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }
}

function writeResetTombstone(resetAt = new Date().toISOString()) {
  try {
    localStorage.setItem(FULL_RESET_TOMBSTONE_KEY, JSON.stringify({ resetAt }));
  } catch {
    // Reset still works without tombstone persistence.
  }
}

function readResetTombstoneTime() {
  const timestamp = Date.parse(readResetTombstone()?.resetAt ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function readResetTombstone() {
  try {
    const raw = localStorage.getItem(FULL_RESET_TOMBSTONE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.resetAt ? { resetAt: parsed.resetAt } : null;
  } catch {
    return null;
  }
}

function isCloudSaveOlderThanReset(metadata) {
  const resetAt = readResetTombstoneTime();
  if (!resetAt) {
    return false;
  }
  const cloudUpdatedAt = Date.parse(metadata?.serverUpdatedAt ?? metadata?.clientUpdatedAt ?? metadata?.updatedAt ?? '');
  return Number.isFinite(cloudUpdatedAt) && cloudUpdatedAt < resetAt;
}

function clearLocalFishHistoryForTesting() {
  clearFishHistoryState(gameState);
  clearFishHistoryStorageKeys();
  lastHudSnapshot = '';
  lastAutosaveSignature = '';
  lastCloudAutosaveSignature = '';
  saveGame(gameState);
  pushLog(gameState, 'Локальну історію риби й трофеїв очищено.');
}

function clearFishHistoryStorageKeys() {
  const shouldRemoveKey = (key) => (
    /^first-tackle-(fish|trophy|guide|leaderboard|catch|journal)/i.test(key)
    || /^first-tackle-save-v\d+-backup-/i.test(key)
    || /^first-tackle-mobile-transition-seen-v/i.test(key)
  );
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (const key of Object.keys(storage)) {
        if (shouldRemoveKey(key)) {
          storage.removeItem(key);
        }
      }
    } catch {
      // Some browser modes can block storage iteration.
    }
  }
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
    assetPath('/assets/logo/Logo-ukr.png'),
    assetPath('/assets/logo/logo-eng.png'),
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

async function reconnectCloudSession() {
  const session = loadCloudSession();
  if (!session?.accessToken && !session?.refreshToken) {
    return;
  }

  try {
    let profile = null;
    try {
      profile = await getProfile();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !session.refreshToken) {
        throw error;
      }
      await refreshAuth(session.refreshToken);
      profile = await getProfile();
    }

    let saveMetadata = session.saveMetadata ?? null;
    try {
      const cloudSave = await loadCloudSave();
      saveMetadata = cloudSave?.metadata ?? saveMetadata;
    } catch {
      // Reconnect updates account state only; it never imports cloud progress on startup.
    }

    saveCloudSession({
      ...(loadCloudSession() ?? session),
      profile,
      saveMetadata,
      lastMessage: session.lastMessage ?? '\u0425\u043c\u0430\u0440\u043d\u0438\u0439 \u0430\u043a\u0430\u0443\u043d\u0442 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e.',
    });
    renderHud();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      clearCloudAutosaveQueue();
      gameState.ui.cloudSave = {
        ...(gameState.ui.cloudSave ?? {}),
        message: '\u0421\u0435\u0441\u0456\u044f \u0437\u0430\u043a\u0456\u043d\u0447\u0438\u043b\u0430\u0441\u044f. \u0423\u0432\u0456\u0439\u0434\u0438 \u0449\u0435 \u0440\u0430\u0437.',
      };
      renderHud();
    } else if (import.meta.env?.DEV) {
      console.warn('Cloud session reconnect failed.', error);
    }
  }
}

async function handleCloudAuth(payload) {
  setCloudBusy(true, payload.mode === 'register' ? 'Реєструємо акаунт...' : 'Входимо...');
  renderHud();
  try {
    if (payload.mode === 'register') {
      await register(
        String(payload.email ?? '').trim(),
        String(payload.password ?? ''),
        String(payload.displayName ?? '').trim() || undefined,
      );
    } else {
      await login(String(payload.email ?? '').trim(), String(payload.password ?? ''));
    }
    saveCloudSession({ rememberMe: payload.rememberMe !== false });
    const profile = await getProfile();
    saveCloudSession({ profile });
    const message = await loadLatestCloudSaveAfterAuth(profile);
    setCloudBusy(false, message);
  } catch (error) {
    setCloudBusy(false, cloudErrorMessage(error));
  }
  renderHud();
}

async function handleCloudAction(actionId) {
  if (actionId === 'cloud:logout') {
    logout();
    clearCloudAutosaveQueue();
    pendingCloudSaveDownload = null;
    lastCloudAutosaveSignature = '';
    setCloudBusy(false, 'Ви вийшли з хмарного акаунта.');
    renderHud();
    return;
  }

  if (actionId === 'cloud:upload') {
    await uploadLocalSaveToCloud();
    return;
  }

  if (actionId === 'cloud:download') {
    await downloadCloudSave();
    return;
  }

  if (actionId === 'cloud:conflict:download') {
    await applyPendingCloudSave();
    return;
  }

  if (actionId === 'cloud:conflict:upload') {
    await uploadLocalSaveToCloud({ force: true });
    return;
  }

  if (actionId === 'cloud:conflict:local') {
    pendingCloudSaveDownload = null;
    gameState.ui.cloudSave = {
      ...(gameState.ui.cloudSave ?? {}),
      conflict: null,
      message: '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u0437\u0430\u043b\u0438\u0448\u0435\u043d\u043e. \u0425\u043c\u0430\u0440\u0443 \u043c\u043e\u0436\u043d\u0430 \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0441\u0430\u0442\u0438 \u043f\u0456\u0437\u043d\u0456\u0448\u0435.',
    };
    renderHud();
    return;
  }
}

async function uploadLocalSaveToCloud({ force = false } = {}) {
  setCloudBusy(true, 'Зберігаємо прогрес...');
  renderHud();
  try {
    const result = await syncCurrentSaveToCloud({ force });
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      saveMetadata: result.metadata,
      lastMessage: 'Збережено',
    });
    pendingCloudSaveDownload = null;
    gameState.ui.cloudSave = {
      ...(gameState.ui.cloudSave ?? {}),
      conflict: null,
    };
    lastCloudAutosaveSignature = getCloudSaveSignature();
    setCloudBusy(false, 'Збережено');
    pushFeedback(gameState, 'Збережено', {}, 'item');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const metadata = conflictMetadataFromError(error);
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        saveMetadata: metadata,
      });
      gameState.ui.cloudSave = {
        ...(gameState.ui.cloudSave ?? {}),
        conflict: { metadata, canDownload: false },
      };
    }
    setCloudBusy(false, cloudErrorMessage(error));
  }
  renderHud();
}

async function downloadCloudSave() {
  setCloudBusy(true, 'Перевіряємо сейв на сервері...');
  renderHud();
  try {
    const result = await loadCloudSave();
    if (!result.metadata?.exists || !result.payload) {
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        saveMetadata: result.metadata,
        lastMessage: 'На сервері ще немає збереження.',
      });
      setCloudBusy(false, 'На сервері ще немає збереження.');
      renderHud();
      return;
    }

    if (isCloudSaveOlderThanReset(result.metadata)) {
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        saveMetadata: result.metadata,
        lastMessage: '\u0425\u043c\u0430\u0440\u043d\u0438\u0439 \u0441\u0435\u0439\u0432 \u0441\u0442\u0430\u0440\u0456\u0448\u0438\u0439 \u0437\u0430 \u043e\u0441\u0442\u0430\u043d\u043d\u0454 \u0441\u043a\u0438\u0434\u0430\u043d\u043d\u044f; \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u0441\u0442\u0430\u043d \u0437\u0430\u043b\u0438\u0448\u0435\u043d\u043e.',
      });
      setCloudBusy(false, '\u0425\u043c\u0430\u0440\u043d\u0438\u0439 \u0441\u0435\u0439\u0432 \u0441\u0442\u0430\u0440\u0456\u0448\u0438\u0439 \u0437\u0430 \u043e\u0441\u0442\u0430\u043d\u043d\u0454 \u0441\u043a\u0438\u0434\u0430\u043d\u043d\u044f.');
      renderHud();
      return;
    }

    const revisionText = result.metadata?.revision ? `Ревізія ${result.metadata.revision}. ` : '';
    if (!window.confirm(`${revisionText}Завантажити сейв із сервера і перезаписати локальне збереження?`)) {
      setCloudBusy(false, 'Завантаження із сервера скасовано.');
      renderHud();
      return;
    }

    backupLocalSave('before-cloud-download');
    gameState = importSave(JSON.stringify(result.payload));
    ensureRuntimeState(gameState);
    player.restore(gameState.player);
    audio.syncSettings(gameState.settings.audio);
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      saveMetadata: result.metadata,
      lastMessage: 'Останнє збереження завантажено',
    });
    setCloudBusy(false, 'Останнє збереження завантажено');
    lastCloudAutosaveSignature = getCloudSaveSignature();
    pushFeedback(gameState, 'Останнє збереження завантажено', {}, 'item');
    pushLog(gameState, 'logLoaded');
  } catch (error) {
    setCloudBusy(false, cloudErrorMessage(error));
  }
  renderHud();
}

async function applyPendingCloudSave() {
  if (!pendingCloudSaveDownload?.payload) {
    await downloadCloudSave();
    return;
  }

  setCloudBusy(true, '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0443\u0454\u043c\u043e \u0445\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f...');
  renderHud();
  try {
    const { payload, metadata, profile } = pendingCloudSaveDownload;
    backupLocalSave('before-cloud-conflict-load');
    gameState = importSave(JSON.stringify(payload));
    ensureRuntimeState(gameState);
    player.restore(gameState.player);
    audio.syncSettings(gameState.settings.audio);
    pendingCloudSaveDownload = null;
    gameState.ui.cloudSave = {
      ...(gameState.ui.cloudSave ?? {}),
      conflict: null,
    };
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      saveMetadata: metadata,
      lastMessage: '\u0425\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e',
    });
    lastCloudAutosaveSignature = getCloudSaveSignature();
    setCloudBusy(false, '\u0425\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e');
    pushFeedback(gameState, '\u0425\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e', {}, 'item');
    pushLog(gameState, 'logLoaded');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const metadata = conflictMetadataFromError(error);
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        saveMetadata: metadata,
      });
      gameState.ui.cloudSave = {
        ...(gameState.ui.cloudSave ?? {}),
        conflict: { metadata, canDownload: false },
      };
    }
    setCloudBusy(false, cloudErrorMessage(error));
  }
  renderHud();
}

async function loadLatestCloudSaveAfterAuth(profile) {
  let result = null;
  try {
    result = await loadCloudSave();
  } catch (error) {
    const message = cloudErrorMessage(error);
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      lastMessage: message,
    });
    return message;
  }

  const metadata = result?.metadata ?? null;
  if (!metadata?.exists || !result?.payload) {
    const autoSyncEnabled = gameState.settings?.cloudSave?.autoSyncAfterLogin !== false;
    if (autoSyncEnabled) {
      try {
        const uploadResult = await syncCurrentSaveToCloud({ force: true });
        const message = '\u0425\u043c\u0430\u0440\u043d\u043e\u0433\u043e \u0441\u0435\u0439\u0432\u0443 \u0449\u0435 \u043d\u0435 \u0431\u0443\u043b\u043e; \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e \u0432 \u0445\u043c\u0430\u0440\u0443.';
        saveCloudSession({
          ...(loadCloudSession() ?? {}),
          profile,
          saveMetadata: uploadResult.metadata,
          lastMessage: message,
        });
        lastCloudAutosaveSignature = getCloudSaveSignature();
        return message;
      } catch (error) {
        return cloudErrorMessage(error);
      }
    }
    const message = '\u0425\u043c\u0430\u0440\u043d\u043e\u0433\u043e \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0449\u0435 \u043d\u0435\u043c\u0430\u0454. \u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u0437\u0430\u043b\u0438\u0448\u0435\u043d\u043e.';
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      saveMetadata: metadata,
      lastMessage: message,
    });
    return message;
  }
  if (isCloudSaveOlderThanReset(metadata)) {
    const message = '\u0425\u043c\u0430\u0440\u043d\u0438\u0439 \u0441\u0435\u0439\u0432 \u0441\u0442\u0430\u0440\u0456\u0448\u0438\u0439 \u0437\u0430 \u043e\u0441\u0442\u0430\u043d\u043d\u0454 \u0441\u043a\u0438\u0434\u0430\u043d\u043d\u044f. \u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u0441\u0442\u0430\u043d \u0437\u0430\u043b\u0438\u0448\u0435\u043d\u043e.';
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      saveMetadata: metadata,
      lastMessage: message,
    });
    return message;
  }

  const decision = compareLocalAndCloudSaves(gameState, result.payload, metadata);
  const autoLoadEnabled = gameState.settings?.cloudSave?.autoLoadNewest !== false;
  const autoSyncEnabled = gameState.settings?.cloudSave?.autoSyncAfterLogin !== false;

  if (decision === 'cloud-ahead' && autoLoadEnabled) {
    await applyCloudPayloadAfterAuth(result.payload, metadata, profile, 'before-cloud-login-load');
    return '\u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u043e \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e \u0430\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u0456\u0448\u0435 \u0445\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f.';
  }

  if (decision === 'local-ahead' && autoSyncEnabled) {
    try {
      const uploadResult = await syncCurrentSaveToCloud({ force: true });
      saveCloudSession({
        ...(loadCloudSession() ?? {}),
        profile,
        saveMetadata: uploadResult.metadata,
        lastMessage: '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u043d\u043e\u0432\u0456\u0448\u0438\u0439; \u0445\u043c\u0430\u0440\u0443 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e.',
      });
      lastCloudAutosaveSignature = getCloudSaveSignature();
      return '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0438\u0439 \u043f\u0440\u043e\u0433\u0440\u0435\u0441 \u043d\u043e\u0432\u0456\u0448\u0438\u0439; \u0445\u043c\u0430\u0440\u0443 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e.';
    } catch (error) {
      return cloudErrorMessage(error);
    }
  }

  if (decision === 'equal') {
    const message = '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u0435 \u0456 \u0445\u043c\u0430\u0440\u043d\u0435 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u043e\u0434\u043d\u0430\u043a\u043e\u0432\u043e \u0430\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u0456.';
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      profile,
      saveMetadata: metadata,
      lastMessage: message,
    });
    return message;
  }

  pendingCloudSaveDownload = {
    payload: result.payload,
    metadata,
    profile,
  };
  gameState.ui.cloudSave = {
    ...(gameState.ui.cloudSave ?? {}),
    conflict: { metadata, canDownload: true },
  };
  const conflictMessage = '\u0425\u043c\u0430\u0440\u0430 \u043c\u0430\u0454 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f. \u041e\u0431\u0435\u0440\u0456\u0442\u044c: \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0445\u043c\u0430\u0440\u0443, \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0438\u0441\u0430\u0442\u0438 \u0457\u0457 \u0447\u0438 \u043f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e.';
  saveCloudSession({
    ...(loadCloudSession() ?? {}),
    profile,
    saveMetadata: metadata,
    lastMessage: conflictMessage,
  });
  return conflictMessage;
}

async function applyCloudPayloadAfterAuth(payload, metadata, profile, backupLabel) {
  backupLocalSave(backupLabel);
  gameState = importSave(JSON.stringify(payload));
  ensureRuntimeState(gameState);
  player.restore(gameState.player);
  audio.syncSettings(gameState.settings.audio);
  saveCloudSession({
    ...(loadCloudSession() ?? {}),
    profile,
    saveMetadata: metadata,
    lastMessage: '\u041e\u0441\u0442\u0430\u043d\u043d\u0454 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e',
  });
  pendingCloudSaveDownload = null;
  gameState.ui.cloudSave = {
    ...(gameState.ui.cloudSave ?? {}),
    conflict: null,
  };
  lastCloudAutosaveSignature = getCloudSaveSignature();
  saveGame(gameState);
}

function compareLocalAndCloudSaves(localState, cloudPayload, metadata = {}) {
  const localReset = readResetTombstone();
  const cloudReset = cloudPayload?.resetTombstone ?? cloudPayload?.metadata?.resetTombstone ?? null;
  const localResetAt = Date.parse(localReset?.resetAt ?? '');
  const cloudResetAt = Date.parse(cloudReset?.resetAt ?? '');
  if (Number.isFinite(localResetAt) || Number.isFinite(cloudResetAt)) {
    if (!Number.isFinite(cloudResetAt) || (Number.isFinite(localResetAt) && localResetAt > cloudResetAt)) {
      return 'local-ahead';
    }
    if (!Number.isFinite(localResetAt) || cloudResetAt > localResetAt) {
      return 'cloud-ahead';
    }
  }

  const cloudRevision = Number(metadata?.revision ?? cloudPayload?.version ?? 0);
  const localRevision = Number(localState?.version ?? localState?.playerState?.revision ?? 0);
  if (cloudRevision > localRevision) return 'cloud-ahead';
  if (localRevision > cloudRevision) return 'local-ahead';

  const cloudUpdated = Date.parse(metadata?.updatedAt ?? cloudPayload?.updatedAt ?? cloudPayload?.savedAt ?? '');
  const localUpdated = Date.parse(localState?.updatedAt ?? localStorage.getItem(LAST_SAVE_TIMESTAMP_KEY) ?? '');
  if (Number.isFinite(cloudUpdated) && Number.isFinite(localUpdated) && Math.abs(cloudUpdated - localUpdated) > 60_000) {
    return cloudUpdated > localUpdated ? 'cloud-ahead' : 'local-ahead';
  }

  const localProgress = progressScore(localState);
  const cloudProgress = progressScore(cloudPayload);
  const delta = cloudProgress - localProgress;
  if (Math.abs(delta) >= 8) {
    return delta > 0 ? 'cloud-ahead' : 'local-ahead';
  }
  return delta === 0 ? 'equal' : 'ambiguous';
}

function progressScore(save) {
  const profile = save?.playerProfile ?? {};
  const stats = save?.stats ?? {};
  const journal = save?.catchJournal ?? {};
  const journalTotal = Object.values(journal)
    .reduce((sum, entry) => sum + Number(entry?.count ?? entry?.caught ?? 0), 0);
  const fishCount = Array.isArray(save?.fishBasket) ? save.fishBasket.length : 0;
  return (
    Number(profile.level ?? 1) * 12
    + Number(profile.xp ?? 0) / 25
    + Math.max(Number(stats.totalFishCaught ?? 0), Number(profile.fishCaughtTotal ?? 0), journalTotal)
    + Number(save?.day ?? 1) * 2
    + Number(save?.money ?? save?.economy?.coins ?? 0) / 250
    + fishCount * 0.25
  );
}
async function syncCurrentSaveToCloud({ force = false } = {}) {
  syncPlayerToState();
  saveGame(gameState);
  const exported = JSON.parse(exportSave(gameState));
  const payload = exported.save;
  const resetTombstone = readResetTombstone();
  if (resetTombstone) {
    payload.resetTombstone = resetTombstone;
  }
  const session = loadCloudSession() ?? {};
  const currentRevision = Number(session.saveMetadata?.revision ?? session.serverRevision ?? 0);
  return syncCloudSave({
    saveVersion: payload.version ?? gameState.version ?? exported.version ?? 1,
    revision: Number.isFinite(currentRevision) ? currentRevision : 0,
    force,
    clientUpdatedAt: new Date().toISOString(),
    payload,
  });
}

function conflictMetadataFromError(error) {
  const detail = error instanceof ApiError && typeof error.details === 'object'
    ? error.details?.detail ?? error.details
    : {};
  return {
    exists: true,
    revision: Number(detail?.serverRevision ?? detail?.revision ?? 0) || 0,
    serverUpdatedAt: detail?.serverUpdatedAt ?? detail?.updatedAt ?? null,
    clientRevision: Number(detail?.clientRevision ?? 0) || 0,
  };
}

function setCloudBusy(busy, message = '') {
  gameState.ui ??= {};
  gameState.ui.cloudSave = {
    ...(gameState.ui.cloudSave ?? {}),
    busy,
    message,
  };
}

function cloudErrorMessage(error) {
  if (error instanceof ApiError && error.status === 409) {
    return 'На сервері є новіша версія збереження. Спочатку завантаж її або підтвердь перезапис.';
  }
  if (error instanceof ApiError && error.status === 401) {
    logout();
    clearCloudAutosaveQueue();
    return 'Сесія закінчилася. Увійди ще раз.';
  }
  return error?.message || 'Не вдалося виконати дію з хмарним збереженням.';
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
    queueCloudAutosave();
  };

  if (now - lastAutosaveAt > 1200) {
    saveNow();
    return;
  }

  if (!autosaveTimer) {
    autosaveTimer = window.setTimeout(saveNow, 1200);
  }
}

function queueCloudAutosave({ immediate = false } = {}) {
  const session = loadCloudSession();
  if (!session?.accessToken) {
    clearCloudAutosaveQueue();
    return;
  }

  const signature = getCloudSaveSignature();
  if (!signature || signature === lastCloudAutosaveSignature) {
    return;
  }

  if (cloudAutosaveInFlight) {
    cloudAutosavePending = true;
    return;
  }

  const now = performance.now();
  const conservativeAutosave = isMobileLowPowerTarget() || gameState.settings?.performance?.lowPower;
  const autosaveDelay = conservativeAutosave ? MOBILE_CLOUD_AUTOSAVE_DELAY_MS : CLOUD_AUTOSAVE_DELAY_MS;
  const autosaveMinInterval = conservativeAutosave ? MOBILE_CLOUD_AUTOSAVE_MIN_INTERVAL_MS : CLOUD_AUTOSAVE_MIN_INTERVAL_MS;
  const waitForInterval = Math.max(0, autosaveMinInterval - (now - lastCloudAutosaveStartedAt));
  const delay = immediate ? waitForInterval : Math.max(autosaveDelay, waitForInterval);

  if (cloudAutosaveTimer) {
    window.clearTimeout(cloudAutosaveTimer);
  }

  cloudAutosaveTimer = window.setTimeout(() => {
    cloudAutosaveTimer = null;
    runCloudAutosave(signature);
  }, delay);
}

async function runCloudAutosave(signature) {
  const session = loadCloudSession();
  if (!session?.accessToken || cloudAutosaveInFlight) {
    return;
  }

  cloudAutosaveInFlight = true;
  cloudAutosavePending = false;
  lastCloudAutosaveStartedAt = performance.now();
  setCloudBusy(true, 'Автозбереження...');
  renderHud();

  try {
    const result = await syncCurrentSaveToCloud();
    saveCloudSession({
      ...(loadCloudSession() ?? {}),
      saveMetadata: result.metadata,
      lastMessage: 'Збережено в хмару',
    });
    lastCloudAutosaveSignature = signature;
    setCloudBusy(false, 'Збережено в хмару');
  } catch (error) {
    setCloudBusy(false, cloudErrorMessage(error) || 'Не вдалося зберегти в хмару');
  } finally {
    cloudAutosaveInFlight = false;
    renderHud();
    if (cloudAutosavePending) {
      queueCloudAutosave();
    }
  }
}

function clearCloudAutosaveQueue() {
  if (cloudAutosaveTimer) {
    window.clearTimeout(cloudAutosaveTimer);
    cloudAutosaveTimer = null;
  }
  cloudAutosavePending = false;
}

function getCloudSaveSignature() {
  try {
    return JSON.stringify(JSON.parse(exportSave(gameState)).save);
  } catch {
    return '';
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

function renderAfterAuthorityAction(actionResult) {
  Promise.resolve(actionResult)
    .catch((error) => {
      console.warn('Game authority action fell back or failed.', error);
    })
    .finally(renderHud);
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
  runLockedFishingAction(() => {
    renderAfterAuthorityAction(runFishingContextAction(gameState, performance.now()));
  });
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    spaceIsDown = false;
  }
});
resize();
renderHud();

function getFrameWorkIntervalMs(state) {
  const lowPower = Boolean(state.settings?.performance?.lowPower);
  const mobileTarget = isMobileLowPowerTarget();
  const menuOverlayOpen = hasOpenMenuOverlay(state);
  const minigame = state.ui?.fishingMinigame;

  if (document.hidden) {
    return Number.POSITIVE_INFINITY;
  }

  if (menuOverlayOpen && (lowPower || mobileTarget)) {
    return 500;
  }

  if (minigame?.open) {
    if (['strike_window', 'animating'].includes(minigame.phase)) {
      return lowPower || mobileTarget ? 38 : 16;
    }
    if (['cast', 'waiting'].includes(minigame.phase)) {
      return lowPower || mobileTarget ? 160 : 80;
    }
    return lowPower || mobileTarget ? 240 : 120;
  }

  if (state.ui?.activeScene) {
    return lowPower || mobileTarget ? 500 : 250;
  }

  return lowPower || mobileTarget ? 180 : 16;
}

function getHudRenderIntervalMs(state) {
  const lowPower = Boolean(state.settings?.performance?.lowPower);
  const mobileTarget = isMobileLowPowerTarget();
  const minigame = state.ui?.fishingMinigame;

  if (minigame?.open) {
    return lowPower || mobileTarget ? 240 : 120;
  }

  if (state.ui?.activeScene) {
    return lowPower || mobileTarget ? 900 : 500;
  }

  return lowPower || mobileTarget ? 360 : 180;
}

function animate(nowMs = performance.now()) {
  requestAnimationFrame(animate);

  if (document.hidden) {
    clock.getDelta();
    return;
  }

  const frameWorkIntervalMs = getFrameWorkIntervalMs(gameState);
  if (nowMs - lastFrameWorkAt < frameWorkIntervalMs) {
    return;
  }
  lastFrameWorkAt = nowMs;

  const delta = Math.min(clock.getDelta(), 0.05);
  const minigameOpen = Boolean(gameState.ui?.fishingMinigame?.open);
  const activeSceneOpen = Boolean(gameState.ui?.activeScene);
  const menuOverlayOpen = hasOpenMenuOverlay(gameState);
  if (!activeSceneOpen || minigameOpen) {
    player.update(delta, world.bounds);
    world.updateCamera(player.position);
    if (!gameState.settings?.performance?.lowPower && !menuOverlayOpen) {
      world.animate(delta);
    }
  }
  tickFishingMinigame(gameState, performance.now());
  gameState.settings.audio.musicTrackId = audio.getCurrentTrackId();
  syncPlayerToState();
  const now = performance.now();
  const renderEveryMs = getHudRenderIntervalMs(gameState);
  if (now - lastHudRenderAt >= renderEveryMs) {
    lastHudRenderAt = now;
    renderHud();
  }
  audio.drainQueue(gameState);
  renderer.render(world.scene, world.camera);
}

animate();
