import { SAVE_KEY, createInitialMarketState, createInitialState } from './state.js';
import { ensureFishState } from './fishInventory.js';
import { ensureMarketState } from './market.js';
import { ensureTackleState } from './tackle.js';
import { normalizeWaterId } from './locations.js';

export function saveGame(state) {
  const serializableState = {
    ...state,
    audioQueue: [],
    feedback: [],
    ui: {
      ...state.ui,
      activeScene: null,
      catchResult: null,
      fishingMinigame: null,
    },
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(serializableState));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const merged = mergeState(createInitialState(), JSON.parse(raw));
    ensureFishState(merged);
    ensureMarketState(merged);
    ensureTackleState(merged);
    return merged;
  } catch {
    return null;
  }
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    inventory: {
      ...base.inventory,
      ...(saved.inventory ?? {}),
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
      selectedWater: normalizeWaterId(saved.travel?.selectedWater ?? base.travel.selectedWater),
      visitedWaters: {
        ...base.travel.visitedWaters,
        ...(saved.travel?.visitedWaters ?? {}),
        canal: true,
        ...(saved.travel?.selectedWater ? { [normalizeWaterId(saved.travel.selectedWater)]: true } : {}),
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
      firstTackleReady: true,
      firstCatchDone: Boolean(saved.progress?.firstCatchDone ?? saved.stats?.totalFishCaught > 0),
      firstCrucianCatchRewardShown: Boolean(saved.progress?.firstCrucianCatchRewardShown),
    },
    stats: {
      ...base.stats,
      ...(saved.stats ?? {}),
      totalFishCaught: Math.max(
        saved.stats?.totalFishCaught ?? 0,
        saved.progress?.firstCatchDone ? 1 : 0,
      ),
    },
    catchJournal: {
      ...base.catchJournal,
      ...(saved.catchJournal ?? {}),
    },
    trophies: Array.isArray(saved.trophies) ? saved.trophies : base.trophies,
    tackle: {
      activeRig: saved.tackle?.activeRig ?? base.tackle.activeRig,
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
      locationTransition: null,
    },
    feedback: Array.isArray(saved.feedback) ? saved.feedback.slice(0, 4) : base.feedback,
    log: Array.isArray(saved.log) ? saved.log.slice(0, 6) : base.log,
  };
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
