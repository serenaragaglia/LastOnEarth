import * as THREE from 'https://esm.sh/three@0.161.0';
import { GLTFLoader } from 'https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import {Sky} from './sky.js';
import { buildingsList, OPTIONS, defaultFov, zombieLife} from './constants.js';
import { scene } from './main.js';
import { getControls } from './controls.js';
export let gun = null;
export let shotgun = null;
export let smg = null;
export let zombieModel = null;
export let heartModel = null;
export let day = 0;
export let sun;
export let skyValues;
export let sunLight;
export let stars;
export let zombieMarkers = [];
// ----------LOADER

//Function to load textures
function loadTexture(path, options = {}) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(path);
  if (options.wrapS) texture.wrapS = options.wrapS;
  if (options.wrapT) texture.wrapT = options.wrapT;
  if (options.repeat) texture.repeat.set(options.repeat.x, options.repeat.y);

  return texture;
}

//Function used to load the gun model
export async function loadGunModel(controls) {
  const loader = new GLTFLoader();
  loader.load('./models/hand_gun.glb', (gltf) => {
    gun = gltf.scene;
    gun.scale.set(0.05, 0.05, 0.05);
    gun.rotation.y= Math.PI;
    //gun.name = 'gun';
    gun.position.set(0.4, -0.5, -1.0); //position wrt camera
    controls.getObject().add(gun);  
    gun.userData.weaponType = 'gun';
    gun.userData.damage = 1;
    gun.userData.hitDistance  = 6;
    gun.userData.bulletSpeed = 80;
    gun.userData.bulletLife = 2;
    gun.userData.recoilY = 0.05;
    gun.userData.rotRecoilX = 0.3;
    gun.userData.rotRecoilZ = 0.05;


    const front = new THREE.Object3D(); 
    front.name = 'front';
    front.position.set(0.4, 0.5, 3);
    gun.add(front);

    /*const axes = new THREE.AxesHelper(10); // lunghezza degli assi
    front.add(axes);*/
  }, undefined, (err) => {
    console.error('Errore nel caricamento della pistola:', err);
  });

}

export async function loadShotGunModel(controls) {
  const loader = new GLTFLoader();
  loader.load('./models/shotgun.glb', (gltf) => {
    shotgun = gltf.scene;
    shotgun.scale.set(2, 2, 2);

    shotgun.rotation.y= Math.PI/2;
    shotgun.position.set(0.4, -0.4, -1.0); //position wrt camera
    controls.getObject().add(shotgun);  

    shotgun.userData.weaponType = 'shotgun';
    shotgun.userData.damage = 3;
    shotgun.userData.hitDistance  = 4;
    shotgun.userData.bulletSpeed = 65;
    shotgun.userData.bulletLife = 1;
    shotgun.userData.posRecoilY = 0.08;
    shotgun.userData.rotRecoilX = 0.4;
    shotgun.userData.rotRecoilZ = 0.08;

    const front = new THREE.Object3D(); 
    front.name = 'front';
    front.position.set(0.5, 0.1, -0.006);
    shotgun.add(front);
    console.log(shotgun.position);
    console.log(front.position);

    /*const axes = new THREE.AxesHelper(10); // lunghezza degli assi
    front.add(axes);*/
  }, undefined, (err) => {
    console.error('Errore nel caricamento della pistola:', err);
  });

}

export async function loadSMGModel(controls) {
  const loader = new GLTFLoader();
  loader.load('./models/smg.glb', (gltf) => {
    smg = gltf.scene;
    smg.scale.set(2, 2, 2);

    smg.rotation.y= Math.PI;
    smg.position.set(-0.4, 2.2, -0.7); //position wrt camera
    controls.getObject().add(smg);  

    smg.userData.weaponType = 'smg';
    smg.userData.damage = 4;
    smg.userData.hitDistance  = 3;
    smg.userData.bulletSpeed = 80;
    smg.userData.bulletLife = 1;
    smg.userData.posRecoilY = 0.1;
    smg.userData.rotRecoilX = 0.45;
    smg.userData.rotRecoilZ = 0.1;

    const front = new THREE.Object3D(); 
    front.name = 'front';
    front.position.set(0, 0.1, -1);
    smg.add(front);
    console.log(smg.position);
    console.log(front.position);

    const axes = new THREE.AxesHelper(10); // lunghezza degli assi
    front.add(axes);
  }, undefined, (err) => {
    console.error('Errore nel caricamento della pistola:', err);
  });

}

