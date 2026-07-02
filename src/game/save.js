import {
  LEGACY_SAVE_KEYS,
  SAVE_KEY,
  SAVE_VERSION,
  createInitialMarketState,
  createInitialState,
} from './state.js';
import { ensureFishState } from './fishInventory.js';
import { ensureMarketState } from './market.js';
import { ensureTackleState } from './tackle.js';
import { ensureStarterTackleDrawerState } from './starterTackleDrawer.js';
import { normalizeWaterId } from './locations.js';
import { ensureProfileState } from './profile.js';

export function saveGame(state) {
  const serializableState = cleanForSave(state);
  localStorage.setItem(SAVE_KEY, JSON.stringify(serializableState));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY)
    ?? LEGACY_SAVE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) {
    return null;
  }

  try {
    const migrated = migrateSave(JSON.parse(raw));
    const merged = normalizeLoadedState(migrated);
    if (migrated.version !== SAVE_VERSION) {
      saveGame(merged);
    }
    return merged;
  } catch {
    return null;
  }
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  for (const key of LEGACY_SAVE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function backupLocalSave(label = 'manual') {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return false;
  }

  localStorage.setItem(`${SAVE_KEY}-backup-${label}`, JSON.stringify({
    createdAt: new Date().toISOString(),
    saveKey: SAVE_KEY,
    raw,
  }));
  return true;
}

export function exportSave(state) {
  return JSON.stringify({
    game: 'first-tackle',
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    save: cleanForSave(state),
  }, null, 2);
}

export function importSave(rawText) {
  const parsed = JSON.parse(rawText);
  const save = parsed?.save && typeof parsed.save === 'object' ? parsed.save : parsed;
  const merged = normalizeLoadedState(migrateSave(save));
  saveGame(merged);
  return merged;
}

function cleanForSave(state) {
  return {
    ...state,
    version: SAVE_VERSION,
    audioQueue: [],
    feedback: [],
    ui: {
      ...state.ui,
      activeScene: null,
      catchResult: null,
      fishingMinigame: null,
      starterTackleDrawerOpen: false,
      starterTackleDrawerMessage: null,
      locationTransition: null,
      activeSubMap: null,
      cloudSave: null,
    },
  };
}

function normalizeLoadedState(saved) {
  const merged = mergeState(createInitialState(), saved);
  ensureFishState(merged);
  ensureMarketState(merged);
  ensureTackleState(merged);
  ensureStarterTackleDrawerState(merged);
  ensureProfileState(merged);
  return merged;
}

function migrateSave(saved) {
  const input = saved && typeof saved === 'object' ? saved : {};
  const version = Number(input.version ?? 1);
  const migrated = version < 2 ? migrateV1ToV2(input) : input;
  return {
    ...migrated,
    version: SAVE_VERSION,
  };
}

function migrateV1ToV2(saved) {
  const initial = createInitialState();
  const hadStarterTackle = (saved.inventory?.primitiveTackle ?? 0) > 0 || saved.progress?.firstTackleReady !== false;
  const catfishCaught = saved.progress?.grandmaTrust?.canadianCatfishCaught
    ?? saved.catchJournal?.canadian_catfish?.totalCaught
    ?? 0;

  return {
    ...saved,
    playerProfile: {
      ...initial.playerProfile,
      ...(saved.playerProfile ?? {}),
      setupComplete: Boolean(saved.playerProfile?.setupComplete ?? saved.progress?.profileSetupComplete ?? true),
    },
    progress: {
      ...initial.progress,
      ...(saved.progress ?? {}),
      profileSetupComplete: Boolean(saved.progress?.profileSetupComplete ?? saved.playerProfile?.setupComplete ?? true),
      firstTackleReady: Boolean(saved.progress?.firstTackleReady ?? hadStarterTackle),
      grandmaTrust: {
        canadianCatfishCaught: catfishCaught,
        required: 5,
      },
    },
    tutorialState: {
      ...initial.tutorialState,
      ...(saved.tutorialState ?? {}),
      promptDismissed: true,
      completed: Boolean(saved.tutorialState?.completed ?? hadStarterTackle),
    },
    seenEvents: {
      ...initial.seenEvents,
      ...(saved.seenEvents ?? {}),
      introResolved: Boolean(saved.seenEvents?.introResolved ?? true),
      introSkipped: Boolean(saved.seenEvents?.introSkipped ?? true),
      firstCrucianVideoShown: Boolean(saved.seenEvents?.firstCrucianVideoShown ?? saved.progress?.firstCrucianCatchRewardShown),
    },
  };
}

