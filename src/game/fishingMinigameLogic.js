import { biteTuning, castSpots, getBiteProfile, getCastSpot, stateDurationsMs } from './bitePatterns.js';
import { getFishData, getFreshFishValue, rollFishById } from './fishData.js';
import {
  getFishEntries,
  markFishAsLiveBait,
  syncInventoryFromFishBasket,
} from './fishInventory.js';
import { addFishToStorage, removeFishFromStorage, resolveCatch } from './gameAuthority.js';
import { countItem, hasItem, removeItem } from './inventory.js';
import { normalizeWaterId } from './locations.js';
import { markFirstCrucianCatchRewardSeen, queueFirstCrucianCatchReward } from './locationTransitions.js';
import { getActiveItemModifiers } from './itemEffects.js';
import {
  buildFishingChanceDebug,
  calculateFishChanceSet,
  getBaitSuitability,
} from './fishChanceCalculator.js';
import { pushFeedback, pushLog, queueSound } from './state.js';
import { getTackleEffects } from './tackle.js';
import { advanceTime, formatGameTime } from './time.js';
import { getWaterSizeRange } from './waterFishDistribution.js';
import { classifyCatchSize, rollFishWeight } from './fishSizeProfiles.js';

const ambientLogKeys = ['logAmbientBird', 'logAmbientRings', 'logAmbientDrift'];
const NO_BAIT_NOTICE_COOLDOWN_MS = 1400;

export function createFishingMinigameState(method) {
  return {
    open: true,
    method,
    selectedBait: null,
    selectedDepth: null,
    selectedZone: null,
    selectedSpot: null,
    phase: 'setup',
    bobberState: 'hidden',
    statusKey: 'fishingChooseSetup',
    result: null,
    fishCandidateId: null,
    currentPattern: [],
    patternIndex: 0,
    nextStepAt: 0,
    strikeWindowStartAt: 0,
    strikeWindowEndAt: 0,
    castTarget: null,
    castAreaTarget: null,
    consumedBait: null,
    baitConsumptionCommitted: false,
    pendingLiveBaitEntryId: null,
    currentCatchEntryId: null,
    debugFishChance: null,
    idleEventAt: 0,
    ambientEventAt: 0,
    rareInsectAt: 0,
    rareInsectActiveUntil: 0,
    falseActivityCount: 0,
    biteChecks: [],
    biteCheckIndex: 0,
    biteCycle: 0,
    biteCycleTotal: 0,
    biteCyclePattern: [],
    biteCyclePatternIndex: 0,
    stillnessUntil: 0,
  };
}

export function openFishingMinigame(state, method) {
  if (!hasItem(state, 'primitiveTackle')) {
    pushLog(state, 'logNeedTutorialTackle');
    return;
  }

  const effects = getTackleEffects(state);
  if (!effects.hasCompleteStarterSet) {
    pushLog(state, 'logNeedCompleteTackle');
    return;
  }

  if (method === 'stickRod' && !hasUsableRod(state)) {
    pushLog(state, 'logNeedFirstRod');
    return;
  }

  if (method === 'liveBait' && (!hasUsableRod(state) || getFishEntries(state, 'live_bait').length === 0)) {
    pushLog(state, !hasUsableRod(state) ? 'logNeedFirstRod' : 'logNeedLiveBait');
    return;
  }

  state.ui.catchResult = null;
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    inventory: true,
    keepnet: true,
    tackle: true,
    guide: true,
    journal: true,
    settings: true,
    fishingControls: true,
    fishingResult: true,
  };
  state.ui.fishingMinigame = createFishingMinigameState(method);
  state.ui.fishingMinigame.selectedDepth = state.settings?.fishing?.lastDepth ?? 'middle';
  state.ui.fishingMinigame.rareInsectAt = (globalThis.performance?.now?.() ?? 0) + randomBetween(330000, 390000);
  autoSelectFirstAvailableBait(state, state.ui.fishingMinigame);
  if (method === 'liveBait' && getFishEntries(state, 'live_bait').length > 0) {
    state.ui.fishingMinigame.selectedBait = 'live_bait';
  }
  autoSelectFirstAvailableSpot(state, state.ui.fishingMinigame);
  if (!state.ui.fishingMinigame.selectedBait) {
    state.ui.fishingMinigame.statusKey = 'fishingNoBaitAvailable';
  }
  queueSound(state, 'open_scene');
}

export function closeFishingMinigame(state) {
  if (state.ui.fishingMinigame?.open) {
    queueSound(state, 'close_scene');
  }
  state.ui.fishingMinigame = null;
  state.ui.catchResult = null;
}

export function selectFishingBait(state, bait) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (!getAvailableBaits(state).some((entry) => entry.id === bait && !entry.disabled)) {
    return;
  }

  minigame.selectedBait = bait;
  minigame.statusKey = 'fishingBaitSelected';
  queueSound(state, 'ui_click');
}

export function selectFishingZone(state, zone) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  const spot = castSpots.find((entry) => entry.zone === zone && canUseCastSpot(state, minigame.method, entry).allowed);
  if (!spot) {
    minigame.statusKey = 'fishingSpotLocked';
    return;
  }

  selectFishingSpot(state, spot.id);
}

export function selectFishingSpot(state, spotId) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  const spot = getCastSpot(spotId);
  const access = canUseCastSpot(state, minigame.method, spot);
  if (!access.allowed) {
    minigame.statusKey = access.reasonKey;
    queueSound(state, 'ui_click');
    return;
  }

  minigame.selectedSpot = spot.id;
  minigame.selectedZone = spot.zone;
  minigame.castAreaTarget = spot.target;
  minigame.castTarget = spot.target;
  minigame.statusKey = 'fishingSpotSelected';
  queueSound(state, 'ui_click');
}

export function selectFishingDepth(state, depth) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open || !['bottom', 'middle', 'surface'].includes(depth)) {
    return;
  }

  minigame.selectedDepth = depth;
  state.settings.fishing ??= {};
  state.settings.fishing.lastDepth = depth;
  minigame.statusKey = 'fishingDepthSelected';
  queueSound(state, 'ui_click');
}

