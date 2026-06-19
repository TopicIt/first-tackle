export const SAVE_KEY = 'first-tackle-save-v1';

export const shopItems = [
  {
    id: 'shovel',
    label: 'Shovel',
    price: 16,
    description: 'Lets you dig richer garden soil',
    type: 'tool',
  },
  {
    id: 'betterLine',
    label: 'Better line',
    price: 24,
    description: 'Future upgrade',
    type: 'tool',
  },
  {
    id: 'simpleFloat',
    label: 'Simple float',
    price: 18,
    description: 'Future upgrade',
    type: 'tool',
  },
  {
    id: 'salt',
    label: 'Salt',
    price: 6,
    description: 'Three pinches for preserving cleaned fish',
    type: 'consumable',
    itemId: 'salt',
    amount: 3,
  },
  {
    id: 'hooksPack',
    label: 'Hooks pack',
    price: 10,
    description: 'Spare hooks for later rods',
    type: 'consumable',
    itemId: 'hooksPack',
    amount: 5,
  },
];

export function createInitialState() {
  return {
    money: 0,
    inventory: {
      thread: 1,
      simpleHook: 1,
      worms: 0,
      larvae: 0,
      primitiveTackle: 0,
      stickRod: 0,
      cleanedFish: 0,
      saltedFish: 0,
      dryingFish: 0,
      taranka: 0,
      salt: 0,
      hooksPack: 0,
      rotan: 0,
      crucian: 0,
      bleak: 0,
      roach: 0,
      rudd: 0,
      loach: 0,
      pike: 0,
    },
    purchased: {},
    timers: {
      wormSearchReadyAt: 0,
    },
    day: 1,
    player: {
      x: -6,
      z: 1.5,
    },
    fishBasket: [],
    settings: {
      audio: {
        soundEnabled: true,
        musicEnabled: true,
        sfxVolume: 0.72,
        musicVolume: 0.45,
      },
    },
    audioQueue: [],
    ui: {
      activeScene: null,
      selectedHotspot: null,
      catchResult: null,
      fishingMinigame: null,
    },
    feedback: [],
    log: [],
  };
}

export function pushLog(state, key, params = {}) {
  const entry = { key, params, createdAt: Date.now(), count: 1 };
  const latest = state.log?.[0];
  const sameMessage = latest && typeof latest === 'object' && latest.key === key
    && JSON.stringify(latest.params ?? {}) === JSON.stringify(params ?? {});

  if (sameMessage && entry.createdAt - latest.createdAt < 1000) {
    state.log = [{ ...latest, count: (latest.count ?? 1) + 1, createdAt: entry.createdAt }, ...state.log.slice(1)];
    return;
  }

  state.log = [entry, ...(state.log ?? [])].slice(0, 6);
}

export function pushFeedback(state, key, params = {}, type = 'item') {
  state.feedback = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      key,
      params,
      type,
    },
    ...(state.feedback ?? []),
  ].slice(0, 4);
}

export function nowSeconds() {
  return Date.now() / 1000;
}

export function queueSound(state, soundId) {
  state.audioQueue = [...(state.audioQueue ?? []), soundId].slice(-12);
}
