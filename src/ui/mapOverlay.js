import { MAP_HOTSPOTS } from '../game/mapHotspots.js';
import { t } from '../i18n/i18n.js';
import { assetPath } from '../utils/assetPath.js';
import './mapOverlay.css';

export function mapOverlayMarkup(state) {
  const mapImageStyle = `--illustrated-map-image: url('${assetPath('/assets/locations/world_map_concept.png')}')`;
  return `
    <section class="illustrated-map" style="${mapImageStyle}" aria-label="${t('mapHint')}">
      <div class="illustrated-map__image" aria-hidden="true"></div>
      <div class="illustrated-map__breath" aria-hidden="true"></div>
      <div class="illustrated-map__water" aria-hidden="true"></div>
      <div class="illustrated-map__hotspots">
        ${MAP_HOTSPOTS.map((hotspot) => hotspotMarkup(hotspot, state)).join('')}
      </div>
    </section>
  `;
}

function hotspotMarkup(hotspot, state) {
  const selected = state.ui?.selectedHotspot === hotspot.id ? ' is-selected' : '';
  const shapeClass = ` map-hotspot--${hotspot.type ?? 'ellipse'}`;
  const style = hotspotStyle(hotspot);
  return `
    <button
      class="map-hotspot${shapeClass}${selected}"
      data-action="open:${hotspot.scene}"
      style="${style}"
      type="button"
      aria-label="${t(hotspot.actionKey)}"
    >
      <span class="map-hotspot__area"></span>
      <span class="map-hotspot__label">${t(hotspot.labelKey)}</span>
    </button>
  `;
}

export function updateMapOverlayMotion(elapsedMs) {
  void elapsedMs;
}

function hotspotStyle(hotspot) {
  if (hotspot.type === 'polygon') {
    return [
      `--points: polygon(${hotspot.points})`,
      `--label-x: ${hotspot.labelX}%`,
      `--label-y: ${hotspot.labelY}%`,
    ].join(';');
  }

  return [
    `--x: ${hotspot.x}%`,
    `--y: ${hotspot.y}%`,
    `--w: ${hotspot.width}%`,
    `--h: ${hotspot.height}%`,
    `--label-x: ${hotspot.x}%`,
    `--label-y: ${hotspot.y}%`,
  ].join(';');
}