export function castLine(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (!minigame.selectedBait) {
    autoSelectFirstAvailableBait(state, minigame);
  }

  if (!minigame.selectedBait) {
    notifyNoBait(state, minigame);
    return;
  }

  if (!minigame.selectedSpot) {
    autoSelectFirstAvailableSpot(state, minigame);
  }

  if (!minigame.selectedSpot) {
    minigame.statusKey = 'fishingSelectSpotFirst';
    return;
  }

  if (!hasBaitAvailable(state, minigame.selectedBait)) {
    notifyNoBait(state, minigame);
    return;
  }

  minigame.consumedBait = minigame.selectedBait;
  minigame.baitConsumptionCommitted = false;
  minigame.pendingLiveBaitEntryId = minigame.selectedBait === 'live_bait'
    ? getFishEntries(state, 'live_bait')[0]?.id ?? null
    : null;
  minigame.consumedLiveBaitSourceFishId = null;
  minigame.consumedLiveBaitQuality = null;
  advanceTime(state, 35);
  minigame.phase = 'cast';
  minigame.bobberState = 'cast';
  minigame.statusKey = 'fishingCasting';
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    fishingControls: true,
  };
  minigame.nextStepAt = nowMs + 850;
  minigame.fishCandidateId = chooseFishCandidate(state, minigame);
  minigame.debugFishChance = buildFishingChanceDebug(state, minigame, minigame.fishCandidateId);
  minigame.currentPattern = minigame.fishCandidateId ? buildPattern(minigame.fishCandidateId) : [];
  minigame.patternIndex = 0;
  minigame.biteChecks = [];
  minigame.biteCheckIndex = 0;
  minigame.biteCycle = 0;
  minigame.biteCycleTotal = minigame.fishCandidateId ? getBiteCycleTotal(minigame.fishCandidateId) : 0;
  minigame.biteCyclePattern = [];
  minigame.biteCyclePatternIndex = 0;
  minigame.stillnessUntil = minigame.fishCandidateId && Math.random() < 0.28 ? nowMs + randomBetween(10000, 15000) : 0;
  minigame.castTarget = rollCastTarget(state, minigame, getCastSpot(minigame.selectedSpot));
  minigame.falseActivityCount = 0;
  minigame.idleEventAt = nowMs + randomBetween(2500, 5200);
  minigame.ambientEventAt = nowMs + randomBetween(5000, 11000);
  autoSelectFirstAvailableBait(state, minigame);
  state.ui.catchResult = null;
  state.ui.questProgressUpdates = [];
  queueSound(state, 'cast_whoosh');
}

export async function strikeLine(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  const tutorialCatchActive = !state.progress?.firstCatchDone;

  if (minigame.phase !== 'strike_window') {
    minigame.statusKey = 'fishingTooEarly';
    minigame.result = { outcome: 'too_early' };
    minigame.bobberState = 'missed';
    if (!tutorialCatchActive && minigame.fishCandidateId && Math.random() < 0.18) {
      resolveMinigameResult(state, { outcome: 'escaped', statusKey: 'fishingScaredFish', sound: 'fish_escape' });
    } else {
      minigame.phase = 'waiting';
      minigame.nextStepAt = nowMs + randomBetween(900, 1700);
      queueSound(state, 'water_ripple');
    }
    return;
  }
  const fishProfile = getBiteProfile(minigame.fishCandidateId);
  const timingCenter = (minigame.strikeWindowStartAt + minigame.strikeWindowEndAt) / 2;
  const timingSpread = Math.max(1, (minigame.strikeWindowEndAt - minigame.strikeWindowStartAt) / 2);
  const reactionQuality = Math.max(0, 1 - Math.abs(nowMs - timingCenter) / timingSpread);
  const tackleBonus = getTackleBonus(state, minigame.method);
  const baitBonus = getBaitSuitability(minigame.fishCandidateId, minigame.selectedBait);
  const fishDifficulty = fishProfile.difficulty ?? 0.5;
  const itemModifiers = getActiveItemModifiers(state);
  const successChance = tutorialCatchActive
    ? 1
    : clamp(0.52 + reactionQuality * 0.26 + tackleBonus * 0.65 + baitBonus * 0.12 + itemModifiers.biteChanceBonus - fishDifficulty * 0.12, 0.34, 0.92);
  const roll = Math.random();
  const effects = getTackleEffects(state);

  queueSound(state, 'strike');

  if (!tutorialCatchActive && ['pike', 'sudak', 'som', 'canadian_catfish', 'eel'].includes(minigame.fishCandidateId)) {
    const breakChance = clamp(
      (0.07 + Math.max(0, effects.breakPenalty) * 0.4 - effects.hookBonus * 0.28 - effects.stabilityBonus * 0.2) * itemModifiers.escapeChanceMultiplier,
      0.015,
      0.16,
    );
    if (roll < breakChance) {
      resolveMinigameResult(state, { outcome: 'line_broke', statusKey: 'fishingLineBroke', sound: 'line_break' });
      return;
    }
  }

  if (!tutorialCatchActive && minigame.method === 'handline') {
    const handlineBreakChance = clamp(
      (0.02 + Math.max(0, effects.breakPenalty) * 0.18 - effects.hookBonus * 0.1) * itemModifiers.escapeChanceMultiplier,
      0.005,
      0.08,
    );
    if (roll > 1 - handlineBreakChance) {
      resolveMinigameResult(state, { outcome: 'line_broke', statusKey: 'fishingLineBroke', sound: 'line_break' });
      return;
    }
  }

  if (minigame.fishCandidateId === 'eel' && !['nightcrawler', 'live_bait'].includes(minigame.consumedBait ?? minigame.selectedBait)) {
    resolveMinigameResult(state, { outcome: 'line_broke', statusKey: 'fishingLineBroke', sound: 'line_break' });
    return;
  }

  if (roll <= successChance) {
    // TODO server-authoritative migration: catch resolution is currently client-owned;
    // later route this through gameApi.resolveCatchOnServer behind SERVER_AUTHORITATIVE_CATCH.
    const baitFits = getBaitSuitability(minigame.fishCandidateId, minigame.consumedBait ?? minigame.selectedBait) >= 1;
    const catchResult = rollFishById(minigame.fishCandidateId, {
      rollWeight: rollFishWeight,
      baitId: minigame.consumedBait ?? minigame.selectedBait,
      baitFits,
      waterId: normalizeWaterId(state.travel?.selectedWater),
      tackleTrophyBonus: (effects.trophyBonus ?? 0) + itemModifiers.trophyChanceBonus,
      hookId: state.tackle?.equipped?.hook ?? 'none',
      depth: minigame.selectedDepth ?? 'middle',
      minWeight: minigame.consumedBait === 'live_bait' ? 350 : 0,
    });
    applyDepthCatchAdjustments(catchResult, minigame.selectedDepth ?? 'middle');
    adjustCatchForWater(state, catchResult);
    applyItemCatchAdjustments(catchResult, itemModifiers);
    catchResult.value = getFreshFishValue(catchResult);
    catchResult.catchCategory = classifyCatchSize(catchResult.id, catchResult.weightGrams);
    if (!tutorialCatchActive && shouldBreakHomemadeRod(state, catchResult, itemModifiers)) {
      removeItem(state, 'stickRod');
      state.tackle.owned.simple_stick_rod = false;
      if (state.tackle.equipped.rod === 'simple_stick_rod') {
        state.tackle.equipped.rod = 'none';
      }
      resolveMinigameResult(state, { outcome: 'rod_broke', statusKey: 'fishingRodBroke', sound: 'line_break' });
      return;
    }
    const catchContext = {
      catchSpotId: minigame.selectedSpot,
      method: minigame.method,
      bait: minigame.consumedBait ?? minigame.selectedBait,
      depth: minigame.selectedDepth ?? 'middle',
      waterId: normalizeWaterId(state.travel?.selectedWater),
      caughtAtTime: formatGameTime(state),
    };
    const shouldShowFirstCrucianReward = catchResult.id === 'crucian'
      && !state.progress?.firstCrucianCatchRewardShown
      && !state.catchJournal?.crucian?.discovered;
    const authorityResult = await resolveCatch({
      state,
      itemModifiers,
      serverPayload: buildCatchResolvePayload(state, minigame, {
        reactionQuality,
        successChance,
        localSaveRevision: state.version ?? 0,
        itemModifiers,
      }),
      localResolve: () => addFishToStorage({
        state,
        catchResult,
        context: catchContext,
      }).result,
    });
    if (!authorityResult.result?.caught) {
      resolveMinigameResult(state, { outcome: 'escaped', statusKey: 'fishingGotAway', sound: 'fish_escape' });
      return;
    }
    const entry = authorityResult.result?.entry ?? null;
    const resolvedCatchResult = authorityResult.result?.catchResult ?? catchResult;
    if (entry?.trophyTier) {
      queueSound(state, 'trophy_fanfare');
    }
    state.ui.catchResult = resolvedCatchResult;
    minigame.currentCatchEntryId = entry?.id ?? null;
    resolveMinigameResult(state, {
      outcome: 'caught',
      statusKey: 'fishingCaught',
      sound: 'catch_success',
      catchResult: resolvedCatchResult,
    });
    const shouldShowTrophyCrucianReward = resolvedCatchResult.id === 'crucian' && Boolean(entry?.trophyTier);
    if (shouldShowTrophyCrucianReward) {
      if (shouldShowFirstCrucianReward) {
        markFirstCrucianCatchRewardSeen(state);
      }
      queueFirstCrucianCatchReward(state, { repeat: true });
    } else if (shouldShowFirstCrucianReward && !queueFirstCrucianCatchReward(state)) {
      markFirstCrucianCatchRewardSeen(state);
    }
    minigame.bobberState = 'hooked';
    return;
  }

  const failureOutcomes = [
    { outcome: 'escaped', statusKey: 'fishingGotAway', sound: 'fish_escape' },
    { outcome: 'hook_lost', statusKey: 'fishingHookLoose', sound: 'fish_escape' },
    { outcome: 'bait_stolen', statusKey: 'fishingBaitStolen', sound: 'fish_escape' },
  ];
  const failure = failureOutcomes[Math.floor(Math.random() * failureOutcomes.length)];
  resolveMinigameResult(state, failure);
}

