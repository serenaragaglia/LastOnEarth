import * as THREE from 'https://esm.sh/three@0.161.0';
import {getControls, collsionManagement} from './controls.js';
import {scene} from './main.js';
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
    life : 3
  }
  scene.add(mesh);
  bullets.push(bullet);
}

//zombie managment
export function spawnZombie(position) {
  const size = 3;
  const zombieMesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );

  zombieMesh.position.copy(position);
  zombieMesh.name = 'zombie';
  scene.add(zombieMesh);

  const zombie = {
    mesh: zombieMesh,
    size: { x: size, z: size },
    speed: 2,
    life: 10,
    alert: false
  };

  zombies.push(zombie);
}

export function updateZombies(delta){
  for(let i = zombies.length - 1; i >= 0; i--){
    const zombie = zombies[i];
    console.log('Zombie Size', zombie.size);
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

      //console.log('Player - Zombie :', dist);
       if(zombie.alert == true){
        const zombieFuturePos = zombie.mesh.position.clone().addScaledVector(dir, zombie.speed * delta);
        zombieFuturePos.y = 0;
        let collide = collsionManagement(zombieFuturePos, buildingsList, zombie.size);
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

export function spawnRandomZombies(count) {
  const range = 30; //max distance from which they spwan
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * range * 2;
    const z = (Math.random() - 0.5) * range * 2;
    const y = 0;

    const position = new THREE.Vector3(x, y, z);
    //if (position.distanceTo(player.position) < 5) continue;
    spawnZombie(position);
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

      for(let z = zombies.length - 1; z >= 0 ; z--){
        const zombie = zombies[z];
  
        if(!zombie.mesh) continue;

        const distance = bullet.mesh.position.distanceTo(zombie.mesh.position);
        const hitRadius = 1;
        
       // console.log('Bullet - Zombie: ', distance);


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
