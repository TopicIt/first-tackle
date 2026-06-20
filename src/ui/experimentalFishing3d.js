import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { fishing3dBackdropPath, fishing3dSkyPath, selectedNatureModels } from '../three/selectedNatureModels.js';

const mountedCanvases = new WeakSet();

export function mountExperimentalFishing3d(root) {
  const canvas = root.querySelector('[data-fishing-3d-canvas]');
  if (!canvas || mountedCanvases.has(canvas)) {
    return;
  }
  mountedCanvases.add(canvas);
  createFishingScene(canvas);
}

function createFishingScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x86b8c7);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  const cameraTarget = new THREE.Vector3(0, 0.8, 0);
  let yaw = 0;
  let pitch = -0.08;

  scene.add(new THREE.HemisphereLight(0xd8f3ff, 0x58714a, 2.15));
  const sun = new THREE.DirectionalLight(0xffe4ad, 2.4);
  sun.position.set(-4, 7, 3);
  scene.add(sun);

  addBackdrop(scene);
  addWater(scene);
  const bobber = addRodAndBobber(scene);
  addSelectedNature(scene);
  loadHdrSky(scene);
  wireDragLook(canvas, {
    onDelta(dx, dy) {
      yaw = clamp(yaw - dx * 0.006, -0.74, 0.74);
      pitch = clamp(pitch - dy * 0.003, -0.24, 0.18);
    },
  });

  function renderFrame() {
    if (!canvas.isConnected) {
      renderer.dispose();
      return;
    }

    resizeRenderer(renderer, camera, canvas);
    const t = performance.now() * 0.001;
    bobber.position.y = 0.34 + Math.sin(t * 2.4) * 0.035;
    bobber.rotation.z = Math.sin(t * 1.7) * 0.08;
    const distance = 7.2;
    camera.position.set(Math.sin(yaw) * distance, 3.05 + pitch * 5.5, 5.5 + Math.cos(yaw) * 1.4);
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  renderFrame();
}

function addBackdrop(scene) {
  const texture = new THREE.TextureLoader().load(
    fishing3dBackdropPath,
    (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
    },
  );
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 7.3),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.96 }),
  );
  plane.position.set(0, 2.9, -5.7);
  scene.add(plane);
}

function addWater(scene) {
  const bank = new THREE.Mesh(
    new THREE.CircleGeometry(5.4, 48),
    new THREE.MeshStandardMaterial({ color: 0x806c45, roughness: 0.92 }),
  );
  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(1.25, 0.78, 1);
  bank.position.y = -0.04;
  scene.add(bank);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(4.7, 64),
    new THREE.MeshStandardMaterial({
      color: 0x387f8d,
      roughness: 0.28,
      metalness: 0.04,
      transparent: true,
      opacity: 0.82,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.set(1.18, 0.68, 1);
  water.position.y = 0.02;
  scene.add(water);
}

function addRodAndBobber(scene) {
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.075, 4.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4224, roughness: 0.72 }),
  );
  rod.position.set(-3.9, 1.05, 2.8);
  rod.rotation.set(1.0, 0.18, -1.16);
  scene.add(rod);

  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 2.35, 6),
    new THREE.MeshBasicMaterial({ color: 0xe8f5f2, transparent: true, opacity: 0.58 }),
  );
  line.position.set(-0.84, 0.84, 1.18);
  line.rotation.set(0.38, 0.05, 0.18);
  scene.add(line);

  const bobber = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd93c2e, roughness: 0.45 }),
  );
  const bottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8f0d6, roughness: 0.45 }),
  );
  top.position.y = 0.1;
  bottom.position.y = -0.1;
  bobber.add(top, bottom);
  bobber.position.set(0.2, 0.34, 1.1);
  scene.add(bobber);
  return bobber;
}

function addSelectedNature(scene) {
  const loader = new GLTFLoader();
  for (const model of selectedNatureModels) {
    loader.load(
      model.path,
      (gltf) => {
        const object = gltf.scene;
        placeObject(object, model);
        scene.add(object);
      },
      undefined,
      () => scene.add(createFallbackObject(model)),
    );
  }
}

function loadHdrSky(scene) {
  new RGBELoader().load(
    fishing3dSkyPath,
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    },
    undefined,
    () => {
      scene.environment = null;
    },
  );
}

function createFallbackObject(model) {
  const group = new THREE.Group();
  if (model.type === 'tree') {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 1.1, 7),
      new THREE.MeshStandardMaterial({ color: 0x69472e }),
    );
    trunk.position.y = 0.55;
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 1.55, 7),
      new THREE.MeshStandardMaterial({ color: 0x315d3d }),
    );
    crown.position.y = 1.62;
    group.add(trunk, crown);
  } else if (model.type === 'rock') {
    group.add(new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: 0x77715f, roughness: 0.9 }),
    ));
  } else {
    group.add(new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.74, 6),
      new THREE.MeshStandardMaterial({ color: 0x4f7b3e, roughness: 0.86 }),
    ));
  }
  placeObject(group, model);
  return group;
}

function placeObject(object, model) {
  object.position.set(...model.position);
  object.rotation.set(...model.rotation);
  object.scale.setScalar(model.scale);
}

function wireDragLook(canvas, handlers) {
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    handlers.onDelta(event.clientX - drag.x, event.clientY - drag.y);
    drag = { ...drag, x: event.clientX, y: event.clientY };
  });
  const stop = (event) => {
    if (drag?.pointerId === event.pointerId) drag = null;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

function resizeRenderer(renderer, camera, canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const size = renderer.getSize(new THREE.Vector2());
  if (size.x === width && size.y === height) {
    return;
  }
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
