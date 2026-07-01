import { FIRST_TACKLE_API_BASE_URL, loadCloudSession } from '../api/client.js';

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
      ${loggedIn ? loggedInMarkup(profile, metadata, message, isBusy) : loggedOutMarkup(message, isBusy)}
      <small class="cloud-save-panel__endpoint">${FIRST_TACKLE_API_BASE_URL}</small>
    </section>
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
    <p class="cloud-save-panel__note">Гра все ще працює без акаунта. Акаунт потрібен лише для хмарного збереження.</p>
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
    </dl>
    <div class="settings-action-row settings-action-row--stack">
      <button data-action="cloud:upload" type="button"${isBusy ? ' disabled' : ''}>Завантажити локальний сейв на сервер</button>
      <button data-action="cloud:download" type="button"${isBusy ? ' disabled' : ''}>Завантажити сейв із сервера</button>
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

