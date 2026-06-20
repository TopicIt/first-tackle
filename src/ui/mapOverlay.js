import { MAP_HOTSPOTS, MAP_HOTSPOT_DEBUG } from '../game/mapHotspots.js';
import { canOpenWaterFromMap, getLockedReasonKey, isFishingLocation } from '../game/locations.js';
import { t } from '../i18n/i18n.js';
import { worldMapAsset } from '../utils/worldMapAsset.js';
import './mapOverlay.css';

export function mapOverlayMarkup(state) {
  return `
    <section class="illustrated-map${MAP_HOTSPOT_DEBUG ? ' is-debugging-hotspots' : ''}" aria-label="${t('mapHint')}" data-map-asset="test-world-map-concept1">
      <div class="illustrated-map__frame">
        <img
          class="illustrated-map__image"
          src="${worldMapAsset.primary}"
          alt=""
          aria-hidden="true"
          onerror="this.onerror=null;this.src='${worldMapAsset.fallback}'"
        />
        <div class="illustrated-map__breath" aria-hidden="true"></div>
        <div class="illustrated-map__water" aria-hidden="true"></div>
        <div class="illustrated-map__hotspots">
          ${MAP_HOTSPOTS.map((hotspot) => hotspotMarkup(hotspot, state)).join('')}
        </div>
      </div>
    </section>
  `;
}

function hotspotMarkup(hotspot, state) {
  const selected = state.ui?.selectedHotspot === hotspot.id ? ' is-selected' : '';
  const locked = isFishingLocation(hotspot.scene) && !canOpenWaterFromMap(state, hotspot.scene);
  const lockedReason = locked ? getLockedReasonKey(state, hotspot.scene) : null;
  const shapeClass = ` map-hotspot--${hotspot.type ?? 'ellipse'}`;
  const style = hotspotStyle(hotspot);
  const ariaLabel = locked ? `${t(hotspot.labelKey)} - ${t(lockedReason)}` : t(hotspot.actionKey);
  const label = `${t(hotspot.labelKey)}${locked ? ` / ${t(lockedReason)}` : ''}`;

  return `
    <button
      class="map-hotspot${shapeClass}${selected}${locked ? ' is-locked' : ''}"
      data-action="${hotspot.action ?? `open:${hotspot.scene}`}"
      style="${style}"
      type="button"
      aria-label="${ariaLabel}"
    >
      <span class="map-hotspot__area"></span>
      <span class="map-hotspot__label">${label}</span>
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
