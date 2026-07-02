import { assetPath } from '../utils/assetPath.js';
import {
  getItemBonuses,
  getItemById,
  getItemDisplayName,
  getItemFullDescription,
  getItemShortDescription,
  localize,
} from '../data/itemCatalog.js';
import { getLanguage } from '../i18n/i18n.js';

export function formatItemPrice(item) {
  if (!item || !Number.isFinite(item.price) || item.price <= 0) {
    return '';
  }
  return `${item.price} ${item.currency === 'coins' ? 'грн' : item.currency}`;
}

export function formatBonusValue(bonus) {
  const value = Number(bonus?.value ?? 0);
  if (!Number.isFinite(value) || value === 0) {
    return '';
  }
  const sign = value > 0 ? '+' : '';
  if (Math.abs(value) < 1) {
    return `${sign}${Math.round(value * 100)}%`;
  }
  return `${sign}${value}`;
}

export function renderItemBonusChips(itemOrId, options = {}) {
  const locale = options.locale ?? getLanguage();
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  const bonuses = getItemBonuses(item, locale);
  const limit = options.limit ?? bonuses.length;
  const visible = bonuses.slice(0, limit);
  const extra = bonuses.length - visible.length;

  if (!bonuses.length) {
    return options.showEmpty
      ? `<span class="item-bonus-chip item-bonus-chip--neutral">${escapeHtml(locale === 'uk' ? 'Базовий предмет' : 'Basic item')}</span>`
      : '';
  }

  return `
    <div class="item-bonus-chips">
      ${visible.map((bonus) => `<span class="item-bonus-chip" title="${escapeHtml(bonus.labelText)}">${escapeHtml(bonus.shortLabelText)}</span>`).join('')}
      ${extra > 0 ? `<span class="item-bonus-chip item-bonus-chip--more">+${extra} ще</span>` : ''}
    </div>
  `;
}

export function renderItemCompactSummary(itemOrId, options = {}) {
  const locale = options.locale ?? getLanguage();
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  if (!item) {
    return '';
  }

  return `
    <div class="item-summary">
      <h3>${escapeHtml(getItemDisplayName(item, locale))}</h3>
      <p>${escapeHtml(getItemShortDescription(item, locale))}</p>
      ${renderItemBonusChips(item, { locale, limit: options.bonusLimit ?? 2 })}
    </div>
  `;
}

export function renderItemDetails(itemOrId, options = {}) {
  const locale = options.locale ?? getLanguage();
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  if (!item) {
    return '';
  }

  const usedFor = (item.usedFor ?? []).map((entry) => `<span>${escapeHtml(entry)}</span>`).join('');
  const tags = (item.tags ?? []).map((entry) => `<span>${escapeHtml(entry)}</span>`).join('');

  return `
    <div class="item-details">
      <p>${escapeHtml(getItemFullDescription(item, locale))}</p>
      ${renderItemBonusChips(item, { locale, showEmpty: true })}
      ${usedFor ? `<div class="item-detail-tags"><strong>${locale === 'uk' ? 'Підходить для' : 'Useful for'}</strong>${usedFor}</div>` : ''}
      ${tags ? `<div class="item-detail-tags"><strong>${locale === 'uk' ? 'Теги' : 'Tags'}</strong>${tags}</div>` : ''}
    </div>
  `;
}

export function itemIconMarkup(itemOrId, options = {}) {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  const src = item?.icon ? assetPath(item.icon) : assetPath('/assets/items/tackle_components.png');
  const fallback = assetPath(options.fallback ?? '/assets/items/tackle_components.png');
  const lazy = options.loading === 'eager' ? '' : ' loading="lazy" decoding="async"';
  const className = options.className ? ` class="${escapeHtml(options.className)}"` : '';
  return `<img${className} src="${src}"${lazy} onerror="this.src='${fallback}'" alt="" />`;
}

export function getCatalogCategoryLabel(category, locale = getLanguage()) {
  const labels = {
    bait: { en: 'Bait', uk: 'Наживки' },
    groundbait: { en: 'Groundbait', uk: 'Прикормки' },
    rod: { en: 'Rods', uk: 'Вудилища' },
    line: { en: 'Lines', uk: 'Жилки' },
    hook: { en: 'Hooks', uk: 'Гачки' },
    float: { en: 'Floats', uk: 'Поплавки' },
    tackle: { en: 'Tackle', uk: 'Снасть' },
    utility: { en: 'Utility', uk: 'Корисне' },
    other: { en: 'Other', uk: 'Різне' },
  };
  return localize(labels[category], locale) || category;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));
}
