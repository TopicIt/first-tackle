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
  const minutes = normalizedDayMinutes(state.time.minutes);
  if (minutes >= 4 * 60 && minutes < 10 * 60) return 'morning';
  if (minutes >= 10 * 60 && minutes < 17 * 60) return 'day';
  if (minutes >= 17 * 60 && minutes < 22 * 60 + 30) return 'evening';
  return 'night';
}

export function getTimeOfDayBucket(state) {
  const forcedBucket = state?.settings?.debug?.timeOfDayBucket;
  if (['dawn_dusk', 'day', 'night'].includes(forcedBucket)) {
    return forcedBucket;
  }

  const phase = getTimePhase(state);
  return phase === 'morning' || phase === 'evening' ? 'dawn_dusk' : phase;
}

export function formatGameTime(state) {
  ensureTimeState(state);
  const minutes = normalizedDayMinutes(state.time.minutes);
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = Math.floor(minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

function normalizedDayMinutes(minutes) {
  const dayMinutes = 24 * 60;
  return ((Math.floor(minutes) % dayMinutes) + dayMinutes) % dayMinutes;
}
