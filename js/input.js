
import { collectHeart, getControls, resetJumpTime, setJumpFlag, jumping } from './controls.js';
import { defaultFov, player, weapon, zoomedFov, levels } from './constants.js';
import { updatePlayerLifeUI, updateLowLifeBorder, showLevelTransition } from './ui.js';
import { hearts, shoot } from './action.js';
import { camera } from './main.js';

export const move = { forward: false, backward: false, left: false, right: false };
export const targetTime = 0 ;

export function setupInput() {
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': move.forward = true; break;
      case 'KeyS': move.backward = true; break;
      case 'KeyA': move.left = true; break;
      case 'KeyD': move.right = true; break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': move.forward = false; break;
      case 'KeyS': move.backward = false; break;
      case 'KeyA': move.left = false; break;
      case 'KeyD': move.right = false; break;
    }
  });
}

window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      if ( !jumping )
      {
        setJumpFlag(true);
        resetJumpTime();
      }
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      //jumping = false;
    }
});


export function startGame(){
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('startScreen').style.display = 'none';
      showLevelTransition(levels.currentLevel);
    }
  })
}

window.restartGame = function () {
  location.reload();
}

export function recoverLife(scene){
  window.addEventListener('keydown' , (e) => {
    if(e.key === 'e' || e.key === 'E'){
      const playerPos = getControls().getObject().position;
      let heartInRange = collectHeart(playerPos);
      if(heartInRange && player.LIFE < 100){
        player.LIFE = Math.min(player.LIFE + 20, 100);
        updatePlayerLifeUI();
        updateLowLifeBorder();
        scene.remove(heartInRange);
        hearts.splice(hearts.indexOf(heartInRange), 1);
        heartInRange = null;
      }
    }
  });
}

const crosshair = document.getElementById('crosshair');

export function muoseClick(event){
  if(event.button == 0){
    shoot();
  }
}

document.addEventListener('mousedown', (event) => {
    if(event.button == 2 && (weapon.active == 'shotgun' || weapon.active == 'smg')){
      crosshair.style.display = 'block';

      camera.fov = zoomedFov;
      camera.updateProjectionMatrix();

  }
  
});

document.addEventListener('mouseup' , (event) => {
  if(event.button == 2){
    crosshair.style.display = 'none';

    camera.fov = defaultFov;
    camera.updateProjectionMatrix();
  }
});

