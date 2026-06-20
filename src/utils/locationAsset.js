import { assetPath } from './assetPath.js';

const locationImages = {
  pond: assetPath('/assets/locations/pond_location_concept.png'),
  canal: assetPath('/assets/locations/fishing-canal.webp'),
  canalAlt: assetPath('/assets/locations/kanava-alt.png'),
  canalFallback: assetPath('/assets/locations/kanava-alt.png'),
  sluice: assetPath('/assets/locations/shliuz.png'),
  sluiceFallback: assetPath('/assets/locations/pond_location_concept.png'),
  firePonds: assetPath('/assets/locations/stavky-pozhara.png'),
  firePondsFallback: assetPath('/assets/locations/pond_location_concept.png'),
  greada: assetPath('/assets/locations/gryada.png'),
  greadaFallback: assetPath('/assets/locations/greada_location_concept.png'),
  lakeTur: assetPath('/assets/locations/ozero-tur.png'),
  lakeTurFallback: assetPath('/assets/locations/pond_location_concept.png'),
  miningLake: assetPath('/assets/locations/hirnytske-ozero.png'),
  miningLakeFallback: assetPath('/assets/locations/greada_location_concept.png'),
  house: assetPath('/assets/locations/grandma-house.webp'),
  houseFallback: assetPath('/assets/locations/house_location_concept.png'),
};

export function getLocationImage(locationId = 'pond') {
  return locationImages[locationId] ?? locationImages.pond;
}

export function getLocationImageFallback(locationId = 'pond') {
  return locationImages[`${locationId}Fallback`] ?? null;
}
