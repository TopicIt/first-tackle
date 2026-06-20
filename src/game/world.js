import * as THREE from 'three';
import { worldMapAsset } from '../utils/worldMapAsset.js';

const zoneColors = {
  house: 0xe3c173,
  garden: 0x627c4b,
  canal: 0x4d8aa1,
  market: 0xb98e5d,
  bus_station: 0x7d90a8,
};

export const interactionZones = {
  house: {
    label: 'Grandma',
    position: new THREE.Vector3(-7.6, 0, 1.6),
    radius: 1.7,
  },
  garden: {
    label: 'Beds',
    position: new THREE.Vector3(-7.1, 0, -3.6),
    radius: 1.65,
  },
  canal: {
    label: 'Canal',
    position: new THREE.Vector3(5.2, 0, -1.8),
    radius: 3,
  },
  market: {
    label: 'Market',
    position: new THREE.Vector3(1.5, 0, 6.1),
    radius: 2.5,
  },
  bus_station: {
    label: 'Bus',
    position: new THREE.Vector3(4.25, 0, 8.2),
    radius: 1.35,
  },
};

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8bb7c7);
  scene.fog = new THREE.Fog(0x8bb7c7, 22, 45);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(-6, 9, 9);

  const sun = new THREE.DirectionalLight(0xfff2cf, 2.2);
  sun.position.set(-7, 11, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xd8f2ff, 0x53664d, 1.5));

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.28, 22),
    new THREE.MeshStandardMaterial({ color: 0x6d8c4e, roughness: 0.9 }),
  );
  ground.position.y = -0.18;
  ground.receiveShadow = true;
  scene.add(ground);

  addRoad(scene);
  addHouse(scene);
  addGarden(scene);
  addPond(scene);
  addMarket(scene);
  addBusStation(scene);
  addTrees(scene);
  addZoneMarkers(scene);

  const windObjects = addReeds(scene);
  const animatedMapObjects = addMapLife(scene);
  const bounds = {
    minX: -12.5,
    maxX: 12.5,
    minZ: -9.5,
    maxZ: 9.5,
  };

  return {
    scene,
    camera,
    bounds,
    updateCamera(target) {
      const desired = new THREE.Vector3(target.x - 6, 8.5, target.z + 8.5);
      camera.position.lerp(desired, 0.08);
      camera.lookAt(target.x, 0.7, target.z);
    },
    animate(delta) {
      const time = performance.now() * 0.001;
      for (const reed of windObjects) {
        reed.rotation.z = Math.sin(time * 1.7 + reed.userData.offset) * 0.07;
      }
      animatedMapObjects.waterShimmer.scale.setScalar(1 + Math.sin(time * 2.2) * 0.04);
      animatedMapObjects.waterShimmer.material.opacity = 0.18 + Math.sin(time * 2.5) * 0.07;
    },
  };
}

function addRoad(scene) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.08, 3),
    new THREE.MeshStandardMaterial({ color: 0x595957, roughness: 0.8 }),
  );
  road.position.set(0, -0.01, 7.35);
  road.receiveShadow = true;
  scene.add(road);

  for (let x = -12; x <= 12; x += 4) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.09, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xe6d79f }),
    );
    stripe.position.set(x, 0.04, 7.35);
    scene.add(stripe);
  }
}

function addHouse(scene) {
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0xd6bc88, roughness: 0.85 }),
  );
  walls.position.set(-7.6, 1, 1.6);
  walls.castShadow = true;
  walls.receiveShadow = true;
  scene.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.7, 1.35, 4),
    new THREE.MeshStandardMaterial({ color: 0x8f3f34, roughness: 0.8 }),
  );
  roof.position.set(-7.6, 2.55, 1.6);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  scene.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.15, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x6a4630 }),
  );
  door.position.set(-7.6, 0.58, 3.13);
  scene.add(door);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x6c6059 }),
  );
  chimney.position.set(-8.5, 3.05, 1.1);
  chimney.castShadow = true;
  scene.add(chimney);
}

function addGarden(scene) {
  const patch = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.06, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x4f6b37, roughness: 1 }),
  );
  patch.position.set(-7.4, 0.02, -3.8);
  scene.add(patch);

  for (let i = 0; i < 4; i += 1) {
    const row = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.08, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x314c28 }),
    );
    row.position.set(-7.4, 0.08, -4.65 + i * 0.55);
    scene.add(row);
  }
}

function addPond(scene) {
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(3.3, 3.65, 0.16, 24),
    new THREE.MeshStandardMaterial({
      color: 0x3f92aa,
      roughness: 0.35,
      metalness: 0.05,
    }),
  );
  water.scale.z = 0.68;
  water.position.set(5.2, 0.04, -1.8);
  water.receiveShadow = true;
  scene.add(water);

  const bank = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 4.1, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x856f45, roughness: 0.9 }),
  );
  bank.scale.z = 0.72;
  bank.position.set(5.2, -0.04, -1.8);
  bank.receiveShadow = true;
  scene.add(bank);
}

