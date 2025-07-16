import * as THREE from 'https://esm.sh/three@0.161.0';
import * as SkeletonUtils from './SkeletonUtils.js'
import {getControls, collsionManagement, zombieAlert, getWeapon} from './controls.js';
import {scene} from './main.js';
import { updateLowLifeBorder, updatePlayerLifeUI } from './ui.js';
import { createZombieMarker, heartModel, updateZombieMarker, zombieMarkers, zombieModel} from './scene.js';
import {buildingsList, player, COLORS, OPTIONS, waves, levels, zombieLife } from './constants.js';

export const bullets = [];
export const zombies = [];
export const hearts = [];

export let firing = false;
let timer = 0; let returning = false; let idle = false;


export function heartSpawn(scene, position){
  const heart = heartModel.clone();
  heart.castShadow = true;
  heart.position.copy(position);
  heart.position.y = 1;
  scene.add(heart);
  hearts.push(heart);
}

export function animateHeart(delta, scene){
  for(const aux of hearts){
    aux.rotation.y += delta * 2;
    const t = performance.now() * 0.02;
    aux.position.y += Math.sin(t + 2) * 0.008; 
    aux.userData.timer += delta;

    if(aux.userData.timer >= aux.userData.max){
      scene.remove(aux);
      hearts.splice(aux, 1);
    }
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
    maxPoints : 5 
  };
  return trail;                                              
}

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
  const box = new THREE.Box3().setFromObject(mesh);
  //const boxHelper = new THREE.Box3Helper(box, 0xff0000);
  //mesh.add(box);
  //mesh.add(boxHelper);

  box.getSize(bulletSize);

    const bullet = {
    mesh,
    bulletSize,
    velocity, 
    life,
    trail,
    box
   // boxHelper
  }
  bullet.mesh.rotation.z = -Math.PI/2 ;
  bullet.mesh.rotation.y = Math.PI/2 ;
  return bullet;
}

export function shoot(){
  //get the object attached to the camera
  const controls = getControls();
  const bullet = createBullets();
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();

  const currentWeapon = getWeapon();
  const currentFront = controls.getObject().getObjectByName('front'); //this will be used to position the bullet

  currentFront.getWorldPosition(position);
  bullet.mesh.position.copy(position);

  controls.getObject().getWorldDirection(direction);
  direction.normalize();

  bullet.velocity = direction.clone().multiplyScalar(currentWeapon.userData.bulletSpeed);
  bullet.trail = bulletTrail(bullet.mesh.position);

  bullet.life = currentWeapon.userData.bulletLife;
  firing = true;
  idle = false;

  scene.add(bullet.mesh);
  scene.add(bullet.trail.line);
  bullets.push(bullet);

}

function createHealthBar(zombie, width, height) {
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );

  const foreground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  foreground.position.z += 0.01;
  background.add(foreground);

  const position = getControls().getObject().position; //player pos

  background.position.set(0, 2, 0);
  background.lookAt(position); 
  zombie.mesh.add(background);
  zombie.healthBar = foreground;
  zombie.healthBarBackground = background;
}

export function updateZombieHealthbar(zombie){
  let maxLife;

  if(levels.currentLevel == 1){
    maxLife = zombieLife.level1;
  }
  else if(levels.currentLevel == 2){
    maxLife = zombieLife.level2;
  }
  else if(levels.currentLevel == 3){
    maxLife = zombieLife.level3;
  }

  const perc = zombie.life / maxLife;
  zombie.healthBar.scale.x = perc;

  const position = getControls().getObject().position;
  zombie.healthBarBackground.lookAt(position);
  
}

