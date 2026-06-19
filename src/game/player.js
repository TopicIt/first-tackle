import * as THREE from 'three';

const keyMap = new Map([
  ['KeyW', 'up'],
  ['ArrowUp', 'up'],
  ['KeyS', 'down'],
  ['ArrowDown', 'down'],
  ['KeyA', 'left'],
  ['ArrowLeft', 'left'],
  ['KeyD', 'right'],
  ['ArrowRight', 'right'],
]);

export function createPlayerController(scene, savedPlayer) {
  const marker = new THREE.Group();
  marker.position.set(savedPlayer.x, 0, savedPlayer.z);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.7, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0xf2dd7e, roughness: 0.65 }),
  );
  body.position.y = 0.82;
  body.castShadow = true;
  marker.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.12, 14),
    new THREE.MeshStandardMaterial({ color: 0x2d596f, roughness: 0.7 }),
  );
  cap.position.y = 1.45;
  cap.castShadow = true;
  marker.add(cap);

  scene.add(marker);

  const pressed = new Set();
  window.addEventListener('keydown', (event) => {
    const direction = keyMap.get(event.code);
    if (direction) {
      pressed.add(direction);
    }
  });
  window.addEventListener('keyup', (event) => {
    const direction = keyMap.get(event.code);
    if (direction) {
      pressed.delete(direction);
    }
  });

  const velocity = new THREE.Vector3();
  const target = new THREE.Vector3();

  return {
    get position() {
      return marker.position;
    },
    update(delta, bounds) {
      target.set(0, 0, 0);
      if (pressed.has('up')) target.z -= 1;
      if (pressed.has('down')) target.z += 1;
      if (pressed.has('left')) target.x -= 1;
      if (pressed.has('right')) target.x += 1;

      if (target.lengthSq() > 0) {
        target.normalize().multiplyScalar(4.1);
        body.rotation.y = Math.atan2(target.x, target.z);
      }

      velocity.lerp(target, 0.18);
      marker.position.x += velocity.x * delta;
      marker.position.z += velocity.z * delta;
      marker.position.x = THREE.MathUtils.clamp(marker.position.x, bounds.minX, bounds.maxX);
      marker.position.z = THREE.MathUtils.clamp(marker.position.z, bounds.minZ, bounds.maxZ);

      const bob = Math.sin(performance.now() * 0.008) * velocity.length() * 0.008;
      body.position.y = 0.82 + bob;
    },
    snapshot() {
      return {
        x: marker.position.x,
        z: marker.position.z,
      };
    },
    restore(playerState) {
      marker.position.set(playerState.x, 0, playerState.z);
      velocity.set(0, 0, 0);
    },
  };
}