function addMarket(scene) {
  const stall = new THREE.Group();
  stall.position.set(1.5, 0, 6.1);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.35, 1),
    new THREE.MeshStandardMaterial({ color: 0x9d6c3d, roughness: 0.8 }),
  );
  table.position.y = 0.7;
  table.castShadow = true;
  stall.add(table);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.2, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xd84f46, roughness: 0.7 }),
  );
  awning.position.y = 1.85;
  awning.castShadow = true;
  stall.add(awning);

  for (const x of [-1.2, 1.2]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 1.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x5e412d }),
    );
    post.position.set(x, 0.85, -0.45);
    stall.add(post);
  }

  scene.add(stall);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.55, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xeadb9b, roughness: 0.8 }),
  );
  sign.position.set(-1, 1.4, 6.1);
  sign.rotation.y = -0.2;
  sign.castShadow = true;
  scene.add(sign);
  scene.add(createTextLabel('FISH', new THREE.Vector3(-1, 1.42, 6.02), 0.9));

}

function addBusStation(scene) {
  const stop = new THREE.Group();
  stop.position.set(4.25, 0, 8.2);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x3d5365 }),
  );
  post.position.y = 1.1;
  post.castShadow = true;
  stop.add(post);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xe9f0d8, roughness: 0.72 }),
  );
  sign.position.set(0, 1.95, 0);
  sign.castShadow = true;
  stop.add(sign);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.22, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x7a5a3d, roughness: 0.82 }),
  );
  bench.position.set(0.95, 0.45, 0.15);
  bench.castShadow = true;
  stop.add(bench);

  scene.add(stop);
}

function addTrees(scene) {
  const positions = [
    [-10.8, -6.4],
    [-2.6, -6.8],
    [9.8, -6.2],
    [10.7, 3.4],
    [-11.1, 5.2],
  ];

  for (const [x, z] of positions) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 1.2, 7),
      new THREE.MeshStandardMaterial({ color: 0x6a4730, roughness: 0.9 }),
    );
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(1.05, 2.1, 7),
      new THREE.MeshStandardMaterial({ color: 0x315d3f, roughness: 0.9 }),
    );
    crown.position.y = 2.05;
    crown.castShadow = true;
    tree.add(crown);

    scene.add(tree);
  }
}

function addZoneMarkers(scene) {
  for (const [zoneId, zone] of Object.entries(interactionZones)) {
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(zone.radius, 40),
      new THREE.MeshBasicMaterial({
        color: zoneColors[zoneId],
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
      }),
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(zone.position.x, 0.052, zone.position.z);
    scene.add(circle);

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(zone.radius - 0.04, zone.radius, 36),
      new THREE.MeshBasicMaterial({
        color: zoneColors[zoneId],
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
      }),
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.set(zone.position.x, 0.055, zone.position.z);
    scene.add(marker);
    scene.add(createTextLabel(zone.label, new THREE.Vector3(zone.position.x, 2.7, zone.position.z), 1.45));
  }
}

function createTextLabel(text, position, scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(20, 31, 28, 0.82)';
  roundRect(context, 12, 18, 232, 58, 12);
  context.fill();
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = '#fff7dc';
  context.font = '700 34px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  label.position.copy(position);
  label.scale.set(2.4 * scale, 0.9 * scale, 1);
  return label;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function addReeds(scene) {
  const reeds = [];
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 3.2 + Math.random() * 0.45;
    const reed = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.8 + Math.random() * 0.45, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x49692d }),
    );
    reed.position.set(
      5.2 + Math.cos(angle) * radius,
      0.35,
      -1.8 + Math.sin(angle) * radius * 0.7,
    );
    reed.userData.offset = Math.random() * 10;
    scene.add(reed);
    reeds.push(reed);
  }
  return reeds;
}

function addMapLife(scene) {
  const mapPlaneMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const mapPlane = new THREE.Mesh(new THREE.PlaneGeometry(22, 15), mapPlaneMaterial);
  mapPlane.rotation.x = -Math.PI / 2;
  mapPlane.position.set(0, 0.065, -0.7);
  scene.add(mapPlane);
  loadMapTexture(mapPlaneMaterial, worldMapAsset.primary, worldMapAsset.fallback);

  const waterShimmer = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.34, 32),
    new THREE.MeshBasicMaterial({
      color: 0xbdefff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  waterShimmer.rotation.x = -Math.PI / 2;
  waterShimmer.position.set(5.2, 0.18, -1.8);
  scene.add(waterShimmer);

  return { waterShimmer };
}

function loadMapTexture(material, primaryPath, fallbackPath) {
  const loader = new THREE.TextureLoader();
  loader.load(
    primaryPath,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    () => {
      loader.load(fallbackPath, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
      });
    },
  );
}
