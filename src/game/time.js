export function ensureTimeState(state) {
  state.time ??= { minutes: 7 * 60 };
  state.time.minutes = Number.isFinite(state.time.minutes) ? state.time.minutes : 7 * 60;
}

export function advanceTime(state, minutes = 30) {
  ensureTimeState(state);
  state.time.minutes += minutes;
  while (state.time.minutes >= 24 * 60) {
    state.time.minutes -= 24 * 60;
    state.day += 1;
  }
}

export function resetToMorning(state) {
  ensureTimeState(state);
  state.time.minutes = 7 * 60;
}

export function getTimePhase(state) {
  ensureTimeState(state);
  const hour = Math.floor(state.time.minutes / 60);
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function formatGameTime(state) {
  ensureTimeState(state);
  const hour = Math.floor(state.time.minutes / 60).toString().padStart(2, '0');
  const minute = Math.floor(state.time.minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}
