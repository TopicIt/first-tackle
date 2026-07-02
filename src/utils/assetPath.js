const optimizedWebpFolders = [
  '/assets/logo/',
  '/assets/profile/',
  '/assets/items/',
  '/assets/fish/',
  '/assets/maps/',
  '/assets/locations/',
  '/assets/time-of-day/',
];

export function assetPath(path) {
  const normalized = normalizeAssetInput(path);
  if (/^(?:https?:|data:|blob:)/.test(normalized)) {
    return normalized;
  }
  return `${import.meta.env?.BASE_URL ?? '/'}${preferOptimizedWebp(normalized).replace(/^\/+/, '')}`;
}

function preferOptimizedWebp(path) {
  const normalized = `/${String(path ?? '').replace(/^\/+/, '')}`;
  if (!/\.(png|jpe?g)$/i.test(normalized)) {
    return normalized;
  }

  if (!optimizedWebpFolders.some((folder) => normalized.startsWith(folder))) {
    return normalized;
  }

  return normalized.replace(/\.(png|jpe?g)$/i, '.webp');
}

function normalizeAssetInput(path) {
  const raw = String(path ?? '');
  if (/^(?:https?:|data:|blob:)/.test(raw)) {
    return raw;
  }

  const assetIndex = raw.indexOf('/assets/');
  if (assetIndex >= 0) {
    return raw.slice(assetIndex);
  }

  return raw;
}
