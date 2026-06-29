import { getTimeOfDayBucket } from '../game/time.js';
import { assetPath } from './assetPath.js';

export const TIME_OF_DAY_BUCKETS = ['dawn_dusk', 'day', 'night'];

const backgroundSets = {
  main_map: {
    dawn_dusk: '/assets/time-of-day/main_map/main_map_dawn_dusk.png',
    day: '/assets/time-of-day/main_map/main_map_day.png',
    night: '/assets/time-of-day/main_map/main_map_night.png',
  },
  pond_fields_map: {
    dawn_dusk: '/assets/time-of-day/pond_fields_map/pond_fields_map_dawn_dusk.png',
    day: '/assets/time-of-day/pond_fields_map/pond_fields_map_day.png',
    night: '/assets/time-of-day/pond_fields_map/pond_fields_map_night.png',
  },
  shluz_aerial: {
    dawn_dusk: '/assets/time-of-day/shluz_aerial/shluz_aerial_dawn_dusk.png',
    day: '/assets/time-of-day/shluz_aerial/shluz_aerial_day.png',
    night: '/assets/time-of-day/shluz_aerial/shluz_aerial_night.png',
  },
  canal_view: {
    dawn_dusk: '/assets/time-of-day/canal_view/canal_view_dawn_dusk.png',
    day: '/assets/time-of-day/canal_view/canal_view_day.png',
    night: '/assets/time-of-day/canal_view/canal_view_night.png',
  },
  shluz_view: {
    dawn_dusk: '/assets/time-of-day/shluz_view/shluz_view_dawn_dusk.png',
    day: '/assets/time-of-day/shluz_view/shluz_view_day.png',
    night: '/assets/time-of-day/shluz_view/shluz_view_night.png',
  },
  grandma_house: {
    dawn_dusk: '/assets/locations/grandma-house-dawn-dusk.png',
    day: '/assets/locations/grandma-house-day.png',
    night: '/assets/locations/grandma-house-night.png',
  },
};

export function getTimeOfDayBackground(key, state, fallback = null) {
  const set = backgroundSets[key];
  const bucket = state ? getTimeOfDayBucket(state) : 'day';
  const primary = set?.[bucket] ?? set?.day ?? set?.dawn_dusk ?? set?.night ?? fallback;
  const fallbackCandidates = [
    set?.day,
    set?.dawn_dusk,
    set?.night,
    fallback,
  ].filter(Boolean);

  return {
    bucket,
    primary: primary ? resolveAsset(primary) : null,
    fallbacks: fallbackCandidates
      .filter((candidate) => candidate !== primary)
      .map(resolveAsset),
  };
}

export function getTimeOfDayBackgroundUrls(key, state, fallbacks = []) {
  const resolved = getTimeOfDayBackground(key, state, fallbacks[0] ?? null);
  return [
    resolved.primary,
    ...resolved.fallbacks,
    ...fallbacks.map((fallback) => fallback ? resolveAsset(fallback) : null),
  ].filter(Boolean);
}

function resolveAsset(path) {
  if (!path || /^(?:https?:|data:|blob:)/.test(path)) {
    return path;
  }
  if (!path.startsWith('/assets/')) {
    return path;
  }
  return assetPath(path);
}
