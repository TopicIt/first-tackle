import { assetPath } from './assetPath.js';

const mobileWorldMapAsset = {
  primary: assetPath('/assets/locations/world_map_concept1.png'),
  fallback: assetPath('/assets/locations/world_map_concept.png'),
};

export const worldMapAsset = mobileWorldMapAsset;

const desktopWorldMapAsset = {
  primary: assetPath('/assets/maps/world-map-desktop.png'),
  fallback: mobileWorldMapAsset.primary,
};

export function getWorldMapAsset(viewMode = 'mobile') {
  return viewMode === 'desktop' ? desktopWorldMapAsset : mobileWorldMapAsset;
}
