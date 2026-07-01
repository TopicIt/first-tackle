import { apiRequest } from './client.js';

export async function loadSave() {
  return apiRequest('/save/load');
}

export async function getSaveStatus() {
  return apiRequest('/save/status');
}

export async function syncSave({ saveVersion, revision, clientUpdatedAt, payload, checksum }) {
  return apiRequest('/save/sync', {
    method: 'POST',
    body: {
      saveVersion,
      revision,
      clientUpdatedAt,
      payload,
      checksum,
    },
  });
}

