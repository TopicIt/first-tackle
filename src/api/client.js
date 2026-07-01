const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000';

export const apiConfig = {
  baseUrl: (import.meta.env.VITE_FIRST_TACKLE_API_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, ''),
  accessToken: null,
};

export function setApiAccessToken(token) {
  apiConfig.accessToken = token || null;
}

export function getApiAccessToken() {
  return apiConfig.accessToken;
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

