export const VIEW_MODE_STORAGE_KEY = 'first-tackle-view-mode';
export const VIEW_MODE_DESKTOP_MIN_WIDTH = 900;
export const viewModes = ['auto', 'mobile', 'desktop'];

export function normalizeViewMode(value) {
  return viewModes.includes(value) ? value : 'auto';
}

export function loadStoredViewMode() {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === null ? null : normalizeViewMode(stored);
  } catch {
    return null;
  }
}

export function persistViewMode(mode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, normalizeViewMode(mode));
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function resolveViewMode(mode, width = window.innerWidth) {
  const normalizedMode = normalizeViewMode(mode);
  if (normalizedMode !== 'auto') {
    return normalizedMode;
  }

  return width >= VIEW_MODE_DESKTOP_MIN_WIDTH ? 'desktop' : 'mobile';
}

export function applyViewModeToDocument(state) {
  const preference = normalizeViewMode(state.settings?.viewMode);
  const resolved = resolveViewMode(preference);
  state.settings ??= {};
  state.settings.viewMode = preference;
  state.ui ??= {};
  state.ui.resolvedViewMode = resolved;

  document.documentElement.dataset.viewPreference = preference;
  document.documentElement.dataset.viewMode = resolved;
  return resolved;
}
