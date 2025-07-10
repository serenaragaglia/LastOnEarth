import * as SCENE from './scene.js';
import { setupControls, updateControls, getControls, updateLevel, changeWeapon } from './controls.js';
import { recoverLife, setupInput, startGame } from './input.js';
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
  SCENE.createSky(scene);
  setupControls(camera, scene, renderer.domElement);
  await SCENE.loadHeartModel();
  changeWeapon();
  SCENE.buildAbandonedTown(scene);
  //SCENE.createStars(scene);
  recoverLife(scene);

  SCENE.loadZombieModel().then((zombieModel) => {
  spawnRandomZombies(0, zombieModel);
});
  //spawnRandomZombies(10);
  setupInput();
  //document.addEventListener('mousedown', shoot());
  animate();
}

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  SCENE.updateSun(delta, scene);
  updateControls(delta);
  updateLevel();
  updateBullets(delta);
  //updateRecoil(delta);
  animateHeart(delta);
  updateZombies(delta);
  renderer.render(scene, camera);
  prevTime = time;
}

