import { assetPath } from '../utils/assetPath.js';

export const locationTransitions = {
  house: {
    id: 'grandma_house',
    targetScene: 'house',
    fallbackImage: assetPath('/assets/locations/grandma-house.webp'),
    fallbackImageAlt: assetPath('/assets/locations/house_location_concept.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.mp4'), type: 'video/mp4' },
      ],
      [
        { src: assetPath('/assets/transitions/grandma-house/grandma-house-flyin-2.mp4'), type: 'video/mp4' },
        { src: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/grandma-house/grandma-house-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
  fishing_select: {
    id: 'fishing_canal',
    targetScene: 'fishing_select',
    fallbackImage: assetPath('/assets/locations/fishing-canal.webp'),
    fallbackImageAlt: assetPath('/assets/locations/pond_location_concept.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
};

export function getLocationTransition(sceneId, state) {
  const transition = locationTransitions[sceneId];
  if (!transition) {
    return null;
  }

  const visits = state?.ui?.transitionVisits?.[transition.id] ?? 0;
  const videos = transition.videos ?? [];
  const videoSources = videos.length ? videos[visits % videos.length] : [];

  return {
    ...transition,
    videoSources,
  };
}

export function markLocationTransitionVisit(state, transition) {
  if (!state?.ui || !transition?.id) {
    return;
  }

  state.ui.transitionVisits = {
    ...(state.ui.transitionVisits ?? {}),
    [transition.id]: (state.ui.transitionVisits?.[transition.id] ?? 0) + 1,
  };
}

export function shouldUseLocationTransitions(state) {
  return state.settings?.transitions?.enabled !== false;
}
