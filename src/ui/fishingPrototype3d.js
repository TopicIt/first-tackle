import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetPath } from '../utils/assetPath.js';

export const DEBUG_FISHERMAN_MODEL = false;

const prototypeConfig = {
  // Prototype model path: swap this when a newer fishing character export is ready.
  path: assetPath('/assets/models/fisher_boy_base.glb'),
  // Prototype scale controls: keep these easy to tweak while dialing in Blender exports.
  baseScale: 1,
  targetHeight: 3.7,
  // Prototype placement controls: this canvas is anchored over the lower-left fisherman area.
  position: new THREE.Vector3(0.1, 0, 0.12),
  rotation: new THREE.Euler(0, Math.PI * 0.78, 0),
  cameraPosition: new THREE.Vector3(1.1, 2.75, 5.2),
  lookAt: new THREE.Vector3(0.08, 1.62, 0.08),
};

const runtime = {
  activeCanvas: null,
  animationFrameId: 0,
  renderer: null,
  scene: null,
  camera: null,
  modelRoot: null,
  debugBox: null,
  resizeObserver: null,
  loadedModelPromise: null,
};

export function syncFishingPrototype3d(root, state) {
  if (state.settings?.performance?.lowPower) {
    teardownFishingPrototype3d();
    return;
  }

  const shouldShow = Boolean(DEBUG_FISHERMAN_MODEL && state.ui?.fishingMinigame?.open);
  const canvas = shouldShow ? root.querySelector('[data-fishing-prototype-canvas]') : null;

  if (!canvas) {
    teardownFishingPrototype3d();
    return;
  }

  if (runtime.activeCanvas === canvas) {
    resizeRendererToCanvas();
    return;
  }

  teardownFishingPrototype3d();
  setupFishingPrototype3d(canvas);
}

function setupFishingPrototype3d(canvas) {
  runtime.activeCanvas = canvas;
  if (DEBUG_FISHERMAN_MODEL) {
    console.log('[fisherman-prototype] attaching to fishing minigame overlay canvas');
  }
  setDebugState({ stage: 'attaching-overlay-canvas' });
  runtime.renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  runtime.renderer.outputColorSpace = THREE.SRGBColorSpace;
  runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  runtime.renderer.setClearColor(0x000000, 0);

  runtime.scene = new THREE.Scene();
  runtime.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  runtime.camera.position.copy(prototypeConfig.cameraPosition);
  runtime.camera.lookAt(prototypeConfig.lookAt);

  const keyLight = new THREE.DirectionalLight(0xfff2cf, 2.4);
  keyLight.position.set(2.4, 4.8, 3.2);
  runtime.scene.add(keyLight);
  runtime.scene.add(new THREE.HemisphereLight(0xdff7ff, 0x31463a, 1.5));

  const fillPlane = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 40),
    new THREE.MeshBasicMaterial({
      color: 0x1b2628,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    }),
  );
  fillPlane.rotation.x = -Math.PI / 2;
  fillPlane.scale.setScalar(1.7);
  fillPlane.position.set(0.1, 0.01, 0.24);
  runtime.scene.add(fillPlane);

  if (DEBUG_FISHERMAN_MODEL) {
    runtime.scene.add(new THREE.AxesHelper(1.8));
  }

  resizeRendererToCanvas();
  observeCanvas(canvas);
  loadPrototypeModel();
  renderLoop();
}

