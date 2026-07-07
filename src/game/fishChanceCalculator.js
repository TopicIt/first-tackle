import { biteProfiles, biteTuning, getCastSpot } from './bitePatterns.js';
import { getFishData } from './fishData.js';
import { getActiveItemModifiers } from './itemEffects.js';
import { normalizeWaterId } from './locations.js';
import { getTackleEffects } from './tackle.js';
import { getTimePhase } from './time.js';
import { getWaterFishIds } from './waterFishDistribution.js';

const predatorFishIds = ['pike', 'sudak', 'som', 'eel', 'okun', 'canadian_catfish'];
const liveBaitFishIds = ['pike', 'okun', 'som', 'eel', 'canadian_catfish', 'rotan', 'sudak'];
const specialHardGates = {
  eel: 'nightcrawler_or_live_bait_and_reach',
  sudak: 'live_bait_and_reach',
  som: 'strong_reach_and_stability',
};

export function calculateFishChanceSet(state, minigame, spot = getCastSpot(minigame.selectedSpot)) {
  const candidates = Object.entries(biteProfiles)
    .map(([fishId, profile]) => calculateFishChanceBreakdown(state, minigame, fishId, profile, spot))
    .filter((entry) => entry.finalWeight > 0);
  const noBiteWeight = getNoBiteWeight(state, minigame, spot, candidates);
  const totalWeight = candidates.reduce((total, entry) => total + entry.finalWeight, noBiteWeight);
  const normalized = candidates.map((entry) => ({
    ...entry,
    finalPercent: totalWeight > 0 ? Number(((entry.finalWeight / totalWeight) * 100).toFixed(2)) : 0,
  }));

  return {
    waterId: normalizeWaterId(state.travel?.selectedWater),
    spotId: spot.id,
    spotLabelKey: spot.labelKey,
    bait: minigame.selectedBait,
    depth: minigame.selectedDepth ?? 'middle',
    method: minigame.method,
    timePhase: getTimePhase(state),
    hook: state.tackle?.equipped?.hook ?? 'none',
    noBiteWeight,
    noBitePercent: totalWeight > 0 ? Number(((noBiteWeight / totalWeight) * 100).toFixed(2)) : 100,
    totalWeight,
    candidates: normalized,
  };
}

export function calculateFishChanceBreakdown(state, minigame, fishId, profile = biteProfiles[fishId], spot = getCastSpot(minigame.selectedSpot)) {
  const waterId = normalizeWaterId(state.travel?.selectedWater);
  const reasons = [];
  const gates = [];
  const basePopulation = spot.weights[fishId] ?? 0;
  const waterModifier = getWaterFishMultiplier(state, fishId);
  const baitModifier = getBaitSuitability(fishId, minigame.selectedBait);
  const depthModifier = getDepthMultiplier(fishId, minigame.selectedDepth ?? 'middle');
  const methodModifier = profile?.preferred?.methods?.includes(minigame.method) ? 1.18 : 0.86;
  const spotModifier = profile?.preferred?.zones?.includes(spot.zone) ? 1.16 : 0.88;
  const timeModifier = getTimeMultiplier(state, fishId);
  const tackleModifier = getTackleCandidateMultiplier(state, minigame, fishId);
  const activityModifier = getActivityMultiplier(state, minigame, fishId, spot);

  if (basePopulation <= 0) gates.push('not_in_spot_population');
  if (waterModifier <= 0 || !getWaterFishIds(waterId).includes(fishId)) gates.push('not_in_water_population');
  if (isHardBaitGate(fishId, minigame.selectedBait)) gates.push(specialHardGates[fishId] ?? 'hard_bait_gate');
  if (minigame.selectedBait === 'live_bait' && !liveBaitFishIds.includes(fishId)) gates.push('live_bait_targets_predators');
  if (isHardTackleGate(state, fishId)) gates.push(specialHardGates[fishId] ?? 'hard_tackle_gate');

  if (profile?.preferred?.baits?.includes(minigame.selectedBait)) reasons.push('favorite_bait');
  else if (baitModifier < 0.2) reasons.push('weak_bait_match');
  if (profile?.preferred?.zones?.includes(spot.zone)) reasons.push('preferred_spot_zone');
  if (profile?.preferred?.methods?.includes(minigame.method)) reasons.push('preferred_method');
  if (depthModifier > 1) reasons.push('preferred_depth');
  if (timeModifier > 1) reasons.push('active_time_phase');
  if (tackleModifier > 1.05) reasons.push('tackle_fit');
  if (gates.length) reasons.push(...gates);

  const finalWeight = gates.length
    ? 0
    : basePopulation
      * spotModifier
      * baitModifier
      * depthModifier
      * timeModifier
      * tackleModifier
      * waterModifier
      * activityModifier
      * methodModifier;

  return {
    fishId,
    basePopulation,
    spotModifier,
    baitModifier,
    depthModifier,
    timeModifier,
    tackleModifier,
    waterModifier,
    activityModifier,
    methodModifier,
    finalWeight: Number(finalWeight.toFixed(4)),
    finalPercent: 0,
    reasons,
    gates,
  };
}

