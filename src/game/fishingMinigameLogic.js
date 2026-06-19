import { biteProfiles, castZones, getBiteProfile, stateDurationsMs } from './bitePatterns.js';
import { getFishData, getFreshFishValue, rollFishById } from './fishData.js';
import { addCaughtFish, getFishEntries, markFishAsLiveBait, syncInventoryFromFishBasket } from './fishInventory.js';
import { countItem, hasItem, removeItem } from './inventory.js';
import { pushFeedback, pushLog, queueSound } from './state.js';

const castZoneTargets = {
  near_bank: { x: 26, y: 62 },
  mid_water: { x: 52, y: 47 },
  reed_edge: { x: 77, y: 42 },
};

export function createFishingMinigameState(method) {
  return {
    open: true,
    method,
    selectedBait: null,
    selectedZone: null,
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

  state.ui.catchResult = null;
  state.ui.fishingMinigame = createFishingMinigameState(method);
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
  if (!minigame?.open || !castZones.includes(zone)) {
    return;
  }

  minigame.selectedZone = zone;
  minigame.castTarget = castZoneTargets[zone];
  minigame.statusKey = 'fishingZoneSelected';
  queueSound(state, 'ui_click');
}

export function castLine(state, nowMs) {
  const minigame = state.ui.fishingMinigame;
  if (!minigame?.open) {
    return;
  }

  if (!minigame.selectedBait) {
    minigame.statusKey = 'fishingSelectBaitFirst';
    return;
  }

  if (!minigame.selectedZone) {
    minigame.statusKey = 'fishingSelectZoneFirst';
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
    addCaughtFish(state, catchResult);
    state.ui.catchResult = catchResult;
    const latestEntry = state.fishBasket[state.fishBasket.length - 1];
    minigame.currentCatchEntryId = latestEntry?.id ?? null;
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

  minigame.statusKey = 'fishingReadyAgain';
  minigame.result = null;
  minigame.currentCatchEntryId = null;
  state.ui.catchResult = null;
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
  state.ui.catchResult = null;
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
    minigame.nextStepAt = nowMs + 750;
    queueSound(state, 'bobber_plop');
    return;
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

export function getCastZoneTarget(zone) {
  return castZoneTargets[zone] ?? castZoneTargets.near_bank;
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
    minigame.statusKey = 'fishingStrikeNow';
    minigame.strikeWindowStartAt = nowMs;
    minigame.strikeWindowEndAt = nowMs + randomBetween(...profile.hookWindowMs);
    queueSound(state, 'strong_bite');
    return;
  }

  minigame.phase = 'animating';
  minigame.bobberState = step;
  minigame.statusKey = step === 'idle' ? 'fishingWaiting' : 'fishingNibble';
  minigame.nextStepAt = nowMs + randomBetween(...(stateDurationsMs[step] ?? [500, 800]));
  queueSound(state, step === 'hard_dip' || step === 'sideways_pull' ? 'strong_bite' : 'tiny_nibble');
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
  const weights = Object.entries(biteProfiles).map(([fishId, profile]) => ({
    fishId,
    weight: getFishWeight(state, minigame, fishId, profile),
  })).filter((entry) => entry.weight > 0);

  const noBiteWeight = weights.length === 0 ? 1 : 1.6;
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

function getFishWeight(state, minigame, fishId, profile) {
  let score = 0.08;

  if (profile.preferred.methods.includes(minigame.method)) {
    score += 0.55;
  }

  if (profile.preferred.zones.includes(minigame.selectedZone)) {
    score += 0.7;
  }

  if (profile.preferred.baits.includes(minigame.selectedBait)) {
    score += 0.6;
  }

  if (fishId === 'rotan' && minigame.selectedZone === 'near_bank' && minigame.method === 'handline') {
    score += 0.6;
  }

  if (fishId === 'crucian' && minigame.selectedZone !== 'near_bank') {
    score += 0.3;
  }

  if (fishId === 'pike') {
    if (minigame.selectedBait !== 'live_bait' || !state.purchased.betterLine) {
      return 0;
    }
    score += 0.25;
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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
