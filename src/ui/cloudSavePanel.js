import { FIRST_TACKLE_API_BASE_URL, loadCloudSession } from '../api/client.js';
import { getPlayerState } from '../game/playerState.js';
import { isLayoutDebugEnabled, isSaveDebugEnabled } from '../utils/debugFlags.js';

export function cloudSavePanelMarkup(state) {
  const model = getCloudSaveModel(state);

  return `
    <section class="settings-block cloud-save-panel">
      <p class="section-label">Хмарне збереження</p>
      <p class="cloud-save-panel__note">Гість зберігає прогрес на цьому пристрої. Після входу хмара синхронізує прогрес і лишає локальний кеш резервом.</p>
      ${model.loggedIn
        ? loggedInMarkup(model.profile, model.metadata, model.message, model.busy, model.conflict)
        : loggedOutMarkup(model.message, model.busy)}
      ${isSaveDebugEnabled() ? `<small class="cloud-save-panel__endpoint">${FIRST_TACKLE_API_BASE_URL}</small>` : ''}
    </section>
  `;
}

export function cloudSaveShortcutMarkup(state) {
  const model = getCloudSaveModel(state);
  const status = model.loggedIn
    ? `${model.account}${model.metadata?.serverUpdatedAt ? ` · ${formatServerTime(model.metadata.serverUpdatedAt)}` : ''}`
    : 'Увійдіть, щоб увімкнути хмарне автозбереження';

  return `
    <section class="cloud-save-shortcut" aria-label="Хмарне збереження">
      <div>
        <strong>Хмарне збереження</strong>
        <span>${escapeHtml(status)}</span>
        ${model.message ? `<small>${escapeHtml(model.message)}</small>` : ''}
      </div>
      <button data-action="cloud:open" type="button">Відкрити</button>
    </section>
  `;
}

export function cloudSaveMenuMarkup(state) {
  const model = getCloudSaveModel(state);
  const expanded = model.busy || Boolean(model.message);
  const revisionText = isLayoutDebugEnabled() ? ` · Ревізія: ${model.playerState.revision ?? 0}` : '';
  const primaryStatus = model.busy
    ? 'Синхронізація...'
    : model.loggedIn
      ? 'Хмарне автозбереження увімкнено'
      : 'Гість';
  const secondaryStatus = model.loggedIn
    ? `${model.account}${model.lastSave !== 'немає' ? ` · Останнє хмарне збереження: ${model.lastSave}` : ' · Хмарного збереження ще немає'}`
    : 'Прогрес зберігається на цьому пристрої';
  const localStateText = model.loggedIn
    ? `Акаунт підключено${revisionText}`
    : `Гість · прогрес збережено локально${revisionText}`;

  return `
    <details class="cloud-save-shortcut cloud-save-shortcut--menu${model.loggedIn ? ' is-connected' : ''}${model.busy ? ' is-syncing' : ''}" aria-label="Хмарне збереження"${expanded ? ' open' : ''}>
      <summary class="cloud-save-shortcut__summary">
        <div>
          <strong>Хмарне збереження</strong>
          <span>${escapeHtml(primaryStatus)}</span>
          <small>${escapeHtml(secondaryStatus)}</small>
          <small class="cloud-save-shortcut__state">${escapeHtml(localStateText)}</small>
        </div>
        <span class="cloud-save-shortcut__chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="cloud-save-shortcut__body">
        ${model.loggedIn
          ? loggedInActionsMarkup(model.profile, model.metadata, model.message, model.busy, model.conflict)
          : loggedOutMarkup(model.message, model.busy, {
              compact: true,
              displayName: state.playerProfile?.name,
              displayNameFromProfile: true,
            })}
      </div>
    </details>
  `;
}

export function cloudSaveStartupMarkup(state) {
  const model = getCloudSaveModel(state);
  const playerName = state.playerProfile?.name ?? '';
  const expanded = model.loggedIn || model.busy || Boolean(model.message);

  return `
    <details class="cloud-save-shortcut cloud-save-shortcut--startup${model.loggedIn ? ' is-connected' : ''}${model.busy ? ' is-syncing' : ''}" aria-label="Хмарне збереження"${expanded ? ' open' : ''}>
      <summary class="cloud-save-shortcut__summary">
        <div>
          <strong>Хмарне збереження</strong>
          <span>${model.loggedIn ? 'Акаунт підключено' : 'Опційно: увійти або створити акаунт'}</span>
          <small>${model.loggedIn ? escapeHtml(model.account) : 'Можна продовжити локально і підключити хмару пізніше.'}</small>
        </div>
        <span class="cloud-save-shortcut__chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="cloud-save-shortcut__body">
        ${model.loggedIn
          ? loggedInActionsMarkup(model.profile, model.metadata, model.message, model.busy, model.conflict)
          : loggedOutMarkup(model.message, model.busy, {
              compact: true,
              displayName: playerName,
              displayNameFromProfile: true,
              note: 'Реєстрація використає імʼя профілю вище. Якщо акаунт уже є, увійдіть і завантажте хмарний сейв перед локальним стартом.',
            })}
      </div>
    </details>
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
        <span>Грати можна і без входу. Акаунт додає синхронізацію та безпечніше хмарне автозбереження.</span>
      </div>
      <div class="cloud-save-hint__actions">
        <button data-action="cloud:open" type="button">Відкрити</button>
        <button data-action="cloud:dismissHint" type="button" aria-label="Приховати підказку">&times;</button>
      </div>
    </aside>
  `;
}

