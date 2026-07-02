import { getFishData } from './fishData.js';
import { syncInventoryFromFishBasket } from './fishInventory.js';
import { pushFeedback, pushLog, queueSound } from './state.js';
import { ensureTimeState } from './time.js';
import { addProfileCoinsEarned } from './profile.js';

const ORDER_LIMIT = 2;
const ORDER_DURATION_MINUTES = 30;
const ORDER_DURATION_MS = ORDER_DURATION_MINUTES * 60 * 1000;

const orderTemplates = [
  {
    templateId: 'rotans_for_cat',
    titleKey: 'cafeOrderRotansForCat',
    descriptionKey: 'cafeOrderRotansForCatDesc',
    fishId: 'rotan',
    required: 5,
    minWeight: 50,
    rewardCoins: 50,
  },
  {
    templateId: 'baked_crucians',
    titleKey: 'cafeOrderBakedCrucians',
    descriptionKey: 'cafeOrderBakedCruciansDesc',
    fishId: 'crucian',
    required: 5,
    minWeight: 150,
    rewardCoins: 250,
  },
  {
    templateId: 'bream_for_drying',
    titleKey: 'cafeOrderBreamForDrying',
    descriptionKey: 'cafeOrderBreamForDryingDesc',
    fishId: 'bream',
    required: 4,
    minWeight: 0,
    rewardCoins: 350,
  },
  {
    templateId: 'roach_plate',
    titleKey: 'cafeOrderRoachPlate',
    descriptionKey: 'cafeOrderRoachPlateDesc',
    fishId: 'roach',
    required: 6,
    minWeight: 80,
    rewardCoins: 180,
  },
];

export function ensureCafeOrders(state) {
  state.quests ??= {};
  state.quests.cafeOrders ??= [];
  ensureTimeState(state);

  const now = getAbsoluteMinutes(state);
  const realNow = Date.now();
  state.quests.cafeOrders = state.quests.cafeOrders
    .map((order) => normalizeCafeOrder(order, state, now, realNow))
    .filter((order) => order.expiresAt > now && order.expiresAtReal > realNow);
  while (state.quests.cafeOrders.length < ORDER_LIMIT) {
    state.quests.cafeOrders.push(createCafeOrder(state));
  }
}

export function getCafeOrderRows(state) {
  ensureCafeOrders(state);
  const now = getAbsoluteMinutes(state);
  const realNow = Date.now();
  return state.quests.cafeOrders.map((order) => {
    const matching = getMatchingFish(state, order);
    const secondsLeft = Math.max(0, Math.ceil(((order.expiresAtReal ?? realNow) - realNow) / 1000));
    return {
      ...order,
      progress: Math.min(order.required, matching.length),
      complete: matching.length >= order.required,
      minutesLeft: Math.max(0, order.expiresAt - now),
      secondsLeft,
      timerText: formatSeconds(secondsLeft),
      fishNameKey: getFishData(order.fishId)?.nameKey ?? order.fishId,
    };
  });
}

export function completeCafeOrder(state, orderId) {
  ensureCafeOrders(state);
  const order = state.quests.cafeOrders.find((entry) => entry.id === orderId);
  if (!order || (order.expiresAtReal ?? Date.now()) <= Date.now()) {
    ensureCafeOrders(state);
    return false;
  }

  const matching = getMatchingFish(state, order);
  if (matching.length < order.required) {
    pushLog(state, 'logCafeOrderNotReady');
    return false;
  }

  const takeIds = new Set(matching.slice(0, order.required).map((entry) => entry.id));
  state.fishBasket = (state.fishBasket ?? []).filter((entry) => !takeIds.has(entry.id));
  syncInventoryFromFishBasket(state);
  state.money = (state.money ?? 0) + order.rewardCoins;
  addProfileCoinsEarned(state, order.rewardCoins);
  state.quests.cafeOrders = state.quests.cafeOrders.filter((entry) => entry.id !== order.id);
  state.quests.cafeCompleted = (state.quests.cafeCompleted ?? 0) + 1;
  pushFeedback(state, 'feedbackCoins', { coins: order.rewardCoins }, 'coins');
  pushLog(state, 'logCafeOrderCompleted', { orderKey: order.titleKey, coins: order.rewardCoins });
  queueSound(state, 'coins');
  ensureCafeOrders(state);
  return true;
}

function createCafeOrder(state) {
  const existing = new Set((state.quests?.cafeOrders ?? []).map((order) => order.templateId));
  const available = orderTemplates.filter((template) => !existing.has(template.templateId));
  const template = (available.length ? available : orderTemplates)[Math.floor(Math.random() * (available.length ? available.length : orderTemplates.length))];
  return {
    ...template,
    id: `${template.templateId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: getAbsoluteMinutes(state),
    expiresAt: getAbsoluteMinutes(state) + ORDER_DURATION_MINUTES,
    createdAtReal: Date.now(),
    expiresAtReal: Date.now() + ORDER_DURATION_MS,
  };
}

function normalizeCafeOrder(order, state, now, realNow) {
  if (order.expiresAtReal) {
    return order;
  }

  const minutesLeft = Math.max(1, (order.expiresAt ?? (now + ORDER_DURATION_MINUTES)) - now);
  return {
    ...order,
    createdAtReal: realNow,
    expiresAtReal: realNow + minutesLeft * 60 * 1000,
  };
}

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function getMatchingFish(state, order) {
  return (state.fishBasket ?? [])
    .filter((entry) => ['fresh', 'cleaned'].includes(entry.status))
    .filter((entry) => entry.fishId === order.fishId)
    .filter((entry) => (entry.weightGrams ?? 0) >= (order.minWeight ?? 0))
    .sort((a, b) => (a.weightGrams ?? 0) - (b.weightGrams ?? 0));
}

function getAbsoluteMinutes(state) {
  ensureTimeState(state);
  return ((state.day ?? 1) - 1) * 24 * 60 + Math.floor(state.time?.minutes ?? 0);
}
