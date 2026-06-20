import { assetPath } from '../utils/assetPath.js';
import { getLocationImage } from '../utils/locationAsset.js';

const selectedRoot = '/assets/3d/nature/selected/';

const baseNatureModels = [
  ['common_tree_3', 'CommonTree_3.gltf', 'tree'],
  ['pine_3', 'Pine_3.gltf', 'tree'],
  ['twisted_tree_2', 'TwistedTree_2.gltf', 'tree'],
  ['bush_common', 'Bush_Common.gltf', 'bush'],
  ['grass_wispy_tall', 'Grass_Wispy_Tall.gltf', 'grass'],
  ['plant_7', 'Plant_7.gltf', 'grass'],
  ['rock_medium_1', 'Rock_Medium_1.gltf', 'rock'],
  ['rock_medium_3', 'Rock_Medium_3.gltf', 'rock'],
  ['pebble_round_3', 'Pebble_Round_3.gltf', 'rock'],
].map(([id, file, type]) => ({
  id,
  path: assetPath(`${selectedRoot}${file}`),
  type,
}));

const sceneNatureLayouts = {
  pond: [
    { modelId: 'common_tree_3', scale: 0.52, position: [-5.8, 0, -5.2], rotation: [0, 0.25, 0] },
    { modelId: 'pine_3', scale: 0.48, position: [6.2, 0, -4.8], rotation: [0, -0.42, 0] },
    { modelId: 'twisted_tree_2', scale: 0.46, position: [-7.1, 0, 1.8], rotation: [0, 0.9, 0] },
    { modelId: 'bush_common', scale: 0.55, position: [-3.8, 0, 2.9], rotation: [0, -0.2, 0] },
    { modelId: 'grass_wispy_tall', scale: 0.72, position: [3.4, 0, 2.5], rotation: [0, 0.35, 0] },
    { modelId: 'plant_7', scale: 0.64, position: [5.1, 0, 1.7], rotation: [0, -0.15, 0] },
    { modelId: 'rock_medium_1', scale: 0.62, position: [-2.8, 0, 3.5], rotation: [0, 0.15, 0] },
    { modelId: 'rock_medium_3', scale: 0.56, position: [4.6, 0, 3.1], rotation: [0, -0.55, 0] },
    { modelId: 'pebble_round_3', scale: 0.74, position: [1.2, 0, 3.75], rotation: [0, 0.7, 0] },
  ],
  greada: [
    { modelId: 'twisted_tree_2', scale: 0.5, position: [-6.6, 0, -5.1], rotation: [0, 0.48, 0] },
    { modelId: 'common_tree_3', scale: 0.44, position: [5.8, 0, -4.6], rotation: [0, -0.18, 0] },
    { modelId: 'bush_common', scale: 0.48, position: [-4.8, 0, 2.4], rotation: [0, 0.12, 0] },
    { modelId: 'grass_wispy_tall', scale: 0.8, position: [3.2, 0, 2.7], rotation: [0, 0.2, 0] },
    { modelId: 'plant_7', scale: 0.71, position: [5.4, 0, 2.05], rotation: [0, -0.3, 0] },
    { modelId: 'rock_medium_1', scale: 0.58, position: [-2.4, 0, 3.25], rotation: [0, 0.24, 0] },
    { modelId: 'pebble_round_3', scale: 0.68, position: [1.6, 0, 3.58], rotation: [0, -0.32, 0] },
  ],
};

export const fishing3dSkyPath = assetPath('/assets/3d/sky/sky.hdr');

export function getFishing3dSceneConfig(locationId = 'pond') {
  const placements = sceneNatureLayouts[locationId] ?? sceneNatureLayouts.pond;
  return {
    backdropPath: getLocationImage(locationId),
    placements: placements.map((placement) => ({
      ...baseNatureModels.find((model) => model.id === placement.modelId),
      ...placement,
    })),
  };
}
