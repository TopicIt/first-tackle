import { addItem } from './inventory.js';
import { ensureTackleState, ownTackleComponent } from './tackle.js';
import { pushFeedback, pushLog, queueSound } from './state.js';

export const drawerItemOrder = ['oldHook', 'embroideryThread', 'stoneSinker', 'gooseFeatherFloat'];

export const drawerItems = {
  oldHook: {
    labelKey: 'drawerItemOldHook',
    foundKey: 'drawerFoundOldHook',
    componentId: 'old_dull_hook',
    slot: 'hook',
  },
  embroideryThread: {
    labelKey: 'drawerItemEmbroideryThread',
    foundKey: 'drawerFoundEmbroideryThread',
    componentId: 'grandma_thread',
    slot: 'line',
  },
  stoneSinker: {
    labelKey: 'drawerItemStoneSinker',
    foundKey: 'drawerFoundStoneSinker',
    componentId: 'small_stone',
    slot: 'sinker',
  },
  gooseFeatherFloat: {
    labelKey: 'drawerItemGooseFeatherFloat',
    foundKey: 'drawerFoundGooseFeatherFloat',
    componentId: 'goose_feather_float',
    slot: 'float',
  },
};

export const drawerClutter = [
  { id: 'button', labelKey: 'drawerJunkButton', mark: 'o', image: '/assets/minigames/grandma-drawer/items/old-button.png', x: 14, y: 22, drawer: 0 },
  { id: 'oldKey', labelKey: 'drawerJunkOldKey', mark: '?', image: '/assets/minigames/grandma-drawer/items/old-key.png', x: 54, y: 18, drawer: 0 },
  { id: 'paper', labelKey: 'drawerJunkPaper', mark: '~', x: 78, y: 36, drawer: 0 },
  { id: 'oldHook', labelKey: 'drawerItemOldHook', mark: 'J', image: '/assets/minigames/grandma-drawer/items/old-hook.png', x: 36, y: 52, drawer: 0, useful: true },
  { id: 'box', labelKey: 'drawerJunkBox', mark: '#', x: 18, y: 72, drawer: 0 },
  { id: 'matches', labelKey: 'drawerJunkMatches', mark: '=', x: 66, y: 72, drawer: 0 },
  { id: 'embroideryThread', labelKey: 'drawerItemEmbroideryThread', mark: '@', image: '/assets/minigames/grandma-drawer/items/embroidery-thread.png', x: 43, y: 28, drawer: 0, useful: true },
  { id: 'zh', labelKey: 'drawerJunkPaper', mark: 'zh', image: '/assets/minigames/grandma-drawer/items-2/zh.png', x: 82, y: 70, drawer: 0 },
  { id: 'sh', labelKey: 'drawerJunkWire', mark: 'sh', image: '/assets/minigames/grandma-drawer/items-2/sh.png', x: 28, y: 38, drawer: 0 },
  { id: 'cap', labelKey: 'drawerJunkCap', mark: 'C', image: '/assets/minigames/grandma-drawer/items/bottle-cap.png', x: 21, y: 28, drawer: 1 },
  { id: 'nail', labelKey: 'drawerJunkNail', mark: '!', x: 58, y: 24, drawer: 1 },
  { id: 'photo', labelKey: 'drawerJunkPhoto', mark: '[]', x: 82, y: 52, drawer: 1 },
  { id: 'coin', labelKey: 'drawerJunkCoin', mark: '$', x: 38, y: 72, drawer: 1 },
  { id: 'stoneSinker', labelKey: 'drawerItemStoneSinker', mark: '*', image: '/assets/minigames/grandma-drawer/items/stone-sinkers.png', x: 64, y: 62, drawer: 1, useful: true },
  { id: 'rag', labelKey: 'drawerJunkRag', mark: '~', image: '/assets/minigames/grandma-drawer/items/fabric-scrap.png', x: 14, y: 66, drawer: 1 },
  { id: 'gooseFeatherFloat', labelKey: 'drawerItemGooseFeatherFloat', mark: '/', image: '/assets/minigames/grandma-drawer/items/goose-feather-float.png', x: 42, y: 40, drawer: 1, useful: true },
  { id: 'spoon', labelKey: 'drawerJunkSpoon', mark: ')', x: 72, y: 18, drawer: 1 },
  { id: 'wire', labelKey: 'drawerJunkWire', mark: 'S', x: 26, y: 46, drawer: 0 },
  { id: 'pr', labelKey: 'drawerJunkPaper', mark: 'pr', image: '/assets/minigames/grandma-drawer/items-2/pr.png', x: 74, y: 34, drawer: 1 },
  { id: 'mo', labelKey: 'drawerJunkCoin', mark: 'mo', image: '/assets/minigames/grandma-drawer/items-2/mo.png', x: 28, y: 82, drawer: 1 },
  { id: 'gv', labelKey: 'drawerJunkNail', mark: 'gv', image: '/assets/minigames/grandma-drawer/items-2/gv.png', x: 54, y: 82, drawer: 1 },
  { id: 'gr', labelKey: 'drawerJunkRag', mark: 'gr', image: '/assets/minigames/grandma-drawer/items-2/gr.png', x: 88, y: 78, drawer: 1 },
  { id: 'g13', labelKey: 'drawerJunkBox', mark: 'g', image: '/assets/minigames/grandma-drawer/items-2/g (13).png', x: 10, y: 44, drawer: 0 },
];