export function keepCatch(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  minigame.statusKey = 'fishingMovedToKeepnet';
  resetAfterResult(state, minigame);
}

export function releaseCurrentCatch(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.currentCatchEntryId) {
    return;
  }

  removeFishFromStorage({ state, fishEntryId: minigame.currentCatchEntryId, reason: 'release-current-catch' });
  minigame.statusKey = 'fishingReleased';
  resetAfterResult(state, minigame);
  queueSound(state, 'water_ripple');
}

export function releaseSmallFish(state, fishId) {
  removeFishFromStorage({ state, fishId, reason: 'release-small-fish' });
  queueSound(state, 'water_ripple');
}

export function releaseKeepnetFish(state, fishEntryId) {
  removeFishFromStorage({ state, fishEntryId, reason: 'release-keepnet-fish' });
  queueSound(state, 'water_ripple');
}

export function useCatchAsLiveBait(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.currentCatchEntryId) {
    return;
  }

  const entry = markFishAsLiveBait(state, minigame.currentCatchEntryId);
  if (!entry) {
    minigame.statusKey = 'fishingLiveBaitUnavailable';
    return;
  }

  minigame.statusKey = 'fishingLiveBaitReady';
  resetAfterResult(state, minigame);
}

export function castAgain(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  minigame.phase = 'setup';
  minigame.bobberState = 'hidden';
  minigame.statusKey = 'fishingChooseSetup';
  minigame.result = null;
  minigame.fishCandidateId = null;
  minigame.currentPattern = [];
  minigame.patternIndex = 0;
  minigame.biteCycle = 0;
  minigame.biteCycleTotal = 0;
  minigame.biteChecks = [];
  minigame.biteCheckIndex = 0;
  minigame.biteCyclePattern = [];
  minigame.biteCyclePatternIndex = 0;
  minigame.stillnessUntil = 0;
  minigame.nextStepAt = 0;
  minigame.strikeWindowStartAt = 0;
  minigame.strikeWindowEndAt = 0;
  minigame.currentCatchEntryId = null;
  minigame.consumedBait = null;
  minigame.baitConsumptionCommitted = false;
  minigame.pendingLiveBaitEntryId = null;
  minigame.consumedLiveBaitSourceFishId = null;
  minigame.consumedLiveBaitQuality = null;
  minigame.debugFishChance = null;
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    fishingControls: false,
  };
  autoSelectFirstAvailableBait(state, minigame);
  if (!minigame.selectedBait) {
    minigame.statusKey = 'fishingNoBaitAvailable';
  }
  state.ui.catchResult = null;
}

