/**
 * character.js — Chibi cartoon character + animation
 */
import * as THREE from 'three';
import { G, checkCollision, getGroundY } from './state.js';
import { lerpAngle, smoothstep, toonMat, addOutline } from './utils.js';

/* ═══════════ MODEL (chibi) ═══════════ */
export function createCharacter() {
  const player = new THREE.Group();
  G.scene.add(player);
  player.position.set(0, 0, 14);
  player.rotation.y = Math.PI;
  G.player = player;

  const robeMat = toonMat(0x90c0d8);
  const robeDark = toonMat(0x6a98b8);
  const skinMat = toonMat(0xf0d8b8);
  const hairMat = toonMat(0x402818);

  const hips = new THREE.Group();
  hips.position.y = 0.42;
  player.add(hips);
  G.charParts.hips = hips;

  const bodyGroup = new THREE.Group();
  hips.add(bodyGroup);
  G.charParts.bodyGroup = bodyGroup;

  // Torso (plump)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.14, 6, 12), robeMat);
  torso.position.y = 0.25;
  torso.castShadow = true;
  bodyGroup.add(torso);
  addOutline(torso, { thickness: 0.02 });

  // Collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 14), robeDark);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.42;
  bodyGroup.add(collar);

  // Head group (BIG — chibi)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.62;
  bodyGroup.add(headGroup);
  G.charParts.headGroup = headGroup;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 16), skinMat);
  head.castShadow = true;
  headGroup.add(head);
  addOutline(head, { thickness: 0.02 });
  G.charParts.head = head;

  // Hair cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hair.position.y = 0.015;
  headGroup.add(hair);
  addOutline(hair, { thickness: 0.02 });

  // Bun
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), hairMat);
  bun.position.y = 0.28;
  headGroup.add(bun);

  // Cartoon eyes (dot)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1008 });
  const eyeGeo = new THREE.SphereGeometry(0.028, 8, 6);
  [-0.095, 0.095].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.02, 0.235);
    headGroup.add(eye);
  });

  // Smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.008, 4, 10, Math.PI),
    eyeMat
  );
  smile.rotation.x = Math.PI;
  smile.position.set(0, -0.055, 0.235);
  headGroup.add(smile);

  // Cheeks (blush)
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf0a8a8, transparent: true, opacity: 0.6 });
  [-0.15, 0.15].forEach(x => {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), blushMat);
    blush.position.set(x, -0.03, 0.235);
    headGroup.add(blush);
  });

  // Arms
  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.26, 0.42, 0);
    bodyGroup.add(pivot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 10), robeMat);
    arm.position.y = -0.17;
    arm.castShadow = true;
    pivot.add(arm);
    addOutline(arm, { thickness: 0.015 });
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
    hand.position.y = -0.32;
    pivot.add(hand);
    addOutline(hand, { thickness: 0.015 });
    return pivot;
  };
  G.charParts.armL = makeArm(-1);
  G.charParts.armR = makeArm(1);

  // Legs
  const makeLeg = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.11, 0, 0);
    hips.add(pivot);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 4, 10), robeMat);
    leg.position.y = -0.18;
    leg.castShadow = true;
    pivot.add(leg);
    addOutline(leg, { thickness: 0.015 });
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skinMat);
    foot.scale.set(1, 0.55, 1.4);
    foot.position.set(0, -0.33, 0.05);
    pivot.add(foot);
    return pivot;
  };
  G.charParts.legL = makeLeg(-1);
  G.charParts.legR = makeLeg(1);

  resetPoseTargets();
}

/* ═══════════ POSE HELPERS ═══════════ */
function resetPoseTargets() {
  Object.assign(G.charState.poseTargets, {
    bodyRotX: 0, hipsY: 0.42,
    legRotXL: 0, legRotXR: 0, legRotZL: 0, legRotZR: 0,
    armRotXL: 0, armRotXR: 0, armRotZL: 0, armRotZR: 0,
    armRotYL: 0, armRotYR: 0
  });
}

function setSittingPose() {
  const t = G.charState.poseTargets;
  t.hipsY = 0.22;
  t.legRotXL = -1.45; t.legRotXR = -1.45;
  t.legRotZL = -0.6; t.legRotZR = 0.6;
  t.armRotXL = -0.4; t.armRotXR = -0.4;
  t.armRotZL = -0.35; t.armRotZR = 0.35;
}

function setClaspPose() {
  const t = G.charState.poseTargets;
  t.armRotXL = -1.35; t.armRotXR = -1.35;
  t.armRotZL = 0.75; t.armRotZR = -0.75;
  t.armRotYL = 0.5; t.armRotYR = -0.5;
}

/* ═══════════ MOVEMENT ═══════════ */
const MOVE_SPEED = 3.0;
const keys = { w: false, a: false, s: false, d: false };

