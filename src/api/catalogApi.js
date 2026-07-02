import { apiRequest } from './client.js';
import { itemCatalog } from '../data/itemCatalog.js';
import { localEconomyConfig, mergeEconomyConfig } from '../data/economyConfig.js';

let catalogCache = null;
let economyCache = null;
let dailyEventsCache = null;

export async function fetchItemCatalog() {
  if (catalogCache) {
    return catalogCache;
  }

  catalogCache = fetchWithFallback('/api/catalog/items', itemCatalog, 'catalog');
  return catalogCache;
}

export async function fetchCatalogItem(id) {
  const catalog = await fetchItemCatalog();
  return catalog.find((item) => item.id === id || item.aliasIds?.includes(id)) ?? null;
}

export async function fetchEconomyConfig() {
  if (economyCache) {
    return economyCache;
  }

  economyCache = fetchWithFallback('/api/economy/config', localEconomyConfig, 'economy')
    .then(mergeEconomyConfig);
  return economyCache;
}

export async function fetchDailyEvents() {
  if (dailyEventsCache) {
    return dailyEventsCache;
  }

  dailyEventsCache = fetchWithFallback('/api/events/daily', localEconomyConfig.events, 'daily events');
  return dailyEventsCache;
}

export function primeCatalogCache() {
  fetchItemCatalog();
  fetchEconomyConfig();
  fetchDailyEvents();
}

async function fetchWithFallback(path, fallback, label) {
  try {
    const result = await apiRequest(path);
    return result?.items ?? result?.events ?? result?.config ?? result;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn(`[catalog-api] Using local ${label} fallback`, error);
    }
    return fallback;
  }
}
