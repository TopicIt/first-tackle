import { getPlayerState } from './playerState.js';
import { shopItems } from './state.js';

const EFFECT_DEFAULTS = {
  fishSizeMultiplier: 1,
  trophyChanceBonus: 0,
  biteChanceBonus: 0,
  escapeChanceMultiplier: 1,
};

export function getItemEffects(itemId) {
  return shopItems.find((item) => item.id === itemId)?.effects ?? [];
}

export function getVisibleItemEffects(item) {
  return Array.isArray(item?.effects) ? item.effects.filter((effect) => effect?.label) : [];
}

export function getActiveItemModifiers(state) {
  const playerState = getPlayerState(state);
  const equipped = playerState.inventory?.tackle?.equipped ?? {};
  const purchased = playerState.inventory?.equipment ?? {};
  const activeItemIds = new Set();

  for (const key of Object.values(equipped)) {
    if (key && key !== 'none') {
      activeItemIds.add(normalizeEquipmentItemId(key));
    }
  }

  for (const [itemId, owned] of Object.entries(purchased)) {
    if (owned && isPassiveUtilityItem(itemId)) {
      activeItemIds.add(itemId);
    }
  }

  const modifiers = { ...EFFECT_DEFAULTS };
  const activeEffects = [];

  for (const itemId of activeItemIds) {
    const item = shopItems.find((entry) => entry.id === itemId);
    for (const effect of item?.effects ?? []) {
      applyEffect(modifiers, effect);
      activeEffects.push({
        itemId,
        type: effect.type,
        value: effect.value,
        label: effect.label,
      });
    }
  }

  modifiers.fishSizeMultiplier = clamp(modifiers.fishSizeMultiplier, 0.9, 1.2);
  modifiers.trophyChanceBonus = clamp(modifiers.trophyChanceBonus, 0, 0.08);
  modifiers.biteChanceBonus = clamp(modifiers.biteChanceBonus, 0, 0.12);
  modifiers.escapeChanceMultiplier = clamp(modifiers.escapeChanceMultiplier, 0.75, 1.1);

  return {
    ...modifiers,
    activeEffects,
    activeItemIds: [...activeItemIds],
  };
}

function applyEffect(modifiers, effect) {
  if (!effect?.type) {
    return;
  }

  if (effect.type === 'fishSizeMultiplier') {
    modifiers.fishSizeMultiplier *= 1 + Number(effect.value ?? 0);
    return;
  }

  if (effect.type === 'escapeChanceMultiplier') {
    modifiers.escapeChanceMultiplier *= 1 + Number(effect.value ?? 0);
    return;
  }

  if (effect.type === 'trophyChanceBonus' || effect.type === 'biteChanceBonus') {
    modifiers[effect.type] += Number(effect.value ?? 0);
  }
}

function isPassiveUtilityItem(itemId) {
  return ['shovel', 'scooter', 'bicycle', 'betterBicycle', 'bestBicycle'].includes(itemId);
}

function normalizeEquipmentItemId(componentId) {
  const aliases = {
    better_line: 'betterLine',
    cheap_float: 'simpleFloat',
    proper_float: 'properFloat',
    proper_sinker: 'properSinker',
    small_hook: 'smallHook',
    medium_hook: 'mediumHook',
    large_hook: 'largeHook',
    sharper_hook: 'sharperHook',
    proper_rod: 'properRod',
  };

  return aliases[componentId] ?? componentId;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