export function recastLine(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open || !['cast', 'waiting', 'animating', 'strike_window'].includes(minigame.phase)) {
    return;
  }

  minigame.phase = 'setup';
  minigame.bobberState = 'hidden';
  minigame.statusKey = 'fishingRecastReady';
  minigame.result = null;
  minigame.fishCandidateId = null;
  minigame.currentPattern = [];
  minigame.patternIndex = 0;
  minigame.biteCycle = 0;
  minigame.biteCycleTotal = 0;
  minigame.biteChecks = [];
  minigame.biteCheckIndex = 0;
  minigame.biteCyclePattern = [];
  minigame.biteCyclePatternIndex = 0;
  minigame.stillnessUntil = 0;
  minigame.nextStepAt = 0;
  minigame.strikeWindowStartAt = 0;
  minigame.strikeWindowEndAt = 0;
  minigame.consumedBait = null;
  minigame.baitConsumptionCommitted = false;
  minigame.pendingLiveBaitEntryId = null;
  minigame.consumedLiveBaitSourceFishId = null;
  minigame.consumedLiveBaitQuality = null;
  minigame.debugFishChance = null;
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    fishingControls: false,
  };
  queueSound(state, 'water_ripple');
}

export function observeWater(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  const spot = getCastSpot(minigame.selectedSpot);
  const strongestFishId = Object.entries(spot.weights)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  if (strongestFishId && Math.random() > 0.35) {
    pushLog(state, 'logObserveWaterSpot', {
      spotKey: spot.labelKey,
      fishKey: getFishData(strongestFishId)?.nameKey ?? strongestFishId,
    });
  } else {
    pushLog(state, ambientLogKeys[Math.floor(Math.random() * ambientLogKeys.length)]);
  }
  queueSound(state, 'water_ripple');
}

export function tickFishingMinigame(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (minigame.phase === 'cast' && nowMs >= minigame.nextStepAt) {
    minigame.phase = 'waiting';
    minigame.bobberState = 'idle';
    minigame.statusKey = 'fishingWaiting';
    minigame.biteChecks = buildBiteChecks(state, minigame, nowMs);
    minigame.biteCheckIndex = 0;
    minigame.nextStepAt = minigame.biteChecks[0]?.at ?? (nowMs + 5200);
    queueSound(state, 'bobber_plop');
    return;
  }

  if (minigame.phase === 'waiting') {
    tickWaitingAmbience(state, minigame, nowMs);
  }

  tickRareInsect(state, minigame, nowMs);

  if (minigame.phase === 'waiting' && nowMs >= minigame.nextStepAt) {
    if (runBiteCheck(state, minigame, nowMs)) {
      startBiteCycle(state, minigame, nowMs);
      return;
    }

    if (minigame.biteCheckIndex >= minigame.biteChecks.length) {
      resolveMinigameResult(state, { outcome: 'no_bite', statusKey: 'fishingNoBite', sound: 'water_ripple' });
      minigame.bobberState = 'idle';
      return;
    }

    minigame.bobberState = minigame.biteCheckIndex % 2 === 0 ? 'tiny_nibble' : 'idle';
    minigame.statusKey = getWaitingStatusKey(state);
    minigame.nextStepAt = minigame.biteChecks[minigame.biteCheckIndex].at;
    queueSound(state, minigame.bobberState === 'tiny_nibble' ? 'tiny_nibble' : 'water_ripple');
    return;
  }

  if (minigame.phase === 'animating' && nowMs >= minigame.nextStepAt) {
    advancePatternStep(state, minigame, nowMs);
    return;
  }

  if (minigame.phase === 'strike_window' && nowMs > minigame.strikeWindowEndAt) {
    advanceMissedBiteCycle(state, minigame, nowMs);
  }
}

export function getAvailableBaits(state) {
  const liveBaitCount = getFishEntries(state, 'live_bait').length;
  return [
    { id: 'small_worms', count: countItem(state, 'smallWorms'), disabled: countItem(state, 'smallWorms') === 0 },
    { id: 'worms', count: countItem(state, 'worms'), disabled: countItem(state, 'worms') === 0 },
    { id: 'larvae', count: countItem(state, 'larvae'), disabled: countItem(state, 'larvae') === 0 },
    { id: 'bread', count: countItem(state, 'bread'), disabled: countItem(state, 'bread') === 0 },
    { id: 'mastyrka', count: countItem(state, 'mastyrka'), disabled: countItem(state, 'mastyrka') === 0 },
    { id: 'corn', count: countItem(state, 'corn'), disabled: countItem(state, 'corn') === 0 },
    { id: 'dough', count: countItem(state, 'dough'), disabled: countItem(state, 'dough') === 0 },
    { id: 'nightcrawler', count: countItem(state, 'nightcrawler'), disabled: countItem(state, 'nightcrawler') === 0 },
    { id: 'live_bait', count: liveBaitCount, disabled: liveBaitCount === 0 },
  ];
}

export function getCastSpotTarget(spotId) {
  return getCastSpot(spotId).target;
}

export function getFishingChanceDebug(state) {
  const minigame = state.ui?.fishingMinigame;
  if (!minigame?.open || !minigame.selectedSpot) {
    return null;
  }
  return buildFishingChanceDebug(state, minigame, minigame.fishCandidateId);
}

export function getAvailableCastSpots(state, method) {
  const selectedWater = normalizeWaterId(state.travel?.selectedWater);
  const waterSpots = castSpots.filter((spot) => (spot.waterId ?? 'canal') === selectedWater);
  return waterSpots.map((spot) => ({
    ...spot,
    scatterRadius: getCastScatterRadius(state, method, spot),
    ...canUseCastSpot(state, method, spot),
  }));
}

export function getCastScatterRadius(state, method, spot) {
  const effects = getTackleEffects(state);
  const methodScale = method === 'handline' ? 1.12 : method === 'liveBait' ? 0.78 : 0.9;
  return {
    x: Math.max(3.5, (spot.radius?.x ?? 8) * effects.scatterScale * methodScale),
    y: Math.max(2.4, (spot.radius?.y ?? 5) * effects.scatterScale * methodScale),
  };
}

export function setBiteHintMode(state, mode) {
  if (!['beginner', 'subtle', 'off'].includes(mode)) {
    return;
  }

  state.settings.fishing ??= {};
  state.settings.fishing.biteHints = mode;
  queueSound(state, 'ui_click');
}

export async function runFishingContextAction(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (canContextCast(minigame)) {
    castLine(state, nowMs);
    return;
  }

  if (minigame.phase === 'strike_window' || minigame.phase === 'animating' || minigame.phase === 'waiting' || minigame.phase === 'cast') {
    await strikeLine(state, nowMs);
  }
}

