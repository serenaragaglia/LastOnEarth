import * as THREE from 'https://esm.sh/three@0.161.0';
import * as SkeletonUtils from './SkeletonUtils.js'
import {getControls, collsionManagement} from './controls.js';
import {scene} from './main.js';
import {COLORS, buildingsList, BULLETSPEED, PLAYER} from './constants.js';
import { updateLowLifeBorder, updatePlayerLifeUI } from './ui.js';
import { heartModel, zombieModel } from './scene.js';
import { move } from './input.js';

export const bullets = [];
export const zombies = [];
export const hearts = [];
//let animationClock = 0;

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

export function shoot(){
  const controls = getControls();
  const ahead = controls.getObject().getObjectByName('gunFront'); //this will be used to position the bullet

  const direction = new THREE.Vector3();
  const pos = new THREE.Vector3();

  ahead.getWorldPosition(pos);
  ahead.getWorldDirection(direction);

  const geometry = new THREE.SphereGeometry(0.5, 10, 10);
  const material = new THREE.MeshBasicMaterial({color : COLORS.BULLET});
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(0.3, 0.3, 0.8);
  mesh.position.copy(pos);

  const bulletSize = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(bulletSize);
  const trail = bulletTrail(mesh.position);

  const bullet = {
    mesh,
    bulletSize,
    //direction : direction.clone().normalize(),
    velocity : direction.clone().multiplyScalar(BULLETSPEED),
    trail,
    life : 1
  }
  scene.add(mesh);
  scene.add(bullet.trail.line);
  bullets.push(bullet);
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
  

  const zombie = {
    mesh: zombieInstance,
    rightLeg,
    leftLeg,
    leftArm,
    rightArm,
    size: { x: zombieSize.x, z: zombieSize },
    speed: 2,
    life: 10,
    alert: false,
    lastHitCooldown : 0,
    walkTime: Math.random() * Math.PI * 2,
   // walking : false,
    target: generateRandomTarget(position),
    timer : 0
  };

  zombie.leftArm.rotation.z = Math.PI/2;
  zombie.rightArm.rotation.z = -Math.PI/2;


  zombies.push(zombie);
}

export function moveZombie(zombie, futurePos, delta){
  zombie.walkTime += delta * zombie.speed * 2;
  const angle = Math.sin(zombie.walkTime) * 0.3;
  const angle2 = Math.sin(zombie.walkTime + Math.PI/2) * 0.3;
  zombie.leftLeg.rotation.x = angle;
  zombie.rightLeg.rotation.x = angle2;
  zombie.rightArm.rotation.y = angle;
  zombie.leftArm.rotation.y = angle2;
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

      //collision with objects and player
      const dist = zombie.mesh.position.distanceTo(playerPos);

      //if the player is seen by the zombie, then this will follow him/her
      if(dist < 10) {
        zombie.alert = true;
      }
      if(dist > 30) {
        zombie.alert = false;
      }

      if(zombie.alert == true){
        //console.log('zombie alert true');
        zombie.mesh.lookAt(playerPos);
        const zombieFuturePos = zombie.mesh.position.clone().addScaledVector(dir, zombie.speed * delta);
        zombieFuturePos.y = 0;
        let collide = collsionManagement(zombieFuturePos, buildingsList, zombie.size);
        if((zombieFuturePos.distanceTo(playerPos) > 3.5) && (!collide)){
          moveZombie(zombie, zombieFuturePos, delta);
        }
      }
      else if(zombie.alert == false){
        //console.log('zombie alert false');
        zombie.timer += delta;
        //if more than 15s passed, change target
        if(zombie.timer > 2){
          //let target = new THREE.Vector3();
          zombie.target = generateRandomTarget(zombie.mesh.position);
          zombie.timer = 0;
        }

        const randomDir = zombie.target.clone().sub(zombie.mesh.position).normalize();
        const futureRanPos = zombie.mesh.position.clone().addScaledVector(randomDir, zombie.speed * delta);
        futureRanPos.y = 0 ;

        let collide = collsionManagement(futureRanPos, buildingsList, zombie.size);
        let zombieCollide = collsionManagement(futureRanPos, zombies, zombie.size);
        if((collide == false) && (futureRanPos.distanceTo(zombie.target) > 5 && (zombieCollide == false))){
          zombie.mesh.lookAt(zombie.target);
          //zombie.walking = true;
          moveZombie(zombie, futureRanPos, delta);
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
    if (position.distanceTo(playerPos) < 10) continue;
    spawnZombie(position);
  }
}

export function handleZombiePlayerDamage(playerPos, delta) {
  const hitDistance = 3.5;
  for (const zombie of zombies) {
    if (!zombie.mesh) continue;

    const dist = zombie.mesh.position.distanceTo(playerPos);
    //console.log('Distanza' , dist);

    if (dist < hitDistance) {
      if (!zombie.lastHitCooldown) zombie.lastHitCooldown = 0;
      //console.log('Last', zombie.lastHitCooldown);
      zombie.lastHitCooldown -= delta;
      //console.log('Last Update', zombie.lastHitCooldown);

      if (zombie.lastHitCooldown <= 0) {
        //console.log('Vita', PLAYER.LIFE);
        PLAYER.LIFE -= 10;
        updatePlayerLifeUI();
        updateLowLifeBorder();
        //console.log('Vita Update', PLAYER.LIFE);
        zombie.lastHitCooldown = 1.5; // 1 secondo di cooldown

        if (PLAYER.LIFE == 0) {
          document.getElementById('gameFilter').style.display = 'block';
          document.getElementById('gameOverScreen').style.display = 'flex';
          //cancelAnimationFrame(animationId); // ferma il ciclo se usi animationId
          controls.unlock();
        }               
        //console.log('🩸 Danno ricevuto! Vita:', PLAYER.LIFE);
      }
    } else {
      zombie.lastHitCooldown = 0; // resetta se troppo lontano
    }
  }
}

export function updateBullets(delta){
  const gravity = new THREE.Vector3(0, -9.8, 0);

  for (let i = bullets.length - 1; i >= 0; i-- ){
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
              zombie.life -= 1;
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
