import { fishData } from './fishData.js';

export const TROPHY_TIERS = ['normal', 'very_rare', 'rarest'];

const starPalette = [
  '#7ecf7a',
  '#e85d63',
  '#a875ff',
  '#f3c45f',
  '#4fc3d7',
  '#ff9f43',
  '#8bd17c',
  '#e777b7',
  '#7fa8ff',
  '#c0d85a',
  '#d99267',
  '#8ad6b8',
  '#b98cff',
  '#f0816a',
  '#76b7f2',
  '#d6b24f',
  '#9fd36b',
  '#cc7ed6',
];

export function ensureAchievementStarState(state) {
  state.achievements ??= {};
  state.achievements.trophyBySpecies ??= {};
  state.achievements.claimedTrophyRewards ??= {};
  state.achievements.completedSpeciesStars ??= {};
  state.achievements.unlockedStars = normalizeUnlockedStars(state.achievements);
  state.playerProfile ??= {};

  const selectedStarId = state.playerProfile.selectedStarId;
  const selectedStar = state.achievements.unlockedStars.find((star) => star.id === selectedStarId)
    ?? state.achievements.unlockedStars.find((star) => star.color === state.playerProfile.selectedStarColor)
    ?? null;

  if (selectedStar) {
    state.playerProfile.selectedStarId = selectedStar.id;
    state.playerProfile.selectedStarColor = selectedStar.color;
  } else {
    state.playerProfile.selectedStarId = null;
    state.playerProfile.selectedStarColor = null;
  }
}

export function getUnlockedStars(state) {
  ensureAchievementStarState(state);
  return state.achievements.unlockedStars;
}

export function getSelectedProfileStar(state) {
  const stars = getUnlockedStars(state);
  return stars.find((star) => star.id === state.playerProfile?.selectedStarId)
    ?? stars.find((star) => star.color === state.playerProfile?.selectedStarColor)
    ?? null;
}

export function selectProfileStar(state, starId) {
  ensureAchievementStarState(state);
  const star = state.achievements.unlockedStars.find((entry) => entry.id === starId);
  if (!star) {
    return false;
  }
  state.playerProfile.selectedStarId = star.id;
  state.playerProfile.selectedStarColor = star.color;
  return true;
}

export function getSpeciesTrophyProgress(state, fishId) {
  const tiers = state.achievements?.trophyBySpecies?.[fishId] ?? {};
  const completedTiers = TROPHY_TIERS.filter((tier) => Boolean(tiers[tier]));
  return {
    completedTiers,
    completedCount: completedTiers.length,
    totalTiers: TROPHY_TIERS.length,
    complete: completedTiers.length === TROPHY_TIERS.length,
  };
}

export function syncCompletedSpeciesStars(state, fishId = null) {
  ensureAchievementStarState(state);
  const fishIds = fishId ? [fishId] : fishData.map((fish) => fish.id);
  let unlocked = false;

  for (const id of fishIds) {
    const progress = getSpeciesTrophyProgress(state, id);
    if (!progress.complete || state.achievements.completedSpeciesStars[id]) {
      continue;
    }

    const star = {
      id: starIdForFish(id),
      fishId: id,
      color: starColorForFish(id),
      unlockedAtDay: state.day ?? null,
      completedTiers: [...progress.completedTiers],
    };
    state.achievements.completedSpeciesStars[id] = star;
    if (!state.achievements.unlockedStars.some((entry) => entry.id === star.id)) {
      state.achievements.unlockedStars.push(star);
    }
    if (!state.playerProfile.selectedStarId) {
      state.playerProfile.selectedStarId = star.id;
      state.playerProfile.selectedStarColor = star.color;
    }
    unlocked = true;
  }

  if (unlocked) {
    state.achievements.unlockedStars = normalizeUnlockedStars(state.achievements);
  }
  return unlocked;
}

export function starColorForFish(fishId) {
  const index = Math.max(0, fishData.findIndex((fish) => fish.id === fishId));
  return starPalette[index % starPalette.length];
}

function starIdForFish(fishId) {
  return `species:${fishId}`;
}

function normalizeUnlockedStars(achievements) {
  const byId = new Map();

  for (const [fishId, star] of Object.entries(achievements.completedSpeciesStars ?? {})) {
    if (!star) {
      continue;
    }
    byId.set(star.id ?? starIdForFish(fishId), {
      id: star.id ?? starIdForFish(fishId),
      fishId: star.fishId ?? fishId,
      color: star.color ?? starColorForFish(fishId),
      unlockedAtDay: star.unlockedAtDay ?? null,
      completedTiers: Array.isArray(star.completedTiers) ? star.completedTiers : TROPHY_TIERS,
    });
  }

  for (const star of achievements.unlockedStars ?? []) {
    if (!star?.fishId) {
      continue;
    }
    byId.set(star.id ?? starIdForFish(star.fishId), {
      id: star.id ?? starIdForFish(star.fishId),
      fishId: star.fishId,
      color: star.color ?? starColorForFish(star.fishId),
      unlockedAtDay: star.unlockedAtDay ?? null,
      completedTiers: Array.isArray(star.completedTiers) ? star.completedTiers : TROPHY_TIERS,
    });
  }

  return [...byId.values()].sort((a, b) => fishData.findIndex((fish) => fish.id === a.fishId) - fishData.findIndex((fish) => fish.id === b.fishId));
}
