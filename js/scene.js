import * as THREE from 'https://esm.sh/three@0.161.0';
import { GLTFLoader } from 'https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { COLORS } from './constants.js';

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
    const gun = gltf.scene;
    gun.scale.set(0.05, 0.05, 0.05);
    gun.position.set(0.4, -0.5, -1.0); // posizione rispetto alla camera
    controls.getObject().add(gun);
  }, undefined, (err) => {
    console.error('Errore nel caricamento della pistola:', err);
  });
}

//Set up of the scene
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.SKY);
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
  const geometry = new THREE.PlaneGeometry(200, 200);
  const texture = loadTexture('../assets/textures/road.png', {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    repeat: { x: 8, y: 8 }
  });

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0x404040, 0.4); // luce ambientale debole
  const directional = new THREE.DirectionalLight(0xfafafa, 0.6);
  directional.position.set(30, 80, -50);
  directional.castShadow = true;

  scene.add(ambient);
  scene.add(directional);
}

function createBuilding(position, size, color = 0x3a3a3a) {
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({ color });
  const building = new THREE.Mesh(geometry, material);
  building.position.set(position.x, size.y / 2, position.z);
  return building;
}

/**
 * Aggiunge un tetto a cono sull'edificio dato
 */
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

/**
 * Crea una casa semplice con tetto
 */
function addHouse(scene, position) {
  const height = 4 + Math.random() * 2;
  const size = { x: 6, y: height, z: 6 };
  const house = createBuilding(position, size, 0x555555);
  scene.add(house);
  addRoof(scene, house, size);
}

/**
 * Crea un palazzo alto (senza tetto)
 */
function addSkyscraper(scene, position) {
  const height = 15 + Math.random() * 10;
  const size = { x: 8, y: height, z: 8 };
  const building = createBuilding(position, size, 0x2a2a2a);
  scene.add(building);
}

/**
 * Popola una piccola città abbandonata
 */
export function buildAbandonedTown(scene) {
  // Case ai lati
  for (let i = -80; i <= 80; i += 20) {
    addHouse(scene, { x: -25, z: i });
    addHouse(scene, { x: 30, z: i });
    addHouse(scene, { x: 50, z: 45 });
    addSkyscraper(scene, { x: -50, z: i + 5 });
  }

  // Alcuni palazzi sparsi
  for(let i = -80; i <= 80; i += 20){
    addSkyscraper(scene, { x: 0, z: -60 });
    addSkyscraper(scene, { x: -40, z: 35 });
   
  }
}