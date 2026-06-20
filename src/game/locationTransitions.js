import { assetPath } from '../utils/assetPath.js';

export const locationTransitions = {
  house: {
    id: 'grandma_house',
    targetScene: 'house',
    fallbackImage: assetPath('/assets/locations/grandma-house.webp'),
    fallbackImageAlt: assetPath('/assets/locations/house_location_concept.png'),
    videos: {
      webm: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.webm'),
      mp4: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.mp4'),
      legacyMp4: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.mp4.mp4'),
    },
  },
  fishing_select: {
    id: 'fishing_canal',
    targetScene: 'fishing_select',
    fallbackImage: assetPath('/assets/locations/fishing-canal.webp'),
    fallbackImageAlt: assetPath('/assets/locations/pond_location_concept.png'),
    videos: {
      webm: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.webm'),
      mp4: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.mp4'),
    },
  },
};

export function getLocationTransition(sceneId) {
  return locationTransitions[sceneId] ?? null;
}

export function shouldUseLocationTransitions(state) {
  return state.settings?.transitions?.enabled !== false;
}
