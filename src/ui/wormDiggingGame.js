import './wormDiggingGame.css';
import { t } from '../i18n/i18n.js';

export function wormDiggingGameMarkup(state) {
  const game = state.ui?.wormDiggingGame;
  if (!game?.open) {
    return '';
  }

  const digs = game.digs ?? [];
  const searchedCount = digs.length || Object.keys(game.searched ?? {}).length;
  const modeKey = game.mode === 'dig' ? 'wormDigModeShovel' : 'wormDigModeStone';
  return `
    <section class="worm-digging" aria-label="${t('wormDigTitle')}">
      <div class="worm-digging__panel">
        <header class="worm-digging__header">
          <div>
            <p class="section-label">${t('wormDigMiniGameLabel')}</p>
            <h2>${t('wormDigTitle')}</h2>
            <strong class="worm-digging__mode">${t(modeKey)}</strong>
            <p>${t(game.messageKey ?? 'wormDigSubtitle')}</p>
          </div>
          <button class="worm-digging__close" data-action="worms:close" type="button" aria-label="${t('close')}">&times;</button>
        </header>
        <div class="worm-digging__field${game.mode === 'stone' ? ' worm-digging__field--stone' : ''}" data-worm-field role="button" tabindex="0" aria-label="${t('wormDigSubtitle')}">
          <span class="worm-digging__furrow worm-digging__furrow--one"></span>
          <span class="worm-digging__furrow worm-digging__furrow--two"></span>
          <span class="worm-digging__furrow worm-digging__furrow--three"></span>
          <span class="worm-digging__shovel" aria-hidden="true"></span>
          ${digs.map(digMarkup).join('')}
        </div>
        <footer class="worm-digging__footer">
          <strong>${t('wormDigProgress', { count: searchedCount })}</strong>
          <span>${t('wormDigFoundSummary', { worms: game.worms ?? 0, larvae: game.larvae ?? 0, nightcrawler: game.nightcrawler ?? 0 })}</span>
          <button data-action="worms:claim" type="button"${game.complete ? '' : ' disabled'}>
            ${t('wormDigClaim')}
          </button>
        </footer>
      </div>
    </section>
  `;
}

function digMarkup(dig) {
  const found = (dig.worms ?? 0) + (dig.larvae ?? 0) + (dig.nightcrawler ?? 0) > 0;
  return `
    <span class="worm-digging__hole${found ? ' has-worms' : ''}" style="--x:${dig.x}%;--y:${dig.y}%;">
      <span></span>
    </span>
  `;
}
