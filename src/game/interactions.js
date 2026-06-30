import { buyShopItem, sellAllFish, sellFishSpecies, sellSingleFish, sellSmokedFish, sellTaranka } from './economy.js';
import {
  countFishByStatus,
  getFishEntries,
} from './fishInventory.js';
import {
  cleanFish,
  collectTaranka,
  craftPrimitiveTackle,
  craftStickRod,
  gatherGooseFeather,
  gatherGrandmaThread,
  gatherOldHook,
  gatherRodStick,
  gatherSmallStones,
  getWormSearchCooldown,
  hangFishToDry,
  restSeveralHours,
  saltFish,
  searchForWorms,
  waitUntilTomorrow,
} from './fishing.js';
import { hasItem } from './inventory.js';
import {
  BUS_WATER_IDS,
  MOBILITY_WATER_IDS,
  canSelectWaterForFishing,
  canUseBusStation,
  getFishingLocation,
  getFishingLocationList,
  getGrandmaTrustProgress,
  getLockedReasonKey,
  hasMobilityForSluice,
  hasUsableBicycle,
  isFishingLocation,
} from './locations.js';
import { arriveAtWater, buyBusTicket, travelByBicycle } from './travel.js';
import { interactionZones } from './world.js';
import { getTackleEffects } from './tackle.js';
import { tutorialSteps } from './profile.js';
import { hasStarterTackleDrawerCompleted } from './starterTackleDrawer.js';
import { t } from '../i18n/i18n.js';

const idleContext = {
  zoneId: null,
  actions: [],
  availableActionLabels: [],
};

export function getInteractionContext(state, playerPosition) {
  const zone = getCurrentZone(playerPosition);
  const actions = [];

  if (!zone) {
    return {
      ...idleContext,
      zoneLabel: t('roadsideVillage'),
      hint: t('roadsideHint'),
      actions,
      sceneActions: [],
    };
  }

  actions.unshift(getOpenSceneAction(zone.id));

  if (zone.id === 'garden') {
    const cooldown = getWormSearchCooldown(state);
    actions.push({
      id: 'worms:open',
      label: cooldown > 0 ? t('searchIn', { seconds: Math.ceil(cooldown) }) : t('wormDigAction'),
      disabled: cooldown > 0,
    });
  }

  if (zone.id === 'canal') {
    actions.push({
      id: 'minigame:start:active',
      label: t('startFishingWithTackle'),
    });
  }

  return {
    zoneId: zone.id,
    zoneLabel: getZoneLabel(zone.id),
    hint: getZoneHint(state, zone.id),
    actions,
    sceneActions: getSceneActions(state, zone.id),
    availableActionLabels: summarizeActions(actions),
  };
}

export function getLocationSceneContext(state, zoneId) {
  const zone = interactionZones[zoneId];
  if (!zone && !isFishingLocation(zoneId) && !['fishing_select', 'sluice_map', 'fire_ponds_map', 'cafe'].includes(zoneId)) {
    return {
      ...idleContext,
      zoneLabel: t('roadsideVillage'),
      hint: t('roadsideHint'),
      sceneActions: [],
    };
  }

  const actions = [];

  return {
    zoneId,
    zoneLabel: getZoneLabel(zoneId),
    hint: getZoneHint(state, zoneId),
    actions,
    sceneActions: getSceneActions(state, zoneId),
    availableActionLabels: summarizeActions(actions),
  };
}