export function getFishCandidateWeights(state, minigame, spot = getCastSpot(minigame.selectedSpot)) {
  return calculateFishChanceSet(state, minigame, spot).candidates.map((entry) => ({
    ...entry,
    weight: entry.finalWeight,
  }));
}

export function getFishWeight(state, minigame, fishId, profile = biteProfiles[fishId], spot = getCastSpot(minigame.selectedSpot)) {
  return calculateFishChanceBreakdown(state, minigame, fishId, profile, spot).finalWeight;
}

export function getNoBiteWeight(state, minigame, spot, candidates = getFishCandidateWeights(state, minigame, spot)) {
  const bestBaitSuitability = candidates.reduce((best, entry) => Math.max(best, entry.baitModifier ?? 0), 0);
  const itemModifiers = getActiveItemModifiers(state);
  const base = candidates.length === 0
    ? 1
    : biteTuning.noBiteWeight
      + (bestBaitSuitability < 1 ? biteTuning.calmNoBiteWeight : 0)
      + (spot.zone === 'near_bank' ? -0.25 : 0.2);
  return Number(Math.max(0.35, base - (itemModifiers.biteChanceBonus ?? 0) * 1.8).toFixed(4));
}

export function buildFishingChanceDebug(state, minigame, selectedCandidateId = null) {
  const chanceSet = calculateFishChanceSet(state, minigame, getCastSpot(minigame.selectedSpot));
  return {
    ...chanceSet,
    selectedCandidateId,
    topCandidates: chanceSet.candidates
      .slice()
      .sort((a, b) => b.finalWeight - a.finalWeight)
      .slice(0, 8),
  };
}

export function getBaitSuitability(fishId, baitId) {
  const profile = biteProfiles[fishId];
  if (!baitId || !profile) {
    return 0;
  }

  if (profile.preferred.baits.includes(baitId)) {
    return 1.24;
  }

  const animalBaits = ['worms', 'small_worms', 'larvae', 'nightcrawler', 'live_bait'];
  if (baitId === 'live_bait') {
    if (fishId === 'rotan') return 0.1;
    return predatorFishIds.includes(fishId) ? 1.18 : 0;
  }
  if (predatorFishIds.includes(fishId)) {
    if (baitId === 'small_worms') return fishId === 'okun' ? 0.22 : 0.06;
    if (fishId === 'pike' && ['worms', 'nightcrawler'].includes(baitId)) return 0.14;
    return animalBaits.includes(baitId) ? 0.16 : 0.04;
  }

  if (baitId === 'small_worms') {
    return ['bleak', 'roach', 'plotytsia', 'gudgeon', 'crucian', 'okun'].includes(fishId) ? 0.92 : 0.18;
  }

  const neutralBaits = {
    crucian: ['larvae'],
    bleak: ['dough'],
    roach: ['corn'],
    rudd: ['mastyrka', 'corn'],
    loach: ['larvae'],
    lynok: ['larvae', 'mastyrka'],
    carp: ['worms'],
    grass_carp: ['mastyrka', 'dough'],
    silver_carp: ['bread'],
    white_bream: ['larvae'],
    bream: ['larvae', 'corn'],
    plotytsia: ['larvae'],
    gudgeon: ['larvae'],
  }[fishId] ?? [];

  return neutralBaits.includes(baitId) ? 0.32 : 0.08;
}

