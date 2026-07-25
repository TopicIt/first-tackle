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
const fakeAudioElements = [];
class FakeAudio {
  constructor() {
    this.listeners = new Map();
    this.paused = true;
    this.volume = 1;
    this.loop = false;
    this.preload = '';
    this.src = '';
    fakeAudioElements.push(this);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type) {
    this.listeners.delete(type);
  }

  load() {}

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  dispatch(type) {
    this.listeners.get(type)?.();
  }
}

globalThis.Audio = FakeAudio;
globalThis.window = {
  AudioContext: class {
    state = 'running';
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
  },
};

const { PROFILE_NAME_MAX_LENGTH, validateProfileName } = await import('../src/game/profile.js');
const { apiConfig, apiRequest, saveCloudSession, setApiAccessToken } = await import('../src/api/client.js');
const { createAudioManager } = await import('../src/audio/audioManager.js');
const { musicTracks } = await import('../src/audio/soundConfig.js');
const { createInitialState } = await import('../src/game/state.js');
const {
  ensureFishState,
  getPendingCatchSyncCount,
  getPendingCatchSyncEntries,
  markCatchSyncSuccess,
} = await import('../src/game/fishInventory.js');
const { addFishToStorage, sellFish } = await import('../src/game/gameAuthority.js');
const { exportCloudSave } = await import('../src/game/save.js');
const { syncCatchRecords } = await import('../src/api/saveApi.js');
const {
  breakTackleComponent,
  ensureTackleState,
  isStarterRodBroken,
} = await import('../src/game/tackle.js');
const { castLine, openFishingMinigame } = await import('../src/game/fishingMinigameLogic.js');
const { gatherRodStick } = await import('../src/game/fishing.js');

assert.deepEqual(validateProfileName('  Івасик Телесик  '), {
  ok: true,
  value: 'Івасик Телесик',
  error: null,
});
assert.equal(validateProfileName("Мар'яна").ok, true);
assert.equal(validateProfileName('Latin Name').ok, true);
assert.equal(validateProfileName('   ').error, 'profileNameRequired');
assert.equal(validateProfileName('я'.repeat(PROFILE_NAME_MAX_LENGTH + 1)).error, 'profileNameTooLong');

const canalTrackIds = musicTracks.map((track) => track.id);
assert.ok(canalTrackIds.includes('canal_dusk_drive'));
assert.ok(canalTrackIds.includes('canal_dusk_drive_2'));
assert.ok(musicTracks.find((track) => track.id === 'canal_dusk_drive')?.sources[0].includes('Canal%20Dusk%20Drive.mp3'));
assert.ok(musicTracks.find((track) => track.id === 'canal_dusk_drive_2')?.sources[0].includes('Canal%20Dusk%20Drive%202.mp3'));

const originalAudioRandom = Math.random;
Math.random = () => 0;
const audioManager = createAudioManager({
  soundEnabled: false,
  musicEnabled: true,
  sfxVolume: 0,
  musicVolume: 0.25,
  musicTrackId: 'ambient_day',
  musicMode: 'random',
});
audioManager.activate();
const playedTrackIds = [audioManager.getCurrentTrackId()];
fakeAudioElements.at(-1).dispatch('ended');
playedTrackIds.push(audioManager.getCurrentTrackId());
fakeAudioElements.at(-1).dispatch('ended');
playedTrackIds.push(audioManager.getCurrentTrackId());
assert.deepEqual(new Set(playedTrackIds), new Set(['ambient_day', 'canal_dusk_drive', 'canal_dusk_drive_2']));
const previousCycleLast = audioManager.getCurrentTrackId();
fakeAudioElements.at(-1).dispatch('ended');
assert.notEqual(audioManager.getCurrentTrackId(), previousCycleLast);
assert.equal(fakeAudioElements.filter((entry) => !entry.paused).length, 1);

