import * as THREE from 'https://esm.sh/three@0.161.0';
import * as SkeletonUtils from './SkeletonUtils.js'
import {getControls, collsionManagement, zombieAlert} from './controls.js';
import {scene} from './main.js';
import {buildingsList, player, lifeZombie, zombieDamage, weapon, COLORS} from './constants.js';
import { updateLowLifeBorder, updatePlayerLifeUI } from './ui.js';
import { heartModel, zombieModel, gun} from './scene.js';

export const bullets = [];
export const zombies = [];
export const hearts = [];

export   let isRecoiling;

export function heartSpawn(scene, position){
  const heart = heartModel.clone();
  heart.position.copy(position);
  heart.position.y = 1;
  scene.add(heart);
  hearts.push(heart);
}

export function animateHeart(delta){
  for(const aux of hearts){
    aux.rotation.y += delta * 2;
    const t = performance.now() * 0.02;
    aux.position.y += Math.sin(t + 2) * 0.008; 
  }
}

export function bulletTrail(position){
  const trailPoints = [position.clone()];
  const geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const material = new THREE.LineBasicMaterial({ color : 0xcccccc,
                                                transparent : true,
                                                opacity : 0.4,
                                                depthWrite : false                                                      
                                              });
  const trailLine = new THREE.Line(geometry, material);

  const trail = {
    points: trailPoints,
    geometry,
    line : trailLine,
    maxPoints : 20
  };
  return trail;                                              
}
/*
export function shoot(){
  const controls = getControls();
  const ahead = controls.getObject().getObjectByName('gunFront'); //this will be used to position the bullet

  const direction = new THREE.Vector3();
  const pos = new THREE.Vector3();

  ahead.getWorldPosition(pos);
  ahead.getWorldDirection(direction);

  const geometry = new THREE.SphereGeometry(0.3, 10, 10);
  const material = new THREE.MeshBasicMaterial({color : COLORS.BULLET});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(0.2, 0.2, 0.8);
  mesh.position.copy(pos);

  const bulletSize = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(bulletSize);
  const trail = bulletTrail(mesh.position);

  const bullet = {
    mesh,
    bulletSize,
    //direction : direction.clone().normalize(),
    velocity : direction.clone().multiplyScalar(gun.userData.bulletSpeed),
    trail,
    life : 1
  }
  scene.add(mesh);
  scene.add(bullet.trail.line);
  bullets.push(bullet);
}*/

export function createBullets(){
  const radius = 0.05;
  const bodyHeight = 0.08;
  const tipHeight = 0.03;


  //Cylinder : radiusTop, radiusBottom, height, radialSegments, heightSegments);
  const geometry = new THREE.CylinderGeometry(radius, radius, bodyHeight, 16);
  
  const material = new THREE.MeshStandardMaterial({ color : COLORS.BULLET, metalness : 0.8, roughness : 0.2});

  const body = new THREE.Mesh(geometry, material);
  body.position.y = bodyHeight / 2;

  const tipGeometry = new THREE.ConeGeometry(radius, tipHeight, 16);
  const tip = new THREE.Mesh(tipGeometry, material);
  tip.position.y = bodyHeight + tipHeight/2;

  const mesh = new THREE.Group();
  mesh.add(body);
  mesh.add(tip);

  const life = null;
  const trail = null;
  const velocity = new THREE.Vector3();
  const bulletSize = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(bulletSize);

    const bullet = {
    mesh,
    bulletSize,
    velocity, 
    life,
    trail
  }
  return bullet;
}


export function shoot(){
  //get the object attached to the camera
  const controls = getControls();
  const bullet = createBullets();
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();

  if(weapon.active == 'gun'){
    const front = controls.getObject().getObjectByName('gunFront'); //this will be used to position the bullet

    front.getWorldPosition(position);
    bullet.mesh.position.copy(position);

    front.getWorldDirection(direction);

    bullet.velocity = direction.clone().multiplyScalar(gun.userData.bulletSpeed);
    bullet.trail = bulletTrail(bullet.mesh.position);

    bullet.life = gun.userData.bulletLife;
    bullet.mesh.rotation.z = -Math.PI/2 ;
    bullet.mesh.rotation.y = Math.PI/2 ;
    scene.add(bullet.mesh);
    scene.add(bullet.trail.line);
    bullets.push(bullet);
  }








}



