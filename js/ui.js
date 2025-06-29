import{PLAYER} from './constants.js';

export function updatePlayerLifeUI() {
  const bar = document.getElementById('lifeBar');
  if (!bar) return;

  const percent = Math.max(0, PLAYER.LIFE / 100) * 100;
  bar.style.width = `${percent}%`;

  // colore dinamico se vuoi (verde → giallo → rosso)
  if (percent > 60) bar.style.backgroundColor = '#2ecc71';       // verde
  else if (percent > 30) bar.style.backgroundColor = '#f1c40f';  // giallo
  else bar.style.backgroundColor = '#e74c3c';                     // rosso
}

export function updateLowLifeBorder() {
  const border = document.getElementById('lowLifeBorder');
  if (!border) return;

  if (PLAYER.LIFE <= 30) {
    border.style.display = 'block';
  } else {
    border.style.display = 'none';
  }
}