export function getPreferredTimePhases(fishId) {
  return {
    rotan: ['day', 'evening'],
    crucian: ['morning', 'evening'],
    bleak: ['day'],
    roach: ['morning', 'evening'],
    rudd: ['day', 'evening'],
    loach: ['evening', 'night'],
    pike: ['morning', 'evening'],
    okun: ['morning', 'day'],
    lynok: ['morning', 'evening'],
    sudak: ['evening', 'night'],
    som: ['evening', 'night'],
    canadian_catfish: ['evening', 'night'],
    carp: ['morning', 'evening'],
    grass_carp: ['day', 'evening'],
    silver_carp: ['day', 'evening'],
    white_bream: ['morning', 'evening'],
    bream: ['morning', 'evening'],
    plotytsia: ['morning', 'day'],
    gudgeon: ['day'],
    eel: ['evening', 'night'],
  }[fishId] ?? ['day'];
}

function getTimeMultiplier(state, fishId) {
  const phase = getTimePhase(state);
  const preferred = getPreferredTimePhases(fishId);
  if (preferred.includes(phase)) return 1.25;
  if ((fishId === 'sudak' || fishId === 'som') && phase === 'day') return 0.35;
  if (fishId === 'canadian_catfish' && phase === 'day') return 0.12;
  return 0.72;
}

function getDepthMultiplier(fishId, depth) {
  if (depth === 'middle') {
    return 1;
  }

  const fish = getFishData(fishId);
  const preference = fish?.depthPreference ?? 'middle';
  if (fishId === 'crucian') {
    return depth === 'surface' ? 0.82 : 1.12;
  }
  if (depth === 'surface') {
    if (fish?.surfaceBite === false) return 0.08;
    if (preference === 'surface') return 1.42;
    if (preference === 'bottom') return 0.18;
    return 0.55;
  }
  if (preference === 'bottom') return 1.38;
  if (preference === 'surface') return 0.24;
  return 0.82;
}

function getTackleCandidateMultiplier(state, minigame, fishId) {
  const effects = getTackleEffects(state);
  const hook = state.tackle?.equipped?.hook ?? 'none';
  const sizeClass = getFishSizeClass(fishId);
  let multiplier = 1 + Math.max(0, 1 - effects.scatterScale) * 0.14;

  if (hook === 'small_hook') {
    multiplier *= sizeClass === 'small' ? 1.16 : sizeClass === 'large' ? 0.86 : 1.04;
    if (predatorFishIds.includes(fishId)) multiplier *= 0.9;
  } else if (hook === 'large_hook') {
    multiplier *= sizeClass === 'small' ? 0.82 : sizeClass === 'large' ? 1.16 : 0.98;
    if (predatorFishIds.includes(fishId) || minigame.selectedBait === 'live_bait') multiplier *= 1.12;
  } else if (hook === 'medium_hook') {
    multiplier *= 1.04;
  } else if (hook === 'sharper_hook') {
    multiplier *= sizeClass === 'small' ? 1.04 : 1.1;
  } else if (hook === 'old_dull_hook') {
    multiplier *= 0.9;
  }

  return multiplier;
}

function getActivityMultiplier(state, minigame, fishId, spot) {
  let multiplier = getLiveBaitSourceMultiplier(fishId, minigame);
  const waterId = normalizeWaterId(state.travel?.selectedWater);

  if (fishId === 'rotan' && spot.zone === 'near_bank' && minigame.method === 'handline') {
    multiplier *= 0.82;
  }

  if (fishId === 'crucian' && spot.zone !== 'near_bank') {
    multiplier *= 1.08;
  }

  if (fishId === 'pike') {
    multiplier *= spot.zone === 'reed_edge' ? 1.95 : spot.zone === 'mid_water' ? 1.52 : 1.12;
    if (waterId === 'sluice') multiplier *= 1.25;
  }

  if (fishId === 'canadian_catfish' && waterId === 'greada') {
    multiplier *= (minigame.selectedDepth ?? 'middle') === 'bottom' ? 1.42 : 1.16;
    if (['worms', 'nightcrawler', 'larvae', 'live_bait'].includes(minigame.selectedBait)) multiplier *= 1.18;
  }

  if (fishId === 'sudak') multiplier *= 1.28;
  if (fishId === 'som') multiplier *= minigame.selectedBait === 'live_bait' ? 1.18 : 0.82;
  if (fishId === 'eel') multiplier *= minigame.selectedBait === 'live_bait' ? 1.3 : 1.08;

  return multiplier;
}