const failingAudioManager = createAudioManager({
  soundEnabled: false,
  musicEnabled: true,
  sfxVolume: 0,
  musicVolume: 0.25,
  musicTrackId: 'ambient_day',
  musicMode: 'random',
});
failingAudioManager.activate();
const failedTrackId = failingAudioManager.getCurrentTrackId();
fakeAudioElements.at(-1).dispatch('error');
assert.notEqual(failingAudioManager.getCurrentTrackId(), failedTrackId);
Math.random = originalAudioRandom;

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
  if (url.endsWith('/api/catches/sync')) {
    const body = JSON.parse(options.body ?? '{}');
    return jsonResponse(200, {
      ok: true,
      syncedCatchIds: (body.catches ?? []).map((entry) => entry.catchId ?? entry.id),
      syncedCount: (body.catches ?? []).length,
      rejectedCount: 0,
      rejected: [],
    });
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

const state = createInitialState();
state.playerProfile.setupComplete = true;
ensureFishState(state);
const storedCatch = addFishToStorage({
  state,
  catchResult: {
    id: 'carp',
    weightGrams: 1450,
    value: 220,
  },
  context: {
    waterId: 'greada',
    bait: 'corn',
    method: 'stickRod',
    catchSpotId: 'reed-pocket',
    caughtAtTime: '08:15',
  },
});
const catchEntry = storedCatch.result.entry;

assert.ok(catchEntry.catchId);
assert.ok(Date.parse(catchEntry.caughtAt));
assert.equal(getPendingCatchSyncCount(state), 1);
assert.equal(getPendingCatchSyncEntries(state)[0].catchId, catchEntry.catchId);
assert.equal(state.catchHistory.length, 1);
assert.equal(state.catchHistory[0].catchId, catchEntry.catchId);
assert.equal(state.fishBasket.length, 1);

sellFish({ state, saleType: 'all' });
assert.equal(state.fishBasket.length, 0);
assert.equal(state.catchHistory.length, 1);
assert.equal(getPendingCatchSyncCount(state), 1);

const exportedCloudSave = JSON.parse(exportCloudSave(state)).save;
assert.equal(exportedCloudSave.catchHistory.length, 1);
assert.equal(exportedCloudSave.catchHistory[0].catchId, catchEntry.catchId);
assert.deepEqual(exportedCloudSave.catchSync.pendingIds, []);

const catchSync = await syncCatchRecords({
  catches: getPendingCatchSyncEntries(state),
  sourceRevision: 3,
  clientUpdatedAt: new Date().toISOString(),
});
assert.deepEqual(catchSync.syncedCatchIds, [catchEntry.catchId]);
markCatchSyncSuccess(state, catchSync.syncedCatchIds);
assert.equal(getPendingCatchSyncCount(state), 0);

const pendingState = createInitialState();
ensureFishState(pendingState);
const pendingCatch = addFishToStorage({
  state: pendingState,
  catchResult: {
    id: 'okun',
    weightGrams: 190,
    value: 40,
  },
  context: {
    waterId: 'sluice',
    bait: 'worms',
    method: 'stickRod',
    catchSpotId: 'sluice_middle',
    caughtAtTime: '10:15',
  },
}).result.entry;
markCatchSyncSuccess(pendingState, []);
assert.equal(getPendingCatchSyncCount(pendingState), 1);
assert.equal(getPendingCatchSyncEntries(pendingState)[0].catchId, pendingCatch.catchId);

const rodState = createInitialState();
rodState.progress.starterTackleDrawerCompleted = true;
rodState.inventory.primitiveTackle = 1;
rodState.inventory.stickRod = 1;
rodState.tackle.owned.simple_stick_rod = true;
rodState.tackle.equipped.rod = 'simple_stick_rod';
ensureTackleState(rodState);
breakTackleComponent(rodState, 'simple_stick_rod');
ensureTackleState(rodState);
assert.equal(isStarterRodBroken(rodState), true);
assert.equal(rodState.inventory.stickRod, 0);
assert.equal(rodState.tackle.owned.simple_stick_rod, false);
assert.equal(rodState.tackle.equipped.rod, 'none');
openFishingMinigame(rodState, 'stickRod');
assert.equal(rodState.ui.fishingMinigame, null);
rodState.ui.fishingMinigame = {
  open: true,
  method: 'stickRod',
  selectedBait: 'worms',
  selectedSpot: 'dam_edge',
  phase: 'setup',
};
const minutesBeforeBrokenCast = rodState.time.minutes;
castLine(rodState, 1000);
assert.equal(rodState.time.minutes, minutesBeforeBrokenCast);
assert.equal(rodState.ui.fishingMinigame.statusKey, 'fishingRodBrokenBlocked');
const originalRandom = Math.random;
Math.random = () => 0;
gatherRodStick(rodState);
Math.random = originalRandom;
ensureTackleState(rodState);
assert.equal(isStarterRodBroken(rodState), false);
assert.equal(rodState.tackle.owned.simple_stick_rod, true);
assert.equal(rodState.inventory.stickRod, 1);
assert.equal(rodState.tackle.equipped.rod, 'simple_stick_rod');

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