//zombie managment
export function spawnZombie(position) {
  
  const zombieInstance = SkeletonUtils.clone(zombieModel);
  zombieInstance.position.copy(position);

  /*zombieInstance.traverse((node) => {
    console.log(node.name, node.type);
  });*/
  zombieInstance.scale.set(1.5, 1.5, 1.5);
  scene.add(zombieInstance);
  
  const boundingBox = new THREE.Box3().setFromObject(zombieInstance);
  const zombieSize = new THREE.Vector3();
  boundingBox.getSize(zombieSize);
  const rightLeg = zombieInstance.getObjectByName('mixamorig5RightUpLeg');
  const leftLeg = zombieInstance.getObjectByName('mixamorig5LeftLeg');
  const leftArm = zombieInstance.getObjectByName('mixamorig5LeftArm');
  const rightArm = zombieInstance.getObjectByName('mixamorig5RightArm');
  const lowSpine = zombieInstance.getObjectByName('mixamorig5Spine');
  const midSpine = zombieInstance.getObjectByName('mixamorig5Spine1');
    
  const zombie = {
    mesh: zombieInstance,
    boundingBox,
    rightLeg,
    leftLeg,
    leftArm,
    rightArm,
    lowSpine,
    midSpine,
    size: zombieSize,
    speed: 2,
    life: lifeZombie,
    alert: false,
    lastHitCooldown : 0,
    walkTime: Math.random() * Math.PI * 2,
    target: generateRandomTarget(position),
    damage : zombieDamage,
    timer : 0
  };

  zombie.leftArm.rotation.z = Math.PI/2;
  zombie.rightArm.rotation.z = -Math.PI/2;
  //zombie.mesh.rotation.z = 0 ;

  zombies.push(zombie);
}

export function zombieDance(zombie, delta){
  zombie.walkTime += delta * zombie.speed * 2;
  const angle = Math.sin(zombie.walkTime) * 0.3;
  const angle2 = Math.sin(zombie.walkTime + Math.PI/2) * 0.3;
  zombie.rightArm.rotation.y = angle;
  zombie.leftArm.rotation.y = angle2;
  zombie.lowSpine.rotation.y = angle;
  zombie.midSpine.rotation.y = angle;
}

export function zombieWalk(zombie, futurePos, delta){
  zombie.walkTime += delta * zombie.speed * 2;
  const angle = Math.sin(zombie.walkTime) * 0.3;
  const angle2 = Math.sin(zombie.walkTime + Math.PI/2) * 0.3;
  zombie.leftLeg.rotation.x = angle;
  zombie.rightLeg.rotation.x = angle2;
  zombie.mesh.position.copy(futurePos);
}
export function zombieRun(zombie, futurePos, delta){
  zombie.walkTime += delta * zombie.speed * 3;
  const angle = Math.sin(zombie.walkTime) * 0.3;
  const angle2 = Math.sin(zombie.walkTime + Math.PI/2) * 0.3;
  zombie.leftLeg.rotation.x = angle;
  zombie.rightLeg.rotation.x = angle2 * 0.5;
  zombie.mesh.position.copy(futurePos);
}

function generateRandomTarget(origin) {
  const range = 30; 
  const x = origin.x + (Math.random() - 0.5) * range;
  const z = origin.z + (Math.random() - 0.5) * range;
  return new THREE.Vector3(x, 0, z);
}

export function updateZombies(delta){
  for(let i = zombies.length - 1; i >= 0; i--){
    const zombie = zombies[i];
    if(zombie.life == 0){
      scene.remove(zombie.mesh);
      zombies.splice(i, 1);
      continue;
    }
    else{
      const controls = getControls();
      const playerPos = controls.getObject().position;
      zombie.mesh.position.y = 0;
      const dir = playerPos.clone().sub(zombie.mesh.position).normalize();
      zombieDance(zombie, delta);

      //if the player is seen by the zombie, then this will follow him/her
      zombieAlert(zombie, playerPos);
      
      if(zombie.alert == false){
        zombie.timer += delta;
        let randomDir = zombie.target.clone().sub(zombie.mesh.position).normalize();
        let futureRanPos = zombie.mesh.position.clone().addScaledVector(randomDir, zombie.speed * delta);        

        let collide = collsionManagement(futureRanPos, buildingsList, zombie.size);
        let zombieCollide = collsionManagement(futureRanPos, zombies, zombie.size);
        futureRanPos.y = 0 ;

        //if more than 5s passed, change target
        if(zombie.timer > 5 && (collide || zombieCollide || futureRanPos.distanceTo(zombie.target) < 5) ){
          zombie.target = generateRandomTarget(zombie.mesh.position);
          randomDir = zombie.target.clone().sub(zombie.mesh.position).normalize();
          futureRanPos = zombie.mesh.position.clone().addScaledVector(randomDir, zombie.speed * delta);  
          futureRanPos.y = 0;
          zombie.timer = 0;
        }
        zombie.mesh.lookAt(zombie.target);
        zombieWalk(zombie, futureRanPos, delta);
      }
      else if(zombie.alert == true){
        zombie.mesh.lookAt(playerPos);
        const zombieFuturePos = zombie.mesh.position.clone().addScaledVector(dir, zombie.speed * delta);
        zombieFuturePos.y = 0;
        let collideBuilding = collsionManagement(zombieFuturePos, buildingsList, zombie.size);
        if((zombieFuturePos.distanceTo(playerPos) > 5)  && !collideBuilding){          
          zombieRun(zombie, zombieFuturePos, delta);
        }
      }     
    }
  }
}

