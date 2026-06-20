import { SAVE_KEY, createInitialMarketState, createInitialState } from './state.js';
import { ensureFishState } from './fishInventory.js';
import { ensureMarketState } from './market.js';

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
    },
    purchased: {
      ...base.purchased,
      ...(saved.purchased ?? {}),
    },
    travel: {
      ...base.travel,
      ...(saved.travel ?? {}),
      farWatersUnlocked: Boolean(saved.travel?.farWatersUnlocked ?? saved.purchased?.bicycle ?? base.travel.farWatersUnlocked),
    },
    market: mergeMarketState(saved.market, base.day),
    day: saved.day ?? base.day,
    player: {
      ...base.player,
      ...(saved.player ?? {}),
    },
    fishBasket: Array.isArray(saved.fishBasket) ? saved.fishBasket : base.fishBasket,
    catchJournal: {
      ...base.catchJournal,
      ...(saved.catchJournal ?? {}),
    },
    trophies: Array.isArray(saved.trophies) ? saved.trophies : base.trophies,
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
