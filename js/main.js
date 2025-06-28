import * as SCENE from './scene.js';
import { setupControls, updateControls, getControls } from './controls.js';
import { setupInput } from './input.js';
import {updateBullets, spawnRandomZombies, updateZombies} from './action.js';

export let scene;
let camera, renderer;

export function init() {
  scene = SCENE.createScene();
  camera = SCENE.createCamera();
  renderer = SCENE.createRenderer();
  SCENE.createFloor(scene);
  SCENE.createLights(scene);
  setupControls(camera, scene, renderer.domElement);
  SCENE.loadGunModel(getControls());
  SCENE.buildAbandonedTown(scene);
  SCENE.loadZombieModel().then((zombieModel) => {
  spawnRandomZombies(10, zombieModel);
});
  setupInput();
  //document.addEventListener('mousedown', shoot());
  animate();
}

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  updateControls(delta);
  updateBullets(delta);
  updateZombies(delta);
  renderer.render(scene, camera);
  prevTime = time;
}

