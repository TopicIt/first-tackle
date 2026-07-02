import { assetPath } from '../utils/assetPath.js';
import { classifyCatchSize } from './fishSizeProfiles.js';

const genericFallback = '/assets/fish/catch_result_frame.png';

const speciesFallbacks = {
  crucian: '/assets/fish/catch_crucian_card.png',
  rotan: '/assets/fish/catch_rotan_card.png',
  okun: '/assets/fish/okun.png',
  lynok: '/assets/fish/lynok.png',
  som: '/assets/fish/som.png',
  sudak: '/assets/fish/sudak.png',
};

const catchCardConfig = {
  crucian: {
    small: ['/assets/fish/catch-cards/karas/karas-0-fry.png'],
    common: ['/assets/fish/catch-cards/karas/karas-common-1.png', '/assets/fish/catch-cards/karas/karas-common-2.png'],
    trophy1: ['/assets/fish/catch-cards/karas/karas-trophy-1.png'],
    trophy2: ['/assets/fish/catch-cards/karas/karas-trophy-2.png'],
    trophy3: ['/assets/fish/catch-cards/karas/karas-trophy-2.png'],
  },
  rotan: {
    small: ['/assets/fish/catch-cards/rotan/rotan-0-small.png'],
    common: ['/assets/fish/catch-cards/rotan/rotan-common.png'],
    trophy1: ['/assets/fish/catch-cards/rotan/rotan-trophy-1.png'],
    trophy2: ['/assets/fish/catch-cards/rotan/rotan-trophy-2.png'],
    trophy3: ['/assets/fish/catch-cards/rotan/rotan-trophy-2.png'],
  },
  okun: {
    common: ['/assets/fish/catch-cards/okun/okun-common.png'],
    trophy1: ['/assets/fish/catch-cards/okun/okun-trophy-1.png'],
    trophy2: ['/assets/fish/catch-cards/okun/okun-trophy-2.png'],
    trophy3: ['/assets/fish/catch-cards/okun/okun-trophy-3.png'],
  },
};

export function resolveFishCatchCardImage(fishId, catchInfo = {}) {
  const category = getImageCategory(fishId, catchInfo);
  const config = catchCardConfig[fishId] ?? {};
  const candidates = [
    ...(config[category] ?? []),
    ...(category === 'trophy3' ? (config.trophy2 ?? []) : []),
    ...(category === 'trophy2' ? (config.trophy1 ?? []) : []),
    ...(config.common ?? []),
    speciesFallbacks[fishId],
    `/assets/fish/species/${fishId}.png`,
    genericFallback,
  ].filter(Boolean);

  return assetPath(stablePick(candidates, fishId, catchInfo));
}

export function persistCatchCardImage(entry) {
  if (!entry || entry.selectedCardImage) {
    return entry?.selectedCardImage ?? null;
  }
  entry.selectedCardImage = resolveFishCatchCardImage(entry.fishId, entry);
  return entry.selectedCardImage;
}

function getImageCategory(fishId, catchInfo) {
  const trophyTier = catchInfo.trophyTier;
  if (trophyTier === 'rarest') return 'trophy3';
  if (trophyTier === 'very_rare') return 'trophy2';
  if (trophyTier === 'normal') return 'trophy1';

  const category = catchInfo.catchCategory ?? classifyCatchSize(fishId, catchInfo.weightGrams ?? 0);
  if (category === 'legendary') return 'trophy3';
  if (category === 'very_rare') return 'trophy2';
  if (category === 'trophy') return 'trophy1';
  if (category === 'small') return 'small';
  return 'common';
}

function stablePick(candidates, fishId, catchInfo) {
  const firstExisting = candidates[0] ?? genericFallback;
  const pool = candidates.filter((candidate) => candidate.includes('/catch-cards/'));
  if (pool.length <= 1) {
    return firstExisting;
  }

  const seed = `${catchInfo.id ?? ''}:${fishId}:${catchInfo.weightGrams ?? ''}:${catchInfo.caughtAtDay ?? ''}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return pool[Math.abs(hash) % pool.length];
}
