import { addItem, countItem, hasItem, removeItem } from './inventory.js';
import { advanceFishStatus, ensureFishState, takeFreshFish } from './fishInventory.js';
import { advanceMarketDay, freshFishAtRisk } from './market.js';
import { nowSeconds, pushFeedback, pushLog, queueSound } from './state.js';

const WORM_SEARCH_COOLDOWN = 8;

export function canCraftPrimitiveTackle(state) {
  return (
    !hasItem(state, 'primitiveTackle') &&
    hasItem(state, 'thread') &&
    hasItem(state, 'simpleHook')
  );
}

export function craftPrimitiveTackle(state) {
  if (!canCraftPrimitiveTackle(state)) {
    pushLog(state, 'logNeedTackleParts');
    return;
  }

  removeItem(state, 'thread');
  removeItem(state, 'simpleHook');
  addItem(state, 'primitiveTackle');
  pushFeedback(state, 'feedbackTackle', {}, 'item');
  pushLog(state, 'logCraftedTackle');
  queueSound(state, 'craft_item');
}

export function canCraftStickRod(state) {
  return hasItem(state, 'primitiveTackle') && !hasItem(state, 'stickRod');
}

export function craftStickRod(state) {
  if (!canCraftStickRod(state)) {
    pushLog(state, 'logNeedTackleForRod');
    return;
  }

  addItem(state, 'stickRod');
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
  if (!hasItem(state, 'cleanedFish')) {
    pushLog(state, 'logNeedCleanedFish');
    return;
  }

  if (!hasItem(state, 'salt')) {
    pushLog(state, 'logNeedSalt');
    return;
  }

  removeItem(state, 'cleanedFish');
  removeItem(state, 'salt');
  advanceFishStatus(state, 'cleaned', 'salted');
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
  const drying = countItem(state, 'dryingFish');
  const hasFreshRisk = freshFishAtRisk(state);
  state.timers.wormSearchReadyAt = 0;
  state.day += 1;
  advanceMarketDay(state);

  if (hasFreshRisk) {
    pushLog(state, 'logFreshFishLostValue');
  }

  if (drying > 0) {
    advanceFishStatus(state, 'drying', 'taranka', drying);
    pushFeedback(state, 'feedbackTaranka', { count: drying }, 'fish');
    pushLog(state, 'logDriedFish', { count: drying });
    return;
  }

  pushLog(state, 'logMorningAgain');
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
