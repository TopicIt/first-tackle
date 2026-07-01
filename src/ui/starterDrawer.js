import { drawerClutter, drawerItemOrder, drawerItems, foundDrawerItemCount } from '../game/starterTackleDrawer.js';
import { t } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import './starterDrawer.css';

export function starterDrawerMarkup(state) {
  if (!state.ui?.starterTackleDrawerOpen) {
    return '';
  }

  const found = state.progress?.starterTackleDrawerFoundItems ?? {};
  const count = foundDrawerItemCount(state);
  const completed = Boolean(state.progress?.starterTackleDrawerCompleted);

  return `
    <section class="starter-drawer" aria-label="${t('drawerTitle')}">
      <div class="starter-drawer__panel">
        <header class="starter-drawer__header">
          <div>
            <p class="section-label">${t('drawerMiniGameLabel')}</p>
            <h2>${t('drawerTitle')}</h2>
            <p>${completed ? t('drawerCompletedMessage') : t('drawerHint')}</p>
          </div>
          <button class="starter-drawer__close" data-action="drawer:close" type="button" aria-label="${t('close')}">&times;</button>
        </header>
        <div class="starter-drawer__progress">
          <strong>${t('drawerFoundProgress', { count })}</strong>
          <ul>
            ${drawerItemOrder.map((id) => `
              <li class="${found[id] ? 'is-found' : ''}">
                <span>${found[id] ? '✓' : ''}</span>
                ${t(drawerItems[id].labelKey)}
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="starter-drawer__drawers">
          ${[0, 1].map((drawer) => drawerMarkup(drawer, found, completed)).join('')}
        </div>
        <footer class="starter-drawer__footer">
          <p>${state.ui?.starterTackleDrawerMessage ? t(state.ui.starterTackleDrawerMessage) : t('drawerJunkMessage')}</p>
          ${completed ? `
            <button data-action="drawer:goCanal" type="button">${t('drawerGoCanal')}</button>
            <button data-action="drawer:close" type="button">${t('close')}</button>
          ` : ''}
        </footer>
      </div>
    </section>
  `;
}

function drawerMarkup(drawer, found, completed) {
  return `
    <div class="starter-drawer__zone" style="--drawer-bg:url('${assetPath(`/assets/minigames/grandma-drawer/drawer-bg-${drawer + 1}.png`)}');">
      <div class="starter-drawer__handle" aria-hidden="true"></div>
      ${drawerClutter.filter((item) => item.drawer === drawer).map((item) => clutterMarkup(item, found, completed)).join('')}
    </div>
  `;
}

function clutterMarkup(item, found, completed) {
  const itemFound = Boolean(found[item.id]);
  const classes = [
    'starter-drawer__clutter',
    item.useful ? 'is-useful' : '',
    itemFound ? 'is-found' : '',
  ].filter(Boolean).join(' ');
  return `
    <button
      class="${classes}"
      style="--x:${item.x}%;--y:${item.y}%;"
      data-action="${item.useful ? `drawer:find:${item.id}` : `drawer:junk:${item.id}`}"
      type="button"
      ${completed || itemFound ? 'disabled' : ''}
      aria-label="${t(item.labelKey)}"
    >
      ${item.image ? `<img src="${assetPath(item.image)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" alt="" />` : ''}
      <span${item.image ? ' class="starter-drawer__mark-fallback"' : ''}>${item.mark}</span>
      <small>${t(item.labelKey)}</small>
    </button>
  `;
}
