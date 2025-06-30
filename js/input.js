import { collectHeart, getControls } from './controls.js';
import { PLAYER } from './constants.js';
import { updatePlayerLifeUI, updateLowLifeBorder } from './ui.js';
import { hearts } from './action.js';

export const move = { forward: false, backward: false, left: false, right: false };

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

export function startGame(){
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('startScreen').style.display = 'none';
      //init(); // ← avvia il gioco
    }
  })
}

window.restartGame = function () {
  location.reload(); // oppure puoi resettare via codice senza ricaricare
}

export function recoverLife(scene){
  window.addEventListener('keydown' , (e) => {
    if(e.key === 'e' || e.key === 'E'){
      const playerPos = getControls().getObject().position;
      let heartInRange = collectHeart(playerPos);
      if(heartInRange && PLAYER.LIFE < 100){
        PLAYER.LIFE = Math.min(PLAYER.LIFE + 20, 100);
        updatePlayerLifeUI();
        updateLowLifeBorder();
        scene.remove(heartInRange);
        hearts.splice(hearts.indexOf(heartInRange), 1);
        heartInRange = null;
      }
    }
  });
}