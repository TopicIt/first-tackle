import { biteProfiles, castSpots, getBiteProfile, getCastSpot, stateDurationsMs } from './bitePatterns.js';
import { getFishData, getFreshFishValue, rollFishById } from './fishData.js';
import {
  addCaughtFish,
  getFishEntries,
  markFishAsLiveBait,
  releaseFish,
  releaseSmallFishOfSpecies,
  syncInventoryFromFishBasket,
} from './fishInventory.js';
import { countItem, hasItem, removeItem } from './inventory.js';
import { pushFeedback, pushLog, queueSound } from './state.js';

const ambientLogKeys = ['logAmbientBird', 'logAmbientRings', 'logAmbientDrift'];

export function createFishingMinigameState(method) {
  return {
    open: true,
    method,
    selectedBait: null,
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
    consumedBait: null,
    currentCatchEntryId: null,
    idleEventAt: 0,
    ambientEventAt: 0,
    falseActivityCount: 0,
  };
}

export function openFishingMinigame(state, method) {
  if (!hasItem(state, 'primitiveTackle')) {
    pushLog(state, 'logNeedPrimitiveTackle');
    return;
  }

  if (method === 'stickRod' && !hasItem(state, 'stickRod')) {
    pushLog(state, 'logNeedFirstRod');
    return;
  }

  if (method === 'liveBait' && (!hasItem(state, 'stickRod') || getFishEntries(state, 'live_bait').length === 0)) {
    pushLog(state, !hasItem(state, 'stickRod') ? 'logNeedFirstRod' : 'logNeedLiveBait');
    return;
  }

  state.ui.catchResult = null;
  state.ui.fishingMinigame = createFishingMinigameState(method);
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
  minigame.castTarget = spot.target;
  minigame.statusKey = 'fishingSpotSelected';
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
    minigame.statusKey = 'fishingSelectBaitFirst';
    return;
  }

  if (!minigame.selectedSpot) {
    autoSelectFirstAvailableSpot(state, minigame);
  }

  if (!minigame.selectedSpot) {
    minigame.statusKey = 'fishingSelectSpotFirst';
    return;
  }

  if (!consumeBait(state, minigame.selectedBait)) {
    minigame.statusKey = 'logNeedBait';
    return;
  }

  minigame.consumedBait = minigame.selectedBait;
  minigame.phase = 'cast';
  minigame.bobberState = 'cast';
  minigame.statusKey = 'fishingCasting';
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  minigame.nextStepAt = nowMs + 850;
  minigame.fishCandidateId = chooseFishCandidate(state, minigame);
  minigame.currentPattern = minigame.fishCandidateId ? buildPattern(minigame.fishCandidateId) : [];
  minigame.patternIndex = 0;
  minigame.falseActivityCount = 0;
  minigame.idleEventAt = nowMs + randomBetween(2500, 5200);
  minigame.ambientEventAt = nowMs + randomBetween(5000, 11000);
  autoSelectFirstAvailableBait(state, minigame);
  state.ui.catchResult = null;
  queueSound(state, 'cast_whoosh');
}

export function strikeLine(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (minigame.phase !== 'strike_window') {
    minigame.phase = 'result';
    minigame.bobberState = 'missed';
    minigame.statusKey = 'fishingTooEarly';
    minigame.result = { outcome: 'too_early' };
    queueSound(state, 'fish_escape');
    return;
  }

  const fishProfile = getBiteProfile(minigame.fishCandidateId);
  const timingCenter = (minigame.strikeWindowStartAt + minigame.strikeWindowEndAt) / 2;
  const timingSpread = Math.max(1, (minigame.strikeWindowEndAt - minigame.strikeWindowStartAt) / 2);
  const reactionQuality = Math.max(0, 1 - Math.abs(nowMs - timingCenter) / timingSpread);
  const tackleBonus = getTackleBonus(state, minigame.method);
  const baitBonus = getBaitSuitability(minigame.fishCandidateId, minigame.selectedBait);
  const successChance = clamp(0.2 + reactionQuality * 0.38 + tackleBonus + baitBonus * 0.16 - fishProfile.difficulty * 0.28, 0.08, 0.95);
  const roll = Math.random();

  queueSound(state, 'strike');

  if (minigame.fishCandidateId === 'pike' && !state.purchased.betterLine && roll < 0.72) {
    resolveMinigameResult(state, { outcome: 'line_broke', statusKey: 'fishingLineBroke', sound: 'line_break' });
    return;
  }

  if (roll <= successChance) {
    const catchResult = rollFishById(minigame.fishCandidateId);
    catchResult.value = getFreshFishValue(catchResult);
    const entry = addCaughtFish(state, catchResult, {
      catchSpotId: minigame.selectedSpot,
      method: minigame.method,
      bait: minigame.consumedBait ?? minigame.selectedBait,
    });
    state.ui.catchResult = catchResult;
    minigame.currentCatchEntryId = entry?.id ?? null;
    resolveMinigameResult(state, {
      outcome: 'caught',
      statusKey: 'fishingCaught',
      sound: 'catch_success',
      catchResult,
    });
    minigame.bobberState = 'hooked';
    return;
  }

  if (minigame.method === 'handline' && roll > 0.82) {
    resolveMinigameResult(state, { outcome: 'line_broke', statusKey: 'fishingLineBroke', sound: 'line_break' });
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
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  state.ui.catchResult = null;
}

export function releaseCurrentCatch(state) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.currentCatchEntryId) {
    return;
  }

  releaseFish(state, minigame.currentCatchEntryId);
  minigame.statusKey = 'fishingReleased';
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  state.ui.catchResult = null;
  queueSound(state, 'water_ripple');
}