function mergeState(base, saved) {
  const profileSetupComplete = Boolean(saved.playerProfile?.setupComplete ?? saved.progress?.profileSetupComplete);
  const drawerCompleted = Boolean(saved.progress?.starterTackleDrawerCompleted);
  const firstTackleReady = Boolean(saved.progress?.firstTackleReady ?? drawerCompleted);
  const catfishCaught = Math.max(
    saved.progress?.grandmaTrust?.canadianCatfishCaught ?? 0,
    saved.catchJournal?.canadian_catfish?.totalCaught ?? 0,
  );

  return {
    ...base,
    ...saved,
    version: SAVE_VERSION,
    playerProfile: {
      ...base.playerProfile,
      ...(saved.playerProfile ?? {}),
      name: saved.playerProfile?.name ?? saved.playerProfile?.playerName ?? base.playerProfile.name,
      playerName: saved.playerProfile?.playerName ?? saved.playerProfile?.name ?? base.playerProfile.playerName,
      avatar: saved.playerProfile?.avatar ?? saved.playerProfile?.avatarId ?? base.playerProfile.avatar,
      avatarId: saved.playerProfile?.avatarId ?? saved.playerProfile?.avatar ?? base.playerProfile.avatarId,
      avatarType: saved.playerProfile?.avatarType ?? (saved.playerProfile?.customAvatarDataUrl ? 'custom' : 'preset'),
      customAvatarDataUrl: saved.playerProfile?.customAvatarDataUrl ?? null,
      selectedStarId: saved.playerProfile?.selectedStarId ?? null,
      selectedStarColor: saved.playerProfile?.selectedStarColor ?? null,
      setupComplete: profileSetupComplete,
    },
    money: resolveLoadedMoney(base, saved),
    inventory: {
      ...base.inventory,
      ...(saved.inventory ?? {}),
      primitiveTackle: firstTackleReady ? Math.max(1, saved.inventory?.primitiveTackle ?? 0) : (saved.inventory?.primitiveTackle ?? 0),
    },
    timers: {
      ...base.timers,
      ...(saved.timers ?? {}),
    },
    settings: {
      ...base.settings,
      ...(saved.settings ?? {}),
      audio: {
        ...base.settings.audio,
        ...(saved.settings?.audio ?? {}),
      },
      fishing: {
        ...base.settings.fishing,
        ...(saved.settings?.fishing ?? {}),
      },
      transitions: {
        ...base.settings.transitions,
        ...(saved.settings?.transitions ?? {}),
      },
      performance: {
        ...base.settings.performance,
        ...(saved.settings?.performance ?? {}),
      },
      animationLimits: {
        ...base.settings.animationLimits,
        ...(saved.settings?.animationLimits ?? {}),
        counts: {
          ...base.settings.animationLimits.counts,
          ...(saved.settings?.animationLimits?.counts ?? {}),
        },
      },
      intro: {
        ...base.settings.intro,
        ...(saved.settings?.intro ?? {}),
      },
      viewMode: saved.settings?.viewMode ?? base.settings.viewMode,
    },
    purchased: {
      ...base.purchased,
      ...(saved.purchased ?? {}),
    },
    hasSmoker: Boolean(saved.hasSmoker ?? saved.purchased?.smoker ?? base.hasSmoker),
    travel: {
      ...base.travel,
      ...(saved.travel ?? {}),
      farWatersUnlocked: Boolean(saved.travel?.farWatersUnlocked ?? saved.purchased?.bicycle ?? base.travel.farWatersUnlocked),
      greadaUnlocked: Boolean(saved.travel?.greadaUnlocked ?? saved.travel?.farWatersUnlocked ?? saved.purchased?.bicycle ?? base.travel.greadaUnlocked),
      busStationUnlocked: Boolean(saved.travel?.busStationUnlocked ?? catfishCaught >= 5),
      boughtTickets: {
        ...base.travel.boughtTickets,
        ...(saved.travel?.boughtTickets ?? {}),
      },
      bicycleTier: saved.travel?.bicycleTier
        ?? (saved.purchased?.bestBicycle ? 'best' : saved.purchased?.betterBicycle ? 'better' : saved.purchased?.bicycle ? 'used' : base.travel.bicycleTier),
      bicycleTripsLeft: saved.travel?.bicycleTripsLeft
        ?? (saved.purchased?.bestBicycle ? 9999 : saved.purchased?.betterBicycle ? 120 : saved.purchased?.bicycle ? 20 : base.travel.bicycleTripsLeft),
      selectedWater: normalizeWaterId(saved.travel?.selectedWater ?? base.travel.selectedWater),
      visitedWaters: {
        ...base.travel.visitedWaters,
        ...(saved.travel?.visitedWaters ?? {}),
        canal: true,
        ...(saved.travel?.selectedWater ? { [normalizeWaterId(saved.travel.selectedWater)]: true } : {}),
      },
    },
    quests: {
      ...base.quests,
      ...(saved.quests ?? {}),
      claimed: {
        ...base.quests.claimed,
        ...(saved.quests?.claimed ?? {}),
      },
    },
    market: mergeMarketState(saved.market, base.day),
    time: {
      ...base.time,
      ...(saved.time ?? {}),
    },
    day: saved.day ?? base.day,
    player: {
      ...base.player,
      ...(saved.player ?? {}),
    },
    fishBasket: Array.isArray(saved.fishBasket) ? saved.fishBasket : base.fishBasket,
    progress: {
      ...base.progress,
      ...(saved.progress ?? {}),
      profileSetupComplete,
      firstTackleReady,
      starterTackleDrawerCompleted: drawerCompleted,
      starterTackleDrawerFoundItems: {
        ...base.progress.starterTackleDrawerFoundItems,
        ...(saved.progress?.starterTackleDrawerFoundItems ?? {}),
      },
      firstCatchDone: Boolean(saved.progress?.firstCatchDone ?? saved.stats?.totalFishCaught > 0),
      firstCrucianCatchRewardShown: Boolean(saved.progress?.firstCrucianCatchRewardShown),
      uahEconomyStarted: true,
      grandmaTrust: {
        ...base.progress.grandmaTrust,
        ...(saved.progress?.grandmaTrust ?? {}),
        canadianCatfishCaught: catfishCaught,
      },
    },
    tutorialState: {
      ...base.tutorialState,
      ...(saved.tutorialState ?? {}),
      completed: Boolean(saved.tutorialState?.completed ?? firstTackleReady),
    },
    seenEvents: {
      ...base.seenEvents,
      ...(saved.seenEvents ?? {}),
    },
    stats: {
      ...base.stats,
      ...(saved.stats ?? {}),
      totalFishCaught: Math.max(
        saved.stats?.totalFishCaught ?? 0,
        saved.progress?.firstCatchDone ? 1 : 0,
      ),
      biggestFishWeight: Math.max(0, saved.stats?.biggestFishWeight ?? 0),
      biggestFishSpecies: saved.stats?.biggestFishSpecies ?? null,
      biggestFishCaughtAtDay: saved.stats?.biggestFishCaughtAtDay ?? null,
      biggestFishCaughtAtTime: saved.stats?.biggestFishCaughtAtTime ?? null,
    },
    catchJournal: {
      ...base.catchJournal,
      ...(saved.catchJournal ?? {}),
    },
    trophies: Array.isArray(saved.trophies) ? saved.trophies : base.trophies,
    achievements: {
      ...base.achievements,
      ...(saved.achievements ?? {}),
      trophyBySpecies: {
        ...base.achievements.trophyBySpecies,
        ...(saved.achievements?.trophyBySpecies ?? {}),
      },
      claimedTrophyRewards: {
        ...base.achievements.claimedTrophyRewards,
        ...(saved.achievements?.claimedTrophyRewards ?? {}),
      },
      completedSpeciesStars: {
        ...base.achievements.completedSpeciesStars,
        ...(saved.achievements?.completedSpeciesStars ?? {}),
      },
      unlockedStars: Array.isArray(saved.achievements?.unlockedStars)
        ? saved.achievements.unlockedStars
        : base.achievements.unlockedStars,
    },
    tackle: {
      activeRig: saved.tackle?.activeRig ?? base.tackle.activeRig,
      migratedLegacyRig: Boolean(saved.tackle?.migratedLegacyRig ?? base.tackle.migratedLegacyRig),
      owned: {
        ...base.tackle.owned,
        ...(saved.tackle?.owned ?? {}),
      },
      equipped: {
        ...base.tackle.equipped,
        ...(saved.tackle?.equipped ?? {}),
      },
    },
    ui: {
      ...base.ui,
      ...(saved.ui ?? {}),
      collapsedPanels: {
        ...base.ui.collapsedPanels,
        ...(saved.ui?.collapsedPanels ?? {}),
      },
      expandedKeepnetSpecies: {
        ...base.ui.expandedKeepnetSpecies,
        ...(saved.ui?.expandedKeepnetSpecies ?? {}),
      },
      expandedMarketSpecies: {
        ...base.ui.expandedMarketSpecies,
        ...(saved.ui?.expandedMarketSpecies ?? {}),
      },
      mapViewerZoom: clampNumber(saved.ui?.mapViewerZoom, 1, 2.4, base.ui.mapViewerZoom),
      locationTransition: null,
      activeSubMap: null,
    },
    feedback: Array.isArray(saved.feedback) ? saved.feedback.slice(0, 4) : base.feedback,
    log: Array.isArray(saved.log) ? saved.log.slice(0, 6) : base.log,
  };
}

