/**
 * state.js — Shared game state & world constants
 * Populated during initialization, read by all modules.
 */

export const G = {
  // Three.js core
  scene: null, camera: null, renderer: null, controls: null,
  // Audio
  audio: null,
  // World
  world: null, obstacles: [],
  cushions: [], incenseBurner: null, buddha: null,
  candleFlames: [], pondWaters: [], smokeSystems: [],
  // Character
  player: null, charParts: {},
  charState: {
    walking: false, sitting: false, bowing: false, bowProgress: 0,
    walkPhase: 0, time: 0, poseTargets: {},
    bowQueue: 0, bowTimer: 0,
    bowBodyRot: 0, bowHipsY: 0.7, bowLegBend: 0,
    bowOnComplete: null
  },
  seatedCushion: -1,
  // Ritual state
  meditationActive: false, meditationEndTime: 0, meditationDuration: 0,
  meditationInterval: null, breathLabelTimeout: null,
  chantActive: false, currentChant: 'niemphat', chantLineIndex: 0,
  incenseLit: false, offeredItems: {},
  // Camera
  cameraMode: 'third', clickTargetPos: null
};

// Temple platform dimensions
export const PLAT = { y: 0.3, w: 15, d: 11, z: -10 };

/** Check if player is inside the main hall. */
export function inTemple() {
  if (!G.player) return false;
  const pz = G.player.position.z;
  return pz < PLAT.z + PLAT.d / 2 + 0.5 && pz > PLAT.z - PLAT.d / 2 - 1;
}

/** Ground height at position (steps up onto temple platform). */
export function getGroundY(x, z) {
  const inT = Math.abs(x) < PLAT.w / 2 - 0.2 && z < PLAT.z + PLAT.d / 2 && z > PLAT.z - PLAT.d / 2;
  if (inT) {
    const frontEdge = PLAT.z + PLAT.d / 2;
    if (z > frontEdge - 1.6) {
      const t = Math.max(0, Math.min(1, (frontEdge - z) / 1.6));
      return PLAT.y * t;
    }
    return PLAT.y;
  }
  const onSteps = Math.abs(x) < 2.6 && z > PLAT.z + PLAT.d / 2 && z < PLAT.z + PLAT.d / 2 + 2;
  if (onSteps) {
    const frontEdge = PLAT.z + PLAT.d / 2;
    const t = Math.max(0, Math.min(1, (frontEdge - z) / 1.6 + 0.2));
    return PLAT.y * t;
  }
  return 0;
}

/** Collision test against all registered obstacles + world bounds. */
export function checkCollision(x, z, radius = 0.42) {
  for (const o of G.obstacles) {
    if (o.type === 'box') {
      const cx = Math.max(o.x - o.w / 2, Math.min(x, o.x + o.w / 2));
      const cz = Math.max(o.z - o.d / 2, Math.min(z, o.z + o.d / 2));
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < radius * radius) return true;
    } else {
      const dx = x - o.x, dz = z - o.z;
      const r = o.r + radius;
      if (dx * dx + dz * dz < r * r) return true;
    }
  }
  if (Math.abs(x) > 27 || z > 27 || z < -24) return true;
  return false;
}

export function addBoxObstacle(x, z, w, d) { G.obstacles.push({ type: 'box', x, z, w, d }); }
export function addCircleObstacle(x, z, r) { G.obstacles.push({ type: 'circle', x, z, r }); }
