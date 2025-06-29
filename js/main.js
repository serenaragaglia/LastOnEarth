import * as SCENE from './scene.js';
import { setupControls, updateControls, getControls } from './controls.js';
import { setupInput, startGame } from './input.js';
import {updateBullets, spawnRandomZombies, updateZombies, animateHeart} from './action.js';

export let scene;
let camera, renderer;

document.getElementById('startScreen').style.display = 'flex';
startGame();

export async function init() {
  scene = SCENE.createScene();
  camera = SCENE.createCamera();
  renderer = SCENE.createRenderer();
  SCENE.createFloor(scene);
  SCENE.createLights(scene);
  setupControls(camera, scene, renderer.domElement);
  await SCENE.loadHeartModel();
  SCENE.loadGunModel(getControls());
  SCENE.buildAbandonedTown(scene);
 /* SCENE.loadZombieModel().then((zombieModel) => {
  spawnRandomZombies(10, zombieModel);
});*/
  spawnRandomZombies(10);
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
  animateHeart(delta);
  updateZombies(delta);
  renderer.render(scene, camera);
  prevTime = time;
}