export function releaseSmallFish(state, fishId) {
  releaseSmallFishOfSpecies(state, fishId);
  queueSound(state, 'water_ripple');
}

export function releaseKeepnetFish(state, fishEntryId) {
  releaseFish(state, fishEntryId);
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
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  state.ui.catchResult = null;
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
  minigame.nextStepAt = 0;
  minigame.strikeWindowStartAt = 0;
  minigame.strikeWindowEndAt = 0;
  minigame.currentCatchEntryId = null;
  minigame.consumedBait = null;
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
  minigame.nextStepAt = 0;
  minigame.strikeWindowStartAt = 0;
  minigame.strikeWindowEndAt = 0;
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
    minigame.nextStepAt = nowMs + getNaturalWaitMs();
    queueSound(state, 'bobber_plop');
    return;
  }

  if (minigame.phase === 'waiting') {
    tickWaitingAmbience(state, minigame, nowMs);
  }

  if (minigame.phase === 'waiting' && nowMs >= minigame.nextStepAt) {
    if (!minigame.fishCandidateId) {
      resolveMinigameResult(state, { outcome: 'no_bite', statusKey: 'fishingNoBite', sound: 'water_ripple' });
      minigame.bobberState = 'idle';
      return;
    }

    advancePatternStep(state, minigame, nowMs);
    return;
  }

  if (minigame.phase === 'animating' && nowMs >= minigame.nextStepAt) {
    advancePatternStep(state, minigame, nowMs);
    return;
  }

  if (minigame.phase === 'strike_window' && nowMs > minigame.strikeWindowEndAt) {
    resolveMinigameResult(state, { outcome: 'too_late', statusKey: 'fishingTooLate', sound: 'fish_escape' });
    minigame.bobberState = 'missed';
  }
}

export function getAvailableBaits(state) {
  const liveBaitCount = getFishEntries(state, 'live_bait').length;
  return [
    { id: 'worms', count: countItem(state, 'worms'), disabled: countItem(state, 'worms') === 0 },
    { id: 'larvae', count: countItem(state, 'larvae'), disabled: countItem(state, 'larvae') === 0 },
    { id: 'live_bait', count: liveBaitCount, disabled: liveBaitCount === 0 },
  ];
}

export function getCastSpotTarget(spotId) {
  return getCastSpot(spotId).target;
}

export function getAvailableCastSpots(state, method) {
  return castSpots.map((spot) => ({
    ...spot,
    ...canUseCastSpot(state, method, spot),
  }));
}

export function setBiteHintMode(state, mode) {
  if (!['beginner', 'subtle', 'off'].includes(mode)) {
    return;
  }

  state.settings.fishing ??= {};
  state.settings.fishing.biteHints = mode;
  queueSound(state, 'ui_click');
}

