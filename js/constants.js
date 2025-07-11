export const levels = {
  currentLevel : 1
} 

export const weapon = {
  active : null
};

export const defaultFov = 75;
export const zoomedFov = 40;

export const player = {
  SPEED: 7,
  HEIGHT: 2,
  LIFE : 100,
  kill : 0
};

export const COLORS = {
  SKY: 0x87CEEB,
  FLOOR: 0x555555,
  BULLET : 0xffff00
};

export const OPTIONS = {
  areaSize: 200,
  spacing: 10,
  centerRadius: 10,
  innerDensity: 0.4,
  outerDensity: 0.2
}

export const MAX_SPEED = 2;  
export const ACCEL = 1.5;         
export const DECAY = 2.5;         

export const buildingsList = [];

export const transition = 0.2;

//zombiesù
export let waves = {
  remaining : 0,
  spawned : 0,
  betweenSpawn : 60,
  spawnTimer : 0,
  isSpawning : false,
  maxZombieWave : 5,
  minZombieWave : 3,
}
