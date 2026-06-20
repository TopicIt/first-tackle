import { fishData, getFishData } from './fishData.js';

const trendSteps = {
  rising: 0.08,
  falling: -0.08,
  stable: 0,
};

const trendCycle = ['rising', 'stable', 'falling', 'stable'];

export function ensureMarketState(state) {
  state.market ??= { day: state.day ?? 1, prices: {} };
  state.market.prices ??= {};
  state.hasSmoker = Boolean(state.hasSmoker ?? state.purchased?.smoker);
  for (const fish of fishData) {
    state.market.prices[fish.id] ??= { multiplier: 1, trend: trendCycle[fish.id.length % trendCycle.length] };
  }
  state.travel ??= {};
  state.travel.farWatersUnlocked = Boolean(state.travel.farWatersUnlocked || state.purchased?.bicycle);
}

export function advanceMarketDay(state) {
  ensureMarketState(state);
  for (const fish of fishData) {
    const current = state.market.prices[fish.id];
    const drift = trendSteps[current.trend] ?? 0;
    const wobble = (((state.day + fish.id.length) % 3) - 1) * 0.025;
    const multiplier = clamp(current.multiplier + drift + wobble, 0.75, 1.35);
    current.multiplier = Number(multiplier.toFixed(2));
    current.trend = nextTrend(fish.id, state.day);
  }
  state.market.day = state.day;
}

export function getMarketPriceInfo(state, fishId) {
  ensureMarketState(state);
  const fish = getFishData(fishId);
  const entry = state.market.prices[fishId] ?? { multiplier: 1, trend: 'stable' };
  return {
    fishId,
    multiplier: entry.multiplier,
    trend: entry.trend,
    currentPrice: Math.max(1, Math.round((fish?.basePrice ?? 1) * entry.multiplier)),
  };
}

export function getFishSaleValue(state, entry) {
  const fish = getFishData(entry.fishId);
  const baseValue = entry.value || fish?.basePrice || 1;
  const market = getMarketPriceInfo(state, entry.fishId);
  const processedMultiplier = getProcessedMultiplier(entry);
  return Math.max(1, Math.round(baseValue * market.multiplier * getFreshnessMultiplier(state, entry) * processedMultiplier));
}

export function getFreshnessInfo(state, entry) {
  const age = Math.max(0, (state.day ?? 1) - (entry.caughtAtDay ?? state.day ?? 1));
  if (entry.status === 'taranka' || entry.status === 'smoked') {
    return { key: 'freshnessPreserved', multiplier: 1, age };
  }
  if (age <= 1) {
    return { key: 'freshnessFresh', multiplier: 1, age };
  }
  if (age === 2) {
    return { key: 'freshnessLosingValue', multiplier: 0.65, age };
  }
  return { key: 'freshnessPoorQuality', multiplier: 0.35, age };
}

export function freshFishAtRisk(state) {
  return (state.fishBasket ?? []).some((entry) => (
    (entry.status === 'fresh' || entry.status === 'live_bait') &&
    (state.day ?? 1) - (entry.caughtAtDay ?? state.day ?? 1) >= 1
  ));
}

function getFreshnessMultiplier(state, entry) {
  return getFreshnessInfo(state, entry).multiplier;
}

function getProcessedMultiplier(entry) {
  if (entry.status === 'taranka') {
    if (entry.weightGrams <= 70) return 3;
    if (entry.weightGrams <= 160) return 2.15;
    return 1.55;
  }

  if (entry.status === 'smoked') {
    if (entry.fishId === 'canadian_catfish') return 2.5;
    if (entry.fishId === 'pike') return 2.35;
    if (entry.fishId === 'crucian' && entry.weightGrams >= 150) return 2.1;
    if (entry.weightGrams >= 180) return 2;
    return 1.8;
  }

  return 1;
}

function nextTrend(fishId, day) {
  return trendCycle[(day + fishId.charCodeAt(0) + fishId.length) % trendCycle.length];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
