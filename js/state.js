/**
 * state.js - Shared game state & world constants
 */
export const G = {
  scene: null, camera: null, renderer: null, controls: null,
  audio: null,
  world: null, obstacles: [],
  cushions: [], incenseBurner: null, buddha: null,
  candleFlames: [], pondWaters: [], smokeSystems: [],
  player: null, charParts: {},
  charState: {
    walking: false, sitting: false, bowing: false, bowProgress: 0,
    walkPhase: 0, time: 0, poseTargets: {},
    bowQueue: 0, bowTimer: 0,
    bowBodyRot: 0, bowHipsY: 0.42, bowLegBend: 0,
    bowOnComplete: null
  },
  seatedCushion: -1,
  meditationActive: false, meditationEndTime: 0, meditationDuration: 0,
  meditationInterval: null, breathLabelTimeout: null,
  chantActive: false, currentChant: 'niemphat', chantLineIndex: 0,
  incenseLit: false, offeredItems: {},
  cameraMode: 'third', clickTargetPos: null,
  mobileInput: { x: 0, y: 0 } // Dành cho Joystick
};

export const PLAT = { y: 0.3, w: 15, d: 11, z: -10 };

export function inTemple() {
  if (!G.player) return false;
  const pz = G.player.position.z;
  return pz < PLAT.z + PLAT.d / 2 + 0.5 && pz > PLAT.z - PLAT.d / 2 - 1;
}

// ═══════════ CẬP NHẬT CHO BẢN ĐỒ 200x200 VÀ SÔNG NƯỚC ═══════════
export function checkCollision(x, z, radius = 0.42) {
  // 1. Giới hạn bản đồ 200x200
  if (Math.abs(x) > 100 || Math.abs(z) > 100) return true;

  // 2. Chặn không cho rơi xuống sông (Sông nằm ngang ở Z = 30, rộng 16m)
  const RIVER_Z = 30;
  const RIVER_WIDTH = 16;
  if (z > RIVER_Z - RIVER_WIDTH/2 && z < RIVER_Z + RIVER_WIDTH/2) {
    // Ngoại trừ khu vực Cầu gỗ (X từ -4 đến 4)
    if (x < -4 || x > 4) {
      return true; 
    }
  }

  // 3. Kiểm tra vật cản (Obstacles)
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
  return false;
}

export function getGroundY(x, z) {
  // Độ cao bậc tam cấp Chùa
  const inT = Math.abs(x) < PLAT.w / 2 - 0.2 && z < PLAT.z + PLAT.d / 2 && z > PLAT.z - PLAT.d / 2;
  if (inT) {
    const frontEdge = PLAT.z + PLAT.d / 2;
    if (z > frontEdge - 1.6) {
      return PLAT.y * Math.max(0, Math.min(1, (frontEdge - z) / 1.6));
    }
    return PLAT.y;
  }
  // Độ cao cầu gỗ (Cầu nằm ở Z = 30, cao 0.5m)
  if (Math.abs(x) <= 4 && z > 21 && z < 39) {
    return 0.5; 
  }
  return 0;
}

export function addBoxObstacle(x, z, w, d) { G.obstacles.push({ type: 'box', x, z, w, d }); }
export function addCircleObstacle(x, z, r) { G.obstacles.push({ type: 'circle', x, z, r }); }