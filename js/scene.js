import * as THREE from 'https://esm.sh/three@0.161.0';
import { GLTFLoader } from 'https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import {Sky} from './sky.js';
import { buildingsList, OPTIONS, transition} from './constants.js';
import { targetTime } from './input.js';
export let gun = null;
export let shotgun = null;
export let zombieModel = null;
export let heartModel = null;
export let day = 0;
export let sun;
export let skyValues;
export let sunLight;
export let stars;
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
    gun.userData.bulletSpeed = 50;
    gun.userData.bulletLife = 2;

    const gunFront = new THREE.Object3D(); 
    gunFront.name = 'gunFront';
    gunFront.position.set(0.4, 0.5, 3);
    gun.add(gunFront);

    const axes = new THREE.AxesHelper(10); // lunghezza degli assi
    gunFront.add(axes);
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
    shotgun.position.set(0.4, -0.55, -1.0); //position wrt camera
    controls.getObject().add(shotgun);  

    shotgun.userData.weaponType = 'shotgun';
    shotgun.userData.damage = 3;
    shotgun.userData.hitDistance  = 4;
    shotgun.userData.bulletSpeed = 60;
    shotgun.userData.bulletLife = 1;

    /*const gunFront = new THREE.Object3D(); 
    gunFront.name = 'gunFront';
    gunFront.position.set(0.4, 0.5, 3);
    gun.add(gunFront);
    console.log(gun.position);*/

    const axes = new THREE.AxesHelper(10); // lunghezza degli assi
    shotgun.add(axes);
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
        zombieModel.name = 'zombieModel';
        //zombieModel.scale.set(5, 5, 5);
        //console.log(zombieModel);
        const axes = new THREE.AxesHelper(10);
        zombieModel.add(axes);
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
        heartModel.name = 'heartModel';
        heartModel.position.set(0.4, 0.5, 13);
        heartModel.scale.set(0.5, 0.5, 0.5);
        const axes = new THREE.AxesHelper(10);
        heartModel.add(axes);

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
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 2;
  return camera;
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer();
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

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  floor.add(line);
  scene.add(floor);
}

export function createLights(scene) {
sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(0, 100, 0);
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

  for (let gx = -gridCount / 2; gx <= gridCount / 2; gx++) {
    for (let gz = -gridCount / 2; gz <= gridCount / 2; gz++) {
      const x = gx * OPTIONS.spacing + (Math.random() - 0.5) * OPTIONS.spacing * 0.3;
      const z = gz * OPTIONS.spacing + (Math.random() - 0.5) * OPTIONS.spacing * 0.3;
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
