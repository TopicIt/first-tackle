import { MAP_HOTSPOTS } from '../game/mapHotspots.js';
import { ROAD_CAR_LOOP_MS, ROAD_CAR_PATH, ROAD_CAR_VISIBLE_RATIO } from '../game/mapPaths.js';
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
  const car = document.querySelector('.illustrated-map__car');
  if (!car || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (car) {
      car.classList.remove('is-visible');
    }
    return;
  }

  const cycleProgress = (elapsedMs % ROAD_CAR_LOOP_MS) / ROAD_CAR_LOOP_MS;
  if (cycleProgress > ROAD_CAR_VISIBLE_RATIO) {
    car.classList.remove('is-visible');
    return;
  }

  const pathPosition = getPathPosition(cycleProgress / ROAD_CAR_VISIBLE_RATIO);
  car.style.left = `${pathPosition.x}%`;
  car.style.top = `${pathPosition.y}%`;
  car.style.transform = `translate(-50%, -50%) rotate(${pathPosition.rotation}deg)`;
  car.classList.add('is-visible');
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

function getPathPosition(progress) {
  const segments = ROAD_CAR_PATH.length - 1;
  const scaled = Math.min(progress, 0.999) * segments;
  const index = Math.min(Math.floor(scaled), ROAD_CAR_PATH.length - 2);
  const nextIndex = index + 1;
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
