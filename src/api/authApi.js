import { apiRequest, setApiAccessToken } from './client.js';

export async function register(email, password, displayName) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
  setApiAccessToken(response.accessToken);
  return response;
}

export async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setApiAccessToken(response.accessToken);
  return response;
}

export async function refreshAuth(refreshToken) {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    token: null,
  });
  setApiAccessToken(response.accessToken);
  return response;
}

export async function getProfile() {
  return apiRequest('/profile/me');
}