export function getFishingContextAction(state) {
  const minigame = state.ui.fishingMinigame;
  const hintMode = state.settings?.fishing?.biteHints ?? 'subtle';
  if (!minigame?.open) {
    return { labelKey: 'action', enabled: false, variant: 'idle' };
  }

  if (canContextCast(minigame)) {
    return { labelKey: 'cast', enabled: Boolean(minigame.selectedSpot), variant: 'cast' };
  }

  if (minigame.phase === 'strike_window') {
    return {
      labelKey: hintMode === 'off' ? 'strike' : 'strikeNow',
      enabled: true,
      variant: 'strike',
    };
  }

  if (minigame.phase === 'waiting' || minigame.phase === 'cast' || minigame.phase === 'animating') {
    return {
      labelKey: hintMode === 'off' ? 'action' : 'strike',
      enabled: true,
      variant: 'wait',
    };
  }

  if (minigame.phase === 'result') {
    return { labelKey: 'castAgain', enabled: true, variant: 'cast' };
  }

  return { labelKey: 'action', enabled: false, variant: 'idle' };
}

function advancePatternStep(state, minigame, nowMs) {
  const activePattern = minigame.biteCyclePattern.length ? minigame.biteCyclePattern : minigame.currentPattern;
  const activeIndex = minigame.biteCyclePattern.length ? minigame.biteCyclePatternIndex : minigame.patternIndex;
  const step = activePattern[activeIndex];
  if (!step) {
    if (minigame.biteCycle < minigame.biteCycleTotal) {
      startBiteCycle(state, minigame, nowMs);
    } else {
      resolveMinigameResult(state, { outcome: 'no_bite', statusKey: 'fishingNoBite', sound: 'water_ripple' });
      minigame.bobberState = 'idle';
    }
    return;
  }

  if (minigame.biteCyclePattern.length) {
    minigame.biteCyclePatternIndex += 1;
  } else {
    minigame.patternIndex += 1;
  }

  if (step === 'strike_window') {
    const profile = getBiteProfile(minigame.fishCandidateId);
    minigame.phase = 'strike_window';
    minigame.bobberState = 'strike_window';
    minigame.statusKey = getStrikeWindowStatusKey(state);
    minigame.strikeWindowStartAt = nowMs;
    minigame.strikeWindowEndAt = nowMs + randomBetween(...(
      state.progress?.firstCatchDone
        ? profile.hookWindowMs
        : [Math.max(profile.hookWindowMs[0], 1200), Math.max(profile.hookWindowMs[1], 2200)]
    ));
    queueSound(state, 'strong_bite');
    queueSound(state, 'line_tension');
    return;
  }

  minigame.phase = 'animating';
  minigame.bobberState = step;
  minigame.statusKey = getPatternStatusKey(step);
  minigame.nextStepAt = nowMs + randomBetween(...(stateDurationsMs[step] ?? [500, 800]));
  queueSound(state, step === 'hard_dip' || step === 'sideways_pull' ? 'strong_bite' : 'tiny_nibble');
}

function canContextCast(minigame) {
  return ['setup', 'result'].includes(minigame.phase);
}

function notifyNoBait(state, minigame) {
  minigame.statusKey = 'fishingNoBaitAvailable';
  const now = globalThis.performance?.now?.() ?? Date.now();
  const lastNoticeAt = Number(minigame.noBaitNoticeAt ?? 0);
  if (lastNoticeAt > 0 && now - lastNoticeAt < NO_BAIT_NOTICE_COOLDOWN_MS) {
    return;
  }
  minigame.noBaitNoticeAt = now;
  pushFeedback(state, 'feedbackNoBait', {}, 'bait');
  pushLog(state, 'logNeedBait');
}

function hasUsableRod(state) {
  return getTackleEffects(state).hasRod || hasItem(state, 'stickRod');
}

function startBiteCycle(state, minigame, nowMs) {
  minigame.biteCycle += 1;
  minigame.biteCyclePattern = buildCyclePattern(minigame.fishCandidateId, minigame.biteCycle, minigame.biteCycleTotal);
  minigame.biteCyclePatternIndex = 0;
  minigame.phase = 'animating';
  minigame.bobberState = 'idle';
  minigame.statusKey = getCycleStatusKey(state, minigame);
  minigame.nextStepAt = nowMs + randomBetween(550, 1100);
}

function buildBiteChecks(state, minigame, startMs) {
  const tutorialBonus = state.progress?.firstCatchDone ? 0 : 0.2;
  const profile = minigame.fishCandidateId ? getBiteProfile(minigame.fishCandidateId) : null;
  const itemModifiers = getActiveItemModifiers(state);
  const fishActivity = profile ? clamp(0.04 + (profile.activity ?? 0.5) * 0.08, 0, 0.12) : 0;
  const spot = minigame.selectedSpot ? getCastSpot(minigame.selectedSpot) : null;
  const spotActivity = spot?.zone === 'mid_water' ? 0.04 : spot?.zone === 'reed_edge' ? 0.025 : 0.015;
  const baitActivity = minigame.fishCandidateId ? clamp((getBaitSuitability(minigame.fishCandidateId, minigame.selectedBait) - 0.28) * 0.08, -0.04, 0.08) : -0.02;
  const waterActivity = normalizeWaterId(state.travel?.selectedWater) === 'canal' ? 0 : 0.025;
  const baseChances = [0.14, 0.24, 0.38, 0.54, 0.68];
  const canFastNibble = ['bleak', 'gudgeon', 'rotan'].includes(minigame.fishCandidateId) && Math.random() < 0.32;
  const firstCheck = canFastNibble ? 1700 : 2800;
  const intervals = [firstCheck, 4300, 6500, 8900, 11600];
  const stillnessDelay = Math.max(0, (minigame.stillnessUntil ?? 0) - startMs);

  return baseChances.map((chance, index) => ({
    at: startMs + stillnessDelay + intervals[index] + randomBetween(-220, 260),
    chance: clamp(chance + tutorialBonus + fishActivity + spotActivity + baitActivity + waterActivity + itemModifiers.biteChanceBonus, 0.04, 0.9),
  }));
}

