import { assetPath } from './assetPath.js';

const locationImages = {
  pond: assetPath('/assets/locations/pond_location_concept.png'),
  greada: assetPath('/assets/locations/greada_location_concept.png'),
};

export function getLocationImage(locationId = 'pond') {
  return locationImages[locationId] ?? locationImages.pond;
}
