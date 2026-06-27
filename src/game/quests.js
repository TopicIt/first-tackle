import { getCastSpot } from './bitePatterns.js';
import { pushFeedback, pushLog, queueSound } from './state.js';

export const questDefinitions = [
  {
    id: 'canal_first_small_fish',
    titleKey: 'questCanalStarterTitle',
    descriptionKey: 'questCanalStarterDesc',
    rewardKey: 'questRewardCoins75',
    rewardCoins: 75,
    waterId: 'canal',
    required: 3,
    getProgress: (state) => countFishWhere(state, (entry) => (entry.waterId ?? getCastSpot(entry.catchSpotId)?.waterId ?? 'canal') === 'canal'),
  },
  {
    id: 'grandma_trust',
    titleKey: 'questGrandmaTrustTitle',
    descriptionKey: 'questGrandmaTrustDesc',
    rewardKey: 'questRewardBusStation',
    waterId: 'greada',
    required: 5,
    getProgress: (state) => Math.min(5, state.progress?.grandmaTrust?.canadianCatfishCaught ?? state.catchJournal?.canadian_catfish?.totalCaught ?? 0),
    applyReward: (state) => {
      state.travel ??= {};
      state.travel.busStationUnlocked = true;
    },
  },
  {
    id: 'pike_taranka',
    titleKey: 'questPikeTarankaTitle',
    descriptionKey: 'questPikeTarankaDesc',
    rewardKey: 'questRewardCoins300',
    rewardCoins: 300,
    required: 1,
    getProgress: (state) => state.catchJournal?.pike?.totalCaught ?? countFishWhere(state, (entry) => entry.fishId === 'pike'),
  },
];

export function ensureQuestState(state) {
  state.quests ??= {};
  state.quests.claimed ??= {};
  syncQuestProgress(state);
}

export function syncQuestProgress(state) {
  state.quests ??= {};
  state.quests.progress = Object.fromEntries(questDefinitions.map((quest) => [
    quest.id,
    Math.min(quest.required, Math.max(state.quests.progress?.[quest.id] ?? 0, quest.getProgress(state))),
  ]));
}

export function getQuestRows(state) {
  ensureQuestState(state);
  return questDefinitions.map((quest) => {
    const progress = Math.min(quest.required, state.quests.progress?.[quest.id] ?? quest.getProgress(state));
    return {
      ...quest,
      progress,
      complete: progress >= quest.required,
      claimed: Boolean(state.quests.claimed?.[quest.id]),
    };
  });
}

export function claimQuestReward(state, questId) {
  ensureQuestState(state);
  const quest = questDefinitions.find((entry) => entry.id === questId);
  if (!quest) {
    return false;
  }

  const progress = state.quests.progress?.[quest.id] ?? quest.getProgress(state);
  if (progress < quest.required || state.quests.claimed?.[quest.id]) {
    return false;
  }

  state.quests.claimed[quest.id] = true;
  quest.applyReward?.(state);
  if (quest.rewardCoins) {
    state.money += quest.rewardCoins;
    pushFeedback(state, 'feedbackCoins', { coins: quest.rewardCoins }, 'coins');
  }
  pushLog(state, 'logQuestRewardClaimed', { questKey: quest.titleKey, rewardKey: quest.rewardKey });
  queueSound(state, quest.rewardCoins ? 'coins' : 'ui_click');
  return true;
}

export function unlockAllLocationsForDebug(state) {
  state.purchased ??= {};
  state.travel ??= {};
  state.purchased.scooter = true;
  state.purchased.bicycle = true;
  state.purchased.betterBicycle = true;
  state.purchased.bestBicycle = true;
  state.travel.sluiceUnlocked = true;
  state.travel.farWatersUnlocked = true;
  state.travel.greadaUnlocked = true;
  state.travel.busStationUnlocked = true;
  state.travel.bicycleTier = 'best';
  state.travel.bicycleTripsLeft = 9999;
  state.travel.boughtTickets = {
    ...(state.travel.boughtTickets ?? {}),
    greada: Math.max(1, state.travel.boughtTickets?.greada ?? 0),
    lake_tur: Math.max(1, state.travel.boughtTickets?.lake_tur ?? 0),
    mining_lake: Math.max(1, state.travel.boughtTickets?.mining_lake ?? 0),
  };
  state.travel.visitedWaters = {
    ...(state.travel.visitedWaters ?? {}),
    canal: true,
    sluice: true,
    fire_ponds: true,
    greada: true,
    lake_tur: true,
    mining_lake: true,
  };
  pushFeedback(state, 'feedbackAllLocationsUnlocked', {}, 'item');
  pushLog(state, 'logAllLocationsUnlocked');
  queueSound(state, 'ui_click');
}

function countFishWhere(state, predicate) {
  return (state.fishBasket ?? []).filter(predicate).length;
}