function runBiteCheck(state, minigame, nowMs) {
  const check = minigame.biteChecks[minigame.biteCheckIndex];
  minigame.biteCheckIndex += 1;

  if (!check || !minigame.fishCandidateId) {
    return false;
  }

  const lateBoost = minigame.biteCheckIndex >= minigame.biteChecks.length ? biteTuning.lateBiteBoost : 0;
  if (Math.random() <= clamp(check.chance + lateBoost, 0, 0.9)) {
    return true;
  }

  minigame.nextStepAt = nowMs + randomBetween(700, 1150);
  return false;
}

function advanceMissedBiteCycle(state, minigame, nowMs) {
  minigame.bobberState = 'missed';
  if (minigame.biteCycle < minigame.biteCycleTotal) {
    minigame.phase = 'animating';
    minigame.statusKey = getCycleStatusKey(state, minigame);
    minigame.biteCyclePattern = ['idle'];
    minigame.biteCyclePatternIndex = 0;
    minigame.nextStepAt = nowMs + randomBetween(700, 1500);
    queueSound(state, 'water_ripple');
    return;
  }

  resolveMinigameResult(state, { outcome: 'too_late', statusKey: 'fishingTooLate', sound: 'fish_escape' });
}

function autoSelectFirstAvailableBait(state, minigame) {
  const available = getAvailableBaits(state).filter((bait) => !bait.disabled);
  if (minigame.selectedBait && available.some((bait) => bait.id === minigame.selectedBait)) {
    return;
  }

  minigame.selectedBait = available[0]?.id ?? null;
}

function autoSelectFirstAvailableSpot(state, minigame) {
  const available = getAvailableCastSpots(state, minigame.method).filter((spot) => spot.allowed);
  if (minigame.selectedSpot && available.some((spot) => spot.id === minigame.selectedSpot)) {
    return;
  }

  const preferredSpot = minigame.method === 'handline' ? 'dam_edge' : 'open_middle';
  minigame.selectedSpot = available.find((spot) => spot.id === preferredSpot)?.id ?? available[0]?.id ?? null;
  const spot = minigame.selectedSpot ? getCastSpot(minigame.selectedSpot) : null;
  minigame.selectedZone = spot?.zone ?? null;
  minigame.castAreaTarget = spot?.target ?? null;
  minigame.castTarget = spot?.target ?? null;
}

function getPatternStatusKey(step) {
  if (step === 'idle') {
    return 'fishingWaiting';
  }

  if (step === 'tiny_nibble') {
    return 'fishingSmallMovement';
  }

  if (step === 'hard_dip') {
    return 'fishingStrongBite';
  }

  return 'fishingCarefulBite';
}

function resolveMinigameResult(state, result) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame) {
    return;
  }

  minigame.phase = 'result';
  hideBobber(minigame);
  minigame.result = result;
  minigame.statusKey = result.statusKey;
  queueSound(state, result.sound);

  if (shouldCommitBaitForOutcome(result.outcome)) {
    commitPendingBait(state, minigame);
  }

  if (result.outcome === 'caught' && result.catchResult) {
    if ((state.stats?.totalFishCaught ?? 0) === 1) {
      pushLog(state, 'logFirstCatch');
    }
    pushFeedback(state, getFishData(result.catchResult.id).nameKey, {}, 'fish');
    pushLog(state, 'logCaughtFish', { fishKey: getFishData(result.catchResult.id).nameKey });
    return;
  }

  if (result.outcome === 'line_broke') {
    pushLog(state, 'logLineBroke');
    return;
  }

  if (result.outcome === 'rod_broke') {
    pushLog(state, 'logRodBroke');
    return;
  }

  if (result.outcome === 'escaped') {
    pushLog(state, 'logFishGotAway');
    return;
  }

  if (result.outcome === 'hook_lost') {
    pushLog(state, 'logHookCameLoose');
    return;
  }

  if (result.outcome === 'bait_stolen') {
    pushLog(state, 'logBaitStolen');
    return;
  }

  if (result.outcome === 'no_bite' || result.outcome === 'too_late') {
    pushLog(state, 'logNoFishCaught');
  }
}

function tickWaitingAmbience(state, minigame, nowMs) {
  if ((minigame.stillnessUntil ?? 0) > nowMs) {
    minigame.bobberState = 'idle';
    minigame.statusKey = 'fishingWaiting';
    return;
  }

  if (nowMs >= minigame.idleEventAt) {
    const falseActivity = Math.random() < biteTuning.falseActivityChance && minigame.falseActivityCount < 2;
    if (falseActivity) {
      minigame.bobberState = Math.random() < 0.55 ? 'tiny_nibble' : 'idle';
      minigame.statusKey = getWaitingStatusKey(state);
      minigame.falseActivityCount += 1;
      minigame.idleEventAt = nowMs + randomBetween(1800, 4200);
      queueSound(state, 'tiny_nibble');
    } else {
      minigame.bobberState = 'idle';
      minigame.idleEventAt = nowMs + randomBetween(2200, 5200);
      queueSound(state, 'water_ripple');
    }
  }

  if (nowMs >= minigame.ambientEventAt) {
    pushLog(state, ambientLogKeys.filter((key) => key !== 'logAmbientBird')[Math.floor(Math.random() * 2)]);
    minigame.ambientEventAt = nowMs + randomBetween(12000, 22000);
    queueSound(state, 'bird_chirp');
  }
}

function tickRareInsect(state, minigame, nowMs) {
  if (!minigame.rareInsectAt || nowMs < minigame.rareInsectAt) {
    return;
  }

  minigame.rareInsectActiveUntil = nowMs + 5200;
  minigame.rareInsectAt = nowMs + randomBetween(330000, 390000);
  queueSound(state, 'insect_buzz');
}

function hasBaitAvailable(state, baitId) {
  if (baitId === 'small_worms') {
    return countItem(state, 'smallWorms') > 0;
  }

  if (['worms', 'larvae', 'bread', 'mastyrka', 'corn', 'dough', 'nightcrawler'].includes(baitId)) {
    return countItem(state, baitId) > 0;
  }

  if (baitId === 'live_bait') {
    return getFishEntries(state, 'live_bait').length > 0;
  }

  return false;
}

function shouldCommitBaitForOutcome(outcome) {
  return [
    'caught',
    'line_broke',
    'rod_broke',
    'escaped',
    'hook_lost',
    'bait_stolen',
    'too_late',
  ].includes(outcome);
}

