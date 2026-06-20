import { buyShopItem, sellAllFish, sellFishSpecies, sellSingleFish, sellSmokedFish, sellTaranka } from './economy.js';
import {
  countFishByStatus,
  getFishEntries,
} from './fishInventory.js';
import {
  canCraftStickRod,
  cleanFish,
  collectTaranka,
  craftPrimitiveTackle,
  craftStickRod,
  gatherGooseFeather,
  gatherRodStick,
  gatherSmallStones,
  getWormSearchCooldown,
  hangFishToDry,
  saltFish,
  searchForWorms,
  waitUntilTomorrow,
} from './fishing.js';
import { hasItem } from './inventory.js';
import { BICYCLE_WATER_IDS, BUS_WATER_IDS, canSelectWaterForFishing, getFishingLocation, getFishingLocationList, isFishingLocation } from './locations.js';
import { arriveAtWater, buyBusTicket, travelByBicycle } from './travel.js';
import { interactionZones } from './world.js';
import { getTimePhase } from './time.js';
import { getActiveRig, getTackleEffects } from './tackle.js';
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
      id: 'search:worms',
      label: cooldown > 0 ? t('searchIn', { seconds: Math.ceil(cooldown) }) : t('searchWorms'),
      disabled: cooldown > 0,
    });
  }

  if (zone.id === 'canal') {
    actions.push({
      id: 'minigame:start:handline',
      label: t('startHandlineFishing'),
    });
  }

  if (zone.id === 'market') {
    actions.push({
      id: 'sell:fish',
      label: t('sellFish'),
    });
    actions.push({
      id: 'buy:betterLine',
      label: t('buyBetterLine'),
      variant: 'future',
      disabled: Boolean(state.purchased.betterLine),
    });
    actions.push({
      id: 'buy:simpleFloat',
      label: t('buySimpleFloat'),
      variant: 'future',
      disabled: Boolean(state.purchased.simpleFloat),
    });
    actions.push({
      id: 'buy:bicycle',
      label: t('buyBicycle'),
      disabled: Boolean(state.purchased.bicycle),
    });
  }

  return {
    zoneId: zone.id,
    zoneLabel: getZoneLabel(zone.id),
    hint: getZoneHint(zone.id),
    actions,
    sceneActions: getSceneActions(state, zone.id),
    availableActionLabels: summarizeActions(actions),
  };
}

export function getLocationSceneContext(state, zoneId) {
  const zone = interactionZones[zoneId];
  if (!zone && !isFishingLocation(zoneId) && zoneId !== 'fishing_select') {
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
    hint: getZoneHint(zoneId),
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

  if (actionId.startsWith('select:water:')) {
    const waterId = actionId.replace('select:water:', '');
    if (canSelectWaterForFishing(state, waterId)) {
      arriveAtWater(state, waterId);
    } else {
      const location = getFishingLocation(waterId);
      pushActionLog(state, location?.access === 'bus' ? 'logNeedBusTicket' : 'logNeedBicycleForTravel');
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

function getZoneHint(zoneId) {
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

  if (zoneId === 'bus_station') {
    return t('hintBusStation');
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
        id: 'craft:stickRod',
        label: t('craftStickRod'),
        disabled: !canCraftStickRod(state),
      },
      ...(!state.tackle?.owned?.simple_stick_rod && !hasItem(state, 'stickRod') ? [{
        id: 'gather:rodStick',
        label: t('gatherRodStick'),
      }] : []),
      {
        id: 'gather:stones',
        label: t('gatherSmallStones'),
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
    ];
  }

  if (zoneId === 'garden') {
    const cooldown = getWormSearchCooldown(state);
    const featherOnCooldown = state.timers?.featherSearchPhaseKey === `${state.day}:${getTimePhase(state)}`;
    return [
      {
        id: 'search:stones',
        label: cooldown > 0 ? t('liftStonesIn', { seconds: Math.ceil(cooldown) }) : t('liftStones'),
        disabled: cooldown > 0,
      },
      {
        id: 'search:soil',
        label: !state.purchased.shovel
          ? t('needShovel')
          : cooldown > 0
            ? t('digSoilIn', { seconds: Math.ceil(cooldown) })
            : t('digSoil'),
        disabled: !state.purchased.shovel || cooldown > 0,
      },
      {
        id: 'search:compost',
        label: cooldown > 0 ? t('compostIn', { seconds: Math.ceil(cooldown) }) : t('searchCompost'),
        disabled: cooldown > 0,
      },
      ...(!state.tackle?.owned?.goose_feather_float ? [{
        id: 'search:feather',
        label: featherOnCooldown ? t('feathersTryLater') : t('searchGooseFeather'),
        disabled: featherOnCooldown,
      }] : []),
      ...(!state.tackle?.owned?.simple_stick_rod && !hasItem(state, 'stickRod') ? [{
        id: 'gather:rodStick',
        label: t('gatherRodStick'),
      }] : []),
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
        reason: available ? '' : t(location.access === 'bus' ? 'requiresBusTicket' : 'requiresBicycle'),
      };
    });
  }

  if (isFishingLocation(zoneId)) {
    const activeRig = getActiveRig(state);
    const waterActions = [
      {
        id: 'minigame:start:active',
        label: t('startActiveTackleFishing', { rig: t(activeRig.labelKey) }),
      },
      {
        id: 'minigame:start:handline',
        label: t('startHandlineFishing'),
      },
      {
        id: 'minigame:start:stickRod',
        label: t('startStickRodFishing'),
        disabled: !hasItem(state, 'stickRod') && !getTackleEffects(state).hasProperRod,
      },
      {
        id: 'minigame:start:liveBait',
        label: t('startLiveBaitFishing'),
        disabled: (!hasItem(state, 'stickRod') && !getTackleEffects(state).hasProperRod) || getFishEntries(state, 'live_bait').length === 0,
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
    bus_station: 'zoneBusStation',
    fishing_select: 'mapFishing',
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
    bus_station: 'openBusStation',
    fishing_select: 'openFishingSelect',
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
  return BICYCLE_WATER_IDS.map((waterId) => {
    const location = getFishingLocation(waterId);
    return {
      id: `travel:water:${waterId}`,
      label: state.purchased?.bicycle
        ? t('travelToWater', { destination: t(location.labelKey) })
        : t('requiresBicycle'),
      disabled: !state.purchased?.bicycle,
      variant: state.purchased?.bicycle ? 'secondary' : 'future',
    };
  });
}
