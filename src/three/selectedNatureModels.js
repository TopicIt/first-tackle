import { assetPath } from '../utils/assetPath.js';

const selectedRoot = '/assets/3d/nature/selected/';

export const selectedNatureModels = [
  {
    id: 'common_tree_3',
    path: assetPath(`${selectedRoot}CommonTree_3.gltf`),
    type: 'tree',
    scale: 0.52,
    position: [-5.8, 0, -5.2],
    rotation: [0, 0.25, 0],
  },
  {
    id: 'pine_3',
    path: assetPath(`${selectedRoot}Pine_3.gltf`),
    type: 'tree',
    scale: 0.48,
    position: [6.2, 0, -4.8],
    rotation: [0, -0.42, 0],
  },
  {
    id: 'twisted_tree_2',
    path: assetPath(`${selectedRoot}TwistedTree_2.gltf`),
    type: 'tree',
    scale: 0.46,
    position: [-7.1, 0, 1.8],
    rotation: [0, 0.9, 0],
  },
  {
    id: 'bush_common',
    path: assetPath(`${selectedRoot}Bush_Common.gltf`),
    type: 'bush',
    scale: 0.55,
    position: [-3.8, 0, 2.9],
    rotation: [0, -0.2, 0],
  },
  {
    id: 'grass_wispy_tall',
    path: assetPath(`${selectedRoot}Grass_Wispy_Tall.gltf`),
    type: 'grass',
    scale: 0.72,
    position: [3.4, 0, 2.5],
    rotation: [0, 0.35, 0],
  },
  {
    id: 'plant_7',
    path: assetPath(`${selectedRoot}Plant_7.gltf`),
    type: 'grass',
    scale: 0.64,
    position: [5.1, 0, 1.7],
    rotation: [0, -0.15, 0],
  },
  {
    id: 'rock_medium_1',
    path: assetPath(`${selectedRoot}Rock_Medium_1.gltf`),
    type: 'rock',
    scale: 0.62,
    position: [-2.8, 0, 3.5],
    rotation: [0, 0.15, 0],
  },
  {
    id: 'rock_medium_3',
    path: assetPath(`${selectedRoot}Rock_Medium_3.gltf`),
    type: 'rock',
    scale: 0.56,
    position: [4.6, 0, 3.1],
    rotation: [0, -0.55, 0],
  },
  {
    id: 'pebble_round_3',
    path: assetPath(`${selectedRoot}Pebble_Round_3.gltf`),
    type: 'rock',
    scale: 0.74,
    position: [1.2, 0, 3.75],
    rotation: [0, 0.7, 0],
  },
];

export const fishing3dSkyPath = assetPath('/assets/3d/sky/sky.hdr');
export const fishing3dBackdropPath = assetPath('/assets/locations/pond_location_concept.png');
