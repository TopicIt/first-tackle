import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME, pushFeedback, pushLog, queueSound } from './state.js';
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
  state.playerProfile.name = normalizePlayerName(state.playerProfile.name ?? state.playerProfile.playerName);
  state.playerProfile.playerName = state.playerProfile.name;
  state.playerProfile.avatar = state.playerProfile.avatar || state.playerProfile.avatarId || DEFAULT_AVATAR;
  state.playerProfile.avatarId = state.playerProfile.avatar;
  state.playerProfile.avatarType = state.playerProfile.avatarType ?? (state.playerProfile.customAvatarDataUrl ? 'custom' : 'preset');
  state.playerProfile.customAvatarDataUrl ??= null;
  state.playerProfile.xp = normalizeWholeNumber(state.playerProfile.xp, 0);
  state.playerProfile.level = getLevelForXp(state.playerProfile.xp);
  state.playerProfile.totalCoinsEarned = normalizeWholeNumber(state.playerProfile.totalCoinsEarned, 0);
  state.playerProfile.fishCaughtTotal = normalizeWholeNumber(state.playerProfile.fishCaughtTotal, 0);
  state.playerProfile.locationsUnlocked = normalizeLocationList(state.playerProfile.locationsUnlocked);
  state.playerProfile.achievementFlags = normalizeAchievementFlags(state.playerProfile.achievementFlags);
  state.playerProfile.setupComplete = Boolean(state.playerProfile.setupComplete ?? state.progress?.profileSetupComplete);
  state.progress ??= {};
  state.progress.profileSetupComplete = state.playerProfile.setupComplete;
  state.tutorialState ??= {};
  state.seenEvents ??= {};
  ensureAchievementStarState(state);
  syncProfileDerivedStats(state);
}

