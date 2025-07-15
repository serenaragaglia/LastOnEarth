import * as SCENE from './scene.js';
import { setupControls, updateControls, updateLevel, changeWeapon, fallFromSky } from './controls.js';
import { jumpKey, recoverLife, setupInput, startGame } from './input.js';
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

  //minimapScene = SCENE.createMinimapScene();
  minimapCamera = SCENE.createMinimapCamera();
  minimapRenderer = SCENE.createMinimapRenderer();
  playerMarker = SCENE.createPlayerMarker();

  await SCENE.loadHeartModel();



  SCENE.loadZombieModel().then((zombieModel) => {
  spawnRandomZombies(20, zombieModel);
  });


  setupControls(camera, scene, renderer.domElement);

  await changeWeapon();
  recoverLife(scene);
  setupInput();
  SCENE.buildAbandonedTown(scene);

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
  jumpKey(delta);

  updateBullets(delta);
  updateRecoil(delta);
  animateHeart(delta, scene);
  updateZombies(delta);
  updateSpawn(delta);
  showKill();
  SCENE.updateMinimap(minimapCamera,playerMarker);

  SCENE.zombieMarkers.forEach(marker => marker.visible = true);
  minimapRenderer.render(scene, minimapCamera);

  SCENE.zombieMarkers.forEach(marker => marker.visible = false);
  renderer.render(scene, camera);


  prevTime = time;
}

