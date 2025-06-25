import * as THREE from 'https://esm.sh/three@0.161.0';
import { PointerLockControls } from 'https://esm.sh/three@0.152.2/examples/jsm/controls/PointerLockControls.js';
import { move } from './input.js';
import { PLAYER, WORLD } from './constants.js';

let controls;

export function setupControls(camera, scene, domElement) {
  controls = new PointerLockControls(camera, domElement);
  scene.add(controls.getObject());

  document.addEventListener('click', () => controls.lock());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

export function updateControls(delta) {
  if (!controls || !controls.isLocked) return;

  const direction = new THREE.Vector3();
  if (move.forward) direction.z += 1;
  if (move.backward) direction.z -= 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;
  direction.normalize();

  const velocity = new THREE.Vector3();
  const front = new THREE.Vector3();
  controls.getDirection(front);
  front.y = 0;
  front.normalize();

  const right = new THREE.Vector3().crossVectors(front, controls.getObject().up).normalize();

  velocity.addScaledVector(front, direction.z * PLAYER.SPEED * delta);
  velocity.addScaledVector(right, direction.x * PLAYER.SPEED * delta);

  const pos = controls.getObject().position;
  pos.add(velocity);

  pos.x = THREE.MathUtils.clamp(pos.x, -WORLD.SIZE, WORLD.SIZE);
  pos.z = THREE.MathUtils.clamp(pos.z, -WORLD.SIZE, WORLD.SIZE);
}

export function getControls() {
  return controls;
}
