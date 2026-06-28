import './wormDiggingGame.css';
import { wormDigSpots } from '../game/wormDigging.js';
import { t } from '../i18n/i18n.js';

export function wormDiggingGameMarkup(state) {
  const game = state.ui?.wormDiggingGame;
  if (!game?.open) {
    return '';
  }

  const searchedCount = Object.keys(game.searched ?? {}).length;
  return `
    <section class="worm-digging" aria-label="${t('wormDigTitle')}">
      <div class="worm-digging__panel">
        <header class="worm-digging__header">
          <div>
            <p class="section-label">${t('wormDigMiniGameLabel')}</p>
            <h2>${t('wormDigTitle')}</h2>
            <p>${t(game.messageKey ?? 'wormDigHint')}</p>
          </div>
          <button class="worm-digging__close" data-action="worms:close" type="button" aria-label="${t('close')}">&times;</button>
        </header>
        <div class="worm-digging__field">
          <span class="worm-digging__furrow worm-digging__furrow--one"></span>
          <span class="worm-digging__furrow worm-digging__furrow--two"></span>
          <span class="worm-digging__furrow worm-digging__furrow--three"></span>
          ${wormDigSpots.map((spot) => spotMarkup(spot, game.searched?.[spot.id])).join('')}
        </div>
        <footer class="worm-digging__footer">
          <strong>${t('wormDigProgress', { count: searchedCount })}</strong>
          <span>${t('wormDigFoundSummary', { worms: game.worms ?? 0, larvae: game.larvae ?? 0 })}</span>
          <button data-action="worms:claim" type="button"${game.complete ? '' : ' disabled'}>
            ${t('wormDigClaim')}
          </button>
        </footer>
      </div>
    </section>
  `;
}

function spotMarkup(spot, searched) {
  return `
    <button
      class="worm-digging__spot${searched ? ' is-searched' : ''}"
      style="--x:${spot.x}%;--y:${spot.y}%;"
      data-action="worms:spot:${spot.id}"
      type="button"
      ${searched ? 'disabled' : ''}
      aria-label="${t(spot.labelKey)}"
      title="${t(spot.labelKey)}"
    >
      <span></span>
    </button>
  `;
}