export function runAction(actionId, state, context = idleContext) {
  if (actionId === 'craft:tackle') {
    if (context.zoneId !== 'house') {
      return;
    }
    craftPrimitiveTackle(state);
  }

  if (actionId === 'search:worms') {
    if (context.zoneId !== 'garden') {
      return;
    }
    searchForWorms(state);
  }

  if (actionId === 'search:stones') {
    if (context.zoneId !== 'garden') {
      return;
    }
    searchForWorms(state, 'stones');
  }

  if (actionId === 'search:soil') {
    if (context.zoneId !== 'garden') {
      return;
    }
    searchForWorms(state, 'soil');
  }

  if (actionId === 'search:compost') {
    if (context.zoneId !== 'garden') {
      return;
    }
    searchForWorms(state, 'compost');
  }

  if (actionId === 'search:feather') {
    if (!['garden', 'house'].includes(context.zoneId)) return;
    gatherGooseFeather(state);
  }

  if (actionId === 'gather:rodStick') {
    if (!['garden', 'house'].includes(context.zoneId)) return;
    gatherRodStick(state);
  }

  if (actionId === 'gather:thread') {
    if (context.zoneId !== 'house') return;
    gatherGrandmaThread(state);
  }

  if (actionId === 'gather:oldHook') {
    if (context.zoneId !== 'house') return;
    gatherOldHook(state);
  }

  if (actionId === 'gather:stones') {
    if (!['garden', 'house'].includes(context.zoneId)) return;
    gatherSmallStones(state);
  }

  if (actionId === 'craft:stickRod') {
    if (context.zoneId !== 'house') {
      return;
    }
    craftStickRod(state);
  }

  if (actionId === 'clean:fish') {
    if (context.zoneId !== 'house') {
      return;
    }
    cleanFish(state);
  }

  if (actionId === 'salt:fish') {
    if (context.zoneId !== 'house') {
      return;
    }
    saltFish(state);
  }

  if (actionId === 'dry:fish') {
    if (context.zoneId !== 'house') {
      return;
    }
    hangFishToDry(state);
  }

  if (actionId === 'collect:taranka') {
    if (context.zoneId !== 'house') {
      return;
    }
    collectTaranka(state);
  }

  if (actionId === 'wait:tomorrow') {
    if (context.zoneId !== 'house') {
      return;
    }
    waitUntilTomorrow(state);
  }

  if (actionId === 'rest:fewHours') {
    if (context.zoneId !== 'house') {
      return;
    }
    restSeveralHours(state);
  }

  if (actionId === 'sell:fish') {
    if (context.zoneId !== 'market') {
      return;
    }
    sellAllFish(state);
  }

  if (actionId.startsWith('sell:entry:')) {
    if (context.zoneId !== 'market') {
      return;
    }
    sellSingleFish(state, actionId.replace('sell:entry:', ''));
  }

  if (actionId.startsWith('sell:species:')) {
    if (context.zoneId !== 'market') {
      return;
    }
    sellFishSpecies(state, actionId.replace('sell:species:', ''));
  }

  if (actionId === 'sell:taranka') {
    if (context.zoneId !== 'market') {
      return;
    }
    sellTaranka(state);
  }

  if (actionId === 'sell:smoked') {
    if (context.zoneId !== 'market') {
      return;
    }
    sellSmokedFish(state);
  }

  if (actionId.startsWith('buy:')) {
    if (context.zoneId !== 'market') {
      return;
    }
    buyShopItem(state, actionId.replace('buy:', ''));
  }

  if (actionId.startsWith('travel:water:')) {
    travelByBicycle(state, actionId.replace('travel:water:', ''));
  }

  if (actionId.startsWith('submap:fish:')) {
    arriveAtWater(state, actionId.replace('submap:fish:', ''));
  }

  if (actionId.startsWith('select:water:')) {
    const waterId = actionId.replace('select:water:', '');
    if (canSelectWaterForFishing(state, waterId)) {
      arriveAtWater(state, waterId);
    } else {
      pushActionLog(state, lockedLogKey(state, waterId));
    }
  }

  if (actionId.startsWith('ticket:buy:')) {
    buyBusTicket(state, actionId.replace('ticket:buy:', ''));
  }
}

function getCurrentZone(playerPosition) {
  for (const [id, zone] of Object.entries(interactionZones)) {
    const distance = zone.position.distanceTo(playerPosition);
    if (distance <= zone.radius) {
      return { id };
    }
  }

  return null;
}

