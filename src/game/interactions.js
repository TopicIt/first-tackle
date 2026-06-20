import { buyShopItem, sellAllFish, sellTaranka } from './economy.js';
import {
  countFishByStatus,
  getFishEntries,
} from './fishInventory.js';
import {
  canCraftPrimitiveTackle,
  canCraftStickRod,
  cleanFish,
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
import { countItem, hasItem } from './inventory.js';
import { interactionZones } from './world.js';
import { getTimePhase } from './time.js';
import { getTackleEffects } from './tackle.js';
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

  if (zone.id === 'pond') {
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
  if (!zone) {
    return {
      ...idleContext,
      zoneLabel: t('roadsideVillage'),
      hint: t('roadsideHint'),
      sceneActions: [],
    };
  }

  const actions = [getOpenSceneAction(zoneId)];

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

  if (actionId === 'sell:taranka') {
    if (context.zoneId !== 'market') {
      return;
    }
    sellTaranka(state);
  }

  if (actionId.startsWith('buy:')) {
    if (context.zoneId !== 'market') {
      return;
    }
    buyShopItem(state, actionId.replace('buy:', ''));
  }

  if (actionId === 'travel:farther') {
    if (!state.purchased.bicycle) {
      pushTravelLog(state, 'logNeedBicycleForTravel');
      return;
    }
    state.travel ??= {};
    state.travel.farWatersUnlocked = true;
    state.travel.greadaUnlocked = true;
    pushTravelLog(state, 'logTravelWatersUnlocked');
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

  if (zoneId === 'pond') {
    return t('hintPond');
  }

  if (zoneId === 'market') {
    return t('hintMarket');
  }

  return t('roadsideHint');
}

function getSceneActions(state, zoneId) {
  if (zoneId === 'house') {
    return [
      {
        id: 'craft:tackle',
        label: t('craftPrimitiveTackle'),
        disabled: !canCraftPrimitiveTackle(state),
      },
      {
        id: 'craft:stickRod',
        label: t('craftStickRod'),
        disabled: !canCraftStickRod(state),
      },
      {
        id: 'gather:rodStick',
        label: t('gatherRodStick'),
      },
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
      {
        id: 'search:feather',
        label: featherOnCooldown ? t('feathersTryLater') : t('searchGooseFeather'),
        disabled: featherOnCooldown,
      },
      {
        id: 'gather:rodStick',
        label: t('gatherRodStick'),
      },
    ];
  }

  if (zoneId === 'pond') {
    return [
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
      {
        id: 'travel:farther',
        label: state.purchased.bicycle ? t('travelFarther') : t('buyBicycleToReachWaters'),
        disabled: !state.purchased.bicycle,
        variant: state.purchased.bicycle ? 'secondary' : 'future',
      },
    ];
  }

  if (zoneId === 'market') {
    return [
      {
        id: 'sell:fish',
        label: t('sellFreshFish'),
        disabled: countFishByStatus(state, 'fresh') === 0,
      },
      {
        id: 'sell:taranka',
        label: t('sellTaranka'),
        disabled: countItem(state, 'taranka') === 0,
      },
      ...['shovel', 'betterLine', 'simpleFloat', 'properFloat', 'properSinker', 'sharperHook', 'properRod', 'bicycle', 'salt', 'hooksPack'].map((itemId) => {
        const item = state.purchased[itemId];
        return {
          id: `buy:${itemId}`,
          label: getBuyLabel(itemId),
          disabled: Boolean(item) && !['salt', 'hooksPack'].includes(itemId),
          variant: ['betterLine', 'simpleFloat'].includes(itemId) ? 'future' : undefined,
        };
      }),
    ];
  }

  return [];
}

function getBuyLabel(itemId) {
  const labels = {
    shovel: 'buyShovel',
    betterLine: 'buyBetterLine',
    simpleFloat: 'buySimpleFloat',
    properFloat: 'buyProperFloat',
    properSinker: 'buyProperSinker',
    sharperHook: 'buySharperHook',
    properRod: 'buyProperRod',
    bicycle: 'buyBicycle',
    salt: 'buySalt',
    hooksPack: 'buyHooksPack',
  };
  return t(labels[itemId] ?? itemId);
}

function pushTravelLog(state, key) {
  state.log = [{ key, params: {}, createdAt: Date.now(), count: 1 }, ...(state.log ?? [])].slice(0, 6);
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
    pond: 'zonePond',
    market: 'zoneMarket',
  };
  return t(labels[zoneId] ?? 'roadsideVillage');
}

function getOpenSceneAction(zoneId) {
  const labels = {
    house: 'openHouse',
    garden: 'openGarden',
    pond: 'openPond',
    market: 'openMarket',
  };

  return {
    id: `open:${zoneId}`,
    label: t(labels[zoneId] ?? 'actions'),
    variant: 'scene',
  };
}
