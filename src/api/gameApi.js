import { ApiError, apiRequest } from './client.js';

function failureResult(error, fallbackMessage) {
  return {
    ok: false,
    error: {
      message: error?.message || fallbackMessage,
      status: error instanceof ApiError ? error.status : null,
      details: error instanceof ApiError ? error.details : null,
    },
  };
}

async function safeGameRequest(path, { method = 'GET', body } = {}, fallbackMessage = 'Game API request failed') {
  try {
    const result = await apiRequest(path, { method, body });
    return { ok: true, result };
  } catch (error) {
    return failureResult(error, fallbackMessage);
  }
}

export function fetchGameConfig() {
  return safeGameRequest('/api/game/config', {}, 'Could not load game config from server');
}

export function resolveCatchOnServer(payload) {
  return safeGameRequest(
    '/api/game/catch/resolve',
    { method: 'POST', body: payload },
    'Could not resolve catch on server',
  );
}

export function buyItemOnServer(payload) {
  return safeGameRequest(
    '/api/game/shop/buy',
    { method: 'POST', body: payload },
    'Could not buy item on server',
  );
}

export function sellFishOnServer(payload) {
  return safeGameRequest(
    '/api/game/fish/sell',
    { method: 'POST', body: payload },
    'Could not sell fish on server',
  );
}

export function fetchGameProfile() {
  return safeGameRequest('/api/game/profile', {}, 'Could not load game profile from server');
}

export function syncGameProfile(payload) {
  return safeGameRequest(
    '/api/game/profile/sync',
    { method: 'POST', body: payload },
    'Could not sync game profile with server',
  );
}

export function fetchLeaderboard(type = 'biggest-fish') {
  const leaderboardType = encodeURIComponent(type);
  return safeGameRequest(
    `/api/leaderboard/${leaderboardType}`,
    {},
    'Could not load leaderboard from server',
  );
}