function resolveLoadedMoney(base, saved) {
  const savedMoney = saved.money ?? base.money;
  if (savedMoney === 0 && isFreshBrokenZeroMoneySave(base, saved)) {
    return base.money;
  }

  return saved.progress?.uahEconomyStarted
    ? savedMoney
    : Math.max(savedMoney, base.money);
}

function isFreshBrokenZeroMoneySave(base, saved) {
  const stats = saved.stats ?? {};
  if ((stats.totalFishCaught ?? 0) > 0 || (stats.biggestFishWeight ?? 0) > 0) {
    return false;
  }

  if ((saved.day ?? 1) > 1 || (saved.trophies ?? []).length > 0 || (saved.fishBasket ?? []).length > 0) {
    return false;
  }

  if (Object.values(saved.purchased ?? {}).some(Boolean) || Object.values(saved.quests?.claimed ?? {}).some(Boolean)) {
    return false;
  }

  const catchJournal = saved.catchJournal ?? {};
  if (Object.values(catchJournal).some((entry) => (entry?.totalCaught ?? 0) > 0)) {
    return false;
  }

  const starterAllowance = new Set(['thread', 'simpleHook', 'worms', 'primitiveTackle', 'stickRod']);
  const baseInventory = base.inventory ?? {};
  for (const [itemId, count] of Object.entries(saved.inventory ?? {})) {
    const allowedStarterCount = itemId === 'worms'
      ? Math.max(baseInventory.worms ?? 0, 5)
      : baseInventory[itemId] ?? 0;
    if (!starterAllowance.has(itemId) && count > allowedStarterCount) {
      return false;
    }
  }

  return true;
}

function mergeMarketState(savedMarket, day) {
  const baseMarket = createInitialMarketState();
  return {
    ...baseMarket,
    ...(savedMarket ?? {}),
    day: savedMarket?.day ?? day ?? baseMarket.day,
    prices: {
      ...baseMarket.prices,
      ...(savedMarket?.prices ?? {}),
    },
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}