//zombie managment
export function spawnZombie(position) {
  
  const zombieInstance = SkeletonUtils.clone(zombieModel);
  zombieInstance.position.copy(position);

  //zombieInstance.scale.set(0, 0, 0);
  scene.add(zombieInstance);

  const boundingBox = new THREE.Box3().setFromObject(zombieInstance);
  const zombieSize = new THREE.Vector3();
  boundingBox.getSize(zombieSize);
  const rightLeg = zombieInstance.getObjectByName('mixamorig5RightLeg');
  const leftLeg = zombieInstance.getObjectByName('mixamorig5LeftLeg');
  const leftArm = zombieInstance.getObjectByName('mixamorig5LeftArm');
  const rightArm = zombieInstance.getObjectByName('mixamorig5RightArm');
  const lowSpine = zombieInstance.getObjectByName('mixamorig5Spine');
  const midSpine = zombieInstance.getObjectByName('mixamorig5Spine1');

  const rightUpLeg = zombieInstance.getObjectByName('mixamorig5RightUpLeg');
  const leftUpLeg = zombieInstance.getObjectByName('mixamorig5LeftUpLeg');

  const marker = createZombieMarker();
 
  const zombie = {
    mesh: zombieInstance,
    life: zombieModel.userData.life,
    damage : zombieModel.userData.damage,
    size: zombieSize,
    speed: 2,    
    boundingBox,
    rightLeg,
    leftLeg,

    rightUpLeg,
    leftUpLeg,

    leftArm,
    rightArm,

    lowSpine,
    midSpine,  

    midSpineAngle : 0,

    leftLegAngle : 0,
    rightLegAngle : 0,

    rightArmAngle :0,
    leftArmAngle :0,

    alert: false,
    lastHitCooldown : 0,
    timer : 0,
    walkTime: Math.random() * Math.PI * 2,
    scaleDirection : 1,

    target: generateRandomTarget(position),
    scaleTimer : 0,
    scaleDuration : 0.5,

    marker : marker

  };

  zombie.leftArm.rotation.z = Math.PI/2;
  zombie.rightArm.rotation.z = -Math.PI/2;
  //zombie.mesh.rotation.z = 0 ;
  //console.log(zombieInstance);

  createHealthBar(zombie, 1, 0.2);
  zombies.push(zombie);
}

export function spawnRandomZombies(count) {
  const range = 80; //max distance from which they spwan
  for (let i = 0; i < count; i++) {
    const playerPos = getControls().getObject().position;
    const x = (Math.random() - 0.5) * range * 2;
    const z = (Math.random() - 0.5) * range * 2;
    const y = 0;    
    
    const position = new THREE.Vector3(x, y, z);
    position.x = THREE.MathUtils.clamp(position.x, -OPTIONS.areaSize, OPTIONS.areaSize);
    position.z = THREE.MathUtils.clamp(position.z, -OPTIONS.areaSize, OPTIONS.areaSize);
    if (position.distanceTo(playerPos) > 25){
      spawnZombie(position);
    } else {
      const newX = (Math.random() - 0.5) * range * 2 + position.x;
      const newZ = (Math.random() - 0.5) * range * 2 + position.z; 
      const newPosition = new THREE.Vector3(newX, y, newZ);
      spawnZombie(newPosition);
    }
  }
}

export function startZombieWave(count){
  waves.remaining = count;
  waves.spawned = 0;
  waves.spawnTimer = 0;
  waves.isSpawning = true;
  waves.betweenSpawn =  Math.max(1.0, 3 - levels.currentLevel * 0.3); //the time between spwan decreases when the level is higher, making it more difficult
}

export function zombieDance(zombie, delta){
  zombie.walkTime += delta * zombie.speed * 2;

  const maxAngle = Math.PI/9;

  //sin and cos are used to have a smooth loop
  const targetLeft = Math.sin(zombie.walkTime) * maxAngle;
  const targetRight = Math.sin(zombie.walkTime + 0.5) * maxAngle; //the right arm is slightly off-phase
  const target = Math.cos(zombie.walkTime + 0.02) * maxAngle;

  zombie.leftArmAngle = THREE.MathUtils.lerp(zombie.rightArmAngle, targetRight, zombie.walkTime/1000);
  zombie.rightArmAngle = THREE.MathUtils.lerp(zombie.leftArmAngle, targetLeft, zombie.walkTime/1000);
  zombie.midSpineAngle = THREE.MathUtils.lerp(zombie.midSpineAngle, target, zombie.walkTime/1000);

  zombie.leftArm.rotation.y = zombie.rightArmAngle;
  zombie.rightArm.rotation.y = zombie.leftArmAngle;
  zombie.lowSpine.rotation.x = zombie.midSpineAngle;

}

