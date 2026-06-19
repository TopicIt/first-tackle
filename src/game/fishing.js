import { addItem, countItem, hasItem, removeItem, removeOneFish } from './inventory.js';
import { getFishData, getFreshFishValue, rollFish } from './fishData.js';
import { nowSeconds, pushFeedback, pushLog } from './state.js';

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

  consumeBait(state);

  const missChance = method === 'stickRod' ? 0.24 : 0.34;
  if (Math.random() < missChance) {
    state.ui.catchResult = null;
    pushFeedback(state, 'feedbackNoFish', {}, 'fish');
    pushLog(state, 'logNoFishCaught');
    return;
  }

  const catchResult = rollFish();
  catchResult.value = getFreshFishValue(catchResult);
  const catchFish = getFishData(catchResult.id);

  addItem(state, catchResult.id);
  state.ui.catchResult = catchResult;
  pushFeedback(state, catchFish.nameKey, {}, 'fish');
  pushLog(state, 'logCaughtFish', { fishKey: catchFish.nameKey });
}

export function cleanFish(state) {
  const fishId = removeOneFish(state);
  if (!fishId) {
    pushLog(state, 'logNeedFreshFish');
    return;
  }

  addItem(state, 'cleanedFish');
  pushFeedback(state, 'feedbackCleanedFish', {}, 'fish');
  pushLog(state, 'logCleanedFish');
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
  addItem(state, 'saltedFish');
  pushFeedback(state, 'feedbackSaltedFish', {}, 'fish');
  pushLog(state, 'logSaltedFish');
}

export function hangFishToDry(state) {
  if (!hasItem(state, 'saltedFish')) {
    pushLog(state, 'logNeedSaltedFish');
    return;
  }

  removeItem(state, 'saltedFish');
  addItem(state, 'dryingFish');
  pushFeedback(state, 'feedbackDryingFish', {}, 'fish');
  pushLog(state, 'logHungFish');
}

export function waitUntilTomorrow(state) {
  const drying = countItem(state, 'dryingFish');
  state.timers.wormSearchReadyAt = 0;

  if (drying > 0) {
    state.inventory.dryingFish = 0;
    addItem(state, 'taranka', drying);
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

function consumeBait(state) {
  if (hasItem(state, 'worms')) {
    removeItem(state, 'worms');
    return;
  }

  removeItem(state, 'larvae');
}
