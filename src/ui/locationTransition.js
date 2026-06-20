import './locationTransition.css';
import { t } from '../i18n/i18n.js';

export function locationTransitionMarkup(transition) {
  if (!transition) {
    return '';
  }

  const sources = (transition.videoSources ?? [])
    .map((source) => `<source src="${source.src}" type="${source.type}" />`)
    .join('');

  return `
    <section class="location-transition" data-location-transition="${transition.id}" aria-label="${t('transitionLoading')}">
      <img
        class="location-transition__fallback"
        src="${transition.fallbackImage}"
        onerror="this.onerror=null;this.src='${transition.fallbackImageAlt}'"
        alt=""
        aria-hidden="true"
      />
      <video
        class="location-transition__media"
        data-transition-video="true"
        muted
        playsinline
        preload="metadata"
      >
        ${sources}
      </video>
      <div class="location-transition__shade" aria-hidden="true"></div>
      <button class="location-transition__skip" data-action="transition:skip" type="button">${t('skipTransition')}</button>
      <span class="location-transition__fallback-note">${t('transitionLoading')}</span>
    </section>
  `;
}