export function zombieWalk(zombie, futurePos, delta){
  zombie.walkTime += delta * zombie.speed * 1.5 ; //to make them go faster we can multiply this value

  const maxAngle = Math.PI/6;

  const targetLeft = Math.sin(zombie.walkTime) * maxAngle;
  const targetRight = Math.cos(zombie.walkTime + 0.2) * maxAngle;

  zombie.leftLegAngle = THREE.MathUtils.lerp(zombie.leftLegAngle, targetLeft, zombie.walkTime/1000);
  zombie.rightLegAngle = THREE.MathUtils.lerp(zombie.rightLegAngle, targetRight, zombie.walkTime/1000);

  zombie.leftLeg.rotation.x = zombie.leftLegAngle;
  zombie.rightLeg.rotation.x = zombie.rightLegAngle;

  zombie.leftUpLeg.rotation.x = zombie.leftLegAngle;
  zombie.rightUpLeg.rotation.x = zombie.rightLegAngle;

  zombie.mesh.position.copy(futurePos);
}

export function zombieRun(zombie, futurePos, delta){
  zombie.walkTime += delta * zombie.speed * 2;

  const maxAngle = Math.PI/4;

  const targetLeft = Math.sin(zombie.walkTime ) * maxAngle;
  const targetRight = Math.cos(zombie.walkTime + 0.02) * maxAngle;

  zombie.leftLegAngle = THREE.MathUtils.lerp(zombie.leftLegAngle, targetLeft, zombie.walkTime/1000);
  zombie.rightLegAngle = THREE.MathUtils.lerp(zombie.rightLegAngle, targetRight, zombie.walkTime/1000);

  zombie.leftLeg.rotation.x = zombie.leftLegAngle;
  zombie.rightLeg.rotation.x = zombie.rightLegAngle;

  zombie.leftUpLeg.rotation.x = zombie.leftLegAngle;
  zombie.rightUpLeg.rotation.x = zombie.rightLegAngle;

  zombie.mesh.position.copy(futurePos);
}

export function zombieSpawnAnimation(zombie, delta){
  if(zombie.scaleTimer < zombie.scaleDuration){
    zombie.scaleTimer += delta;
    const t = Math.min(zombie.scaleTimer / zombie.scaleDuration , 1);
    const scale = THREE.MathUtils.lerp(0, 1.5, t);
    zombie.mesh.scale.set(scale, scale, scale);
  }

}

function generateRandomTarget(origin) {
  const range = 80; 
  const x = origin.x + (Math.random() - 0.5) * range;
  const z = origin.z + (Math.random() - 0.5) * range;
  return new THREE.Vector3(x, 0, z);
}

export function handleZombiePlayerDamage(playerPos, delta) {
  const hitDistance = 6;      

  const controls = getControls();  
  for (const zombie of zombies) {
    if (!zombie.mesh) continue;
    
    const dist = zombie.mesh.position.distanceTo(playerPos);

    if (dist < hitDistance) {
      if (!zombie.lastHitCooldown) zombie.lastHitCooldown = 0;
      zombie.lastHitCooldown -= delta;

      if (zombie.lastHitCooldown <= 0) {
        player.LIFE -= zombie.damage;                  //CHANGE ACCORDING LEVEL
        updatePlayerLifeUI();
        updateLowLifeBorder();
        zombie.lastHitCooldown = 1.5;             
      }
    } else {
      zombie.lastHitCooldown = 0;
    }
  }
  if (player.LIFE <= 0) {
  document.getElementById('gameFilter').style.display = 'block';
  document.getElementById('gameOverScreen').style.display = 'flex';
  //cancelAnimationFrame(animationId);
  controls.unlock();
  }  
}

export function updateZombies(delta){
  for(let i = zombies.length - 1; i >= 0; i--){
    const zombie = zombies[i];
    updateZombieHealthbar(zombie);
    zombieSpawnAnimation(zombie, delta);

    updateZombieMarker(zombie);
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
      futureRanPos.y = 0 ;

      let collide = collsionManagement(futureRanPos, buildingsList, zombie.size);
      
      //if more than 5s passed, change target
      if(zombie.timer > 10 || collide == true){
        zombie.timer = 0;
        zombie.target = generateRandomTarget(zombie.mesh.position);
        
      }else{
        zombie.mesh.lookAt(zombie.target);
        zombieWalk(zombie, futureRanPos, delta);          
      }

    }
    else if(zombie.alert == true){
      zombie.mesh.lookAt(playerPos);
      const zombieFuturePos = zombie.mesh.position.clone().addScaledVector(dir, zombie.speed * delta) ;
      zombieFuturePos.y = 0;
      let collideBuilding = collsionManagement(zombieFuturePos, buildingsList, zombie.size);
      if(!collideBuilding && zombieFuturePos.distanceTo(playerPos) > 5){          
        zombieRun(zombie, zombieFuturePos, delta);          
      }
    }     
    
  }
}

