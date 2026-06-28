import { MAP_HOTSPOTS, MAP_HOTSPOT_DEBUG } from '../game/mapHotspots.js';
import { tutorialSteps } from '../game/profile.js';
import { canOpenWaterFromMap, canUseBusStation, getLockedReasonKey, isFishingLocation } from '../game/locations.js';
import { t } from '../i18n/i18n.js';
import { getWorldMapAsset } from '../utils/worldMapAsset.js';
import './mapOverlay.css';

export function mapOverlayMarkup(state) {
  const viewMode = state.ui?.resolvedViewMode ?? 'mobile';
  const worldMapAsset = getWorldMapAsset(viewMode, state);
  const fallback = worldMapAsset.fallbacks?.[0] ?? worldMapAsset.fallback;
  return `
    <section class="illustrated-map${MAP_HOTSPOT_DEBUG ? ' is-debugging-hotspots' : ''}" aria-label="${t('mapHint')}" data-map-mode="${viewMode}" data-time-of-day="${worldMapAsset.bucket}">
      <div class="illustrated-map__frame">
        <img
          class="illustrated-map__image"
          src="${worldMapAsset.primary}"
          alt=""
          aria-hidden="true"
          onerror="this.onerror=null;this.src='${fallback}'"
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
  const locked = isHotspotLocked(hotspot, state);
  const lockedReason = locked ? getHotspotLockedReason(hotspot, state) : null;
  const shapeClass = ` map-hotspot--${hotspot.type ?? 'ellipse'}`;
  const tutorialTarget = isTutorialTarget(state, hotspot.action ?? `open:${hotspot.scene}`) ? ' is-tutorial-target' : '';
  const style = hotspotStyle(hotspot);
  const ariaLabel = locked ? `${t(hotspot.labelKey)} - ${t(lockedReason)}` : t(hotspot.actionKey);
  const label = `${hotspot.direction === 'left' ? '← ' : ''}${t(hotspot.labelKey)}${hotspot.direction === 'right' ? ' →' : ''}${locked ? ` / ${t(lockedReason)}` : ''}`;

  return `
    <button
      class="map-hotspot${shapeClass}${selected}${tutorialTarget}${locked ? ' is-locked' : ''}"
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

function isTutorialTarget(state, actionId) {
  const tutorial = state.tutorialState;
  if (!tutorial?.started || tutorial.completed || tutorial.skipped || tutorial.collapsed) {
    return false;
  }
  return actionId === tutorialSteps[tutorial.step ?? 0]?.actionId;
}

function isHotspotLocked(hotspot, state) {
  if (isFishingLocation(hotspot.scene)) {
    return !canOpenWaterFromMap(state, hotspot.scene);
  }

  if (hotspot.scene === 'bus_station') {
    return !canUseBusStation(state);
  }

  return false;
}

function getHotspotLockedReason(hotspot, state) {
  if (isFishingLocation(hotspot.scene)) {
    return getLockedReasonKey(state, hotspot.scene);
  }

  if (hotspot.scene === 'bus_station') {
    return 'requiresGrandmaTrust';
  }

  return 'locked';
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
