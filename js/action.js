import * as THREE from 'https://esm.sh/three@0.161.0';
import {getControls, collsionManagement} from './controls.js';
import {scene} from './main.js';
import { getZombie } from './scene.js';
import {COLORS, buildingsList, BULLETSPEED} from './constants.js';

export const bullets = [];
export const zombies = [];

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
  mesh.scale.set(0.3, 0.3, 0.3);
  mesh.position.copy(pos);

  const bulletSize = new THREE.Vector3();
  new THREE.Box3().setFromObject(mesh).getSize(bulletSize);
  const bullet = {
    mesh,
    bulletSize,
    //direction : direction.clone().normalize(),
    velocity : direction.clone().multiplyScalar(BULLETSPEED),
    life : 5
  }
  scene.add(mesh);
  bullets.push(bullet);
}

//zombie managment
export function spawnZombie(position, modelTemplate){
  const size = new THREE.Vector3();
  new THREE.Box3().setFromObject(modelTemplate).getSize(size);

  const zombie = {
    mesh: modelTemplate.clone(),
    size,
    speed : 2,
    life : 10,
    alert : false
  };
  
  zombie.mesh.position.copy(position);
  zombie.mesh.name = 'zombie';
  scene.add(zombie.mesh);
  zombies.push(zombie);
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
      if(dist < 6) {
        zombie.alert = true;
      }
      if(dist > 15) {
        zombie.alert = false;
      }

       if(zombie.alert == true){
        const zombieFuturePos = zombie.mesh.position.clone().addScaledVector(dir, zombie.speed * delta);
        zombieFuturePos.y = 0;
        let collide = false //collsionManagement(zombieFuturePos, buildingsList, zombie.size);
        if(!collide){
          zombie.mesh.position.copy(zombieFuturePos);
        }        
      }
      zombie.mesh.lookAt(playerPos);

      /*const t = performance.now() * 0.005;
      const leg = zombie.mesh.getObjectByName('RightLeg');
      if (leg) leg.rotation.x = Math.sin(t) * 0.5;*/

    }
  }
}

export function spawnRandomZombies(count, modelTemplate) {
  const range = 30; // raggio massimo da cui spawnano attorno all’origine

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * range * 2;
    const z = (Math.random() - 0.5) * range * 2;
    const y = 0; // o il valore corretto per il terreno

    const position = new THREE.Vector3(x, y, z);
    //if (position.distanceTo(player.position) < 5) continue;
    spawnZombie(position, modelTemplate);
  }
}

export function updateBullets(delta){
  const gravity = new THREE.Vector3(0, -9.8, 0);

  for (let i = bullets.length - 1; i >= 0; i-- ){
    const bullet = bullets[i];

    bullet.velocity.addScaledVector(gravity, delta);
    const bulletFuturePos = bullet.mesh.position.clone().addScaledVector(bullet.velocity, delta);

    let block = collsionManagement(bulletFuturePos, buildingsList, bullet.bulletSize);

    if(!block){
      bullet.mesh.position.copy(bulletFuturePos);
      bullet.life -= delta;

      for(let z = zombies.lenght - 1; z >= 0 ; z--){
        const zombie = zombies[z];

        if(!zombie.mesh) continue;

        const distance = bullet.mesh.position.distanceTo(zombie.mesh.position);
        const hitRadius = 5;
        
        //if the bullet hits the zombie his life decreases, according to the power of the gun that the player has !!!!!!!!!
        if(distance < hitRadius){
          zombie.life -= 1;
          console.log(zombie.life);
          if(zombie.life <= 0){
            scene.remove(zombie.mesh);
            zombies.splice(z, 1);
          }
          scene.remove(bullet.mesh);
          bullets.splice(i ,1);
          break;
        }
      }
      if( i < bullets.lenght && bullet.life <= 0){
        scene.remove(bullet.mesh);
        bullets.splice(i,1);
      }
    }
    else if(block){
      bullet.life = 0;
      scene.remove(bullet.mesh);
      bullets.splice(i,1);
    }
  }
}
