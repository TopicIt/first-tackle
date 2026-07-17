import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const { PROFILE_NAME_MAX_LENGTH, validateProfileName } = await import('../src/game/profile.js');
const { apiConfig, apiRequest, saveCloudSession, setApiAccessToken } = await import('../src/api/client.js');

assert.deepEqual(validateProfileName('  Івасик Телесик  '), {
  ok: true,
  value: 'Івасик Телесик',
  error: null,
});
assert.equal(validateProfileName("Мар'яна").ok, true);
assert.equal(validateProfileName('Latin Name').ok, true);
assert.equal(validateProfileName('   ').error, 'profileNameRequired');
assert.equal(validateProfileName('я'.repeat(PROFILE_NAME_MAX_LENGTH + 1)).error, 'profileNameTooLong');

saveCloudSession({
  accessToken: 'expired-token',
  refreshToken: 'valid-refresh-token',
  rememberMe: true,
});
setApiAccessToken('expired-token');

const requests = [];
globalThis.fetch = async (url, options = {}) => {
  requests.push({ url, options });
  if (url.endsWith('/auth/refresh')) {
    return jsonResponse(200, {
      accessToken: 'fresh-token',
      refreshToken: 'fresh-refresh-token',
    });
  }
  if (requests.filter((request) => request.url.endsWith('/save/sync')).length === 1) {
    return jsonResponse(401, { detail: 'Token expired' });
  }
  return jsonResponse(200, {
    metadata: { exists: true, revision: 3 },
  });
};

const result = await apiRequest('/save/sync', {
  method: 'POST',
  body: { saveVersion: 1, revision: 2, payload: {} },
});

assert.equal(result.metadata.revision, 3);
assert.equal(requests.length, 3);
assert.equal(requests[2].options.headers.Authorization, 'Bearer fresh-token');
assert.equal(apiConfig.accessToken, 'fresh-token');

console.log('Focused profile/cloud smoke passed.');

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null,
    },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}
