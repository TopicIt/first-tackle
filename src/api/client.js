export const FIRST_TACKLE_API_BASE_URL = 'https://first-tackle-api-production.up.railway.app';
const CLOUD_SESSION_KEY = 'first-tackle-cloud-session-v1';

export const apiConfig = {
  baseUrl: (import.meta.env?.VITE_FIRST_TACKLE_API_URL ?? FIRST_TACKLE_API_BASE_URL).replace(/\/$/, ''),
  accessToken: loadCloudSession()?.accessToken ?? null,
};

export function setApiAccessToken(token) {
  apiConfig.accessToken = token || null;
}

export function getApiAccessToken() {
  return apiConfig.accessToken;
}

export function loadCloudSession() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function saveCloudSession(session) {
  const nextSession = {
    ...(loadCloudSession() ?? {}),
    ...(session ?? {}),
    updatedAt: new Date().toISOString(),
  };
  if (!nextSession.accessToken && !nextSession.refreshToken) {
    clearCloudSession();
    return null;
  }
  try {
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(nextSession));
    setApiAccessToken(nextSession.accessToken);
    return nextSession;
  } catch {
    setApiAccessToken(nextSession.accessToken);
    return nextSession;
  }
}

export function updateCloudSessionProfile(profile) {
  const session = loadCloudSession();
  if (!session) {
    return null;
  }
  return saveCloudSession({ ...session, profile });
}

export function clearCloudSession() {
  try {
    localStorage.removeItem(CLOUD_SESSION_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  setApiAccessToken(null);
}

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { method = 'GET', body, token = apiConfig.accessToken } = {}) {
  const headers = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.detail
      ? formatApiDetail(payload.detail)
      : `API request failed with ${response.status}`;
    throw new ApiError(message, { status: response.status, details: payload });
  }

  return payload;
}

function formatApiDetail(detail) {
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail?.message) {
    return detail.message;
  }
  return 'API request failed';
}
