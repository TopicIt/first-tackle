import { SAVE_KEY, createInitialState } from './state.js';

export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return mergeState(createInitialState(), JSON.parse(raw));
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
    purchased: {
      ...base.purchased,
      ...(saved.purchased ?? {}),
    },
    player: {
      ...base.player,
      ...(saved.player ?? {}),
    },
    ui: {
      ...base.ui,
      ...(saved.ui ?? {}),
    },
    feedback: Array.isArray(saved.feedback) ? saved.feedback.slice(0, 4) : base.feedback,
    log: Array.isArray(saved.log) ? saved.log.slice(0, 6) : base.log,
  };
}