function commitPendingBait(state, minigame) {
  if (!minigame?.consumedBait || minigame.baitConsumptionCommitted) {
    return true;
  }

  const committed = consumeBait(state, minigame.consumedBait, {
    liveBaitEntryId: minigame.pendingLiveBaitEntryId,
  });
  minigame.baitConsumptionCommitted = committed;
  return committed;
}

function consumeBait(state, baitId, options = {}) {
  if (baitId === 'small_worms') {
    return removeItem(state, 'smallWorms', 1);
  }

  if (['worms', 'larvae', 'bread', 'mastyrka', 'corn', 'dough', 'nightcrawler'].includes(baitId)) {
    return removeItem(state, baitId, 1);
  }

  if (baitId === 'live_bait') {
    const liveBait = getFishEntries(state, 'live_bait')
      .find((entry) => entry.id === options.liveBaitEntryId)
      ?? getFishEntries(state, 'live_bait')[0];
    if (!liveBait) {
      return false;
    }
    state.fishBasket = state.fishBasket.filter((entry) => entry.id !== liveBait.id);
    state.ui.fishingMinigame.consumedLiveBaitSourceFishId = liveBait.liveBaitSourceFishId ?? liveBait.fishId;
    state.ui.fishingMinigame.consumedLiveBaitQuality = liveBait.liveBaitQuality ?? 'small';
    syncInventoryFromFishBasket(state);
    return true;
  }

  return false;
}

function chooseFishCandidate(state, minigame) {
  if (!state.progress?.firstCatchDone) {
    if (normalizeWaterId(state.travel?.selectedWater) !== 'canal') {
      const spot = getCastSpot(minigame.selectedSpot);
      return Object.entries(spot.weights).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'crucian';
    }
    return Math.random() < 0.65 ? 'rotan' : 'crucian';
  }

  const spot = getCastSpot(minigame.selectedSpot);
  const chanceSet = calculateFishChanceSet(state, minigame, spot);
  const weights = chanceSet.candidates.map((entry) => ({ ...entry, weight: entry.finalWeight }));

  const noBiteWeight = chanceSet.noBiteWeight;
  const totalWeight = chanceSet.totalWeight;
  const roll = Math.random() * totalWeight;

  if (roll <= noBiteWeight) {
    return null;
  }

  let cursor = noBiteWeight;
  for (const entry of weights) {
    cursor += entry.weight;
    if (roll <= cursor) {
      return entry.fishId;
    }
  }

  return null;
}

function buildPattern(fishId) {
  const profile = getBiteProfile(fishId);
  return profile.patterns[Math.floor(Math.random() * profile.patterns.length)]?.filter((step) => step !== 'strike_window') ?? ['idle'];
}

function buildCyclePattern(fishId, cycle, total) {
  const profiles = {
    rotan: cycle === total ? ['hard_dip', 'submerged', 'strike_window'] : ['tiny_nibble', 'hard_dip', 'strike_window'],
    crucian: cycle === total ? ['lift', 'slow_dip', 'strike_window'] : ['tiny_nibble', 'lift', 'strike_window'],
    bleak: ['tiny_nibble', 'tiny_nibble', 'strike_window'],
    roach: cycle === total ? ['tiny_nibble', 'idle', 'slow_dip', 'strike_window'] : ['tiny_nibble', 'slow_dip', 'strike_window'],
    rudd: ['tiny_nibble', 'sideways_pull', 'strike_window'],
    loach: cycle === total ? ['slow_dip', 'submerged', 'strike_window'] : ['idle', 'slow_dip', 'strike_window'],
    pike: ['sideways_pull', 'hard_dip', 'strike_window'],
    okun: cycle === total ? ['tiny_nibble', 'hard_dip', 'strike_window'] : ['tiny_nibble', 'sideways_pull', 'strike_window'],
    lynok: cycle === total ? ['lift', 'slow_dip', 'strike_window'] : ['tiny_nibble', 'slow_dip', 'strike_window'],
    sudak: ['sideways_pull', 'hard_dip', 'strike_window'],
    som: cycle === total ? ['slow_dip', 'submerged', 'strike_window'] : ['idle', 'slow_dip', 'hard_dip', 'strike_window'],
    canadian_catfish: cycle === total ? ['slow_dip', 'submerged', 'strike_window'] : ['idle', 'slow_dip', 'strike_window'],
    carp: cycle === total ? ['slow_dip', 'hard_dip', 'strike_window'] : ['tiny_nibble', 'slow_dip', 'strike_window'],
    grass_carp: ['sideways_pull', 'hard_dip', 'strike_window'],
    silver_carp: ['slow_dip', 'submerged', 'strike_window'],
    white_bream: cycle === total ? ['lift', 'slow_dip', 'strike_window'] : ['tiny_nibble', 'slow_dip', 'strike_window'],
    bream: cycle === total ? ['lift', 'slow_dip', 'submerged', 'strike_window'] : ['tiny_nibble', 'slow_dip', 'strike_window'],
    plotytsia: ['tiny_nibble', 'slow_dip', 'strike_window'],
    gudgeon: ['tiny_nibble', 'hard_dip', 'strike_window'],
    eel: cycle === total ? ['idle', 'slow_dip', 'submerged', 'strike_window'] : ['idle', 'sideways_pull', 'strike_window'],
  };
  const profile = profiles[fishId] ?? ['tiny_nibble', 'strike_window'];
  if (cycle < total && Math.random() < biteTuning.weakBiteChance) {
    return Math.random() < 0.5 ? ['tiny_nibble', 'idle'] : ['lift', 'idle'];
  }
  return profile;
}