function getZoneHint(state, zoneId) {
  if (zoneId === 'house') {
    return t('hintHouse');
  }

  if (zoneId === 'garden') {
    return t('hintGarden');
  }

  if (zoneId === 'canal') {
    return t('hintPond');
  }

  if (isFishingLocation(zoneId)) {
    return t(getFishingLocation(zoneId).descriptionKey);
  }

  if (zoneId === 'market') {
    return t('hintMarket');
  }

  if (zoneId === 'cafe') {
    return t('hintCafe');
  }

  if (zoneId === 'bus_station') {
    return canUseBusStation(state) ? t('hintBusStation') : t('hintBusStationLocked');
  }

  if (zoneId === 'sluice_map') {
    return t('hintSluiceMap');
  }

  if (zoneId === 'fire_ponds_map') {
    return t('hintFirePondsMap');
  }

  if (zoneId === 'fishing_select') {
    return t('hintFishingSelect');
  }

  return t('roadsideHint');
}

function getSceneActions(state, zoneId) {
  if (zoneId === 'house') {
    return [
      {
        id: hasStarterTackleDrawerCompleted(state) ? 'drawer:done' : 'drawer:open',
        label: hasStarterTackleDrawerCompleted(state) ? t('drawerCollectedAction') : t('drawerCollectAction'),
        disabled: hasStarterTackleDrawerCompleted(state),
      },
      {
        id: 'clean:fish',
        label: t('cleanFish'),
        disabled: countFishByStatus(state, 'fresh') === 0,
      },
      {
        id: 'salt:fish',
        label: t('saltFish'),
        disabled: !hasItem(state, 'cleanedFish') || !hasItem(state, 'salt'),
      },
      {
        id: 'dry:fish',
        label: t('hangFish'),
        disabled: !hasItem(state, 'saltedFish'),
      },
      {
        id: 'collect:taranka',
        label: t('collectTaranka'),
        disabled: countFishByStatus(state, 'ready_taranka') === 0,
      },
      {
        id: 'wait:tomorrow',
        label: t('waitTomorrow'),
      },
      {
        id: 'rest:fewHours',
        label: t('restFewHours'),
      },
    ];
  }

  if (zoneId === 'garden') {
    const cooldown = getWormSearchCooldown(state);
    return [
      {
        id: 'worms:open',
        label: cooldown > 0 ? t('searchIn', { seconds: Math.ceil(cooldown) }) : t('wormDigAction'),
        disabled: cooldown > 0,
      },
    ];
  }

  if (zoneId === 'fishing_select') {
    return getFishingLocationList().map((location) => {
      const available = canSelectWaterForFishing(state, location.id);
      const selected = (state.travel?.selectedWater ?? 'canal') === location.id;
      return {
        id: `select:water:${location.id}`,
        label: selected
          ? t('waterSelectedAction', { destination: t(location.labelKey) })
          : t('selectWaterAction', { destination: t(location.labelKey) }),
        disabled: !available,
        variant: available ? 'secondary' : 'future',
        reason: available ? '' : t(getLockedReasonKey(state, location.id)),
      };
    });
  }

  if (zoneId === 'sluice_map') {
    return [
      {
        id: 'submap:fish:sluice',
        label: t('fishAtSluice'),
        variant: 'secondary scene-hotspot scene-hotspot--left',
      },
    ];
  }

  if (zoneId === 'fire_ponds_map') {
    return [
      {
        id: 'submap:fish:fire_ponds',
        label: t('fishAtFirePonds'),
        variant: 'secondary scene-hotspot scene-hotspot--right',
      },
    ];
  }

  if (isFishingLocation(zoneId)) {
    const effects = getTackleEffects(state);
    const waterActions = [
      {
        id: 'minigame:start:active',
        label: t('startFishingWithTackle'),
      },
      {
        id: 'minigame:start:liveBait',
        label: t('startLiveBaitFishing'),
        disabled: !effects.hasRod || getFishEntries(state, 'live_bait').length === 0,
      },
    ];

    if (zoneId !== 'canal') {
      return waterActions;
    }

    return [
      ...waterActions,
      ...bicycleRouteActions(state),
    ];
  }

  if (zoneId === 'market') {
    return [
      {
        id: 'market:tab:sell',
        label: t('marketTabSell'),
      },
      {
        id: 'market:tab:buy',
        label: t('marketTabBuy'),
      },
      {
        id: 'market:tab:prices',
        label: t('marketTabPrices'),
      },
    ];
  }

  if (zoneId === 'bus_station') {
    if (!canUseBusStation(state)) {
      const trust = getGrandmaTrustProgress(state);
      return [
        {
          id: 'bus:locked',
          label: t('grandmaTrustProgress', { caught: trust.caught, required: trust.required }),
          disabled: true,
          variant: 'future',
          reason: t('grandmaTrustHint'),
        },
      ];
    }

    return BUS_WATER_IDS.map((waterId) => {
      const location = getFishingLocation(waterId);
      const price = location.ticketCost ?? 0;
      return {
        id: `ticket:buy:${waterId}`,
        label: t('buyTicketTo', { destination: t(location.labelKey), coins: price }),
        disabled: state.money < price,
        variant: state.money < price ? 'future' : 'secondary',
      };
    });
  }

  return [];
}