export async function loadZombieModel() {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load('./models/zombie.glb',
      (gltf) => {
        zombieModel = gltf.scene;
        //recursive search insiede the model and its children
        zombieModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;        
            child.receiveShadow = true;    
            child.material.side = THREE.FrontSide; //to not have transparencies
          }
        });
        zombieModel.name = 'zombieModel';
        zombieModel.userData.life = zombieLife.level1;
        zombieModel.userData.damage = 10;     
        /*const axes = new THREE.AxesHelper(10);
        zombieModel.add(axes);*/        
        resolve(zombieModel);
      },
      undefined,
      (err) => {
        console.error('Errore nel caricamento dello zombie:', err);
        reject(err);
      }
    );
  });
}

export function getZombie(){
  return zombieModel;
}

export async function loadHeartModel() {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load('./models/heart__sketchfabweeklychallenge.glb',
      (gltf) => {
        heartModel = gltf.scene;
        heartModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;          
            child.material.side = THREE.FrontSide; //to not have transparencies
          }
        });
        heartModel.name = 'heartModel';
        heartModel.position.set(0.4, 0.5, 13);
        heartModel.scale.set(0.5, 0.5, 0.5);

        heartModel.userData.timer = 0;
        heartModel.userData.max = 15;

        resolve(heartModel);
      },
      undefined,
      (err) => {
        console.error('Errore nel caricamento dello zombie:', err);
        reject(err);
      }
    );
  });
}

//-------------------WORLD SCENE AND AMBIENT
//Set up of the scene
export function createScene() {
  const scene = new THREE.Scene();
  //scene.background = new THREE.Color(COLORS.SKY);
  scene.background = null;
  const color = new THREE.Color('red');
  scene.fog = new THREE.Fog(color, 50, 500);
  return scene;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(defaultFov, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 2;
  return camera;
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias : true});
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createFloor(scene) {
  const geometry = new THREE.PlaneGeometry(500, 500);
  const texture = loadTexture('../assets/textures/road.png', {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    repeat: { x: 10, y: 10 }
  });

  const material = new THREE.MeshLambertMaterial({ map: texture });
  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  floor.add(line);
  scene.add(floor);
}

export function createLights(scene) {
  sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(0, 100, 0);
  sunLight.castShadow = true;


  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;

  
  const d = 200;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 500;

  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
}

export function createStars(scene){
  const geometry = new THREE.BufferGeometry();
  const starsNumber = 1000;
  const starPos = [];

  for (let i = 0 ; i < starsNumber; i++){
    const radius = 400 + Math.random() * 100;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta); 
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    starPos.push(x, y , z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const material = new THREE.PointsMaterial({
    color : 0xffffff,
    size : 0.7,
    sizeAttenuation : true,
    transparent : true,
    opacity : 0
  });

  //console.log(material.opacity);
  stars = new THREE.Points(geometry, material);
  scene.add(stars);

}

export function createSky(scene){
  const sky = new Sky();
  sky.scale.setScalar(800);
  scene.add(sky);
  sun = new THREE.Vector3();
  skyValues = sky.material.uniforms;
  sky.material.uniforms['turbidity'].value = 15;
  sky.material.uniforms['rayleigh'].value = 7;
  sky.material.uniforms['mieCoefficient'].value = 0.5;
  sky.material.uniforms['mieDirectionalG'].value = 0.7;
  //createStars(scene);

  updateSun(0);
}

export function updateSun(delta){
  //let time = performance.now() / 1000;
  day +=  delta * 0.005;
  if(day > 1) day -= 1;

  //definition of sun position through the day
  let phi = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(0, 180, Math.sin(day * Math.PI)));
  let theta= THREE.MathUtils.degToRad(THREE.MathUtils.lerp(0, 360, day));

  sun.setFromSphericalCoords(1, phi, theta);
  skyValues.sunPosition.value.copy(sun);
  sunLight.position.copy(sun);
  //console.log(stars);

  /*if(stars && (day < 0.25 || day > 0.75)){
    let starsVisibility = Math.abs(Math.cos(day * Math.PI));
    stars.material.opacity = 2;
    console.log(stars);
    stars.visible = starsVisibility > 0.01; 
  }*/
}