export function bindKeyboard() {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (k === 'arrowup')    keys.w = true;
    if (k === 'arrowdown')  keys.s = true;
    if (k === 'arrowleft')  keys.a = true;
    if (k === 'arrowright') keys.d = true;
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
    if (k === 'arrowup')    keys.w = false;
    if (k === 'arrowdown')  keys.s = false;
    if (k === 'arrowleft')  keys.a = false;
    if (k === 'arrowright') keys.d = false;
  });
}

export function updateMovement(dt, cameraMode, fpYaw) {
  if (G.charState.bowing) return;
  if (G.charState.sitting) { G.charState.walking = false; return; }

  let dir = new THREE.Vector3();
  if (cameraMode === 'first') {
    const f = new THREE.Vector3(-Math.sin(fpYaw), 0, -Math.cos(fpYaw));
    const r = new THREE.Vector3(Math.cos(fpYaw), 0, -Math.sin(fpYaw));
    if (keys.w) dir.add(f); if (keys.s) dir.sub(f);
    if (keys.d) dir.add(r); if (keys.a) dir.sub(r);
  } else {
    const f = new THREE.Vector3();
    G.camera.getWorldDirection(f); f.y = 0;
    if (f.lengthSq() < 0.001) f.set(0, 0, -1);
    f.normalize();
    const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
    if (keys.w) dir.add(f); if (keys.s) dir.sub(f);
    if (keys.d) dir.add(r); if (keys.a) dir.sub(r);
  }

  let moving = false;
  if (dir.lengthSq() > 0.001) {
    G.clickTargetPos = null;
    dir.normalize();
    moving = true;
    _applyMove(dir, dt);
  } else if (G.clickTargetPos) {
    const d = new THREE.Vector3(
      G.clickTargetPos.x - G.player.position.x, 0,
      G.clickTargetPos.z - G.player.position.z
    );
    if (d.length() > 0.3) {
      d.normalize(); moving = true;
      _applyMove(d, dt);
    } else G.clickTargetPos = null;
  }

  G.charState.walking = moving;
  const gy = getGroundY(G.player.position.x, G.player.position.z);
  G.player.position.y += (gy - G.player.position.y) * Math.min(1, dt * 12);
}

function _applyMove(dir, dt) {
  const nx = G.player.position.x + dir.x * MOVE_SPEED * dt;
  const nz = G.player.position.z + dir.z * MOVE_SPEED * dt;
  if (!checkCollision(nx, G.player.position.z)) G.player.position.x = nx;
  if (!checkCollision(G.player.position.x, nz)) G.player.position.z = nz;
  const tgt = Math.atan2(dir.x, dir.z);
  G.player.rotation.y = lerpAngle(G.player.rotation.y, tgt, Math.min(1, dt * 12));
}

/* ═══════════ ANIMATION ═══════════ */
export function updateCharacterAnim(dt) {
  G.charState.time += dt;
  const p = G.charParts, t = G.charState.poseTargets, s = G.charState;

  if (s.bowing) {
    t.bodyRotX = s.bowBodyRot;
    t.hipsY = 0.42 * (s.bowHipsY / 0.7); // scale to new hips base
    t.legRotXL = -s.bowLegBend;
    t.legRotXR = -s.bowLegBend;
    setClaspPose();
  } else if (s.sitting) {
    setSittingPose();
  } else if (s.walking) {
    s.walkPhase += dt * 8;
    const ph = s.walkPhase;
    t.legRotXL = Math.sin(ph) * 0.55;
    t.legRotXR = -Math.sin(ph) * 0.55;
    t.armRotXL = -Math.sin(ph) * 0.45;
    t.armRotXR = Math.sin(ph) * 0.45;
    t.armRotZL = 0; t.armRotZR = 0;
    t.armRotYL = 0; t.armRotYR = 0;
    t.bodyRotX = 0;
    t.hipsY = 0.42 + Math.abs(Math.sin(ph)) * 0.025;
    t.legRotZL = 0; t.legRotZR = 0;
  } else {
    resetPoseTargets();
    t.hipsY = 0.42 + Math.sin(s.time * 1.5) * 0.012;
  }

  const k = Math.min(1, dt * 10);
  p.bodyGroup.rotation.x = THREE.MathUtils.lerp(p.bodyGroup.rotation.x, t.bodyRotX, k);
  p.hips.position.y = THREE.MathUtils.lerp(p.hips.position.y, t.hipsY, k);
  p.legL.rotation.x = THREE.MathUtils.lerp(p.legL.rotation.x, t.legRotXL, k);
  p.legR.rotation.x = THREE.MathUtils.lerp(p.legR.rotation.x, t.legRotXR, k);
  p.legL.rotation.z = THREE.MathUtils.lerp(p.legL.rotation.z, t.legRotZL, k);
  p.legR.rotation.z = THREE.MathUtils.lerp(p.legR.rotation.z, t.legRotZR, k);
  p.armL.rotation.x = THREE.MathUtils.lerp(p.armL.rotation.x, t.armRotXL, k);
  p.armR.rotation.x = THREE.MathUtils.lerp(p.armR.rotation.x, t.armRotXR, k);
  p.armL.rotation.z = THREE.MathUtils.lerp(p.armL.rotation.z, t.armRotZL, k);
  p.armR.rotation.z = THREE.MathUtils.lerp(p.armR.rotation.z, t.armRotZR, k);
  p.armL.rotation.y = THREE.MathUtils.lerp(p.armL.rotation.y, t.armRotYL, k);
  p.armR.rotation.y = THREE.MathUtils.lerp(p.armR.rotation.y, t.armRotYR, k);
}