export function updateSpawn(delta){
  if(!waves.isSpawning) return;

  waves.spawnTimer += delta;

  if(waves.spawned >= waves.remaining){
    waves.isSpawning = false;
    return;
  }

  if(waves.spawnTimer >= waves.betweenSpawn){
    const toSpawn = waves.remaining - waves.spawned;
    const waveCount = Math.min(toSpawn, waves.maxZombieWave);
    spawnRandomZombies(waveCount);
    waves.spawned += waveCount;
    waves.spawnTimer = 0;
  }
}

export function updateBullets(delta){

  const gravity = new THREE.Vector3(0, -9.8, 0);
  const currentWeapon = getWeapon();
  for (let i = bullets.length - 1; i >= 0; i-- ){

    const bullet = bullets[i];
    //updating velocity value
    bullet.velocity.addScaledVector(gravity, delta);
    //incrementing the position using the updated velocity
    const bulletFuturePos = bullet.mesh.position.clone().addScaledVector(bullet.velocity, delta);

    let block = collsionManagement(bulletFuturePos, buildingsList, bullet.bulletSize);
    
    if(bullet.life != 0){
      if(!block){
        //console.log(bullet.life);
        bullet.mesh.position.copy(bulletFuturePos);
        bullet.trail.points.push(bullet.mesh.position.clone());
        bullet.box.setFromObject(bullet.mesh);
        
      //const boxHelper = new THREE.Box3Helper(bullet.box, 0xff0000);
      //scene.add(boxHelper);

        if(bullet.trail.points.length > bullet.trail.maxPoints){
          bullet.trail.points.shift();
        }
        bullet.trail.geometry.setFromPoints(bullet.trail.points);
        bullet.life -= delta;
        for(let z = zombies.length - 1; z >= 0 ; z--){
          const zombie = zombies[z];
          if(!zombie.mesh) continue;

          const distance = bulletFuturePos.distanceTo(zombie.mesh.position);
          const hitRadius = currentWeapon.userData.hitDistance;
         //console.log('Bullet - Zombie: ', distance);
          //if the bullet hits the zombie his life decreases, according to the power of the gun that the player has !!!!!!!!!
            if(distance < hitRadius){
              zombie.life -= currentWeapon.userData.damage;
              //console.log(zombie.life);
              if(zombie.life <= 0){
                scene.remove(zombie.marker);
                zombieMarkers.splice(zombieMarkers, i);
                heartSpawn(scene, zombie.mesh.position);
                player.kill++;
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

export function updateRecoil(delta){
  const currentWeapon = getWeapon();
  if(!currentWeapon) return;
  const currentRotation = currentWeapon.rotation;
  const targetRotX = currentWeapon.userData.rotRecoilX;
  const targetRotZ = currentWeapon.userData.rotRecoilZ;

    if(firing == true){
      timer += delta;
      const t  = timer / 0.3;

      //when the animation finishes set the final values of the rotation and set up the returning phase
      if( t >= 1){
        currentRotation.x = targetRotX;
        currentRotation.z = targetRotZ;
        timer = 0;
        firing = false;
        returning = true;
      } else {
        const easedT = easeOut(t);  //starts fast and slows down at the end
        currentRotation.x = THREE.MathUtils.lerp(0, targetRotX, easedT);
        currentRotation.z = THREE.MathUtils.lerp(0, targetRotZ, easedT);
      }
      currentWeapon.rotation.x = currentRotation.x;
      currentWeapon.rotation.z = currentRotation.z;    
    }
    else if(returning == true){
      timer += delta;
      const t = timer / 0.5;

      //when finished return to the initial rotation 
      if(t >= 1){
        currentRotation.x = 0;
        currentRotation.z = 0;
        returning = false;
        idle = true;
      } else {
        const easedT = easeIn(t);
        currentRotation.x = THREE.MathUtils.lerp(targetRotX, 0, easedT);
        currentRotation.z = THREE.MathUtils.lerp(targetRotZ, 0, easedT);
      }
      currentWeapon.rotation.x = currentRotation.x;
      currentWeapon.rotation.z = currentRotation.z;
    }
  
}

export function easeOut(t){
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t){
  return t * t * t ;
}
