import { DEFAULT_AVATAR, DEFAULT_PLAYER_NAME, pushFeedback, pushLog, queueSound } from './state.js';
import { addItem } from './inventory.js';
import { ensureTackleState, ownTackleComponent, selectActiveRig } from './tackle.js';

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
    id: 'rod',
    label: '\u0412\u0443\u0434\u0438\u043b\u0438\u0449\u0435 \u0437 \u043b\u0456\u0449\u0438\u043d\u0438',
    component: 'simple_stick_rod',
    feedbackKey: 'componentSimpleStickRod',
    placeKey: 'tutorialPlaceRod',
    actionId: 'gather:rodStick',
  },
  {
    id: 'float',
    label: '\u041f\u043e\u043f\u043b\u0430\u0432\u043e\u043a \u0437 \u0433\u0443\u0441\u044f\u0447\u043e\u0433\u043e \u043f\u0435\u0440\u0430',
    component: 'goose_feather_float',
    feedbackKey: 'componentGooseFeatherFloat',
    placeKey: 'tutorialPlaceFloat',
    actionId: 'search:feather',
  },
  {
    id: 'line',
    label: '\u041d\u0438\u0442\u043a\u0430 \u0434\u043b\u044f \u0432\u0438\u0448\u0438\u0432\u0430\u043d\u043d\u044f',
    component: 'grandma_thread',
    feedbackKey: 'componentGrandmaThread',
    placeKey: 'tutorialPlaceLine',
    actionId: 'open:house',
  },
  {
    id: 'hook',
    label: '\u0421\u0442\u0430\u0440\u0438\u0439 \u0433\u0430\u0447\u043e\u043a',
    component: 'old_dull_hook',
    feedbackKey: 'componentOldDullHook',
    placeKey: 'tutorialPlaceHook',
    actionId: 'open:house',
  },
  {
    id: 'sinker',
    label: '\u041a\u0430\u043c\u0456\u043d\u0447\u0438\u043a',
    component: 'small_stone',
    feedbackKey: 'componentSmallStone',
    placeKey: 'tutorialPlaceSinker',
    actionId: 'gather:stones',
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
  state.playerProfile.setupComplete = Boolean(state.playerProfile.setupComplete ?? state.progress?.profileSetupComplete);
  state.progress ??= {};
  state.progress.profileSetupComplete = state.playerProfile.setupComplete;
  state.tutorialState ??= {};
  state.seenEvents ??= {};
}

export function updateProfile(state, profile) {
  ensureProfileState(state);
  state.playerProfile = {
    ...state.playerProfile,
    name: normalizePlayerName(profile.name),
    avatar: profile.avatar || state.playerProfile.avatar || DEFAULT_AVATAR,
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
  if (!state.playerProfile.nameCustom) {
    state.playerProfile.name = defaultNameByAvatar[avatar] ?? DEFAULT_PLAYER_NAME;
  }
  queueSound(state, 'ui_click');
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
    collapsed: true,
  };
  queueSound(state, 'ui_click');
}

export function completeTutorialStep(state) {
  const stepIndex = state.tutorialState?.step ?? 0;
  const step = tutorialSteps[stepIndex];
  if (!step) {
    grantPrimitiveTackle(state, { skipped: false });
    return;
  }

  ownTackleComponent(state, step.component);
  pushFeedback(state, step.feedbackKey, {}, 'item');
  pushLog(state, 'logTutorialFoundPart', { item: step.label });
  state.tutorialState.step = stepIndex + 1;

  if (state.tutorialState.step >= tutorialSteps.length) {
    grantPrimitiveTackle(state, { skipped: false });
  }
}

export function skipTutorial(state) {
  grantPrimitiveTackle(state, { skipped: true });
}

export function grantPrimitiveTackle(state, options = {}) {
  ensureTackleState(state);
  addItem(state, 'primitiveTackle', Math.max(0, 1 - (state.inventory?.primitiveTackle ?? 0)));
  addItem(state, 'stickRod', Math.max(0, 1 - (state.inventory?.stickRod ?? 0)));
  for (const step of tutorialSteps) {
    ownTackleComponent(state, step.component);
  }
  state.tackle.equipped = {
    line: 'grandma_thread',
    hook: 'old_dull_hook',
    sinker: 'small_stone',
    float: 'goose_feather_float',
    rod: 'simple_stick_rod',
  };
  selectActiveRig(state, 'first_rod');
  state.progress.firstTackleReady = true;
  if (!options.skipped && !state.tutorialState?.rewardGranted) {
    state.money = (state.money ?? 0) + 100;
    pushFeedback(state, 'feedbackCoins', { coins: 100 }, 'coins');
  }
  state.tutorialState = {
    ...(state.tutorialState ?? {}),
    promptDismissed: true,
    started: true,
    completed: true,
    skipped: Boolean(options.skipped),
    step: tutorialSteps.length,
    collapsed: false,
    rewardGranted: Boolean(state.tutorialState?.rewardGranted || !options.skipped),
  };
  pushFeedback(state, 'feedbackTackle', {}, 'item');
  pushLog(state, options.skipped ? 'logTutorialSkipped' : 'logTutorialCompleted');
  queueSound(state, 'craft_item');
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
