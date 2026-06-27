import { BUS_WATER_IDS, canUseBusStation, getFishingLocation, hasMobilityForSluice, hasScooter, hasUsableBicycle, normalizeWaterId } from './locations.js';
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
  if (!location || !['bicycle', 'bicycle_or_bus', 'scooter_or_bicycle'].includes(location.access)) {
    return false;
  }

  if (location.access === 'scooter_or_bicycle' && !hasMobilityForSluice(state)) {
    pushLog(state, 'logNeedScooterOrBicycle');
    return false;
  }

  const usingScooterForSluice = location.access === 'scooter_or_bicycle' && hasScooter(state);
  if (!usingScooterForSluice && !hasUsableBicycle(state)) {
    pushLog(state, location.access === 'scooter_or_bicycle' ? 'logNeedScooterOrBicycle' : 'logNeedBicycleForTravel');
    return false;
  }

  state.travel ??= {};
  state.travel.farWatersUnlocked = true;
  if (!usingScooterForSluice && !state.purchased?.bestBicycle) {
    state.travel.bicycleTripsLeft = Math.max(0, (state.travel.bicycleTripsLeft ?? 0) - 1);
    if (state.travel.bicycleTripsLeft === 0) {
      pushLog(state, 'logBicycleBroken');
    }
  }
  return arriveAtWater(state, location.id, 'logTravelByBicycle');
}

export function buyBusTicket(state, locationId) {
  const location = getFishingLocation(locationId);
  if (!location || !BUS_WATER_IDS.includes(location.id)) {
    return false;
  }

  if (!canUseBusStation(state)) {
    pushLog(state, 'logBusStationLocked');
    return false;
  }

  const cost = location.ticketCost ?? 0;
  if (state.money < cost) {
    pushLog(state, 'logTicketCosts', { waterKey: location.labelKey, coins: cost });
    return false;
  }

  state.money -= cost;
  state.travel ??= {};
  state.travel.boughtTickets = {
    ...(state.travel.boughtTickets ?? {}),
    [location.id]: (state.travel.boughtTickets?.[location.id] ?? 0) + 1,
  };
  pushLog(state, 'logBoughtTicket', { waterKey: location.labelKey, coins: cost });
  queueSound(state, 'buy_item');
  return arriveAtWater(state, location.id, 'logArrivedByBus');
}
