import { assetPath } from './assetPath.js';
import { getTimeOfDayBackground } from './timeOfDayBackgrounds.js';

const mobileWorldMapAsset = {
  primary: assetPath('/assets/locations/world_map_concept1.png'),
  fallback: assetPath('/assets/locations/world_map_concept.png'),
};

export const worldMapAsset = mobileWorldMapAsset;

const desktopWorldMapAsset = {
  primary: assetPath('/assets/maps/world-map-desktop.png'),
  fallback: mobileWorldMapAsset.primary,
};

export function getWorldMapAsset(viewMode = 'mobile', state = null, options = {}) {
  const baseAsset = viewMode === 'desktop' ? desktopWorldMapAsset : mobileWorldMapAsset;
  if (options.useTimeOfDay === false) {
    return {
      primary: baseAsset.primary,
      fallback: baseAsset.fallback,
      fallbacks: [baseAsset.fallback].filter(Boolean),
      bucket: 'static',
    };
  }
  const timeAsset = getTimeOfDayBackground('main_map', state, baseAsset.primary);
  return {
    primary: timeAsset.primary ?? baseAsset.primary,
    fallback: timeAsset.fallbacks[0] ?? baseAsset.fallback,
    fallbacks: [...timeAsset.fallbacks, baseAsset.fallback].filter(Boolean),
    bucket: timeAsset.bucket,
  };
}
