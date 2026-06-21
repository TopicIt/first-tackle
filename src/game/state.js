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
    price: 48,
    description: 'Reaches farther shadows and protects against line breaks',
    type: 'tool',
  },
  {
    id: 'simpleFloat',
    label: 'Cheap float',
    price: 18,
    description: 'Basic shop float',
    type: 'tool',
  },
  {
    id: 'properFloat',
    label: 'Proper float',
    price: 28,
    description: 'Clearer bite reading',
    type: 'tool',
  },
  {
    id: 'properSinker',
    label: 'Proper sinker',
    price: 12,
    description: 'More stable presentation',
    type: 'tool',
  },
  {
    id: 'sharperHook',
    label: 'Sharper hook',
    price: 22,
    description: 'Better hook-up rate',
    type: 'tool',
  },
  {
    id: 'properRod',
    label: 'Proper rod',
    price: 96,
    description: 'Durable shop rod for larger fish',
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
    id: 'baitBread',
    label: 'Bread',
    price: 4,
    description: 'Soft bread bait for peaceful fish',
    type: 'consumable',
    itemId: 'bread',
    amount: 4,
  },
  {
    id: 'baitWorms',
    label: 'Worms',
    price: 5,
    description: 'Reliable universal bait',
    type: 'consumable',
    itemId: 'worms',
    amount: 4,
  },
  {
    id: 'baitMastyrka',
    label: 'Mastyrka',
    price: 7,
    description: 'Pea bait for crucian and carp',
    type: 'consumable',
    itemId: 'mastyrka',
    amount: 3,
  },
  {
    id: 'baitCorn',
    label: 'Corn',
    price: 8,
    description: 'Sweet grain for larger pond fish',
    type: 'consumable',
    itemId: 'corn',
    amount: 3,
  },
  {
    id: 'baitDough',
    label: 'Dough',
    price: 6,
    description: 'Soft dough for calm-water fish',
    type: 'consumable',
    itemId: 'dough',
    amount: 3,
  },
  {
    id: 'baitNightcrawler',
    label: 'Nightcrawler',
    price: 9,
    description: 'Large worm for perch and catfish',
    type: 'consumable',
    itemId: 'nightcrawler',
    amount: 2,
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
  {
    id: 'bicycle',
    label: 'Bicycle',
    price: 150,
    description: 'Reach farther waters',
    type: 'tool',
  },
];

export function createInitialState() {
  return {
    money: 0,
    inventory: {
      thread: 1,
      simpleHook: 1,
      worms: 2,
      larvae: 0,
      bread: 0,
      mastyrka: 0,
      corn: 0,
      dough: 0,
      nightcrawler: 0,
      primitiveTackle: 1,
      stickRod: 0,
      cleanedFish: 0,
      saltedFish: 0,
      dryingFish: 0,
      taranka: 0,
      smokedFish: 0,
      salt: 0,
      hooksPack: 0,
      rotan: 0,
      crucian: 0,
      bleak: 0,
      roach: 0,
      rudd: 0,
      loach: 0,
      pike: 0,
      okun: 0,
      lynok: 0,
      sudak: 0,
      som: 0,
      canadian_catfish: 0,
      carp: 0,
      grass_carp: 0,
      silver_carp: 0,
      white_bream: 0,
      bream: 0,
      plotytsia: 0,
      gudgeon: 0,
    },
    purchased: {},
    hasSmoker: false,
    travel: {
      farWatersUnlocked: false,
      selectedWater: 'canal',
      greadaUnlocked: false,
      visitedWaters: {
        canal: true,
      },
    },
    market: createInitialMarketState(),
    timers: {
      wormSearchReadyAt: 0,
      featherSearchPhaseKey: null,
    },
    day: 1,
    time: {
      minutes: 7 * 60,
    },
    player: {
      x: -6,
      z: 1.5,
    },
    fishBasket: [],
    progress: {
      firstTackleReady: true,
      firstCatchDone: false,
      firstCrucianCatchRewardShown: false,
    },
    stats: {
      totalFishCaught: 0,
    },
    catchJournal: {},
    trophies: [],
    achievements: {
      trophyBySpecies: {},
    },
    tackle: {
      activeRig: 'handline',
      owned: {
        grandma_thread: true,
        old_dull_hook: true,
        small_stone: true,
        none: true,
      },
      equipped: {
        line: 'grandma_thread',
        hook: 'old_dull_hook',
        sinker: 'small_stone',
        float: 'none',
        rod: 'none',
      },
    },
    settings: {
      viewMode: 'auto',
      audio: {
        soundEnabled: true,
        musicEnabled: true,
        sfxVolume: 0.72,
        musicVolume: 0.45,
        musicTrackId: 'ambient_day',
        musicMode: 'fixed',
      },
      fishing: {
        biteHints: 'subtle',
      },
      transitions: {
        enabled: true,
        explicit: false,
      },
    },
    audioQueue: [],
    ui: {
      activeScene: null,
      selectedHotspot: null,
      catchResult: null,
      fishingMinigame: null,
      collapsedPanels: {
        status: false,
        inventory: true,
        keepnet: true,
        journal: true,
        tackle: true,
        guide: true,
        achievements: true,
        mapViewer: true,
        settings: true,
        fishingControls: true,
        fishingResult: true,
      },
      expandedKeepnetSpecies: {},
      expandedMarketSpecies: {},
      guideTab: 'fish',
      marketTab: 'sell',
      mapViewerZoom: 1,
      locationTransition: null,
      transitionVisits: {},
    },
    feedback: [],
    log: [],
  };
}

export function createInitialMarketState() {
  return {
    day: 1,
    prices: {
      rotan: { multiplier: 1, trend: 'stable' },
      crucian: { multiplier: 1, trend: 'rising' },
      bleak: { multiplier: 1, trend: 'stable' },
      roach: { multiplier: 1, trend: 'falling' },
      rudd: { multiplier: 1, trend: 'rising' },
      loach: { multiplier: 1.08, trend: 'stable' },
      pike: { multiplier: 1.12, trend: 'rising' },
      okun: { multiplier: 1.04, trend: 'stable' },
      lynok: { multiplier: 1.12, trend: 'rising' },
      sudak: { multiplier: 1.16, trend: 'rising' },
      som: { multiplier: 1.2, trend: 'rising' },
      canadian_catfish: { multiplier: 1.18, trend: 'rising' },
      carp: { multiplier: 1.18, trend: 'rising' },
      grass_carp: { multiplier: 1.24, trend: 'rising' },
      silver_carp: { multiplier: 1.24, trend: 'rising' },
      white_bream: { multiplier: 1.04, trend: 'stable' },
      bream: { multiplier: 1.12, trend: 'rising' },
      plotytsia: { multiplier: 1, trend: 'stable' },
      gudgeon: { multiplier: 1, trend: 'stable' },
    },
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
  const createdAt = Date.now();
  const latest = state.feedback?.[0];
  const sameMessage = latest && latest.key === key && latest.type === type
    && JSON.stringify(latest.params ?? {}) === JSON.stringify(params ?? {});

  if (sameMessage && createdAt - (latest.createdAt ?? 0) < 500) {
    return;
  }

  state.feedback = [
    {
      id: `${createdAt}-${Math.random().toString(16).slice(2)}`,
      key,
      params,
      type,
      createdAt,
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