function getCloudSaveModel(state) {
  const session = loadCloudSession();
  const profile = session?.profile;
  const metadata = session?.saveMetadata;
  const cloudState = state.ui?.cloudSave ?? {};
  const message = cloudState.message ?? session?.lastMessage ?? '';
  const busy = Boolean(cloudState.busy);
  const conflict = cloudState.conflict ?? null;
  const loggedIn = Boolean(session?.accessToken);
  const account = profile?.email || profile?.displayName || 'акаунт активний';
  const playerState = getPlayerState(state);

  return {
    session,
    profile,
    metadata,
    playerState,
    message,
    busy,
    conflict,
    loggedIn,
    account,
    lastSave: formatServerTime(metadata?.serverUpdatedAt),
  };
}

function loggedOutMarkup(message, isBusy, options = {}) {
  const {
    compact = false,
    displayName = '',
    displayNameFromProfile = false,
    note = 'Гість: прогрес зберігається на цьому пристрої. Увійдіть для хмарної синхронізації.',
  } = options;
  const displayNameValue = String(displayName ?? '').trim();

  return `
    <form class="cloud-save-form${compact ? ' cloud-save-form--compact' : ''}" data-cloud-auth-form>
      <label>
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" inputmode="email" required />
      </label>
      <label>
        <span>Пароль</span>
        <input name="password" type="password" autocomplete="current-password" minlength="8" required />
      </label>
      <label class="cloud-save-form__remember">
        <input name="rememberMe" type="checkbox" checked />
        <span>Запамʼятати мене</span>
      </label>
      ${displayNameFromProfile ? `
        <input name="displayName" type="hidden" value="${escapeHtml(displayNameValue)}" data-cloud-profile-name />
      ` : `
        <label>
          <span>Імʼя для реєстрації</span>
          <input name="displayName" type="text" autocomplete="name" maxlength="80" />
        </label>
      `}
      <div class="settings-action-row">
        <button name="mode" value="register" type="submit"${isBusy ? ' disabled' : ''}>Зареєструватися</button>
        <button name="mode" value="login" type="submit"${isBusy ? ' disabled' : ''}>Увійти</button>
      </div>
    </form>
    ${note ? `<p class="cloud-save-panel__note">${escapeHtml(note)}</p>` : ''}
    ${displayNameFromProfile && displayNameValue ? `<p class="cloud-save-panel__note">Імʼя акаунта: <strong>${escapeHtml(displayNameValue)}</strong></p>` : ''}
    ${messageMarkup(message)}
  `;
}

function loggedInMarkup(profile, metadata, message, isBusy, conflict = null) {
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
    ${loggedInActionsMarkup(profile, metadata, message, isBusy, conflict)}
  `;
}

function loggedInActionsMarkup(profile, metadata, message, isBusy, conflict = null) {
  void profile;
  void metadata;
  return `
    ${conflict ? `
      <div class="cloud-save-conflict">
        <strong>Є хмарне збереження</strong>
        <span>Обери, що зробити з поточним прогресом.</span>
        <div class="settings-action-row settings-action-row--stack">
          <button data-action="cloud:conflict:download" type="button"${isBusy ? ' disabled' : ''}>Завантажити хмарне збереження</button>
          <button data-action="cloud:conflict:upload" type="button"${isBusy ? ' disabled' : ''}>Перезаписати хмару поточним прогресом</button>
          <button data-action="cloud:conflict:local" type="button"${isBusy ? ' disabled' : ''}>Продовжити локально</button>
        </div>
      </div>
    ` : ''}
    <div class="settings-action-row settings-action-row--stack cloud-save-shortcut__actions">
      <button data-action="cloud:upload" type="button"${isBusy ? ' disabled' : ''}>Зберегти зараз</button>
      <button data-action="cloud:download" type="button"${isBusy ? ' disabled' : ''}>Завантажити останнє збереження</button>
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
