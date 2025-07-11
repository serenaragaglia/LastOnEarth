import{player} from './constants.js';
import { getControls } from './controls.js';

export function updatePlayerLifeUI() {
  const bar = document.getElementById('lifeBar');
  if (!bar) return;

  const percent = Math.max(0, player.LIFE / 100) * 100;
  bar.style.width = `${percent}%`;

  // colore dinamico se vuoi (verde → giallo → rosso)
  if (percent > 60) bar.style.backgroundColor = '#2ecc71';       // verde
  else if (percent > 30) bar.style.backgroundColor = '#f1c40f';  // giallo
  else bar.style.backgroundColor = '#e74c3c';                     // rosso
}

export function updateLowLifeBorder() {
  const border = document.getElementById('lowLifeBorder');
  if (!border) return;

  if (player.LIFE <= 30) {
    border.style.display = 'block';
  } else {
    border.style.display = 'none';
  }
}

export function showHintCollect(heartInRange){
    const collectHint = document.getElementById('pickupHint');
    if(heartInRange){
      collectHint.style.display = 'block';
    }
    else{
      collectHint.style.display = 'none';
    }
}

export function endGame() {
  //isGameRunning = false;

  // Sblocca i controlli e mostra il cursore
  const controls = getControls();
  controls.locked = false;
  document.exitPointerLock?.();

  // Mostra la schermata HTML
  const screen = document.getElementById('win-screen');
  screen.classList.remove('hidden');
  screen.classList.add('active');
}

export function showLevelTransition(levelNumber) {
  const div = document.getElementById('levelTransition');
  div.textContent = `Level ${levelNumber}`;
  
  div.classList.add('fade-in');

  // Dopo 2 secondi, inizia il fade-out
  setTimeout(() => {
    div.classList.remove('fade-in');
  }, 2000); // visibile per 2 secondi (puoi regolare)
}