function getBiteCycleTotal(fishId) {
  const profile = getBiteProfile(fishId);
  const [min, max] = profile.biteCycles ?? [2, 3];
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getTackleBonus(state, method) {
  const effects = getTackleEffects(state);
  let bonus = method === 'stickRod' ? 0.18 : 0.08;
  bonus += effects.hookBonus + effects.floatBonus + effects.stabilityBonus + effects.controlBonus + effects.escapeReduction;
  return bonus;
}

function canUseCastSpot(state, method, spot) {
  const selectedWater = normalizeWaterId(state.travel?.selectedWater);
  if ((spot.waterId ?? 'canal') !== selectedWater) {
    return { allowed: false, reasonKey: 'wrongWater' };
  }

  void method;
  return { allowed: true, reasonKey: null };
}

function getStrikeWindowStatusKey(state) {
  const mode = state.settings?.fishing?.biteHints ?? 'subtle';
  if (mode === 'off') {
    return 'fishingWatchBobber';
  }
  if (mode === 'subtle') {
    return 'fishingSomethingHappening';
  }
  return 'fishingStrikeNow';
}

function getCycleStatusKey(state, minigame) {
  const mode = state.settings?.fishing?.biteHints ?? 'subtle';
  if (mode === 'off') {
    return 'fishingWatchWater';
  }
  if (mode === 'subtle') {
    return 'fishingMovement';
  }
  return 'fishingBiteCycle';
}

function getWaitingStatusKey(state) {
  const mode = state.settings?.fishing?.biteHints ?? 'subtle';
  if (mode === 'off') {
    return 'fishingWatchWater';
  }
  if (mode === 'subtle') {
    return 'fishingMovement';
  }
  return 'fishingSmallMovement';
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function hideBobber(minigame) {
  minigame.bobberState = 'hidden';
}

function rollCastTarget(state, minigame, spot) {
  const radius = getCastScatterRadius(state, minigame.method, spot);
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random());
  return {
    x: clamp(spot.target.x + Math.cos(angle) * radius.x * distance, 12, 88),
    y: clamp(spot.target.y + Math.sin(angle) * radius.y * distance, 24, 76),
  };
}

function shouldBreakHomemadeRod(state, catchResult, itemModifiers = getActiveItemModifiers(state)) {
  const effects = getTackleEffects(state);
  if (effects.hasProperRod || effects.activeRigId !== 'first_rod' || catchResult.weightGrams <= 500) {
    return false;
  }

  const overweightRatio = Math.max(0, (catchResult.weightGrams - 500) / 700);
  const breakChance = clamp((0.38 + overweightRatio * 0.42) * itemModifiers.escapeChanceMultiplier, 0.34, 0.88);
  return Math.random() < breakChance;
}

function adjustCatchForWater(state, catchResult) {
  const waterId = normalizeWaterId(state.travel?.selectedWater);
  const multipliers = {
    sluice: { bleak: [1.05, 1.18], roach: [1.08, 1.2] },
    fire_ponds: { crucian: [1.12, 1.28], rudd: [1.08, 1.22], lynok: [1.02, 1.12] },
    greada: { crucian: [1.12, 1.32], lynok: [1.06, 1.18], canadian_catfish: [1.08, 1.24] },
    lake_tur: { okun: [1.1, 1.24], lynok: [1.12, 1.26], sudak: [1.08, 1.22], rudd: [1.12, 1.28], pike: [1.1, 1.22] },
    mining_lake: { pike: [1.18, 1.34], okun: [1.12, 1.26], lynok: [1.12, 1.3], sudak: [1.2, 1.38], som: [1.18, 1.42], canadian_catfish: [1.18, 1.38] },
  };
  const range = multipliers[waterId]?.[catchResult.id];
  const centralizedRange = getWaterSizeRange(waterId, catchResult.id);
  if (centralizedRange || range) {
    catchResult.weightGrams = Math.round(catchResult.weightGrams * randomBetween(...(centralizedRange ?? range)));
  }
  if (state.ui?.fishingMinigame?.consumedBait === 'live_bait') {
    catchResult.weightGrams = Math.max(350, catchResult.weightGrams);
  }
  catchResult.weightGrams = Math.max(1, catchResult.weightGrams);
}

function applyItemCatchAdjustments(catchResult, itemModifiers) {
  if (!itemModifiers) {
    return;
  }
  catchResult.weightGrams = Math.max(1, Math.round(catchResult.weightGrams * itemModifiers.fishSizeMultiplier));
}

function applyDepthCatchAdjustments(catchResult, depth) {
  if (depth === 'surface') {
    catchResult.weightGrams = Math.max(1, Math.round(catchResult.weightGrams * 0.88));
  }
}

function buildCatchResolvePayload(state, minigame, context = {}) {
  return {
    locationId: normalizeWaterId(state.travel?.selectedWater),
    baitId: minigame.consumedBait ?? minigame.selectedBait,
    rodId: state.tackle?.equipped?.rod ?? 'none',
    tackle: {
      line: state.tackle?.equipped?.line ?? 'none',
      hook: state.tackle?.equipped?.hook ?? 'none',
      sinker: state.tackle?.equipped?.sinker ?? 'none',
      float: state.tackle?.equipped?.float ?? 'none',
      rod: state.tackle?.equipped?.rod ?? 'none',
    },
    spotId: minigame.selectedSpot,
    depth: minigame.selectedDepth ?? 'middle',
    method: minigame.method,
    clientActionScore: Number((context.reactionQuality ?? 0).toFixed(3)),
    clientSuccessChance: Number((context.successChance ?? 0).toFixed(3)),
    localSaveRevision: context.localSaveRevision ?? 0,
    itemModifiers: serializeItemModifiers(context.itemModifiers),
  };
}

function serializeItemModifiers(modifiers = {}) {
  return {
    fishSizeMultiplier: Number((modifiers.fishSizeMultiplier ?? 1).toFixed(3)),
    trophyChanceBonus: Number((modifiers.trophyChanceBonus ?? 0).toFixed(3)),
    biteChanceBonus: Number((modifiers.biteChanceBonus ?? 0).toFixed(3)),
    escapeChanceMultiplier: Number((modifiers.escapeChanceMultiplier ?? 1).toFixed(3)),
    activeItemIds: Array.isArray(modifiers.activeItemIds) ? modifiers.activeItemIds : [],
  };
}

function resetAfterResult(state, minigame) {
  minigame.phase = 'setup';
  minigame.bobberState = 'hidden';
  minigame.result = null;
  minigame.fishCandidateId = null;
  minigame.currentPattern = [];
  minigame.patternIndex = 0;
  minigame.nextStepAt = 0;
  minigame.strikeWindowStartAt = 0;
  minigame.strikeWindowEndAt = 0;
  minigame.biteChecks = [];
  minigame.biteCheckIndex = 0;
  minigame.currentCatchEntryId = null;
  minigame.consumedBait = null;
  minigame.consumedLiveBaitSourceFishId = null;
  minigame.consumedLiveBaitQuality = null;
  minigame.debugFishChance = null;
  minigame.stillnessUntil = 0;
  state.ui.catchResult = null;
  state.ui.collapsedPanels = {
    ...(state.ui.collapsedPanels ?? {}),
    fishingControls: true,
  };
  autoSelectFirstAvailableBait(state, minigame);
  autoSelectFirstAvailableSpot(state, minigame);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
