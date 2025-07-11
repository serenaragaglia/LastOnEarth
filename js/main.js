import * as SCENE from './scene.js';
import { setupControls, updateControls, updateLevel, changeWeapon, getWeapon } from './controls.js';
import { recoverLife, setupInput, startGame } from './input.js';
import {updateBullets, spawnRandomZombies, updateZombies, animateHeart, updateRecoil, updateSpawn} from './action.js';
import { levels } from './constants.js';
import { showLevelTransition } from './ui.js';
export let scene;
export let camera, renderer;

document.getElementById('startScreen').style.display = 'flex';
startGame();

export async function init() {
  scene = SCENE.createScene();
  camera = SCENE.createCamera();
  renderer = SCENE.createRenderer();

  SCENE.createFloor(scene);
  SCENE.createLights(scene);
  SCENE.createSky(scene);
  await SCENE.loadHeartModel();
  SCENE.buildAbandonedTown(scene);
  SCENE.loadZombieModel().then((zombieModel) => {
  spawnRandomZombies(20, zombieModel);
  });
  setupControls(camera, scene, renderer.domElement);
  await changeWeapon();
  recoverLife(scene);
  setupInput();
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
  updateRecoil(delta);
  animateHeart(delta, scene);
  updateZombies(delta);
  updateSpawn(delta);
  renderer.render(scene, camera);
  prevTime = time;
}