/* ═══════════ BOW ═══════════ */
const BOW_DURATION = 2.6;

export function startBowAnimation(count, onComplete) {
  G.charState.bowQueue = count;
  G.charState.bowOnComplete = onComplete || null;
  _startSingleBow();
}
function _startSingleBow() {
  if (G.charState.bowQueue <= 0) {
    if (G.charState.bowOnComplete) { G.charState.bowOnComplete(); G.charState.bowOnComplete = null; }
    return;
  }
  G.charState.bowQueue--;
  G.charState.bowing = true;
  G.charState.bowTimer = 0;
  G.charState.bowBodyRot = 0;
  G.charState.bowHipsY = 0.42;
  G.charState.bowLegBend = 0;
  G.audio.bell();
}

export function updateBowAnimation(dt) {
  if (!G.charState.bowing) return;
  G.charState.bowTimer += dt;
  const t = G.charState.bowTimer / BOW_DURATION;

  let bodyRot = 0, hipsY = 0.42, legBend = 0;
  if (t < 0.15) {}
  else if (t < 0.35) {
    const e = smoothstep((t - 0.15) / 0.2);
    legBend = e * 1.5; hipsY = 0.42 - e * 0.2;
  } else if (t < 0.55) {
    legBend = 1.5; hipsY = 0.22;
    bodyRot = smoothstep((t - 0.35) / 0.2) * 1.5;
  } else if (t < 0.72) {
    legBend = 1.5; hipsY = 0.22; bodyRot = 1.5;
  } else if (t < 0.9) {
    const e = smoothstep((t - 0.72) / 0.18);
    legBend = (1 - e) * 1.5; hipsY = 0.22 + e * 0.2; bodyRot = (1 - e) * 1.5;
  }

  G.charState.bowBodyRot = bodyRot;
  G.charState.bowHipsY = hipsY * (0.7 / 0.42); // keep compatibility
  G.charState.bowLegBend = legBend;

  // Override hipsY in anim using scaling
  G.charState.poseTargets.hipsY = hipsY;

  if (t >= 1) {
    G.charState.bowing = false;
    resetPoseTargets();
    if (G.charState.bowQueue > 0) {
      setTimeout(() => { if (G.charState.bowQueue > 0) _startSingleBow(); }, 500);
    } else if (G.charState.bowOnComplete) {
      G.charState.bowOnComplete();
      G.charState.bowOnComplete = null;
    }
  }
}

/* ═══════════ SIT / STAND ═══════════ */
export function nearestEmptyCushion() {
  let best = -1, bestDist = Infinity;
  const px = G.player.position.x, pz = G.player.position.z;
  G.cushions.forEach((c, i) => {
    if (c.occupied) return;
    const d = (c.position.x - px) ** 2 + (c.position.z - pz) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

export function sitOnCushion(index) {
  if (index < 0 || !G.cushions[index] || G.cushions[index].occupied) return false;
  const c = G.cushions[index];
  G.player.position.x = c.position.x;
  G.player.position.z = c.position.z;
  G.player.position.y = c.position.y;
  G.player.rotation.y = Math.PI;
  c.occupied = true;
  G.seatedCushion = index;
  G.charState.sitting = true;
  G.charState.walking = false;
  G.clickTargetPos = null;
  return true;
}

export function standUp() {
  if (!G.charState.sitting) return;
  if (G.seatedCushion >= 0) {
    G.cushions[G.seatedCushion].occupied = false;
    G.seatedCushion = -1;
  }
  G.charState.sitting = false;
  resetPoseTargets();
  G.player.position.z += 0.7;
  G.player.position.y = 0;
}

export function handleSitToggle() {
  if (G.charState.bowing) return;
  if (G.charState.sitting) {
    standUp();
    return { action: 'stand', msg: 'Đứng dậy' };
  }
  const nearest = nearestEmptyCushion();
  if (nearest >= 0) {
    const c = G.cushions[nearest];
    const dist = Math.hypot(c.position.x - G.player.position.x, c.position.z - G.player.position.z);
    if (dist < 2.2) {
      sitOnCushion(nearest);
      return { action: 'sit', msg: 'Ngồi thiền trên bồ đoàn' };
    }
  }
  return { action: 'none', msg: 'Hãy đến gần bồ đoàn để ngồi' };
}