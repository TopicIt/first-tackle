import { apiRequest, clearCloudSession, saveCloudSession, setApiAccessToken, updateCloudSessionProfile } from './client.js';

export async function register(email, password, displayName) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
  setApiAccessToken(response.accessToken);
  saveCloudSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response;
}

export async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setApiAccessToken(response.accessToken);
  saveCloudSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response;
}

export async function refreshAuth(refreshToken) {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    token: null,
  });
  setApiAccessToken(response.accessToken);
  saveCloudSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response;
}

export async function getProfile() {
  const profile = await apiRequest('/profile/me');
  updateCloudSessionProfile(profile);
  return profile;
}

export function logout() {
  clearCloudSession();
}
