import { assetPath } from './assetPath.js';

const locationImages = {
  pond: assetPath('/assets/locations/pond_location_concept.png'),
  canal: assetPath('/assets/locations/fishing-canal.webp'),
  canalFallback: assetPath('/assets/locations/pond_location_concept.png'),
  greada: assetPath('/assets/locations/greada_location_concept.png'),
  house: assetPath('/assets/locations/grandma-house.webp'),
  houseFallback: assetPath('/assets/locations/house_location_concept.png'),
};

export function getLocationImage(locationId = 'pond') {
  return locationImages[locationId] ?? locationImages.pond;
}

export function getLocationImageFallback(locationId = 'pond') {
  return locationImages[`${locationId}Fallback`] ?? null;
}