function loadPrototypeModel() {
  const loader = new GLTFLoader();
  runtime.loadedModelPromise = loader.loadAsync(prototypeConfig.path)
    .then((gltf) => {
      if (!runtime.scene) {
        return;
      }

      const importedModel = gltf.scene;
      const importedSummary = summarizeRenderableNodes(importedModel);
      const hasRenderableModel = importedSummary.renderableCount > 0 || importedSummary.nodeCount > 0;
      const model = hasRenderableModel ? importedModel : buildDebugFisherPlaceholder();

      if (!hasRenderableModel) {
        console.warn('[fisherman-prototype] GLB loaded but contains no meshes; showing debug placeholder fisherman instead');
      }

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const heightScale = size.y > 0 ? prototypeConfig.targetHeight / size.y : 1;
      const normalizedScale = prototypeConfig.baseScale * heightScale;

      model.scale.setScalar(normalizedScale);

      const scaledCenter = center.clone().multiplyScalar(normalizedScale);
      const scaledMinY = box.min.y * normalizedScale;
      model.position.set(
        prototypeConfig.position.x - scaledCenter.x,
        prototypeConfig.position.y - scaledMinY,
        prototypeConfig.position.z - scaledCenter.z,
      );
      model.rotation.copy(prototypeConfig.rotation);

      model.traverse((child) => {
        if (isRenderableNode(child)) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              if (material) {
                material.side = THREE.DoubleSide;
                material.needsUpdate = true;
              }
            });
          } else if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });

      runtime.modelRoot = model;
      runtime.scene.add(model);

      if (DEBUG_FISHERMAN_MODEL) {
        runtime.debugBox = new THREE.BoxHelper(model, 0xff7f50);
        runtime.scene.add(runtime.debugBox);
        console.log('[fisherman-prototype] model loaded');
        console.log('[fisherman-prototype] imported mesh count', importedSummary.renderableCount);
        console.log('[fisherman-prototype] imported node types', importedSummary.nodeTypes);
        console.log('[fisherman-prototype] bounding box size', { x: size.x, y: size.y, z: size.z });
        console.log('[fisherman-prototype] normalized scale', normalizedScale);
        console.log('[fisherman-prototype] final position', {
          x: model.position.x,
          y: model.position.y,
          z: model.position.z,
        });
        console.log('[fisherman-prototype] final rotation', {
          x: model.rotation.x,
          y: model.rotation.y,
          z: model.rotation.z,
        });
        console.log('[fisherman-prototype] camera position', {
          x: runtime.camera.position.x,
          y: runtime.camera.position.y,
          z: runtime.camera.position.z,
        });
      }

      setDebugState({
        stage: 'model-ready',
        importedMeshCount: importedSummary.renderableCount,
        importedNodeTypes: importedSummary.nodeTypes,
        importedNodeCount: importedSummary.nodeCount,
        boundingBoxSize: { x: size.x, y: size.y, z: size.z },
        normalizedScale,
        finalPosition: { x: model.position.x, y: model.position.y, z: model.position.z },
        finalRotation: { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z },
        cameraPosition: { x: runtime.camera.position.x, y: runtime.camera.position.y, z: runtime.camera.position.z },
        usingPlaceholderFisherman: !hasRenderableModel,
      });
    })
    .catch((error) => {
      console.warn(`[fisherman-prototype] model load failed: ${prototypeConfig.path}`, error);
      const placeholder = buildDebugFisherPlaceholder();
      const box = new THREE.Box3().setFromObject(placeholder);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const heightScale = size.y > 0 ? prototypeConfig.targetHeight / size.y : 1;
      const normalizedScale = prototypeConfig.baseScale * heightScale;

      placeholder.scale.setScalar(normalizedScale);
      const scaledCenter = center.clone().multiplyScalar(normalizedScale);
      const scaledMinY = box.min.y * normalizedScale;
      placeholder.position.set(
        prototypeConfig.position.x - scaledCenter.x,
        prototypeConfig.position.y - scaledMinY,
        prototypeConfig.position.z - scaledCenter.z,
      );
      placeholder.rotation.copy(prototypeConfig.rotation);
      runtime.modelRoot = placeholder;
      runtime.scene?.add(placeholder);
      setDebugState({
        stage: 'fallback-placeholder-after-load-failure',
        error: String(error),
      });
    });
}

function observeCanvas(canvas) {
  runtime.resizeObserver = new ResizeObserver(() => {
    resizeRendererToCanvas();
  });
  runtime.resizeObserver.observe(canvas);
}

function resizeRendererToCanvas() {
  if (!runtime.renderer || !runtime.camera || !runtime.activeCanvas) {
    return;
  }

  const rect = runtime.activeCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  runtime.renderer.setSize(width, height, false);
  runtime.camera.aspect = width / height;
  runtime.camera.updateProjectionMatrix();
}

function renderLoop() {
  if (!runtime.renderer || !runtime.scene || !runtime.camera) {
    return;
  }

  runtime.animationFrameId = window.requestAnimationFrame(renderLoop);
  if (document.hidden) {
    return;
  }

  if (runtime.modelRoot) {
    runtime.modelRoot.rotation.y = prototypeConfig.rotation.y + Math.sin(performance.now() * 0.0012) * 0.04;
  }

  if (runtime.debugBox) {
    runtime.debugBox.update();
  }

  runtime.renderer.render(runtime.scene, runtime.camera);
}

