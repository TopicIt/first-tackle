import { buyShopItem, sellAllFish, sellTaranka } from './economy.js';
import {
  canCraftPrimitiveTackle,
  canCraftStickRod,
  cleanFish,
  craftPrimitiveTackle,
  craftStickRod,
  fish,
  getWormSearchCooldown,
  hangFishToDry,
  saltFish,
  searchForWorms,
  waitUntilTomorrow,
} from './fishing.js';
import { countItem, getFishCount, hasItem } from './inventory.js';
import { interactionZones } from './world.js';
import { t } from '../i18n/i18n.js';

const idleContext = {
  zoneId: null,
  actions: [],
  availableActionLabels: [],
};

export function getInteractionContext(state, playerPosition) {
  const zone = getCurrentZone(playerPosition);
  const actions = [];

  if (zone?.id === 'house' && canCraftPrimitiveTackle(state)) {
    actions.push({
      id: 'craft:tackle',
      label: t('craftTackle'),
      variant: 'secondary',
    });
  }

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
      id: 'fish',
      label: t('fish'),
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

  if (actionId === 'fish') {
    if (context.zoneId !== 'pond') {
      return;
    }
    fish(state);
  }

  if (actionId === 'fish:handline') {
    if (context.zoneId !== 'pond') {
      return;
    }
    fish(state, 'handline');
  }

  if (actionId === 'fish:stickRod') {
    if (context.zoneId !== 'pond') {
      return;
    }
    fish(state, 'stickRod');
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
        id: 'clean:fish',
        label: t('cleanFish'),
        disabled: getFishCount(state) === 0,
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
    ];
  }

  if (zoneId === 'pond') {
    return [
      {
        id: 'fish:handline',
        label: t('handline'),
      },
      {
        id: 'fish:stickRod',
        label: t('stickRodFishing'),
        disabled: !hasItem(state, 'stickRod'),
      },
      {
        id: 'fish:liveBait',
        label: t('liveBaitFishing'),
        disabled: true,
        variant: 'future',
      },
    ];
  }

  if (zoneId === 'market') {
    return [
      {
        id: 'sell:fish',
        label: t('sellFreshFish'),
        disabled: getFishCount(state) === 0,
      },
      {
        id: 'sell:taranka',
        label: t('sellTaranka'),
        disabled: countItem(state, 'taranka') === 0,
      },
      ...['shovel', 'betterLine', 'simpleFloat', 'salt', 'hooksPack'].map((itemId) => {
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
    salt: 'buySalt',
    hooksPack: 'buyHooksPack',
  };
  return t(labels[itemId] ?? itemId);
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
