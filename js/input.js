import {init} from './main.js';

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
