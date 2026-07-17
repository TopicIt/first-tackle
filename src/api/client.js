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
    const raw = localStorage.getItem(CLOUD_SESSION_KEY)
      ?? sessionStorage.getItem(CLOUD_SESSION_KEY);
    return JSON.parse(raw ?? 'null');
  } catch {
    return null;
  }
}

export function saveCloudSession(session) {
  const existingSession = loadCloudSession() ?? {};
  const nextSession = {
    ...existingSession,
    ...(session ?? {}),
    updatedAt: new Date().toISOString(),
  };
  if (!nextSession.accessToken && !nextSession.refreshToken) {
    clearCloudSession();
    return null;
  }
  try {
    const storage = nextSession.rememberMe === false ? sessionStorage : localStorage;
    const otherStorage = nextSession.rememberMe === false ? localStorage : sessionStorage;
    storage.setItem(CLOUD_SESSION_KEY, JSON.stringify(nextSession));
    otherStorage.removeItem(CLOUD_SESSION_KEY);
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
    sessionStorage.removeItem(CLOUD_SESSION_KEY);
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

export async function apiRequest(path, {
  method = 'GET',
  body,
  token = apiConfig.accessToken,
  retryAuth = true,
} = {}) {
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
    if (response.status === 401 && retryAuth && path !== '/auth/refresh') {
      const refreshedToken = await refreshAccessTokenForRequest();
      if (refreshedToken) {
        return apiRequest(path, {
          method,
          body,
          token: refreshedToken,
          retryAuth: false,
        });
      }
    }
    const message = typeof payload === 'object' && payload?.detail
      ? formatApiDetail(payload.detail)
      : `API request failed with ${response.status}`;
    throw new ApiError(message, { status: response.status, details: payload });
  }

  return payload;
}

async function refreshAccessTokenForRequest() {
  const session = loadCloudSession();
  if (!session?.refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiConfig.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!response.ok) {
      return null;
    }
    const tokens = await response.json();
    if (!tokens?.accessToken) {
      return null;
    }
    saveCloudSession({
      ...session,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? session.refreshToken,
    });
    return tokens.accessToken;
  } catch {
    return null;
  }
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
