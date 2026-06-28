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
    digs: [],
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

export function digWormSoil(state, xPercent, yPercent) {
  const game = state.ui?.wormDiggingGame;
  if (!game?.open || game.complete) {
    return false;
  }

  const digs = game.digs ?? [];
  if (digs.length >= REQUIRED_SEARCHES) {
    game.complete = true;
    return false;
  }

  const x = clamp(Number(xPercent), 5, 95);
  const y = clamp(Number(yPercent), 8, 92);
  const moistBonus = y > 46 && y < 84 ? 0.16 : 0;
  const compostBonus = x > 58 && y > 48 ? 0.12 : 0;
  const found = Math.random() < 0.58 + moistBonus + compostBonus;
  const worms = found ? 1 + Math.floor(Math.random() * 3) : 0;
  const larvae = found && Math.random() < 0.22 ? 1 : 0;
  const nightcrawler = found && y > 58 && Math.random() < 0.08 ? 1 : 0;

  game.digs = [
    ...digs,
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x,
      y,
      worms,
      larvae,
      nightcrawler,
    },
  ];
  game.searched = Object.fromEntries(game.digs.map((dig, index) => [String(index), true]));
  game.worms = (game.worms ?? 0) + worms;
  game.larvae = (game.larvae ?? 0) + larvae;
  game.nightcrawler = (game.nightcrawler ?? 0) + nightcrawler;
  game.messageKey = found ? (larvae || nightcrawler ? 'wormDigFoundLarvae' : 'wormDigFoundWorms') : 'wormDigEmpty';
  game.complete = game.digs.length >= REQUIRED_SEARCHES;
  queueSound(state, found ? 'gather_bait' : 'water_ripple');
  return true;
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
  const nightcrawler = (game.nightcrawler ?? 0) + (Math.random() < 0.12 ? 1 : 0);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