export function spawnRandomZombies(count) {
  const range = 30; //max distance from which they spwan
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * range * 2;
    const z = (Math.random() - 0.5) * range * 2;
    const y = 0;
    
    const playerPos = getControls().getObject().position;
    const position = new THREE.Vector3(x, y, z);
    if (position.distanceTo(playerPos) < 15 ) continue;
    spawnZombie(position);
  }
}

export function handleZombiePlayerDamage(playerPos, delta) {
  const hitDistance = 4;                //TO CHANGE ACCORDING GUN ...
  for (const zombie of zombies) {
    if (!zombie.mesh) continue;

    const dist = zombie.mesh.position.distanceTo(playerPos);

    if (dist < hitDistance) {
      if (!zombie.lastHitCooldown) zombie.lastHitCooldown = 0;
      zombie.lastHitCooldown -= delta;

      if (zombie.lastHitCooldown <= 0) {
        player.LIFE -= zombie.zombieDamage;                  //CHANGE ACCORDING LEVEL
        updatePlayerLifeUI();
        updateLowLifeBorder();
        zombie.lastHitCooldown = 1.5;

        if (player.LIFE == 0) {
          document.getElementById('gameFilter').style.display = 'block';
          document.getElementById('gameOverScreen').style.display = 'flex';
          //cancelAnimationFrame(animationId);
          controls.unlock();
        }               
      }
    } else {
      zombie.lastHitCooldown = 0;
    }
  }
}

//COMPUTE WHICH WEAPON THE PLAYER IS USING
export function computeWeapon(){
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

export function updateBullets(delta){
  const gravity = new THREE.Vector3(0, -9.8, 0);
  for (let i = bullets.length - 1; i >= 0; i-- ){
    /*recoilFlag = true;
    updateRecoil(delta);*/
    const bullet = bullets[i];
    bullet.velocity.addScaledVector(gravity, delta);
    const bulletFuturePos = bullet.mesh.position.clone().addScaledVector(bullet.velocity, delta);

    let block = collsionManagement(bulletFuturePos, buildingsList, bullet.bulletSize);
    
    if(bullet.life != 0){
      if(!block){
        //console.log(bullet.life);
        bullet.mesh.position.copy(bulletFuturePos);
        bullet.trail.points.push(bullet.mesh.position.clone());
        if(bullet.trail.points.length > bullet.trail.maxPoints){
          bullet.trail.points.shift();
        }
        bullet.trail.geometry.setFromPoints(bullet.trail.points);
        bullet.life -= delta;
        for(let z = zombies.length - 1; z >= 0 ; z--){
          const zombie = zombies[z];
          if(!zombie.mesh) continue;

          const distance = bulletFuturePos.distanceTo(zombie.mesh.position);
          const hitRadius = 4;
          
         //console.log('Bullet - Zombie: ', distance);
          //if the bullet hits the zombie his life decreases, according to the power of the gun that the player has !!!!!!!!!
            if(distance < hitRadius){
              zombie.lide -= computeZombieDamage();
              console.log(zombie.life);
              if(zombie.life <= 0){
                heartSpawn(scene, zombie.mesh.position);
                scene.remove(zombie.mesh);
                zombies.splice(z, 1);
              } 
            scene.remove(bullet.mesh);
            bullets.splice(i ,1);
            scene.remove(bullet.trail.line);
            bullet.trail.geometry.dispose();
            bullet.trail.line.material.dispose();
            break;    
            }    
        }
      }
      else if(block){
        bullet.life = 0;
        scene.remove(bullet.trail.line);
        bullet.trail.geometry.dispose();
        bullet.trail.line.material.dispose();
        scene.remove(bullet.mesh);
        bullets.splice(i,1);
      }
    }
    if(bullet.life < 0){
        scene.remove(bullet.trail.line);
        bullet.trail.geometry.dispose();
        bullet.trail.line.material.dispose();      
        scene.remove(bullet.mesh);
        bullets.splice(i,1);
    }
  }
}

let recoil = 0;
let recoilFlag = false;

export function updateRecoil(delta){
  //recoilFlag = true;
  const originalRot = gun.rotation.x;
  const originalPos = gun.position.z;
  recoil += delta
  let time = Math.min(recoil/0.2 , 1);
  gun.rotation.x = 0 +  Math.sin(time * Math.PI) *0.2;
  gun.position.z = -1 + Math.sin(time * Math.PI) * 0.2;

  setTimeout(() => {
    gun.rotation.x = 0;
    gun.position.z = -1;        
    recoilFlag = false;
  }, 150);
}