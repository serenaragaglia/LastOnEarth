import * as THREE from 'https://esm.sh/three@0.161.0';
import { PointerLockControls } from 'https://esm.sh/three@0.152.2/examples/jsm/controls/PointerLockControls.js';
import { move, muoseClick } from './input.js';
import {gun, loadGunModel, loadShotGunModel, shotgun, zombieModel} from './scene.js';
import {handleZombiePlayerDamage, zombies, hearts, spawnRandomZombies, startZombieWave} from './action.js';
import { ACCEL, DECAY, MAX_SPEED, player, buildingsList, OPTIONS, levels, weapon} from './constants.js';
import { showHintCollect , endGame, updatePlayerLifeUI, showLevelTransition} from './ui.js';
import { scene } from './main.js';


let controls;   let speedFactor = 0;

export function setupControls(camera, scene, domElement) {
  controls = new PointerLockControls(camera, domElement); //init controls of the pointer
  scene.add(controls.getObject()); //adds the player to the scene

  document.addEventListener('click', () => controls.lock()); //lock the pointer

  //Manage the command mousedown because we have the pointer already locked 
    document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === domElement) {
      document.addEventListener('mousedown', muoseClick);
    } else {
      document.removeEventListener('mousedown', muoseClick);
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

export async function changeWeapon(){
  controls = getControls();
  if(levels.currentLevel == 1){
    await loadGunModel(controls);
    weapon.active = 'gun';
    //console.log('ARMA CORRENTE', weapon.active);
  }
  if(levels.currentLevel == 2){
      controls.getObject().remove(gun);
      await loadShotGunModel(controls);
      weapon.active = 'shotgun';
      //console.log('ARMA CORRENTE', weapon.active);
  }
}

//COMPUTE WHICH WEAPON THE PLAYER IS USING
export function getWeapon(){
  if (weapon.active == 'gun'){
    return gun;
  }
  else if(weapon.active == 'shotgun'){
    return shotgun;
  }
  else if(weapon.active == 'machineGun'){
    return machineGun;
  }
}

function weaponBobbing(speedFactor) {
  const time          = performance.now() / 1000; //time variable that is used to create the movement with sin
  const bobSpeed      = 5;      // how much the gun swings while the player is moving
  const baseWidth = 0.01;  // base ampitude of the swing
  const amplitude     = baseWidth * speedFactor; //scaling the real amplitude according to the player's speed
 
  const currentWeapon = getWeapon();
  if(!currentWeapon) return;
  const currentPosx = currentWeapon.position.x ;
  const currentPosy = currentWeapon.position.y

  if (speedFactor > 0) {
    currentWeapon.position.x =  0.4 + Math.sin(time * bobSpeed) * amplitude;
    currentWeapon.position.y = -0.5 + Math.abs(Math.sin(time * bobSpeed)) * amplitude;
  } else {
    currentWeapon.position.x = currentPosx;
    currentWeapon.position.y = currentPosy;
  }
}

export function isColliding(firstObjPos, firstObjSize, secObjPos, secObjSize){
    if(
      Math.abs(firstObjPos.x - secObjPos.x) < (firstObjSize.x / 2 + secObjSize.x / 2 ) &&
      //Math.abs(firstObjPos.y - secObjPos.y) < (firstObjSize.y / 2 + secObjSize.y / 2 ) &&
      Math.abs(firstObjPos.z - secObjPos.z) < (firstObjSize.z / 2 + secObjSize.z / 2 )
    )
      return true;
    else return false;

}

export function collsionManagement(future, builds, Psize){
  let stop = false;
  for (const { mesh, size } of builds) {
    if (isColliding(future, Psize, mesh.position, size) == true) {
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

  const realSpeed = player.SPEED * speedFactor;
  vel.addScaledVector(front, dir.z * realSpeed * d);
  vel.addScaledVector(right, dir.x * realSpeed * d);
  return vel;
}

export function collectHeart(playerPos){
  for(const heart of hearts){
    const distance = heart.position.distanceTo(playerPos);
    if(distance < 2 && player.LIFE < 100){
      return heart;
    }
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
  let stop = playerZombieCollision(futurePos);

  if (!blocked && !stop) {
    pos.add(velocity); //apply velocity to the camera such that the player moves
  }
  handleZombiePlayerDamage(pos, delta)
  //block the position so the player can't go out of the map
  pos.x = THREE.MathUtils.clamp(pos.x, -OPTIONS.areaSize, OPTIONS.areaSize);
  pos.z = THREE.MathUtils.clamp(pos.z, -OPTIONS.areaSize, OPTIONS.areaSize);

  weaponBobbing(speedFactor);
  let heartInRange = collectHeart(pos);
  showHintCollect(heartInRange);
}

export function getControls() {
  return controls;
}

export function updateLevel(){
  if(player.kill == 2 && levels.currentLevel == 1){
    levels.currentLevel = 2 ;    
    showLevelTransition(levels.currentLevel);
    zombieModel.userData.life = 20;
    zombieModel.userData.damage = 3;
    player.kill = 0;
    changeWeapon(scene);    
    startZombieWave(30);
    
    if(player.LIFE < 100){      
      player.LIFE = 100;
      updatePlayerLifeUI();
    }
  }
  if(player.kill == 5 && levels.currentLevel == 2){
    levels.currentLevel = 3;
    showLevelTransition(levels.currentLevel);
    zombieModel.userData.life = 25;
    zombieModel.userData.damage = 5;
    player.kill = 0;
    changeWeapon(scene);
    startZombieWave(40);

    if(player.LIFE < 100){      
      player.LIFE = 100;
      updatePlayerLifeUI();
    }
  }
  if(player.kill == 5 && levels.currentLevel == 3){
    endGame();
  }
}

export function zombieCollision(future){
  let stop = false;
  for (const build of buildingsList) {
    if (future.distanceTo(build.mesh.position) < 5) {
      stop = true;
      break;
    }
  }
  return stop;  
}

export function zombieAlert(zombie, playerPos){
  const dist = zombie.mesh.position.distanceTo(playerPos);
  if(dist < 15){
    zombie.alert = true;
    zombie.speed = 7;
  }
  else{
    zombie.alert = false;
    zombie.speed = 2;
  }
}

export function playerZombieCollision(playerPos){

  let stop = false;
  for(let z = zombies.length - 1; z >= 0; z--){
    const zombie = zombies[z];
    const dist = zombie.mesh.position.distanceTo(playerPos);
    if(dist < 4){
      stop = true;
      break;
    }
  }
  return stop;
}