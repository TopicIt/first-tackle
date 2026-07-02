export function isLayoutDebugEnabled() {
  return hasQueryFlag('debugLayout')
    || getLocalFlag('first-tackle-debug-layout')
    || getLocalFlag('first-tackle-mobile-debug');
}

export function isSaveDebugEnabled() {
  return hasQueryFlag('debugSave')
    || getLocalFlag('first-tackle-debug-save')
    || getLocalFlag('first-tackle-save-debug');
}

function hasQueryFlag(key) {
  try {
    return new URLSearchParams(window.location.search).get(key) === '1'
      || new URLSearchParams(window.location.search).has(key);
  } catch {
    return false;
  }
}

function getLocalFlag(key) {
  try {
    return localStorage.getItem(key) === 'true' || localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
