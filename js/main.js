import * as SCENE from './scene.js';
import { setupControls, updateControls, updateLevel, changeWeapon, fallFromSky, playerJump } from './controls.js';
import { recoverLife, setupInput, startGame } from './input.js';
import {updateBullets, spawnRandomZombies, updateZombies, animateHeart, updateRecoil, updateSpawn} from './action.js';
import { showKill } from './ui.js';
export let scene;
export let camera, renderer, minimapScene;
let minimapCamera, minimapRenderer, playerMarker;

document.getElementById('startScreen').style.display = 'flex';
startGame();

export async function init() {
  scene = SCENE.createScene();
  camera = SCENE.createCamera();
  renderer = SCENE.createRenderer();

  SCENE.createFloor(scene);
  SCENE.createLights(scene);
  SCENE.createSky(scene);

  minimapCamera = SCENE.createMinimapCamera();
  minimapRenderer = SCENE.createMinimapRenderer();
  playerMarker = SCENE.createPlayerMarker();

  await SCENE.loadHeartModel();

  setupControls(camera, scene, renderer.domElement);

  await changeWeapon();
  recoverLife(scene);
  setupInput();
  SCENE.buildAbandonedTown(scene);
  SCENE.loadZombieModel().then((zombieModel) => {
    spawnRandomZombies(10, zombieModel);
  });

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
  fallFromSky(delta);

  playerJump(delta);
  updateBullets(delta);
  updateRecoil(delta);
  animateHeart(delta, scene);
  updateZombies(delta);
  updateSpawn(delta);
  showKill();
  SCENE.updateMinimap(minimapCamera,playerMarker);

  SCENE.zombieMarkers.forEach(marker => marker.visible = true);
  playerMarker.visibile = true;
  minimapRenderer.render(scene, minimapCamera);

  SCENE.zombieMarkers.forEach(marker => marker.visible = false);
  playerMarker.visible = false;
  renderer.render(scene, camera);


  prevTime = time;
}

