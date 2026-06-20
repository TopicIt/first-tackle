import { addItem, countItem, hasItem, removeItem } from './inventory.js';
import { advanceFishStatus, countFishByStatus, ensureFishState, takeFreshFish } from './fishInventory.js';
import { advanceMarketDay, freshFishAtRisk } from './market.js';
import { ownTackleComponent } from './tackle.js';
import { advanceTime, getTimePhase, resetToMorning } from './time.js';
import { nowSeconds, pushFeedback, pushLog, queueSound } from './state.js';

const WORM_SEARCH_COOLDOWN = 8;

export function canCraftPrimitiveTackle(state) {
  return false;
}

export function craftPrimitiveTackle(state) {
  pushLog(state, 'logStarterTackleReady');
}

export function canCraftStickRod(state) {
  const owned = state.tackle?.owned ?? {};
  return hasItem(state, 'primitiveTackle') && !hasItem(state, 'stickRod')
    && owned.simple_stick_rod
    && (owned.goose_feather_float || owned.cheap_float || owned.proper_float);
}

export function craftStickRod(state) {
  if (!canCraftStickRod(state)) {
    pushLog(state, 'logNeedTackleForRod');
    return;
  }

  addItem(state, 'stickRod');
  state.tackle.equipped.rod = 'simple_stick_rod';
  if (state.tackle.equipped.float === 'none') {
    state.tackle.equipped.float = state.tackle.owned.goose_feather_float ? 'goose_feather_float' : 'cheap_float';
  }
  pushFeedback(state, 'feedbackRod', {}, 'item');
  pushLog(state, 'logCraftedRod');
  queueSound(state, 'craft_item');
}

export function getWormSearchCooldown(state) {
  return Math.max(0, state.timers.wormSearchReadyAt - nowSeconds());
}

export function searchForWorms(state, method = 'stones') {
  const cooldown = getWormSearchCooldown(state);
  if (cooldown > 0) {
    pushLog(state, 'logGardenCooldown', { seconds: Math.ceil(cooldown) });
    return;
  }

  if (method === 'soil' && !state.purchased.shovel) {
    pushLog(state, 'logNeedShovel');
    return;
  }

  const amount = getBaitAmount(method);
  const larvae = method === 'compost' ? 1 + Math.floor(Math.random() * 2) : 0;
  addItem(state, 'worms', amount);
  if (larvae > 0) {
    addItem(state, 'larvae', larvae);
  }

  state.timers.wormSearchReadyAt = nowSeconds() + WORM_SEARCH_COOLDOWN;
  const larvaeText = larvae ? `, +${larvae} larvae` : '';
  pushFeedback(state, 'feedbackBait', { worms: amount, larvaeText }, 'bait');
  pushLog(state, 'logFoundBait', {
    worms: amount,
    larvaeText: larvae ? ` and ${larvae} larvae` : '',
  });
  queueSound(state, 'gather_bait');
  advanceTime(state, 25);
}

export function gatherGooseFeather(state) {
  const phaseKey = `${state.day}:${getTimePhase(state)}`;
  if (state.timers?.featherSearchPhaseKey === phaseKey) {
    pushLog(state, 'logFeathersTryLater');
    return;
  }
  state.timers ??= {};
  advanceTime(state, 20);
  state.timers.featherSearchPhaseKey = `${state.day}:${getTimePhase(state)}`;
  if (state.tackle?.owned?.goose_feather_float) {
    pushLog(state, 'logAlreadyFoundFeather');
    return;
  }
  if (Math.random() < 0.4) {
    ownTackleComponent(state, 'goose_feather_float');
    pushFeedback(state, 'componentGooseFeatherFloat', {}, 'item');
    pushLog(state, 'logFoundGooseFeather');
    return;
  }
  pushLog(state, 'logNoGooseFeather');
}

export function gatherRodStick(state) {
  advanceTime(state, 20);
  if (state.tackle?.owned?.simple_stick_rod || hasItem(state, 'stickRod')) {
    pushLog(state, 'logAlreadyFoundRodStick');
    return;
  }
  if (Math.random() > 0.9) {
    pushLog(state, 'logNoRodStick');
    return;
  }
  ownTackleComponent(state, 'simple_stick_rod');
  pushFeedback(state, 'componentSimpleStickRod', {}, 'item');
  pushLog(state, 'logFoundRodStick');
}

export function gatherSmallStones(state) {
  advanceTime(state, 10);
  ownTackleComponent(state, 'small_stone');
  pushLog(state, 'logFoundSmallStone');
}

export function canFish(state) {
  return hasItem(state, 'primitiveTackle') && hasAnyBait(state);
}

