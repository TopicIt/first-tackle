import { FIRST_TACKLE_API_BASE_URL, loadCloudSession } from '../api/client.js';
import { getPlayerState } from '../game/playerState.js';
import { isLayoutDebugEnabled, isSaveDebugEnabled } from '../utils/debugFlags.js';

export function cloudSavePanelMarkup(state) {
  const session = loadCloudSession();
  const profile = session?.profile;
  const metadata = session?.saveMetadata;
  const message = state.ui?.cloudSave?.message ?? session?.lastMessage ?? '';
  const isBusy = Boolean(state.ui?.cloudSave?.busy);
  const loggedIn = Boolean(session?.accessToken);

  return `
    <section class="settings-block cloud-save-panel">
      <p class="section-label">Хмарне збереження</p>
      <p class="cloud-save-panel__note">Гість зберігає прогрес на цьому пристрої. Після входу синхронізація з хмарою стає основним способом збереження, а локальний кеш лишається резервом.</p>
      ${loggedIn ? loggedInMarkup(profile, metadata, message, isBusy) : loggedOutMarkup(message, isBusy)}
      ${isSaveDebugEnabled() ? `<small class="cloud-save-panel__endpoint">${FIRST_TACKLE_API_BASE_URL}</small>` : ''}
    </section>
  `;
}

export function cloudSaveShortcutMarkup(state) {
  const session = loadCloudSession();
  const profile = session?.profile;
  const metadata = session?.saveMetadata;
  const message = state.ui?.cloudSave?.message ?? session?.lastMessage ?? '';
  const loggedIn = Boolean(session?.accessToken);
  const account = profile?.email || profile?.displayName || 'акаунт активний';
  const status = loggedIn
    ? `${account}${metadata?.serverUpdatedAt ? ` · ${formatServerTime(metadata.serverUpdatedAt)}` : ''}`
    : 'Увійдіть, щоб увімкнути хмарне автозбереження';

  return `
    <section class="cloud-save-shortcut" aria-label="Хмарне збереження">
      <div>
        <strong>Хмарне збереження</strong>
        <span>${escapeHtml(status)}</span>
        ${message ? `<small>${escapeHtml(message)}</small>` : ''}
      </div>
      <button data-action="cloud:open" type="button">Відкрити</button>
    </section>
  `;
}

export function cloudSaveMenuMarkup(state) {
  const session = loadCloudSession();
  const playerState = getPlayerState(state);
  const profile = session?.profile;
  const metadata = session?.saveMetadata;
  const cloudState = state.ui?.cloudSave ?? {};
  const message = cloudState.message ?? session?.lastMessage ?? '';
  const busy = Boolean(cloudState.busy);
  const loggedIn = Boolean(session?.accessToken);
  const account = profile?.email || profile?.displayName || 'акаунт активний';
  const lastSave = formatServerTime(metadata?.serverUpdatedAt);
  const primaryStatus = busy
    ? 'Синхронізація...'
    : loggedIn
      ? 'Хмарне автозбереження увімкнено'
      : 'Гість';
  const secondaryStatus = loggedIn
    ? `${account}${lastSave !== 'немає' ? ` · Останнє хмарне збереження: ${lastSave}` : ' · Хмарного збереження ще немає'}`
    : 'Прогрес зберігається на цьому пристрої';
  const revisionText = isLayoutDebugEnabled() ? ` · Ревізія: ${playerState.revision ?? 0}` : '';
  const localStateText = loggedIn
    ? `Акаунт підключено${revisionText}`
    : `Гість · прогрес збережено на цьому пристрої${revisionText}`;

  return `
    <section class="cloud-save-shortcut cloud-save-shortcut--menu${loggedIn ? ' is-connected' : ''}${busy ? ' is-syncing' : ''}" aria-label="Хмарне збереження">
      <div>
        <strong>Хмарне збереження</strong>
        <span>${escapeHtml(primaryStatus)}</span>
        <small>${escapeHtml(secondaryStatus)}</small>
        <small class="cloud-save-shortcut__state">${escapeHtml(localStateText)}</small>
      </div>
      <div class="cloud-save-shortcut__actions">
        ${loggedIn ? `
          <button data-action="cloud:upload" type="button"${busy ? ' disabled' : ''}>Синхронізувати зараз</button>
          <button data-action="cloud:download" type="button"${busy ? ' disabled' : ''}>Завантажити з хмари</button>
          <button data-action="cloud:logout" type="button"${busy ? ' disabled' : ''}>Вийти</button>
        ` : `
          <button data-action="cloud:open" type="button"${busy ? ' disabled' : ''}>Увійти для хмари</button>
        `}
      </div>
      ${message ? `<small>${escapeHtml(message)}</small>` : ''}
    </section>
  `;
}

export function cloudSaveHintMarkup(state) {
  if (state.ui?.cloudSaveHintDismissed) {
    return '';
  }

  return `
    <aside class="cloud-save-hint" aria-label="Хмарне збереження">
      <div>
        <strong>Хмарне збереження доступне</strong>
        <span>Грати можна і без входу. Акаунт додає синхронізацію та безпечне хмарне автозбереження.</span>
      </div>
      <div class="cloud-save-hint__actions">
        <button data-action="cloud:open" type="button">Відкрити</button>
        <button data-action="cloud:dismissHint" type="button" aria-label="Приховати підказку">&times;</button>
      </div>
    </aside>
  `;
}

function loggedOutMarkup(message, isBusy) {
  return `
    <form class="cloud-save-form" data-cloud-auth-form>
      <label>
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" inputmode="email" required />
      </label>
      <label>
        <span>Пароль</span>
        <input name="password" type="password" autocomplete="current-password" minlength="8" required />
      </label>
      <label>
        <span>Ім'я для реєстрації</span>
        <input name="displayName" type="text" autocomplete="name" maxlength="80" />
      </label>
      <div class="settings-action-row">
        <button name="mode" value="register" type="submit"${isBusy ? ' disabled' : ''}>Зареєструватися</button>
        <button name="mode" value="login" type="submit"${isBusy ? ' disabled' : ''}>Увійти</button>
      </div>
    </form>
    <p class="cloud-save-panel__note">Гість: прогрес зберігається на цьому пристрої. Увійдіть для хмарної синхронізації.</p>
    ${messageMarkup(message)}
  `;
}

function loggedInMarkup(profile, metadata, message, isBusy) {
  return `
    <div class="cloud-save-panel__account">
      <strong>${escapeHtml(profile?.displayName ?? 'Гравець')}</strong>
      <span>${escapeHtml(profile?.email ?? '')}</span>
    </div>
    <dl class="cloud-save-panel__status">
      <div><dt>Ревізія сервера</dt><dd>${metadata?.revision ?? 'немає'}</dd></div>
      <div><dt>Оновлено</dt><dd>${formatServerTime(metadata?.serverUpdatedAt)}</dd></div>
      <div><dt>Автозбереження</dt><dd>увімкнено</dd></div>
    </dl>
    <div class="settings-action-row settings-action-row--stack">
      <button data-action="cloud:upload" type="button"${isBusy ? ' disabled' : ''}>Синхронізувати зараз</button>
      <button data-action="cloud:download" type="button"${isBusy ? ' disabled' : ''}>Завантажити з хмари</button>
      <button data-action="cloud:logout" type="button"${isBusy ? ' disabled' : ''}>Вийти</button>
    </div>
    ${messageMarkup(message)}
  `;
}

function messageMarkup(message) {
  return message ? `<p class="cloud-save-panel__message">${escapeHtml(message)}</p>` : '';
}

function formatServerTime(value) {
  if (!value) {
    return 'немає';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