function advancePatternStep(state, minigame, nowMs) {
  const step = minigame.currentPattern[minigame.patternIndex];
  if (!step) {
    resolveMinigameResult(state, { outcome: 'no_bite', statusKey: 'fishingNoBite', sound: 'water_ripple' });
    minigame.bobberState = 'idle';
    return;
  }

  minigame.patternIndex += 1;

  if (step === 'strike_window') {
    const profile = getBiteProfile(minigame.fishCandidateId);
    minigame.phase = 'strike_window';
    minigame.bobberState = 'strike_window';
    minigame.statusKey = getStrikeWindowStatusKey(state);
    minigame.strikeWindowStartAt = nowMs;
    minigame.strikeWindowEndAt = nowMs + randomBetween(...profile.hookWindowMs);
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
  minigame.result = result;
  minigame.statusKey = result.statusKey;
  queueSound(state, result.sound);

  if (result.outcome === 'caught' && result.catchResult) {
    pushFeedback(state, getFishData(result.catchResult.id).nameKey, {}, 'fish');
    pushLog(state, 'logCaughtFish', { fishKey: getFishData(result.catchResult.id).nameKey });
    return;
  }

  if (result.outcome === 'line_broke') {
    pushLog(state, 'logLineBroke');
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
  if (nowMs >= minigame.idleEventAt) {
    const falseActivity = Math.random() < 0.42 && minigame.falseActivityCount < 2;
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
    pushLog(state, ambientLogKeys[Math.floor(Math.random() * ambientLogKeys.length)]);
    minigame.ambientEventAt = nowMs + randomBetween(12000, 22000);
    queueSound(state, 'bird_chirp');
  }
}

function consumeBait(state, baitId) {
  if (baitId === 'worms' || baitId === 'larvae') {
    return removeItem(state, baitId, 1);
  }

  if (baitId === 'live_bait') {
    const liveBait = getFishEntries(state, 'live_bait')[0];
    if (!liveBait) {
      return false;
    }
    state.fishBasket = state.fishBasket.filter((entry) => entry.id !== liveBait.id);
    syncInventoryFromFishBasket(state);
    return true;
  }

  return false;
}

function chooseFishCandidate(state, minigame) {
  const spot = getCastSpot(minigame.selectedSpot);
  const weights = Object.entries(biteProfiles).map(([fishId, profile]) => ({
    fishId,
    weight: getFishWeight(state, minigame, fishId, profile, spot),
  })).filter((entry) => entry.weight > 0);

  const noBiteWeight = weights.length === 0 ? 1 : 2.35;
  const totalWeight = weights.reduce((total, entry) => total + entry.weight, noBiteWeight);
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

function getFishWeight(state, minigame, fishId, profile, spot) {
  let score = spot.weights[fishId] ?? 0;
  if (score <= 0) {
    return 0;
  }

  if (profile.preferred.methods.includes(minigame.method)) {
    score *= 1.18;
  }

  if (profile.preferred.zones.includes(spot.zone)) {
    score *= 1.16;
  }

  if (profile.preferred.baits.includes(minigame.selectedBait)) {
    score *= 1.22;
  }

  if (fishId === 'rotan' && minigame.selectedZone === 'near_bank' && minigame.method === 'handline') {
    score *= 1.25;
  }

  if (fishId === 'crucian' && minigame.selectedZone !== 'near_bank') {
    score *= 1.08;
  }

  if (fishId === 'pike') {
    if (minigame.selectedBait !== 'live_bait' || !state.purchased.betterLine) {
      return 0;
    }
    score *= 1.35;
  }

  return score;
}

function buildPattern(fishId) {
  const profile = getBiteProfile(fishId);
  return profile.patterns[Math.floor(Math.random() * profile.patterns.length)] ?? ['idle', 'strike_window'];
}

function getBaitSuitability(fishId, baitId) {
  const profile = getBiteProfile(fishId);
  return profile.preferred.baits.includes(baitId) ? 1 : 0.55;
}

function getTackleBonus(state, method) {
  let bonus = method === 'stickRod' ? 0.18 : 0.08;
  if (state.purchased.betterLine) {
    bonus += 0.12;
  }
  if (state.purchased.simpleFloat && method !== 'handline') {
    bonus += 0.06;
  }
  return bonus;
}

function canUseCastSpot(state, method, spot) {
  if (spot.id === 'far_shadow' && !state.purchased.betterLine) {
    return { allowed: false, reasonKey: 'requiresBetterRodOrLine' };
  }

  if (method === 'handline' && !spot.allowedMethods.includes('handline')) {
    return { allowed: false, reasonKey: 'tooFarForHandline' };
  }

  if ((method === 'stickRod' || method === 'liveBait') && !spot.allowedMethods.includes('stickRod') && spot.id !== 'far_shadow') {
    return { allowed: false, reasonKey: 'requiresStickRod' };
  }

  return { allowed: true, reasonKey: null };
}

function getNaturalWaitMs() {
  const roll = Math.random();
  if (roll > 0.88) {
    return randomBetween(18000, 30000);
  }
  return randomBetween(6000, 18000);
}

function getStrikeWindowStatusKey(state) {
  const mode = state.settings?.fishing?.biteHints ?? 'beginner';
  if (mode === 'off') {
    return 'fishingWatchBobber';
  }
  if (mode === 'subtle') {
    return 'fishingSomethingHappening';
  }
  return 'fishingStrikeNow';
}

function getWaitingStatusKey(state) {
  const mode = state.settings?.fishing?.biteHints ?? 'beginner';
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
