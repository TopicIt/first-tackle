import { assetPath } from '../utils/assetPath.js';

export const locationTransitions = {
  house: {
    id: 'grandma_house',
    animationId: 'locationTransition_grandma_house',
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
    animationId: 'locationTransition_canal',
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
  canal: {
    id: 'fishing_canal',
    animationId: 'locationTransition_canal',
    targetScene: 'canal',
    fallbackImage: assetPath('/assets/locations/fishing-canal.webp'),
    fallbackImageAlt: assetPath('/assets/locations/pond_location_concept.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/fishing-canal/fishing-canal-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
  sluice: {
    id: 'sluice_flyin',
    animationId: 'locationTransition_shluz',
    targetScene: 'sluice',
    fallbackImage: assetPath('/assets/locations/shluz-transition-06-final.png'),
    fallbackImageAlt: assetPath('/assets/locations/shluz.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/shluz/shluz-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
  fire_ponds: {
    id: 'fire_ponds_flyin',
    animationId: 'locationTransition_stavok',
    targetScene: 'fire_ponds',
    fallbackImage: assetPath('/assets/locations/stavok-pozhara-05-final-fishing-view.png.png'),
    fallbackImageAlt: assetPath('/assets/locations/stavok.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/stavok-pozhara/stavok-pozhara-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/stavok-pozhara/stavok-pozhara-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
  garden: {
    id: 'garden',
    animationId: 'locationTransition_garden',
    targetScene: 'garden',
    fallbackImage: assetPath('/assets/locations/garden_location_concept.png'),
    fallbackImageAlt: assetPath('/assets/locations/pond_location_concept.png'),
    videos: [
      [
        { src: assetPath('/assets/transitions/garden/garden-flyin.webm'), type: 'video/webm' },
        { src: assetPath('/assets/transitions/garden/garden-flyin.mp4'), type: 'video/mp4' },
      ],
    ],
  },
};

export const ANIMATION_PLAY_LIMIT = 5;
export const INTRO_VIDEO_ANIMATION_ID = 'introVideo';

export function normalizeAnimationLimits(state) {
  state.settings ??= {};
  const savedCounts = state.settings.animationLimits?.counts ?? {};
  state.settings.animationLimits = {
    ...(state.settings.animationLimits ?? {}),
    counts: { ...savedCounts },
  };
}

export function getAnimationUsageId(animation) {
  return typeof animation === 'string' ? animation : animation?.animationId ?? animation?.id ?? null;
}

export function canPlayLimitedAnimation(state, animation) {
  const animationId = getAnimationUsageId(animation);
  if (!animationId) {
    return true;
  }
  if (state?.settings?.transitions?.enabled === false || state?.settings?.performance?.lowPower) {
    return false;
  }
  normalizeAnimationLimits(state);
  return (state.settings.animationLimits.counts[animationId] ?? 0) < ANIMATION_PLAY_LIMIT;
}

export function recordLimitedAnimationPlay(state, animation) {
  const animationId = getAnimationUsageId(animation);
  if (!animationId) {
    return 0;
  }
  normalizeAnimationLimits(state);
  const nextCount = (state.settings.animationLimits.counts[animationId] ?? 0) + 1;
  state.settings.animationLimits.counts[animationId] = nextCount;
  return nextCount;
}

export function resetAnimationLimits(state) {
  state.settings ??= {};
  state.settings.animationLimits = { counts: {} };
}

export function getLocationTransition(sceneId, state) {
  const transition = locationTransitions[sceneId];
  if (!transition) {
    return null;
  }
  if (!canPlayLimitedAnimation(state, transition)) {
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

export function getFirstCrucianCatchRewardTransition() {
  return {
    id: 'first_crucian_catch',
    animationId: 'crucianVideo',
    type: 'reward',
    targetScene: null,
    labelKey: 'firstCatchReward',
    fallbackImage: assetPath('/assets/fish/catch_crucian_card.png'),
    fallbackImageAlt: assetPath('/assets/fish/catch_result_frame.png'),
    videoSources: [
      { src: assetPath('/assets/transitions/first-catch/first-crucian-catch.webm'), type: 'video/webm' },
      { src: assetPath('/assets/transitions/first-catch/first-crucian-catch.mp4'), type: 'video/mp4' },
    ],
  };
}

export function queueFirstCrucianCatchReward(state, options = {}) {
  const transition = getFirstCrucianCatchRewardTransition();
  if (!state?.ui || !canPlayLimitedAnimation(state, transition)) {
    return false;
  }

  state.progress ??= {};
  if (!options.repeat) {
    state.progress.firstCrucianCatchRewardShown = true;
    state.seenEvents ??= {};
    state.seenEvents.firstCrucianVideoShown = true;
  }
  recordLimitedAnimationPlay(state, transition);
  state.ui.locationTransition = transition;
  return true;
}

export function markFirstCrucianCatchRewardSeen(state) {
  state.progress ??= {};
  state.progress.firstCrucianCatchRewardShown = true;
  state.seenEvents ??= {};
  state.seenEvents.firstCrucianVideoShown = true;
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
  return state.settings?.transitions?.enabled !== false && !state.settings?.performance?.lowPower;
}