function summarizeActions(actions) {
  const availableActions = actions.filter((action) => !action.disabled);
  if (availableActions.length === 0) {
    return [t('none')];
  }

  return availableActions.map((action) => action.label);
}

function getZoneLabel(zoneId) {
  const labels = {
    house: 'zoneHouse',
    garden: 'zoneGarden',
    canal: 'zoneCanal',
    market: 'zoneMarket',
    cafe: 'zoneCafe',
    bus_station: 'zoneBusStation',
    fishing_select: 'mapFishing',
    sluice_map: 'zoneSluice',
    fire_ponds_map: 'zoneFirePonds',
  };
  if (isFishingLocation(zoneId)) {
    return t(getFishingLocation(zoneId).labelKey);
  }
  return t(labels[zoneId] ?? 'roadsideVillage');
}

function getOpenSceneAction(zoneId) {
  const labels = {
    house: 'openHouse',
    garden: 'openGarden',
    canal: 'openPond',
    market: 'openMarket',
    cafe: 'openCafe',
    bus_station: 'openBusStation',
    fishing_select: 'openFishingSelect',
    sluice_map: 'zoneSluice',
    fire_ponds_map: 'zoneFirePonds',
  };

  return {
    id: `open:${zoneId}`,
    label: t(labels[zoneId] ?? 'actions'),
    variant: 'scene',
  };
}

function pushActionLog(state, key) {
  state.log = [{ key, params: {}, createdAt: Date.now(), count: 1 }, ...(state.log ?? [])].slice(0, 6);
}

function bicycleRouteActions(state) {
  const usableBicycle = hasUsableBicycle(state);
  return MOBILITY_WATER_IDS.map((waterId) => {
    const location = getFishingLocation(waterId);
    const available = location.access === 'scooter_or_bicycle' ? hasMobilityForSluice(state) : usableBicycle;
    return {
      id: `travel:water:${waterId}`,
      label: available
        ? t('travelToWater', { destination: t(location.labelKey) })
        : t(getLockedReasonKey(state, waterId)),
      disabled: !available,
      variant: available ? 'secondary' : 'future',
    };
  });
}

function isTutorialAction(state, actionId) {
  const tutorial = state.tutorialState;
  if (!tutorial?.started || tutorial.completed || tutorial.skipped) {
    return false;
  }
  const stepIndex = tutorial.step ?? 0;
  return tutorialSteps[stepIndex]?.actionId === actionId;
}

function lockedLogKey(state, waterId) {
  const reasonKey = getLockedReasonKey(state, waterId);
  if (reasonKey === 'requiresScooterOrBicycle') {
    return 'logNeedScooterOrBicycle';
  }
  if (reasonKey === 'requiresBusTicket') {
    return 'logNeedBusTicket';
  }
  return 'logNeedBicycleForTravel';
}