function getLiveBaitSourceMultiplier(fishId, minigame) {
  if (minigame.selectedBait !== 'live_bait') {
    return 1;
  }
  const source = minigame.consumedLiveBaitSourceFishId;
  if (fishId === 'pike' && source === 'crucian') return 1.28;
  if ((fishId === 'som' || fishId === 'eel' || fishId === 'canadian_catfish') && source === 'loach') return 1.24;
  if (fishId === 'okun' && ['gudgeon', 'bleak', 'plotytsia'].includes(source)) return 1.18;
  if (fishId === 'rotan') return 0.32;
  return 1.06;
}

function getWaterFishMultiplier(state, fishId) {
  const waterId = normalizeWaterId(state.travel?.selectedWater);
  if (!getWaterFishIds(waterId).includes(fishId)) {
    return 0;
  }
  const phase = getTimePhase(state);
  const multipliers = {
    canal: { rotan: 1.15, crucian: 1.02, pike: 0.55, rudd: 0.9, plotytsia: 1.04, loach: 0.82, canadian_catfish: 0 },
    sluice: { bleak: 1.35, roach: 1.22, rudd: 0.92, pike: ['morning', 'evening'].includes(phase) ? 1.18 : 0.76, loach: 0.55, canadian_catfish: 0 },
    fire_ponds: { crucian: 1.24, rudd: 1.3, roach: 1.12, rotan: 0.62, canadian_catfish: 0 },
    greada: {
      crucian: 1.24,
      rotan: 0.62,
      loach: 0.82,
      canadian_catfish: ['evening', 'night'].includes(phase) ? 1.55 : 0.42,
      pike: 0.35,
    },
    lake_tur: { roach: 1.12, rudd: 1.16, okun: 1.32, lynok: 1.24, sudak: ['evening', 'night'].includes(phase) ? 1.28 : 0.72, pike: 1.12, rotan: 0.2, canadian_catfish: 0, som: 0.18 },
    mining_lake: {
      pike: 1.45,
      okun: 1.24,
      lynok: 1.22,
      sudak: ['evening', 'night'].includes(phase) ? 1.65 : 0.8,
      som: ['evening', 'night'].includes(phase) ? 1.55 : 0.58,
      canadian_catfish: ['evening', 'night'].includes(phase) ? 1.65 : 0.72,
      eel: ['evening', 'night'].includes(phase) ? 1.45 : 0.44,
      loach: 1.18,
      rotan: 0.2,
    },
  };
  return multipliers[waterId]?.[fishId] ?? 1;
}

function isHardBaitGate(fishId, baitId) {
  if (fishId === 'eel') return !['nightcrawler', 'live_bait'].includes(baitId);
  if (fishId === 'sudak') return baitId !== 'live_bait';
  return false;
}

function isHardTackleGate(state, fishId) {
  const effects = getTackleEffects(state);
  if (fishId === 'sudak') return effects.reachBonus <= 0;
  if (fishId === 'som') return effects.reachBonus <= 0 || effects.stabilityBonus <= 0;
  if (fishId === 'eel') return effects.reachBonus <= 0;
  return false;
}

function getFishSizeClass(fishId) {
  const fish = getFishData(fishId);
  if (!fish) return 'medium';
  if ((fish.maxWeight ?? 0) <= 180) return 'small';
  if ((fish.minWeight ?? 0) >= 180 || predatorFishIds.includes(fishId)) return 'large';
  return 'medium';
}
