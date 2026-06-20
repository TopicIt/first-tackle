import { getFishingLocation, normalizeWaterId } from './locations.js';
import { pushFeedback, pushLog, queueSound } from './state.js';

export function arriveAtWater(state, locationId, logKey = 'logArrivedAtWater') {
  const waterId = normalizeWaterId(locationId);
  const location = getFishingLocation(waterId);
  if (!location) {
    return false;
  }

  state.travel ??= {};
  state.travel.selectedWater = waterId;
  state.travel.visitedWaters = {
    ...(state.travel.visitedWaters ?? {}),
    canal: true,
    [waterId]: true,
  };
  if (waterId === 'greada') {
    state.travel.greadaUnlocked = true;
  }

  state.ui.activeScene = waterId;
  state.ui.selectedHotspot = waterId;
  pushFeedback(state, 'feedbackArrived', { destinationKey: location.labelKey }, 'item');
  pushLog(state, logKey, { waterKey: location.labelKey });
  queueSound(state, 'open_scene');
  return true;
}

export function travelByBicycle(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location || location.access !== 'bicycle') {
    return false;
  }

  if (!state.purchased?.bicycle) {
    pushLog(state, 'logNeedBicycleForTravel');
    return false;
  }

  state.travel ??= {};
  state.travel.farWatersUnlocked = true;
  return arriveAtWater(state, location.id, 'logTravelByBicycle');
}

export function buyBusTicket(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location || location.access !== 'bus') {
    return false;
  }

  const cost = location.ticketCost ?? 0;
  if (state.money < cost) {
    pushLog(state, 'logTicketCosts', { waterKey: location.labelKey, coins: cost });
    return false;
  }

  state.money -= cost;
  pushLog(state, 'logBoughtTicket', { waterKey: location.labelKey, coins: cost });
  queueSound(state, 'buy_item');
  return arriveAtWater(state, location.id, 'logArrivedByBus');
}
