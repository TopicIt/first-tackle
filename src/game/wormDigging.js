import { addItem } from './inventory.js';
import { advanceTime } from './time.js';
import { nowSeconds, pushFeedback, pushLog, queueSound } from './state.js';

export const wormDigSpots = [
  { id: 'stoneRow', x: 18, y: 38, labelKey: 'wormSpotStoneRow' },
  { id: 'wetSoil', x: 36, y: 58, labelKey: 'wormSpotWetSoil' },
  { id: 'leafPile', x: 58, y: 32, labelKey: 'wormSpotLeafPile' },
  { id: 'compostEdge', x: 76, y: 62, labelKey: 'wormSpotCompostEdge' },
  { id: 'fenceShade', x: 26, y: 76, labelKey: 'wormSpotFenceShade' },
  { id: 'rootPatch', x: 66, y: 78, labelKey: 'wormSpotRootPatch' },
];

const REQUIRED_SEARCHES = 5;
const WORM_DIG_COOLDOWN = 8;

export function openWormDiggingGame(state) {
  state.timers ??= {};
  const cooldown = Math.max(0, (state.timers.wormSearchReadyAt ?? 0) - nowSeconds());
  if (cooldown > 0) {
    pushLog(state, 'logGardenCooldown', { seconds: Math.ceil(cooldown) });
    return false;
  }

  state.ui ??= {};
  state.ui.wormDiggingGame = {
    open: true,
    searched: {},
    worms: 0,
    larvae: 0,
    nightcrawler: 0,
    complete: false,
    messageKey: 'wormDigHint',
  };
  queueSound(state, 'open_scene');
  return true;
}

export function closeWormDiggingGame(state) {
  if (state.ui?.wormDiggingGame?.open) {
    state.ui.wormDiggingGame.open = false;
    queueSound(state, 'close_scene');
  }
}

export function searchWormDigSpot(state, spotId) {
  const game = state.ui?.wormDiggingGame;
  const spot = wormDigSpots.find((entry) => entry.id === spotId);
  if (!game?.open || !spot || game.searched?.[spotId]) {
    return false;
  }

  game.searched = { ...(game.searched ?? {}), [spotId]: true };
  const worms = 1 + Math.floor(Math.random() * 3);
  const larvae = Math.random() < 0.24 ? 1 : 0;
  game.worms = (game.worms ?? 0) + worms;
  game.larvae = (game.larvae ?? 0) + larvae;
  game.messageKey = larvae ? 'wormDigFoundLarvae' : 'wormDigFoundWorms';
  game.complete = Object.keys(game.searched).length >= REQUIRED_SEARCHES;
  queueSound(state, 'gather_bait');
  return true;
}

export function claimWormDiggingReward(state) {
  const game = state.ui?.wormDiggingGame;
  if (!game?.open || !game.complete) {
    return false;
  }

  const worms = Math.min(15, Math.max(8, game.worms + Math.floor(Math.random() * 4)));
  const larvae = game.larvae + (Math.random() < 0.32 ? 1 : 0);
  const nightcrawler = Math.random() < 0.18 ? 1 : 0;
  addItem(state, 'worms', worms);
  if (larvae > 0) {
    addItem(state, 'larvae', larvae);
  }
  if (nightcrawler > 0) {
    addItem(state, 'nightcrawler', nightcrawler);
  }

  state.timers ??= {};
  state.timers.wormSearchReadyAt = nowSeconds() + WORM_DIG_COOLDOWN;
  state.ui.wormDiggingGame.open = false;
  advanceTime(state, 25);
  pushFeedback(state, 'feedbackBait', { worms, larvaeText: larvae ? `, +${larvae} личинки` : '' }, 'bait');
  pushLog(state, 'logWormDigReward', {
    worms,
    larvaeText: larvae ? ` і ${larvae} личинки` : '',
    nightcrawlerText: nightcrawler ? ' і 1 виповзок' : '',
  });
  queueSound(state, 'gather_bait');
  return true;
}
