import { MAP_HOTSPOTS } from '../game/mapHotspots.js';
import { ROAD_CAR_LOOP_MS, ROAD_CAR_PATH } from '../game/mapPaths.js';
import { t } from '../i18n/i18n.js';
import './mapOverlay.css';

export function mapOverlayMarkup(state) {
  return `
    <section class="illustrated-map" aria-label="${t('mapHint')}">
      <div class="illustrated-map__image" aria-hidden="true"></div>
      <div class="illustrated-map__breath" aria-hidden="true"></div>
      <div class="illustrated-map__water" aria-hidden="true"></div>
      <div class="illustrated-map__car" aria-hidden="true">
        <span class="illustrated-map__car-shadow"></span>
        <span class="illustrated-map__car-body">
          <span class="illustrated-map__car-glass"></span>
          <span class="illustrated-map__car-light illustrated-map__car-light--front"></span>
          <span class="illustrated-map__car-light illustrated-map__car-light--rear"></span>
        </span>
        <span class="illustrated-map__car-wheel illustrated-map__car-wheel--front-left"></span>
        <span class="illustrated-map__car-wheel illustrated-map__car-wheel--front-right"></span>
        <span class="illustrated-map__car-wheel illustrated-map__car-wheel--rear-left"></span>
        <span class="illustrated-map__car-wheel illustrated-map__car-wheel--rear-right"></span>
      </div>
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

export function updateMapOverlayMotion(elapsedMs) {
  const car = document.querySelector('.illustrated-map__car');
  if (!car || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const pathPosition = getPathPosition((elapsedMs % ROAD_CAR_LOOP_MS) / ROAD_CAR_LOOP_MS);
  car.style.left = `${pathPosition.x}%`;
  car.style.top = `${pathPosition.y}%`;
  car.style.transform = `translate(-50%, -50%) rotate(${pathPosition.rotation}deg)`;
}

function getPathPosition(progress) {
  const segments = ROAD_CAR_PATH.length - 1;
  const scaled = progress * segments;
  const index = Math.floor(scaled);
  const nextIndex = (index + 1) % ROAD_CAR_PATH.length;
  const segmentProgress = scaled - index;
  const current = ROAD_CAR_PATH[index];
  const next = ROAD_CAR_PATH[nextIndex];

  return {
    x: lerp(current.x, next.x, segmentProgress),
    y: lerp(current.y, next.y, segmentProgress),
    rotation: lerp(current.rotation, next.rotation, segmentProgress),
  };
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}
