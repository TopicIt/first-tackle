export const localEconomyConfig = {
  version: '2026-07-catalog-pass-1',
  currency: 'coins',
  market: {
    buyMultiplier: 1,
    sellMultiplier: 1,
  },
  progression: {
    startingCoins: 1000,
    dailyBonusCoins: 0,
  },
  events: [
    {
      id: 'quiet-market-day',
      title: {
        en: 'Quiet market day',
        uk: 'Спокійний день на ринку',
      },
      description: {
        en: 'No active modifiers yet. This placeholder keeps the daily event shape ready for the backend.',
        uk: 'Поки без активних модифікаторів. Ця подія готує формат для майбутнього бекенду.',
      },
      modifiers: [],
    },
  ],
};

export function mergeEconomyConfig(remoteConfig = null) {
  if (!remoteConfig || typeof remoteConfig !== 'object') {
    return localEconomyConfig;
  }

  return {
    ...localEconomyConfig,
    ...remoteConfig,
    market: {
      ...localEconomyConfig.market,
      ...(remoteConfig.market ?? {}),
    },
    progression: {
      ...localEconomyConfig.progression,
      ...(remoteConfig.progression ?? {}),
    },
    events: Array.isArray(remoteConfig.events) ? remoteConfig.events : localEconomyConfig.events,
  };
}
