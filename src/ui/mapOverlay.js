import { MAP_HOTSPOTS } from '../game/mapHotspots.js';
import { t } from '../i18n/i18n.js';
import './mapOverlay.css';

export function mapOverlayMarkup(state) {
  return `
    <section class="illustrated-map" aria-label="${t('mapHint')}">
      <div class="illustrated-map__image" aria-hidden="true"></div>
      <div class="illustrated-map__breath" aria-hidden="true"></div>
      <div class="illustrated-map__water" aria-hidden="true"></div>
      <div class="illustrated-map__car" aria-hidden="true"></div>
      <div class="illustrated-map__hotspots">
        ${MAP_HOTSPOTS.map((hotspot) => hotspotMarkup(hotspot, state)).join('')}
      </div>
    </section>
  `;
}

function hotspotMarkup(hotspot, state) {
  const selected = state.ui?.selectedHotspot === hotspot.id ? ' is-selected' : '';
  return `
    <button
      class="map-hotspot${selected}"
      data-action="open:${hotspot.scene}"
      style="--x: ${hotspot.x}%; --y: ${hotspot.y}%"
      type="button"
      aria-label="${t(hotspot.actionKey)}"
    >
      <span class="map-hotspot__ring"></span>
      <span class="map-hotspot__dot"></span>
      <span class="map-hotspot__label">${t(hotspot.labelKey)}</span>
    </button>
  `;
}
