import { SAVE_KEY, createInitialState } from './state.js';
import { ensureFishState } from './fishInventory.js';

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
    },
    purchased: {
      ...base.purchased,
      ...(saved.purchased ?? {}),
    },
    day: saved.day ?? base.day,
    player: {
      ...base.player,
      ...(saved.player ?? {}),
    },
    fishBasket: Array.isArray(saved.fishBasket) ? saved.fishBasket : base.fishBasket,
    ui: {
      ...base.ui,
      ...(saved.ui ?? {}),
    },
    feedback: Array.isArray(saved.feedback) ? saved.feedback.slice(0, 4) : base.feedback,
    log: Array.isArray(saved.log) ? saved.log.slice(0, 6) : base.log,
  };
}
