import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME, pushLog, queueSound } from './state.js';
import { completeStarterTackleDrawer } from './starterTackleDrawer.js';
import { ensureAchievementStarState } from './achievementStars.js';

export const profileAvatars = [
  '/assets/profile/Grandson-1.png',
  '/assets/profile/Grandson-2.png',
  '/assets/profile/granddaughter-1.png',
  '/assets/profile/granddaughter-2.png',
  '/assets/profile/boy-1.png',
  '/assets/profile/boy-2.png',
  '/assets/profile/girl-1.png',
  '/assets/profile/girl-2.png',
  '/assets/profile/grandfather-1.png',
  '/assets/profile/grandfather-2.png',
  '/assets/profile/grandmother-1.png',
  '/assets/profile/grandmother-2.png',
  '/assets/profile/grandmother.png',
];

export const tutorialSteps = [
  {
    id: 'house',
    labelKey: 'tutorialStepHouse',
    placeKey: 'tutorialPlaceDrawerHouse',
    actionId: 'open:house',
  },
  {
    id: 'drawer',
    labelKey: 'tutorialStepDrawerButton',
    placeKey: 'tutorialPlaceDrawerButton',
    actionId: 'drawer:open',
  },
  {
    id: 'search',
    labelKey: 'tutorialStepDrawerSearch',
    placeKey: 'tutorialPlaceDrawerSearch',
    actionId: 'drawer:complete',
  },
  {
    id: 'canal',
    labelKey: 'tutorialStepGoCanal',
    placeKey: 'tutorialPlaceGoCanal',
    actionId: 'open:canal',
  },
  {
    id: 'firstTrophy',
    labelKey: 'questFirstTrophyTitle',
    placeKey: 'questFirstTrophyDesc',
    actionId: 'minigame:start:active',
  },
];

export const defaultNameByAvatar = {
  '/assets/profile/granddaughter-1.png': '\u041c\u0430\u0440\u0456\u0447\u043a\u0430',
  '/assets/profile/granddaughter-2.png': '\u041c\u0430\u0440\u0456\u0447\u043a\u0430',
  '/assets/profile/girl-1.png': '\u041c\u0430\u0440\u0456\u0447\u043a\u0430',
  '/assets/profile/girl-2.png': '\u041c\u0430\u0440\u0456\u0447\u043a\u0430',
  '/assets/profile/grandmother-1.png': '\u041d\u0430\u0434\u0456\u044f',
  '/assets/profile/grandmother-2.png': '\u041d\u0430\u0434\u0456\u044f',
  '/assets/profile/grandmother.png': '\u041d\u0430\u0434\u0456\u044f',
  '/assets/profile/grandfather-1.png': '\u0410\u043d\u0430\u0442\u043e\u043b\u0456\u0439',
  '/assets/profile/grandfather-2.png': '\u0410\u043d\u0430\u0442\u043e\u043b\u0456\u0439',
  '/assets/profile/boy-1.png': '\u0414\u0456\u043c\u0430',
  '/assets/profile/boy-2.png': '\u0414\u0456\u043c\u0430',
  '/assets/profile/Grandson-1.png': '\u0406\u0432\u0430\u0441\u0438\u043a \u0422\u0435\u043b\u0435\u0441\u0438\u043a',
  '/assets/profile/Grandson-2.png': '\u0414\u0456\u043c\u0430',
};

export function ensureProfileState(state) {
  state.playerProfile ??= {};
  state.playerProfile.name = normalizePlayerName(state.playerProfile.name);
  state.playerProfile.avatar = state.playerProfile.avatar || DEFAULT_AVATAR;
  state.playerProfile.avatarType = state.playerProfile.avatarType ?? (state.playerProfile.customAvatarDataUrl ? 'custom' : 'preset');
  state.playerProfile.customAvatarDataUrl ??= null;
  state.playerProfile.setupComplete = Boolean(state.playerProfile.setupComplete ?? state.progress?.profileSetupComplete);
  state.progress ??= {};
  state.progress.profileSetupComplete = state.playerProfile.setupComplete;
  state.tutorialState ??= {};
  state.seenEvents ??= {};
  ensureAchievementStarState(state);
}