export function ensureStarterTackleDrawerState(state) {
  state.progress ??= {};
  state.progress.starterTackleDrawerFoundItems = {
    oldHook: false,
    embroideryThread: false,
    stoneSinker: false,
    gooseFeatherFloat: false,
    ...(state.progress.starterTackleDrawerFoundItems ?? {}),
  };
  state.progress.starterTackleDrawerCompleted = Boolean(
    state.progress.starterTackleDrawerCompleted
      || (state.progress.firstTackleReady && hasStarterDrawerComponents(state)),
  );
}

export function hasStarterTackleDrawerCompleted(state) {
  ensureStarterTackleDrawerState(state);
  return Boolean(state.progress.starterTackleDrawerCompleted);
}

export function foundDrawerItemCount(state) {
  ensureStarterTackleDrawerState(state);
  return drawerItemOrder.filter((id) => state.progress.starterTackleDrawerFoundItems[id]).length;
}

export function findDrawerItem(state, itemId) {
  ensureStarterTackleDrawerState(state);
  const item = drawerItems[itemId];
  if (!item || state.progress.starterTackleDrawerFoundItems[itemId]) {
    return false;
  }

  state.progress.starterTackleDrawerFoundItems[itemId] = true;
  ownTackleComponent(state, item.componentId);
  pushLog(state, 'logDrawerFoundItem', { itemKey: item.labelKey });
  pushFeedback(state, item.labelKey, {}, 'item');
  queueSound(state, 'ui_click');

  if (foundDrawerItemCount(state) >= drawerItemOrder.length) {
    completeStarterTackleDrawer(state);
  }

  return true;
}

export function completeStarterTackleDrawer(state) {
  ensureStarterTackleDrawerState(state);
  if (state.progress.starterTackleDrawerCompleted) {
    return false;
  }

  for (const id of drawerItemOrder) {
    state.progress.starterTackleDrawerFoundItems[id] = true;
    ownTackleComponent(state, drawerItems[id].componentId);
  }
  ownTackleComponent(state, 'simple_stick_rod');
  addItem(state, 'primitiveTackle', Math.max(0, 1 - (state.inventory?.primitiveTackle ?? 0)));
  addItem(state, 'stickRod', Math.max(0, 1 - (state.inventory?.stickRod ?? 0)));
  equipStarterComponentIfEmpty(state, 'line', 'grandma_thread');
  equipStarterComponentIfEmpty(state, 'hook', 'old_dull_hook');
  equipStarterComponentIfEmpty(state, 'sinker', 'small_stone');
  equipStarterComponentIfEmpty(state, 'float', 'goose_feather_float');
  equipStarterComponentIfEmpty(state, 'rod', 'simple_stick_rod');
  state.progress.firstTackleReady = true;
  state.progress.starterTackleDrawerCompleted = true;
  state.tutorialState = {
    ...(state.tutorialState ?? {}),
    completed: true,
    started: true,
    promptDismissed: true,
    step: 4,
  };
  pushFeedback(state, 'feedbackTackle', {}, 'item');
  pushLog(state, 'logDrawerCompleted');
  queueSound(state, 'craft_item');
  return true;
}

function equipStarterComponentIfEmpty(state, slot, componentId) {
  ensureTackleState(state);
  const current = state.tackle.equipped?.[slot];
  if (!current || current === 'none') {
    state.tackle.equipped[slot] = componentId;
  }
}

function hasStarterDrawerComponents(state) {
  const owned = state.tackle?.owned ?? {};
  return ['grandma_thread', 'old_dull_hook', 'small_stone', 'goose_feather_float', 'simple_stick_rod']
    .every((componentId) => owned[componentId]);
}
