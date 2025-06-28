import * as THREE from 'https://esm.sh/three@0.161.0';
import { PointerLockControls } from 'https://esm.sh/three@0.152.2/examples/jsm/controls/PointerLockControls.js';
import { move } from './input.js';
import {gun} from './scene.js';
import {shoot} from './action.js';
import { ACCEL, DECAY, MAX_SPEED, PLAYER, buildingsList, OPTIONS } from './constants.js';

let controls;   let speedFactor = 0;

export function setupControls(camera, scene, domElement) {
  controls = new PointerLockControls(camera, domElement); //init controls of the pointer
  scene.add(controls.getObject()); //adds the player to the scene

  document.addEventListener('click', () => controls.lock()); //lock the pointer

  //Manage the command mousedown because we have the pointer already locked 
    document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === domElement) {
      document.addEventListener('mousedown', shoot);
    } else {
      document.removeEventListener('mousedown', shoot);
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

export function isColliding(firstObjPos, firstObjSize, secObjPos, secObjSize){
    return (
      Math.abs(firstObjPos.x - secObjPos.x) < (firstObjSize.x / 2 + secObjSize.x / 2 ) &&
      Math.abs(firstObjPos.y - secObjPos.y) < (firstObjSize.y / 2 + secObjSize.y / 2 ) &&
      Math.abs(firstObjPos.z - secObjPos.z) < (firstObjSize.z / 2 + secObjSize.z / 2 )
  );
}

export function collsionManagement(future, builds, Psize){
  let stop = false;
  for (const { mesh, size } of builds) {
    if (isColliding(future, Psize, mesh.position, size)) {
      stop = true;
      break;
    }
  }
  return stop;
}

export function updateSpeedFactor(dir, d){
  const isMoving = dir.lengthSq() > 0.01;
  if(isMoving){
    speedFactor += ACCEL * d; //proportinal increment to real time
    speedFactor = Math.min(speedFactor, MAX_SPEED); //so that the player doesn't go further than the max speed
  }
  else{
    speedFactor -= DECAY * d;
    speedFactor = Math.max(speedFactor, 0);
  }
}

export function computeVelocity(speedFactor, dir, d){
  const vel = new THREE.Vector3();

  //to get where the player is watching, so the direction in which the camera is pointing
  const front = new THREE.Vector3();
  controls.getDirection(front); //controls will insert in front the direction in which the player is watching
  front.y = 0; //we are ignoring the height because we need only the front direction
  front.normalize();

  //to compute the relative right, becuase the player moves
  const right = new THREE.Vector3().crossVectors(front, controls.getObject().up).normalize();

  const realSpeed = PLAYER.SPEED * speedFactor;
  vel.addScaledVector(front, dir.z * realSpeed * d);
  vel.addScaledVector(right, dir.x * realSpeed * d);
  return vel;
}

function weaponBobbing(speedFactor) {
  if (!gun) return;

  const time          = performance.now() / 1000; //time variable that is used to create the movement with sin
  const bobSpeed      = 5;      // how much the gun swings while the player is moving
  const baseWidth = 0.01;  // base ampitude of the swing
  const amplitude     = baseWidth * speedFactor; //scaling the real amplitude according to the player's speed
 
  if (speedFactor > 0) {
    gun.position.x = 0.4 + Math.sin(time * bobSpeed) * amplitude;
    gun.position.y = -0.5 + Math.abs(Math.sin(time * bobSpeed)) * amplitude;
  } else {

    gun.position.x = 0.4;
    gun.position.y = -0.5;
  }
}

export function updateControls(delta) {
  if (!controls || !controls.isLocked) return; //if the player is not moving

  const direction = new THREE.Vector3(); //vector to save the directionin which the player is moving
  if (move.forward) direction.z += 1;
  if (move.backward) direction.z -= 1;
  if (move.left) direction.x -= 1;
  if (move.right) direction.x += 1;
  direction.normalize(); //to only have the direction without the lenght

  updateSpeedFactor(direction, delta);  
  const velocity = computeVelocity(speedFactor, direction, delta);

  //extract the actual position and compute the future one
  const pos = controls.getObject().position;
  const futurePos = pos.clone().add(velocity);

  const playerSize = { x: 3, y : 3 , z: 2 };

  let blocked = collsionManagement(futurePos, buildingsList, playerSize);

  if (!blocked) {
    pos.add(velocity); //apply velocity to the camera such that the player moves
  }

  //block the position so the player can't go out of the map
  pos.x = THREE.MathUtils.clamp(pos.x, -OPTIONS.areaSize, OPTIONS.areaSize);
  pos.z = THREE.MathUtils.clamp(pos.z, -OPTIONS.areaSize, OPTIONS.areaSize);

  weaponBobbing(speedFactor);

}

export function getControls() {
  return controls;
}