export function fish(state, method = 'handline') {
  if (!hasItem(state, 'primitiveTackle')) {
    pushLog(state, 'logNeedPrimitiveTackle');
    return;
  }

  if (method === 'stickRod' && !hasItem(state, 'stickRod')) {
    pushLog(state, 'logNeedFirstRod');
    return;
  }

  if (!hasAnyBait(state)) {
    pushLog(state, 'logNeedBait');
    return;
  }

  pushLog(state, method === 'stickRod' ? 'logUseFloatMinigameRod' : 'logUseFloatMinigameHandline');
}

export function cleanFish(state) {
  ensureFishState(state);
  const fishEntry = takeFreshFish(state);
  if (!fishEntry) {
    pushLog(state, 'logNeedFreshFish');
    return;
  }

  pushFeedback(state, 'feedbackCleanedFish', {}, 'fish');
  pushLog(state, 'logCleanedFish');
  queueSound(state, 'ui_click');
}

export function saltFish(state) {
  const eligibleCleanedFish = getTarankaEligibleCount(state, 'cleaned');
  if (eligibleCleanedFish === 0) {
    if (hasItem(state, 'cleanedFish')) {
      pushLog(state, 'logTarankaFishTooLarge');
      return;
    }
    pushLog(state, 'logNeedCleanedFish');
    return;
  }

  if (!hasItem(state, 'salt')) {
    pushLog(state, 'logNeedSalt');
    return;
  }

  removeItem(state, 'salt');
  advanceFishStatus(state, 'cleaned', 'salted', 1, isTarankaEligible);
  pushFeedback(state, 'feedbackSaltedFish', {}, 'fish');
  pushLog(state, 'logSaltedFish');
}

export function hangFishToDry(state) {
  if (!hasItem(state, 'saltedFish')) {
    pushLog(state, 'logNeedSaltedFish');
    return;
  }

  advanceFishStatus(state, 'salted', 'drying');
  pushFeedback(state, 'feedbackDryingFish', {}, 'fish');
  pushLog(state, 'logHungFish');
  queueSound(state, 'dry_fish');
}

export function waitUntilTomorrow(state) {
  ensureFishState(state);
  const drying = countFishByStatus(state, 'drying');
  const hasFreshRisk = freshFishAtRisk(state);
  state.timers.wormSearchReadyAt = 0;
  state.day += 1;
  resetToMorning(state);
  advanceMarketDay(state);

  if (hasFreshRisk) {
    pushLog(state, 'logFreshFishLostValue');
  }

  if (drying > 0) {
    advanceFishStatus(state, 'drying', 'ready_taranka', drying);
    pushFeedback(state, 'feedbackTarankaReady', { count: drying }, 'fish');
    pushLog(state, 'logDriedFishReady', { count: drying });
    return;
  }

  pushLog(state, 'logMorningAgain');
}

export function collectTaranka(state) {
  const ready = countFishByStatus(state, 'ready_taranka');
  if (ready === 0) {
    pushLog(state, 'logNoTarankaReady');
    return;
  }

  advanceFishStatus(state, 'ready_taranka', 'taranka', ready);
  pushFeedback(state, 'feedbackTaranka', { count: ready }, 'fish');
  pushLog(state, 'logCollectedTaranka', { count: ready });
  queueSound(state, 'dry_fish');
}

export function smokeFish(state) {
  ensureFishState(state);
  if (!state.hasSmoker) {
    pushLog(state, 'logNeedSmoker');
    return;
  }

  const candidate = (state.fishBasket ?? []).find((entry) => ['cleaned', 'fresh'].includes(entry.status));
  if (!candidate) {
    pushLog(state, 'logNeedFishToSmoke');
    return;
  }

  candidate.status = 'smoked';
  advanceTime(state, 90);
  pushFeedback(state, 'feedbackSmokedFish', {}, 'fish');
  pushLog(state, 'logSmokedFish', { fishKey: candidate.fishId });
  queueSound(state, 'dry_fish');
}

function getBaitAmount(method) {
  if (method === 'soil') {
    return 2 + Math.floor(Math.random() * 3);
  }

  if (method === 'compost') {
    return 1 + Math.floor(Math.random() * 2);
  }

  return 1 + Math.floor(Math.random() * 3);
}

function hasAnyBait(state) {
  return hasItem(state, 'worms') || hasItem(state, 'larvae');
}

function getTarankaEligibleCount(state, status) {
  return (state.fishBasket ?? []).filter((entry) => entry.status === status && isTarankaEligible(entry)).length;
}

function isTarankaEligible(entry) {
  return !['pike', 'canadian_catfish'].includes(entry.fishId) && entry.weightGrams <= 260;
}