export function updateProfile(state, profile) {
  ensureProfileState(state);
  const name = normalizePlayerName(profile.name);
  state.playerProfile = {
    ...state.playerProfile,
    name,
    playerName: name,
    avatar: profile.avatar || state.playerProfile.avatar || DEFAULT_AVATAR,
    avatarId: profile.avatar || state.playerProfile.avatar || DEFAULT_AVATAR,
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
  state.playerProfile.avatarId = avatar;
  state.playerProfile.avatarType = 'preset';
  state.playerProfile.customAvatarDataUrl = null;
  if (!state.playerProfile.nameCustom) {
    state.playerProfile.name = defaultNameByAvatar[avatar] ?? DEFAULT_PLAYER_NAME;
    state.playerProfile.playerName = state.playerProfile.name;
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
  state.playerProfile.avatarId = state.playerProfile.avatar;
  state.playerProfile.updatedAt = new Date().toISOString();
  queueSound(state, 'ui_click');
  return true;
}

export function updateProfileDraftName(state, name) {
  ensureProfileState(state);
  const normalized = normalizePlayerName(name);
  state.playerProfile.name = normalized;
  state.playerProfile.playerName = normalized;
  state.playerProfile.nameCustom = normalized !== (defaultNameByAvatar[state.playerProfile.avatar] ?? DEFAULT_PLAYER_NAME);
}

export function getXpForLevel(level) {
  const targetLevel = Math.max(1, Math.floor(Number(level) || 1));
  if (targetLevel <= 1) {
    return 0;
  }
  return 25 * (targetLevel - 1) * (targetLevel + 2);
}

export function getLevelForXp(xp) {
  const currentXp = normalizeWholeNumber(xp, 0);
  let level = 1;
  while (level < 99 && currentXp >= getXpForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function getLevelProgress(profile) {
  const xp = normalizeWholeNumber(profile?.xp, 0);
  const level = getLevelForXp(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const earnedThisLevel = Math.max(0, xp - currentLevelXp);

  return {
    level,
    xp,
    currentLevelXp,
    nextLevelXp,
    earnedThisLevel,
    neededThisLevel: span,
    percent: Math.min(100, Math.max(0, Math.round((earnedThisLevel / span) * 100))),
  };
}

export function awardCatchXp(state, catchResult, entry) {
  const weightBonus = Math.min(15, Math.floor((catchResult?.weightGrams ?? entry?.weightGrams ?? 0) / 200));
  const trophyBonus = {
    normal: 15,
    very_rare: 25,
    rarest: 40,
  }[entry?.trophyTier] ?? 0;

  return addProfileXp(state, 10 + weightBonus + trophyBonus);
}

export function addProfileXp(state, amount) {
  ensureProfileState(state);
  const gained = normalizeWholeNumber(amount, 0);
  if (gained <= 0) {
    return { gained: 0, levelUp: false, level: state.playerProfile.level };
  }

  const previousLevel = state.playerProfile.level;
  state.playerProfile.xp += gained;
  state.playerProfile.level = getLevelForXp(state.playerProfile.xp);
  state.playerProfile.updatedAt = new Date().toISOString();
  pushFeedback(state, 'feedbackXp', { xp: gained }, 'xp');

  const levelUp = state.playerProfile.level > previousLevel;
  if (levelUp) {
    pushFeedback(state, 'feedbackLevelUp', { level: state.playerProfile.level }, 'level');
  }

  return {
    gained,
    levelUp,
    level: state.playerProfile.level,
  };
}

export function addProfileCoinsEarned(state, amount) {
  ensureProfileState(state);
  const earned = normalizeWholeNumber(amount, 0);
  if (earned <= 0) {
    return;
  }
  state.playerProfile.totalCoinsEarned += earned;
  state.playerProfile.updatedAt = new Date().toISOString();
}

export function syncProfileDerivedStats(state) {
  state.playerProfile ??= {};
  state.playerProfile.fishCaughtTotal = Math.max(
    normalizeWholeNumber(state.playerProfile.fishCaughtTotal, 0),
    normalizeWholeNumber(state.stats?.totalFishCaught, 0),
  );
  state.playerProfile.locationsUnlocked = getUnlockedLocationIds(state, state.playerProfile.locationsUnlocked);
  state.playerProfile.achievementFlags = {
    ...normalizeAchievementFlags(state.playerProfile.achievementFlags),
    firstCatch: Boolean(state.progress?.firstCatchDone || (state.stats?.totalFishCaught ?? 0) > 0),
    firstTrophy: Boolean((state.trophies ?? []).some((entry) => entry?.tier)),
    starterTackleReady: Boolean(state.progress?.firstTackleReady),
  };
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
  grantPrimitiveTackle(state, { logIfGranted: true });
  queueSound(state, 'ui_click');
}

export function grantPrimitiveTackle(state, options = {}) {
  const completedNow = completeStarterTackleDrawer(state);
  if (completedNow && options.logIfGranted) {
    pushLog(state, 'logTutorialClosedStarterTackle');
  }
  return completedNow;
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

function normalizeWholeNumber(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(0, Math.floor(number));
}

function normalizeLocationList(locations) {
  const list = Array.isArray(locations) ? locations : [];
  const normalized = list
    .map((locationId) => String(locationId ?? '').trim())
    .filter(Boolean);
  return [...new Set(['canal', ...normalized])];
}

function getUnlockedLocationIds(state, savedLocations = []) {
  const unlocked = new Set(normalizeLocationList(savedLocations));
  for (const [waterId, visited] of Object.entries(state.travel?.visitedWaters ?? {})) {
    if (visited) {
      unlocked.add(waterId);
    }
  }

  if (state.travel?.sluiceUnlocked || state.purchased?.scooter) {
    unlocked.add('sluice');
  }
  if (state.travel?.greadaUnlocked || state.travel?.farWatersUnlocked) {
    unlocked.add('greada');
  }
  if (state.travel?.busStationUnlocked) {
    unlocked.add('bus_station');
  }

  return [...unlocked];
}

function normalizeAchievementFlags(flags) {
  return flags && typeof flags === 'object' && !Array.isArray(flags) ? { ...flags } : {};
}