export function createMinimapCamera(){
  const camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
  camera.position.set(0, 100, 0);
  //camera.lookAt(0,0,0);
  camera.up.set(0, 0, -1);
  return camera;
}

export function createMinimapRenderer() {
  const renderer = new THREE.WebGLRenderer({alpha : true});

  renderer.setSize(200, 200);
  document.getElementById('minimap').appendChild(renderer.domElement);
  return renderer;
}

export function updateMinimap(camera, playerMarker){
  const controls = getControls();
  const player = controls.getObject().position;
  const direction = new THREE.Vector3();
  
  controls.getObject().getWorldDirection(direction);

  camera.position.set(player.x , 100, player.z);
  playerMarker.position.set(player.x, 2, player.z);  

  camera.lookAt(player.x, 0, player.z);
  
}

export function createPlayerMarker(){
  const geometry = new THREE.ConeGeometry(2, 5, 32);
  const material = new THREE.MeshBasicMaterial({color : 0xf000f0});
  const marker = new THREE.Mesh(geometry, material);
  marker.rotation.x = -Math.PI/2;
  
  //marker.position.set(0, 2, -1);
  scene.add(marker);
  return marker;
}

export function createZombieMarker(){

  const geometry = new THREE.SphereGeometry(2, 5, 100);
  const material = new THREE.MeshBasicMaterial({color : 0xff0000});
  const marker = new THREE.Mesh(geometry, material);
  scene.add(marker);
  return marker;

}

export function updateZombieMarker(zombie){
  
  let marker = zombie.marker;
  marker.position.set(zombie.mesh.position.x, 2, zombie.mesh.position.z);

  zombieMarkers.push(marker);

}

//------------------------TOWN
function createBuilding(position, size, color = 0x3a3a3a) {
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({ color });
  const building = new THREE.Mesh(geometry, material);
  building.position.set(position.x, size.y / 2, position.z);
  buildingsList.push({
  mesh: building,
  size: { ...size } 
  });
  building.castShadow = true;
  return building;
}

function addRoof(scene, baseMesh, size) {
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(size.x * 0.75, size.y * 0.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(
    baseMesh.position.x,
    baseMesh.position.y + size.y / 2 + (size.y * 0.25),
    baseMesh.position.z
  );
  roof.castShadow = true;
  scene.add(roof);
}

function addHouse(scene, position) {
  const height = 4 + Math.random() * 2;
  const size = { x: 6, y: height, z: 6 };
  const house = createBuilding(position, size, 0x555555);
  scene.add(house);
  addRoof(scene, house, size);
}


function addSkyscraper(scene, position) {
  const height = 15 + Math.random() * 10;
  const size = { x: 8, y: height, z: 8 };
  const building = createBuilding(position, size, 0x2a2a2a);
  scene.add(building);
}

export function buildAbandonedTown(scene) {
  const gridCount = Math.floor((250 * 2) / OPTIONS.spacing);
  const placed = new Set();
  const playerPos = getControls().getObject().position;

  for (let gx = -gridCount / 2; gx <= gridCount / 2; gx++) {
    for (let gz = -gridCount / 2; gz <= gridCount / 2; gz++) {
      const x = gx * OPTIONS.spacing + (Math.random() - 0.5) * OPTIONS.spacing + playerPos.x *0.5;
      const z = gz * OPTIONS.spacing + (Math.random() - 0.5) * OPTIONS.spacing + playerPos.z * 0.5;
      const dist = Math.sqrt(x * x + z * z);

      const isCenter = dist < OPTIONS.centerRadius;
      const chance = Math.random();

      const key = `${Math.round(x)},${Math.round(z)}`;
      if (placed.has(key)) continue;
      placed.add(key);

      if (isCenter) {
        if (chance < OPTIONS.innerDensity) addSkyscraper(scene, { x, z });
      } else {
        if (chance < OPTIONS.outerDensity) {
          chance < OPTIONS.outerDensity * 0.4
            ? addSkyscraper(scene, { x, z })
            : addHouse(scene, { x, z });
        }
      }
    }
  }
}



