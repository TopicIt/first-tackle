export const SAVE_KEY = 'first-tackle-save-v2';
export const LEGACY_SAVE_KEYS = ['first-tackle-save-v1'];
export const SAVE_VERSION = 2;
export const DEFAULT_PLAYER_NAME = '\u0406\u0432\u0430\u0441\u0438\u043a \u0422\u0435\u043b\u0435\u0441\u0438\u043a';
export const DEFAULT_AVATAR = '/assets/profile/Grandson-1.png';
export const GAME_TITLE = '\u0420\u0438\u0431\u0430\u043b\u043a\u0430 \u0440\u043e\u0434\u043e\u043c \u0437 \u0434\u0438\u0442\u0438\u043d\u0441\u0442\u0432\u0430';

export const shopItems = [
  {
    id: 'shovel',
    label: 'Shovel',
    price: 150,
    description: 'Lets you dig richer garden soil',
    type: 'tool',
    category: 'other',
  },
  {
    id: 'betterLine',
    label: 'Better line',
    price: 300,
    description: 'Reaches farther shadows and protects against line breaks',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'simpleFloat',
    label: 'Cheap float',
    price: 40,
    description: 'Basic shop float',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'properFloat',
    label: 'Proper float',
    price: 200,
    description: 'Clearer bite reading',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'properSinker',
    label: 'Proper sinker',
    price: 80,
    description: 'More stable presentation',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'smallHook',
    label: 'Small hook',
    price: 45,
    description: 'Small sharp hook for careful small fish',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'mediumHook',
    label: 'Medium hook',
    price: 90,
    description: 'Balanced hook for everyday fishing',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'largeHook',
    label: 'Large hook',
    price: 150,
    description: 'Stronger hook for bigger fish and live bait',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'sharperHook',
    label: 'Sharper hook',
    price: 100,
    description: 'Better hook-up rate',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'properRod',
    label: 'Proper rod',
    price: 800,
    description: 'Durable shop rod for larger fish',
    type: 'tool',
    category: 'tackle',
  },
  {
    id: 'salt',
    label: 'Salt',
    price: 30,
    description: 'Ten pinches for preserving cleaned fish',
    type: 'consumable',
    itemId: 'salt',
    amount: 10,
    category: 'other',
  },
  {
    id: 'baitSmallWorms',
    label: 'Small worms',
    price: 20,
    description: 'Tiny worms for careful small fish',
    type: 'consumable',
    itemId: 'smallWorms',
    amount: 25,
    category: 'bait',
  },
  {
    id: 'baitBread',
    label: 'Bread',
    price: 30,
    description: 'Soft bread bait for peaceful fish',
    type: 'consumable',
    itemId: 'bread',
    amount: 30,
    category: 'bait',
  },
  {
    id: 'baitWorms',
    label: 'Worms',
    price: 30,
    description: 'Reliable universal bait',
    type: 'consumable',
    itemId: 'worms',
    amount: 30,
    category: 'bait',
  },
  {
    id: 'baitMastyrka',
    label: 'Mastyrka',
    price: 50,
    description: 'Pea bait for crucian and carp',
    type: 'consumable',
    itemId: 'mastyrka',
    amount: 10,
    category: 'bait',
  },
  {
    id: 'baitCorn',
    label: 'Corn',
    price: 60,
    description: 'Sweet grain for larger pond fish',
    type: 'consumable',
    itemId: 'corn',
    amount: 10,
    category: 'bait',
  },
  {
    id: 'baitDough',
    label: 'Dough',
    price: 40,
    description: 'Soft dough for calm-water fish',
    type: 'consumable',
    itemId: 'dough',
    amount: 20,
    category: 'bait',
  },
  {
    id: 'baitNightcrawler',
    label: 'Nightcrawler',
    price: 50,
    description: 'Large worm for perch and catfish',
    type: 'consumable',
    itemId: 'nightcrawler',
    amount: 10,
    category: 'bait',
  },
  {
    id: 'baitLarvae',
    label: 'Larvae',
    price: 35,
    description: 'Small larvae for perch, roach-like fish and quick bites',
    type: 'consumable',
    itemId: 'larvae',
    amount: 20,
    category: 'bait',
  },
  {
    id: 'hooksPack',
    label: 'Hooks pack',
    price: 100,
    description: 'Spare hooks for later rods',
    type: 'consumable',
    itemId: 'hooksPack',
    amount: 5,
    category: 'tackle',
  },
  {
    id: 'scooter',
    label: 'Scooter',
    price: 700,
    description: 'Unlocks rides to the sluice',
    type: 'tool',
    category: 'other',
  },
  {
    id: 'bicycle',
    label: 'Used bicycle',
    price: 2000,
    description: 'Reach farther waters for about 20 trips',
    type: 'tool',
    category: 'other',
  },
  {
    id: 'betterBicycle',
    label: 'Better bicycle',
    price: 10000,
    description: 'A much sturdier bicycle for long rides',
    type: 'tool',
    category: 'other',
  },
  {
    id: 'bestBicycle',
    label: 'Best bicycle',
    price: 20000,
    description: 'Premium bicycle with practical no-worry durability',
    type: 'tool',
    category: 'other',
  },
];

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    playerProfile: {
      setupComplete: false,
      name: DEFAULT_PLAYER_NAME,
      avatar: DEFAULT_AVATAR,
      avatarType: 'preset',
      customAvatarDataUrl: null,
      selectedStarId: null,
      selectedStarColor: null,
      nameCustom: false,
      createdAt: null,
      updatedAt: null,
    },
    money: 1000,
    inventory: {
      thread: 1,
      simpleHook: 1,
      smallWorms: 0,
      worms: 5,
      larvae: 0,
      bread: 0,
      mastyrka: 0,
      corn: 0,
      dough: 0,
      nightcrawler: 0,
      primitiveTackle: 0,
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
      eel: 0,
    },
    purchased: {},
    hasSmoker: false,
    travel: {
      farWatersUnlocked: false,
      selectedWater: 'canal',
      greadaUnlocked: false,
      busStationUnlocked: false,
      boughtTickets: {},
      bicycleTier: null,
      bicycleTripsLeft: 0,
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
      firstTackleReady: false,
      starterTackleDrawerCompleted: false,
      starterTackleDrawerFoundItems: {
        oldHook: false,
        embroideryThread: false,
        stoneSinker: false,
        gooseFeatherFloat: false,
      },
      firstCatchDone: false,
      firstCrucianCatchRewardShown: false,
      uahEconomyStarted: true,
      profileSetupComplete: false,
      grandmaTrust: {
        canadianCatfishCaught: 0,
        required: 5,
      },
    },
    tutorialState: {
      promptDismissed: false,
      started: false,
      completed: false,
      skipped: false,
      step: 0,
    },
    seenEvents: {
      introResolved: false,
      introWatched: false,
      introSkipped: false,
      firstCrucianVideoShown: false,
    },
    stats: {
      totalFishCaught: 0,
      biggestFishWeight: 0,
      biggestFishSpecies: null,
      biggestFishCaughtAtDay: null,
      biggestFishCaughtAtTime: null,
    },
    catchJournal: {},
    trophies: [],
    achievements: {
      trophyBySpecies: {},
      claimedTrophyRewards: {},
      completedSpeciesStars: {},
      unlockedStars: [],
    },
    quests: {
      claimed: {},
    },
    tackle: {
      activeRig: null,
      owned: {
        none: true,
      },
      equipped: {
        line: 'none',
        hook: 'none',
        sinker: 'none',
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
        lastDepth: 'middle',
      },
      transitions: {
        enabled: true,
        explicit: false,
      },
      performance: {
        lowPower: null,
      },
      animationLimits: {
        counts: {},
      },
      intro: {
        showOnStartup: true,
      },
    },
    audioQueue: [],
    ui: {
      activeScene: null,
      selectedHotspot: null,
      mapHotspotsHidden: false,
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
        quests: true,
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
      startupStep: 'loading',
      activeSubMap: null,
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
      eel: { multiplier: 1.18, trend: 'rising' },
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