function teardownFishingPrototype3d() {
  if (runtime.animationFrameId) {
    window.cancelAnimationFrame(runtime.animationFrameId);
  }
  runtime.animationFrameId = 0;

  runtime.resizeObserver?.disconnect();
  runtime.resizeObserver = null;

  runtime.debugBox = null;
  runtime.modelRoot = null;
  runtime.loadedModelPromise = null;

  runtime.renderer?.dispose();
  runtime.renderer = null;
  runtime.scene = null;
  runtime.camera = null;
  runtime.activeCanvas = null;
  setDebugState({ stage: 'detached' });
}

function summarizeRenderableNodes(model) {
  let renderableCount = 0;
  let nodeCount = 0;
  const nodeTypes = new Set();
  model.traverse((child) => {
    nodeCount += 1;
    if (child.type) {
      nodeTypes.add(child.type);
    }
    if (isRenderableNode(child)) {
      renderableCount += 1;
    }
  });
  return {
    renderableCount,
    nodeCount,
    nodeTypes: [...nodeTypes],
  };
}

function isRenderableNode(child) {
  return Boolean(
    child?.isMesh
    || child?.isSkinnedMesh
    || child?.geometry
    || child?.type?.endsWith?.('Mesh'),
  );
}

function buildDebugFisherPlaceholder() {
  const group = new THREE.Group();
  group.name = 'prototype-fisherman-debug-placeholder';

  const darkCloth = new THREE.MeshStandardMaterial({ color: 0x4f8ea0, roughness: 0.82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc9966d, roughness: 0.92 });
  const hat = new THREE.MeshStandardMaterial({ color: 0xf0c35c, roughness: 0.78 });
  const boots = new THREE.MeshStandardMaterial({ color: 0x253032, roughness: 0.95 });
  const rod = new THREE.MeshStandardMaterial({ color: 0xb17b46, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.95, 6, 12), darkCloth);
  body.position.set(0, 1.2, 0);
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), skin);
  head.position.set(0, 2.05, 0.02);
  group.add(head);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), hat);
  hatBrim.position.set(0, 2.3, 0.02);
  group.add(hatBrim);

  const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.26, 16), hat);
  hatTop.position.set(0, 2.42, 0.02);
  group.add(hatTop);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.86, 4, 10), boots);
  leftLeg.position.set(-0.16, 0.48, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.86, 4, 10), boots);
  rightLeg.position.set(0.16, 0.48, 0);
  group.add(rightLeg);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.72, 4, 10), darkCloth);
  leftArm.position.set(-0.42, 1.42, 0.04);
  leftArm.rotation.z = Math.PI * 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.18, 4, 10), darkCloth);
  rightArm.position.set(0.62, 1.5, 0.16);
  rightArm.rotation.z = Math.PI * -0.58;
  rightArm.rotation.x = Math.PI * -0.04;
  group.add(rightArm);

  const fishingRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 3.5, 10), rod);
  fishingRod.position.set(1.78, 2.1, 0.22);
  fishingRod.rotation.z = Math.PI * -0.94;
  fishingRod.rotation.x = Math.PI * -0.08;
  group.add(fishingRod);

  return group;
}

function setDebugState(payload) {
  globalThis.__DEBUG_FISHERMAN_MODEL__ = {
    path: prototypeConfig.path,
    ...globalThis.__DEBUG_FISHERMAN_MODEL__,
    ...payload,
  };

  if (!runtime.activeCanvas) {
    return;
  }

  runtime.activeCanvas.dataset.debugStage = String(payload.stage ?? '');
  if (payload.importedMeshCount != null) {
    runtime.activeCanvas.dataset.debugMeshCount = String(payload.importedMeshCount);
  }
  if (payload.normalizedScale != null) {
    runtime.activeCanvas.dataset.debugScale = Number(payload.normalizedScale).toFixed(3);
  }
  if (payload.usingPlaceholderFisherman != null) {
    runtime.activeCanvas.dataset.debugPlaceholder = String(payload.usingPlaceholderFisherman);
  }
  if (payload.importedNodeCount != null) {
    runtime.activeCanvas.dataset.debugNodeCount = String(payload.importedNodeCount);
  }
  if (payload.importedNodeTypes?.length) {
    runtime.activeCanvas.dataset.debugNodeTypes = payload.importedNodeTypes.join(',');
  }
}