export function updateProfile(state, profile) {
  ensureProfileState(state);
  state.playerProfile = {
    ...state.playerProfile,
    name: normalizePlayerName(profile.name),
    avatar: profile.avatar || state.playerProfile.avatar || DEFAULT_AVATAR,
    avatarType: state.playerProfile.avatarType ?? 'preset',
    customAvatarDataUrl: state.playerProfile.customAvatarDataUrl ?? null,
    setupComplete: true,
    updatedAt: new Date().toISOString(),
    createdAt: state.playerProfile.createdAt ?? new Date().toISOString(),
  };
  state.playerProfile.nameCustom = Boolean(profile.nameCustom ?? true);
  state.progress.profileSetupComplete = true;
  pushLog(state, 'logProfileSaved');
  queueSound(state, 'ui_click');
}

export function selectAvatar(state, avatar) {
  ensureProfileState(state);
  if (!profileAvatars.includes(avatar)) {
    return;
  }
  state.playerProfile.avatar = avatar;
  state.playerProfile.avatarType = 'preset';
  state.playerProfile.customAvatarDataUrl = null;
  if (!state.playerProfile.nameCustom) {
    state.playerProfile.name = defaultNameByAvatar[avatar] ?? DEFAULT_PLAYER_NAME;
  }
  queueSound(state, 'ui_click');
}

export function setCustomAvatar(state, dataUrl) {
  ensureProfileState(state);
  if (!String(dataUrl ?? '').startsWith('data:image/')) {
    return false;
  }
  state.playerProfile.customAvatarDataUrl = String(dataUrl);
  state.playerProfile.avatarType = 'custom';
  state.playerProfile.updatedAt = new Date().toISOString();
  queueSound(state, 'ui_click');
  return true;
}

export function updateProfileDraftName(state, name) {
  ensureProfileState(state);
  const normalized = normalizePlayerName(name);
  state.playerProfile.name = normalized;
  state.playerProfile.nameCustom = normalized !== (defaultNameByAvatar[state.playerProfile.avatar] ?? DEFAULT_PLAYER_NAME);
}

export function startTutorial(state) {
  state.tutorialState = {
    ...(state.tutorialState ?? {}),
    promptDismissed: true,
    started: true,
    skipped: false,
    completed: false,
    step: state.tutorialState?.step ?? 0,
    collapsed: false,
    closed: false,
  };
  queueSound(state, 'ui_click');
}

export function completeTutorialStep(state) {
  const stepIndex = state.tutorialState?.step ?? 0;
  const step = tutorialSteps[stepIndex];
  if (!step) {
    state.tutorialState.completed = true;
    return;
  }

  state.tutorialState.step = stepIndex + 1;

  if (state.tutorialState.step >= tutorialSteps.length) {
    state.tutorialState.completed = true;
  }
}

export function advanceTutorialForAction(state, actionId) {
  const tutorial = state.tutorialState;
  if (!tutorial?.started || tutorial.completed || tutorial.skipped) {
    return false;
  }

  const step = tutorialSteps[tutorial.step ?? 0];
  if (!step || step.actionId !== actionId) {
    return false;
  }

  completeTutorialStep(state);
  return true;
}

export function skipTutorial(state) {
  state.tutorialState = {
    ...(state.tutorialState ?? {}),
    promptDismissed: true,
    skipped: true,
    closed: true,
  };
  queueSound(state, 'ui_click');
}

export function grantPrimitiveTackle(state, options = {}) {
  void options;
  completeStarterTackleDrawer(state);
}

export function syncGrandmaTrust(state) {
  const count = state.catchJournal?.canadian_catfish?.totalCaught ?? 0;
  state.progress ??= {};
  state.progress.grandmaTrust ??= { canadianCatfishCaught: 0, required: 5 };
  state.progress.grandmaTrust.canadianCatfishCaught = Math.max(state.progress.grandmaTrust.canadianCatfishCaught ?? 0, count);
  if (state.progress.grandmaTrust.canadianCatfishCaught >= (state.progress.grandmaTrust.required ?? 5)) {
    state.travel ??= {};
    state.travel.busStationUnlocked = true;
  }
}

function normalizePlayerName(name) {
  const trimmed = String(name ?? '').trim();
  return trimmed || DEFAULT_PLAYER_NAME;
}
