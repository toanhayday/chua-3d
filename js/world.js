/**
 * world.js — Soft clay + cartoon + pixel temple
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { G, PLAT, addBoxObstacle, addCircleObstacle } from './state.js';
import {
  toonMat, addOutline,
  makePixelTileTexture, makePixelWoodTexture
} from './utils.js';

// ═══════════ PALETTE (pastel warm) ═══════════
const P = {
  groundBase: 0xecd0b0, groundLine: 0xd4b090,
  path: 0xf4e4cc,
  woodLight: 0xc89868, woodMid: 0xb08050, woodDark: 0x8a5a38,
  roof: 0xc07048, roofDark: 0x8a5030,
  gold: 0xf0d080, goldDark: 0xd4b050,
  skin: 0xf0d8b8, hair: 0x402818,
  robe: 0x90c0d8, robeDark: 0x6a98b8,
  leafLight: 0xa8d080, leafMid: 0x88b868, leafDark: 0x689a50,
  water: 0x90c8d0,
  lotus: 0xf0b0c8, lotusDark: 0xe090a8,
  stone: 0xd8d0c0, stoneDark: 0xb8b0a0,
  bronze: 0xc09060, bronzeDark: 0x906840,
  cushion1: 0xb8a888, cushion2: 0xc8b898,
  cushionBorder: 0xe0c8a0
};

const _tileTex = makePixelTileTexture(P.groundBase, P.groundLine, 4, 64);
const _woodTex = makePixelWoodTexture(P.woodLight, 64);

export function buildWorld() {
  const g = new THREE.Group();
  G.world = g;
  G.scene.add(g);
  _ground(g); _platform(g); _pillars(g); _walls(g); _roof(g);
  _buddha(g); _altar(g); _incense(g); _woodenFish(g);
  _candles(g); _offerDecor(g); _cushions(g);
  _trees(g); _ponds(g); _lanterns(g); _gate(g);
_vegetableGarden(g); _fishPond(g);  _modernHouse(g);
}

/* ═══════════ GROUND (pixel tiles) ═══════════ */
function _ground(parent) {
  const t = _tileTex.clone(); t.needsUpdate = true; t.repeat.set(20, 20);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    toonMat(0xffffff, { map: t })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  parent.add(ground);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 30),
    toonMat(P.path)
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.005, 2);
  path.receiveShadow = true;
  parent.add(path);
}

/* ═══════════ PLATFORM (rounded) ═══════════ */
function _platform(parent) {
  const t = _tileTex.clone(); t.needsUpdate = true; t.repeat.set(5, 4);
  const p = new THREE.Mesh(
    new RoundedBoxGeometry(PLAT.w, PLAT.y, PLAT.d, 2, 0.08),
    toonMat(0xffffff, { map: t })
  );
  p.position.set(0, PLAT.y / 2, PLAT.z);
  p.receiveShadow = p.castShadow = true;
  parent.add(p);
  addOutline(p, { thickness: 0.02 });

  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new RoundedBoxGeometry(5, 0.12, 0.62, 2, 0.04),
      toonMat(P.stone)
    );
    step.position.set(0, 0.06 + i * 0.1, PLAT.z + PLAT.d / 2 + 0.3 + i * 0.55);
    step.receiveShadow = step.castShadow = true;
    parent.add(step);
    addOutline(step, { thickness: 0.015 });
  }
}

/* ═══════════ PILLARS (instanced toon + outline) ═══════════ */
function _pillars(parent) {
  const pos = [];
  [-6, -2.5, 2.5, 6].forEach(x => {
    pos.push([x, PLAT.z + PLAT.d / 2 - 0.7]);
    pos.push([x, PLAT.z - PLAT.d / 2 + 0.7]);
  });

  const shaftGeo = new THREE.CylinderGeometry(0.26, 0.3, 4, 12);
  const shaftMat = toonMat(P.woodMid);
  const shafts = new THREE.InstancedMesh(shaftGeo, shaftMat, pos.length);

  const capGeo = new THREE.CylinderGeometry(0.36, 0.32, 0.22, 12);
  const caps = new THREE.InstancedMesh(capGeo, toonMat(P.woodDark), pos.length);

  const baseGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.16, 12);
  const bases = new THREE.InstancedMesh(baseGeo, toonMat(P.woodDark), pos.length);

  const d = new THREE.Object3D();
  pos.forEach(([x, z], i) => {
    d.position.set(x, PLAT.y + 0.08, z); d.updateMatrix(); bases.setMatrixAt(i, d.matrix);
    d.position.set(x, PLAT.y + 2.2, z);  d.updateMatrix(); shafts.setMatrixAt(i, d.matrix);
    d.position.set(x, PLAT.y + 4.28, z); d.updateMatrix(); caps.setMatrixAt(i, d.matrix);
    addCircleObstacle(x, z, 0.48);
  });

  shafts.castShadow = caps.castShadow = bases.castShadow = true;
  parent.add(bases, shafts, caps);

  // Outline instanced (proxy bigger cylinder)
  const outGeo = new THREE.CylinderGeometry(0.30, 0.34, 4, 12);
  const outMat = new THREE.MeshBasicMaterial({ color: 0x3a2010, side: THREE.BackSide });
  const outs = new THREE.InstancedMesh(outGeo, outMat, pos.length);
  pos.forEach(([x, z], i) => {
    d.position.set(x, PLAT.y + 2.2, z); d.updateMatrix(); outs.setMatrixAt(i, d.matrix);
  });
  parent.add(outs);
}

/* ═══════════ WALLS ═══════════ */
function _walls(parent) {
  const back = new THREE.Mesh(
    new RoundedBoxGeometry(PLAT.w, 3.8, 0.28, 2, 0.05),
    toonMat(P.woodMid)
  );
  back.position.set(0, PLAT.y + 1.9, PLAT.z - PLAT.d / 2 + 0.35);
  back.castShadow = back.receiveShadow = true;
  parent.add(back);
  addOutline(back, { thickness: 0.02 });
  addBoxObstacle(0, PLAT.z - PLAT.d / 2 + 0.35, PLAT.w, 0.3);

  [-1, 1].forEach(s => {
    const w = new THREE.Mesh(
      new RoundedBoxGeometry(0.24, 3.2, PLAT.d * 0.6, 2, 0.05),
      toonMat(P.woodMid)
    );
    w.position.set(s * (PLAT.w / 2 - 0.1), PLAT.y + 1.6, PLAT.z);
    w.castShadow = w.receiveShadow = true;
    parent.add(w);
    addOutline(w, { thickness: 0.02 });
    addBoxObstacle(s * (PLAT.w / 2 - 0.1), PLAT.z, 0.25, PLAT.d * 0.6);
  });
}

/* ═══════════ ROOF ═══════════ */
function _roof(parent) {
  const lower = new THREE.Mesh(
    new THREE.ConeGeometry(10.5, 2.4, 4, 1),
    toonMat(P.roof)
  );
  lower.rotation.y = Math.PI / 4;
  lower.position.set(0, PLAT.y + 4.6, PLAT.z);
  lower.castShadow = lower.receiveShadow = true;
  parent.add(lower);
  addOutline(lower, { thickness: 0.04 });

  const upper = new THREE.Mesh(
    new THREE.ConeGeometry(5, 1.8, 4, 1),
    toonMat(P.roofDark)
  );
  upper.rotation.y = Math.PI / 4;
  upper.position.set(0, PLAT.y + 6.4, PLAT.z);
  upper.castShadow = true;
  parent.add(upper);
  addOutline(upper, { thickness: 0.04 });

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.2, 8),
    toonMat(P.gold)
  );
  spire.position.set(0, PLAT.y + 7.9, PLAT.z);
  spire.castShadow = true;
  parent.add(spire);
  addOutline(spire, { thickness: 0.02 });
}

/* ═══════════ BUDDHA (chibi toon) ═══════════ */
function _buddha(parent) {
  const g = new THREE.Group();
  const goldMat = toonMat(P.gold);
  const skinMat = toonMat(P.skin);

  // Lotus base — puffy petals
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.35, 0.28, 16),
    toonMat(P.goldDark)
  );
  base.position.y = 0.14; base.castShadow = true; g.add(base);
  addOutline(base, { thickness: 0.025 });

  const petalGeo = new THREE.SphereGeometry(0.26, 10, 8);
  const petals = new THREE.InstancedMesh(petalGeo, goldMat, 16);
  const d = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    d.position.set(Math.cos(a) * 1.18, 0.34, Math.sin(a) * 1.18);
    d.rotation.set(0, -a, 0.35);
    d.scale.set(1.1, 0.55, 0.5);
    d.updateMatrix();
    petals.setMatrixAt(i, d.matrix);
  }
  g.add(petals);

  // Body — plump capsule
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 0.5, 6, 16), skinMat);
  body.scale.set(1, 1.15, 0.78);
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.03 });

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 0.72, 14), goldMat);
  robe.position.y = 0.75;
  robe.castShadow = true;
  g.add(robe);
  addOutline(robe, { thickness: 0.025 });

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), skinMat);
  shoulders.scale.set(1.35, 0.72, 0.85);
  shoulders.position.y = 1.48;
  shoulders.castShadow = true;
  g.add(shoulders);
  addOutline(shoulders, { thickness: 0.025 });

  // Head — big round
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), skinMat);
  head.position.y = 1.98;
  head.castShadow = true;
  g.add(head);
  addOutline(head, { thickness: 0.025 });

  // Ushnisha bun
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinMat);
  bun.position.y = 2.34;
  g.add(bun);
  addOutline(bun, { thickness: 0.02 });

  // Cartoon eyes (closed — serene)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3a2010 });
  const eyeGeo = new THREE.TorusGeometry(0.06, 0.012, 4, 12, Math.PI);
  [-0.12, 0.12].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.rotation.x = Math.PI;
    eye.rotation.z = 0;
    eye.position.set(x, 2.02, 0.33);
    g.add(eye);
  });

  // Halo
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe090, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.position.set(0, 1.98, -0.6);
  halo.userData.isHalo = true;
  g.add(halo);

  const halo2 = new THREE.Mesh(
    new THREE.CircleGeometry(1.7, 32),
    new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  halo2.position.set(0, 1.98, -0.61);
  halo2.userData.isHalo = true;
  g.add(halo2);

  // Hands in mudra
  const handGeo = new THREE.SphereGeometry(0.17, 10, 8);
  const hl = new THREE.Mesh(handGeo, skinMat);
  hl.scale.set(1.4, 0.6, 1); hl.position.set(-0.18, 0.82, 0.6);
  g.add(hl);
  const hr = hl.clone(); hr.position.x = 0.18; g.add(hr);

  g.position.set(0, PLAT.y + 1.3, PLAT.z - 3.2);
  parent.add(g);
  G.buddha = g;
}

/* ═══════════ ALTAR (rounded) ═══════════ */
function _altar(parent) {
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(5.5, 0.18, 1.8, 2, 0.06),
    toonMat(P.woodMid)
  );
  top.position.set(0, PLAT.y + 1.15, PLAT.z - 3.2);
  top.castShadow = top.receiveShadow = true;
  parent.add(top);
  addOutline(top, { thickness: 0.02 });

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(5, 1.0, 1.4, 2, 0.08),
    toonMat(P.woodDark)
  );
  base.position.set(0, PLAT.y + 0.55, PLAT.z - 3.2);
  base.castShadow = base.receiveShadow = true;
  parent.add(base);
  addOutline(base, { thickness: 0.025 });

  addBoxObstacle(0, PLAT.z - 3.2, 5.5, 2.0);
}

/* ═══════════ INCENSE BURNER ═══════════ */
function _incense(parent) {
  const g = new THREE.Group();
  const bronze = toonMat(P.bronze);

  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.55, 16), bronze);
  bowl.position.y = 0.275; bowl.castShadow = true; g.add(bowl);
  addOutline(bowl, { thickness: 0.02 });

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 8, 20), bronze);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.55; g.add(rim);

  const ash = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.06, 14),
    toonMat(0x908878)
  );
  ash.position.y = 0.52; g.add(ash);

  g.position.set(0, PLAT.y + 1.35, PLAT.z - 3.2);
  parent.add(g);
  G.incenseBurner = g;
}

/* ═══════════ WOODEN FISH ═══════════ */
function _woodenFish(parent) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 10),
    toonMat(P.woodDark)
  );
  body.scale.set(1.35, 0.8, 1); body.position.y = 0.16; body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.015 });

  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
    toonMat(P.woodLight)
  );
  stick.rotation.z = Math.PI / 2.5; stick.position.set(0.35, 0.28, 0);
  g.add(stick);

  g.position.set(-1.8, PLAT.y + 1.25, PLAT.z - 3.2);
  parent.add(g);
}

/* ═══════════ CANDLES ═══════════ */
function _createCandle(parent, x, z, y) {
  const g = new THREE.Group();
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.14, 0.5, 10),
    toonMat(P.bronze)
  );
  stand.position.y = 0.25; g.add(stand);

  const c = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8),
    toonMat(0xf8eed8)
  );
  c.position.y = 0.64; g.add(c);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc44, toneMapped: false })
  );
  flame.scale.set(0.7, 1.5, 0.7); flame.position.y = 0.86; g.add(flame);

  g.position.set(x, y, z);
  parent.add(g);
  G.candleFlames.push({ flame, light: null, base: y + 0.86 });
}
function _candles(parent) {
  _createCandle(parent, -1.8, PLAT.z - 3.2, PLAT.y + 1.25);
  _createCandle(parent,  1.8, PLAT.z - 3.2, PLAT.y + 1.25);
}

/* ═══════════ OFFERING DECOR ═══════════ */
function _offerDecor(parent) {
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.13, 0.42, 12),
    toonMat(0x6090a8)
  );
  vase.position.set(-0.6, PLAT.y + 1.5, PLAT.z - 3.2);
  vase.castShadow = true;
  parent.add(vase);
  addOutline(vase, { thickness: 0.015 });

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const l = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      toonMat(P.lotus)
    );
    l.scale.set(1, 0.7, 1);
    l.position.set(-0.6 + Math.cos(a) * 0.07, PLAT.y + 1.78, PLAT.z - 3.2 + Math.sin(a) * 0.07);
    parent.add(l);
  }

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.3, 0.07, 16),
    toonMat(P.stone)
  );
  plate.position.set(0.7, PLAT.y + 1.28, PLAT.z - 3.2);
  parent.add(plate);

  const fruitColors = [0xe05a48, 0xf0b048, 0xe05a48, 0xf0b048, 0xa0c870];
  const fruitGeo = new THREE.SphereGeometry(0.09, 10, 8);
  fruitColors.forEach((c, i) => {
    const a = (i / 5) * Math.PI * 2;
    const f = new THREE.Mesh(fruitGeo, toonMat(c));
    f.position.set(0.7 + Math.cos(a) * 0.15, PLAT.y + 1.37, PLAT.z - 3.2 + Math.sin(a) * 0.15);
    parent.add(f);
  });
}

/* ═══════════ CUSHIONS (puffy toon) ═══════════ */
const CUSH_POS = [
  [-4, -7], [-2, -7], [0, -7], [2, -7], [4, -7],
  [-4, -9], [-2, -9], [0, -9], [2, -9], [4, -9]
];

function _cushions(parent) {
  CUSH_POS.forEach(([x, z], i) => {
    const g = new THREE.Group();

    // Puffy base (squashed sphere)
    const base = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 14, 10),
      toonMat(i % 2 === 0 ? P.cushion1 : P.cushion2)
    );
    base.scale.set(1, 0.32, 1);
    base.position.y = 0.13;
    base.castShadow = base.receiveShadow = true;
    g.add(base);
    addOutline(base, { thickness: 0.02 });

    // Decorative tuft in center
    const tuft = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      toonMat(P.cushionBorder)
    );
    tuft.scale.set(1, 0.6, 1);
    tuft.position.y = 0.26;
    g.add(tuft);

    g.position.set(x, PLAT.y, z);
    parent.add(g);

    G.cushions.push({
      position: new THREE.Vector3(x, PLAT.y, z),
      occupied: false
    });
  });
}

/* ═══════════ TREES (instanced toon) ═══════════ */
function _trees(parent) {
  const trees = [
    [-10, 8, 1.1], [10, 8, 1.0], [-10, 2, 0.95], [10, 2, 1.05],
    [-11, -4, 0.9], [11, -4, 1.0], [-13, 12, 1.2], [13, 12, 1.1],
    [-9, 18, 0.85], [9, 18, 0.9]
  ];
  const foliage = [
    [0, 2.5, 0, 0.9], [0.5, 2.2, 0.3, 0.7], [-0.4, 2.3, -0.3, 0.75],
    [0.2, 3.1, -0.2, 0.65], [-0.3, 3.0, 0.3, 0.6], [0, 3.5, 0, 0.5]
  ];

  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 2, 8);
  const trunks = new THREE.InstancedMesh(trunkGeo, toonMat(P.woodDark), trees.length);

  const leafGeo = new THREE.SphereGeometry(1, 10, 8);
  const leafMatA = toonMat(P.leafMid);
  const leafMatB = toonMat(P.leafLight);
  const leavesA = new THREE.InstancedMesh(leafGeo, leafMatA, Math.ceil(trees.length * foliage.length / 2));
  const leavesB = new THREE.InstancedMesh(leafGeo, leafMatB, Math.floor(trees.length * foliage.length / 2));

  const d = new THREE.Object3D();
  let iA = 0, iB = 0;
  trees.forEach(([tx, tz, ts], ti) => {
    d.position.set(tx, 1 * ts, tz); d.scale.setScalar(ts); d.updateMatrix();
    trunks.setMatrixAt(ti, d.matrix);

    foliage.forEach(([fx, fy, fz, fr], fi) => {
      d.position.set(tx + fx * ts, fy * ts, tz + fz * ts);
      d.scale.setScalar(fr * ts);
      d.updateMatrix();
      if ((ti + fi) % 2 === 0) leavesA.setMatrixAt(iA++, d.matrix);
      else leavesB.setMatrixAt(iB++, d.matrix);
    });
    addCircleObstacle(tx, tz, 0.5 * ts);
  });
  trunks.castShadow = leavesA.castShadow = leavesB.castShadow = true;
  parent.add(trunks, leavesA, leavesB);
}

/* ═══════════ PONDS ═══════════ */
function _ponds(parent) {
  _makePond(parent, -5, 6);
  _makePond(parent, 5, 6);
}
function _makePond(parent, x, z) {
  const g = new THREE.Group();

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.18, 8, 20),
    toonMat(P.stone)
  );
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.1;
  rim.receiveShadow = true; g.add(rim);
  addOutline(rim, { thickness: 0.02 });

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1.72, 24),
    new THREE.MeshStandardMaterial({
      color: P.water, roughness: 0.15, metalness: 0.25,
      transparent: true, opacity: 0.88
    })
  );
  water.rotation.x = -Math.PI / 2; water.position.y = 0.09;
  g.add(water);

  const leafMat = toonMat(P.leafDark, { side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.2;
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.22 + Math.random() * 0.15, 8), leafMat);
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(Math.cos(a) * r, 0.11, Math.sin(a) * r);
    g.add(leaf);
  }

  const petalGeo = new THREE.SphereGeometry(0.1, 6, 5);
  const pinkMat = toonMat(P.lotus);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const r = 0.5 + Math.random() * 0.8;
    for (let p = 0; p < 6; p++) {
      const pa = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, pinkMat);
      petal.scale.set(0.6, 1.4, 0.5);
      petal.position.set(Math.cos(a) * r + Math.cos(pa) * 0.05, 0.19, Math.sin(a) * r + Math.sin(pa) * 0.05);
      g.add(petal);
    }
  }

  g.position.set(x, 0, z);
  parent.add(g);
  addCircleObstacle(x, z, 1.95);
  G.pondWaters.push(water);
}

/* ═══════════ LANTERNS ═══════════ */
function _lanterns(parent) {
  [[-3, 3], [3, 3], [-3, -2], [3, -2]].forEach(([x, z]) => _makeLantern(parent, x, z));
}
function _makeLantern(parent, x, z) {
  const g = new THREE.Group();
  const mat = toonMat(P.stone);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.22, 8), mat);
  base.position.y = 0.11; base.castShadow = true; g.add(base);
  addOutline(base, { thickness: 0.02 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.8, 8), mat);
  post.position.y = 0.62; post.castShadow = true; g.add(post);

  const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), mat);
  plat.position.y = 1.07; g.add(plat);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false })
  );
  box.position.y = 1.32;
  g.add(box);
  addOutline(box, { thickness: 0.02, color: 0x5a4028 });

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.28, 4),
    toonMat(P.woodDark)
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.63;
  g.add(roof);

  g.position.set(x, 0, z);
  parent.add(g);
  addCircleObstacle(x, z, 0.4);
}
/* ═══════════════════════════════════════════════════════════
   HIỆN ĐẠI VILLA (Căn nhà trong ảnh)
   ═══════════════════════════════════════════════════════════ */
function _modernHouse(parent) {
  var g = new THREE.Group();
  
  var whiteMat = toonMat(0xf8f8f8);
  var roofMat = toonMat(0x4a5058);
  var woodMat = toonMat(0x8a6040);
  var glassMat = toonMat(0x1a2a3a);
  var grassMat = toonMat(0x88c060);
  var stoneMat = toonMat(0xd0d0d0);

  // 1. Bãi cỏ nền
  var lawn = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 16), grassMat);
  lawn.position.set(0, 0.05, 0);
  lawn.receiveShadow = true;
  g.add(lawn);

  // 2. Móng nhà (sân thượng)
  var patio = new THREE.Mesh(new RoundedBoxGeometry(14, 0.6, 10, 2, 0.1), stoneMat);
  patio.position.set(0, 0.4, -2);
  patio.receiveShadow = true; patio.castShadow = true;
  g.add(patio);
  addOutline(patio, { thickness: 0.02 });

  // 3. Tường nhà chính
  var walls = new THREE.Mesh(new RoundedBoxGeometry(12, 3.5, 8, 2, 0.2), whiteMat);
  walls.position.set(0, 2.45, -3);
  walls.castShadow = true;
  g.add(walls);
  addOutline(walls, { thickness: 0.025 });

  // 4. Mái nhà (Chóp 4 cạnh)
  var roof = new THREE.Mesh(new THREE.ConeGeometry(10, 1.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 5.1, -3);
  roof.castShadow = true;
  g.add(roof);
  addOutline(roof, { thickness: 0.035 });

  // Diềm mái
  var eave = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.15, 8.4), roofMat);
  eave.position.set(0, 4.2, -3);
  g.add(eave);

  // 5. Cửa kính lớn (Mặt tiền)
  var door = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 0.1), glassMat);
  door.position.set(1.5, 1.9, 1.01);
  g.add(door);
  
  // Khung cửa gỗ
  [-0.5, 3.5].forEach(function(x) {
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 0.15), woodMat);
    frame.position.set(x, 1.9, 1.05);
    g.add(frame);
  });

  // 6. Cửa vòm bên hông (như trong ảnh)
  var arch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 2), glassMat);
  arch.position.set(-6.01, 1.85, -2);
  g.add(arch);
  
  var archTop = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 16, 1, false, 0, Math.PI), whiteMat);
  archTop.rotation.z = Math.PI / 2;
  archTop.rotation.x = Math.PI / 2;
  archTop.position.set(-6, 3.1, -2);
  g.add(archTop);

  // 7. Giàn gỗ Pergola (bên trái sân)
  for (var i = 0; i < 4; i++) {
    var beam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4), woodMat);
    beam.position.set(-4.5 + i * 1, 3.2, 2);
    beam.castShadow = true;
    g.add(beam);
  }
  var pergolaRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 4), toonMat(0x9a7050, {transparent: true, opacity: 0.5}));
  pergolaRoof.position.set(-3, 3.3, 2);
  g.add(pergolaRoof);

  // Cột chống Pergola
  [-5.5, -0.5].forEach(function(x) {
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 6), woodMat);
    post.position.set(x, 1.6, 3.8);
    g.add(post);
  });

  // 8. Bậc thang dẫn lên sân thượng
  for (var j = 0; j < 4; j++) {
    var step = new THREE.Mesh(new RoundedBoxGeometry(6, 0.15, 0.6, 2, 0.05), stoneMat);
    step.position.set(0, 0.15 + j * 0.15, 4.5 - j * 0.5);
    step.castShadow = true; step.receiveShadow = true;
    g.add(step);
    addOutline(step, { thickness: 0.01 });
  }

  // 9. Lối đi lát đá (Stepping stones)
  for (var k = 0; k < 5; k++) {
    var pathStone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6), stoneMat);
    pathStone.position.set(0, 0.1, 6.5 + k * 1.5);
    pathStone.rotation.y = Math.random() * Math.PI;
    g.add(pathStone);
  }

  // 10. Hàng rào trắng bao quanh
  var fenceGeo = new RoundedBoxGeometry(0.2, 1.2, 1.8, 2, 0.05);
  var fencePositions = [
    [-10, 0], [-8, 0], [-6, 0], [-4, 0], [-2, 0], [0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], // Hàng trước
    [-10, -8], [-10, -6], [-10, -4], [-10, -2], [-10, 0], // Hàng trái
    [10, -8], [10, -6], [10, -4], [10, -2], [10, 0] // Hàng phải
  ];

  fencePositions.forEach(function(pos) {
    var fence = new THREE.Mesh(fenceGeo, whiteMat);
    // Xoay hàng rào hông
    if (pos[0] === -10 || pos[0] === 10) {
      fence.rotation.y = Math.PI / 2;
      fence.position.set(pos[0], 0.6, pos[1] + 0.9);
    } else {
      fence.position.set(pos[0], 0.6, 8);
    }
    g.add(fence);
    addOutline(fence, { thickness: 0.015 });
  });

  // 11. Cây cối trang trí
  // Cây hoa màu tím (bên trái)
  var pTree = new THREE.Group();
  var pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2, 6), woodMat);
  pTrunk.position.y = 1;
  pTree.add(pTrunk);
  var pLeaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), toonMat(0xc060a0));
  pLeaf.position.y = 2.2;
  pTree.add(pLeaf);
  pTree.position.set(-5, 0, 1);
  g.add(pTree);

  // Cây xanh nhỏ (bên phải)
  var gTree = new THREE.Group();
  var gTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6), woodMat);
  gTrunk.position.y = 0.75;
  gTree.add(gTrunk);
  var gLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), toonMat(0x70b050));
  gLeaf.position.y = 1.8;
  gTree.add(gLeaf);
  gTree.position.set(5, 0, 2);
  g.add(gTree);

  // Đặt nhà ở khu đất trống phía bên trái chùa
  g.position.set(-22, 0, -12);
  parent.add(g);

  // Thêm va chạm (không cho nhân vật đi xuyên qua nhà)
  addBoxObstacle(-22, -15, 12, 8);       // Tường nhà
  addBoxObstacle(-22, -14, 14, 10);      // Sân thượng
  addBoxObstacle(-32, -10, 0.5, 18);     // Hàng rào trái
  addBoxObstacle(-12, -10, 0.5, 18);     // Hàng rào phải
}
/* ═══════════════════════════════════════════════════════════
   VƯỜN RAU (Vegetable Garden)
   ═══════════════════════════════════════════════════════════ */
function _vegetableGarden(parent) {
  const g = new THREE.Group();

  const soilMat = toonMat(0x6a4a30);
  const soilDarkMat = toonMat(0x4a3020);
  const cabbageMat = toonMat(0x88c060);
  const cabbageDarkMat = toonMat(0x5a8a40);
  const carrotMat = toonMat(0xe87840);
  const leafMat = toonMat(0x70a050);
  const fenceMat = toonMat(P.woodLight);
  const railMat = toonMat(0x8a6050);

  // ─── 2 luống cải bắp ───
  const beds = [
    { x: 0, z: -1.5 },
    { x: 0, z: 0.5 }
  ];

  beds.forEach(bed => {
    const soil = new THREE.Mesh(
      new RoundedBoxGeometry(5, 0.2, 1.2, 2, 0.05),
      soilMat
    );
    soil.position.set(bed.x, 0.1, bed.z);
    soil.receiveShadow = true;
    g.add(soil);
    addOutline(soil, { thickness: 0.02 });

    // 5 cây cải mỗi luống
    for (let i = 0; i < 5; i++) {
      const px = bed.x - 2 + i;
      const cabbage = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 6),
        i % 2 === 0 ? cabbageMat : cabbageDarkMat
      );
      cabbage.scale.set(1, 0.78, 1);
      cabbage.position.set(px, 0.32, bed.z);
      cabbage.castShadow = true;
      g.add(cabbage);
      addOutline(cabbage, { thickness: 0.015 });
    }
  });

  // ─── Luống cà rốt dọc bên phải ───
  const carrotBed = new THREE.Mesh(
    new RoundedBoxGeometry(1.2, 0.2, 4, 2, 0.05),
    soilDarkMat
  );
  carrotBed.position.set(2.6, 0.1, -0.5);
  carrotBed.receiveShadow = true;
  g.add(carrotBed);
  addOutline(carrotBed, { thickness: 0.02 });

  for (let i = 0; i < 4; i++) {
    const pz = -0.5 - 1.5 + i * 1;
    const carrot = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.42, 6),
      carrotMat
    );
    carrot.position.set(2.6, 0.42, pz);
    carrot.rotation.z = Math.PI;
    carrot.castShadow = true;
    g.add(carrot);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 6, 4),
      leafMat
    );
    top.scale.set(1, 1.6, 1);
    top.position.set(2.6, 0.7, pz);
    g.add(top);
  }

  // ─── Hàng rào gỗ ───
  const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6);
  const postPositions = [];

  // Hàng rào trái (dọc)
  for (let z = -2.8; z <= 2.8; z += 1.0) postPositions.push([-3.0, z]);
  // Hàng rào phải (dọc)
  for (let z = -2.8; z <= 2.8; z += 1.0) postPositions.push([3.8, z]);
  // Hàng rào sau
  for (let x = -3.0; x <= 3.8; x += 1.0) postPositions.push([x, -3.0]);

  postPositions.forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, fenceMat);
    post.position.set(px, 0.275, pz);
    post.castShadow = true;
    g.add(post);
    addOutline(post, { thickness: 0.01 });
  });

  // Thanh ngang hàng rào
  [-0.4, -0.15, 0.1, 0.35, 0.6, 0.85, 1.1, 1.35, 1.6, 1.85, 2.1, 2.35, 2.6, 2.85, 3.1, 3.35, 3.6].forEach(() => {});

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 5.8), railMat);
  railL.position.set(-3.0, 0.35, 0);
  g.add(railL);

  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 5.8), railMat);
  railR.position.set(3.8, 0.35, 0);
  g.add(railR);

  const railB = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.06), railMat);
  railB.position.set(0.4, 0.35, -3.0);
  g.add(railB);

  // ─── Bù nhìn (Scarecrow) ───
  const scarecrow = new THREE.Group();

  const scarePost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2, 6),
    toonMat(P.woodDark)
  );
  scarePost.position.y = 1;
  scarecrow.add(scarePost);

  const cross = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6),
    toonMat(P.woodDark)
  );
  cross.rotation.z = Math.PI / 2;
  cross.position.y = 1.5;
  scarecrow.add(cross);

  // Đầu rơm
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 10, 8),
    toonMat(0xd8b878)
  );
  head.position.y = 1.85;
  scarecrow.add(head);
  addOutline(head, { thickness: 0.02 });

  // Mắt
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3a2010 });
  [-0.1, 0.1].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), eyeMat);
    eye.position.set(x, 1.9, 0.24);
    scarecrow.add(eye);
  });

  // Miệng cười
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 4, 8, Math.PI),
    eyeMat
  );
  smile.rotation.x = Math.PI;
  smile.position.set(0, 1.8, 0.26);
  scarecrow.add(smile);

  // Nón lá
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.2, 10),
    toonMat(0xc0a050)
  );
  hat.position.y = 2.15;
  scarecrow.add(hat);
  addOutline(hat, { thickness: 0.015 });

  // Áo
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.3),
    toonMat(0x6090c0)
  );
  shirt.position.y = 1.4;
  scarecrow.add(shirt);
  addOutline(shirt, { thickness: 0.015 });

  scarecrow.position.set(0, 0, 2.5);
  scarecrow.rotation.y = 0;
  g.add(scarecrow);

  // Đặt cả vườn vào khuôn viên — góc trước-trái
  g.position.set(-18, 0, 8);
  parent.add(g);

  addBoxObstacle(-16.9, 8, 8.2, 7.2);
}

/* ═══════════════════════════════════════════════════════════
   AO CÁ (Fish Pond) — với cá koi bơi
   ═══════════════════════════════════════════════════════════ */
const fishObjects = [];

function _fishPond(parent) {
  const g = new THREE.Group();
  const pondR = 3;

  // ─── Bờ đá ───
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(pondR, 0.22, 8, 24),
    toonMat(P.stone)
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.15;
  rim.receiveShadow = true;
  g.add(rim);
  addOutline(rim, { thickness: 0.025 });

  // ─── Đáy cát ───
  const bottom = new THREE.Mesh(
    new THREE.CircleGeometry(pondR - 0.1, 32),
    toonMat(0x8a9a90)
  );
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.05;
  g.add(bottom);

  // ─── Mặt nước ───
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(pondR - 0.12, 32),
    new THREE.MeshStandardMaterial({
      color: 0x5a98b8,
      roughness: 0.1,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.14;
  g.add(water);
  G.pondWaters.push(water);

  // ─── Cá koi ───
  const fishColors = [0xf07850, 0xf0a050, 0xf8f0e0, 0xe05838, 0xf8d050, 0xf08868];

  for (let i = 0; i < 6; i++) {
    const fish = new THREE.Group();
    const color = fishColors[i];

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      toonMat(color)
    );
    body.scale.set(1.6, 0.75, 0.8);
    fish.add(body);

    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.22, 6),
      toonMat(color)
    );
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -0.3;
    fish.add(tail);

    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0x1a1008 })
    );
    eye.position.set(0.15, 0.03, 0.11);
    fish.add(eye);

    const startAngle = (i / 6) * Math.PI * 2;
    const radius = 1 + (i % 3) * 0.55;
    fish.position.set(
      Math.cos(startAngle) * radius,
      0.28 + (i % 2) * 0.04,
      Math.sin(startAngle) * radius
    );

    fish.userData = {
      angle: startAngle,
      radius: radius,
      speed: 0.35 + Math.random() * 0.25,
      y: fish.position.y,
      phase: Math.random() * Math.PI * 2
    };

    fishObjects.push(fish);
    g.add(fish);
  }

  // ─── Lá sen ───
  const lilyMat = toonMat(0x4a8a3a, { side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 1.5;
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 8),
      lilyMat
    );
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = Math.random() * Math.PI * 2;
    pad.position.set(Math.cos(a) * r, 0.17, Math.sin(a) * r);
    g.add(pad);
  }

  // ─── Hoa súng nhỏ ───
  const flowerMat = toonMat(0xf0b0c8);
  for (let i = 0; i < 2; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.random() * 0.8;
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 6, 5),
        flowerMat
      );
      petal.scale.set(0.6, 1.3, 0.5);
      petal.position.set(
        Math.cos(a) * r + Math.cos(pa) * 0.06,
        0.22,
        Math.sin(a) * r + Math.sin(pa) * 0.06
      );
      g.add(petal);
    }
  }

  // ─── Cầu gỗ nhỏ ───
  const bridgeMat = toonMat(P.woodMid);
  const bridge = new THREE.Group();

  // Ván cầu (cong lên)
  for (let i = 0; i < 7; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.06, 0.28),
      bridgeMat
    );
    const t = i / 6;
    plank.position.set(0, 0.35 + Math.sin(t * Math.PI) * 0.18, -0.9 + i * 0.3);
    plank.rotation.x = -Math.cos(t * Math.PI) * 0.25;
    plank.castShadow = true;
    bridge.add(plank);
    addOutline(plank, { thickness: 0.012 });
  }

  // Lan can 2 bên
  [-0.65, 0.65].forEach(side => {
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6),
        bridgeMat
      );
      post.position.set(side, 0.55 + Math.sin(t * Math.PI) * 0.18, -0.9 + i * 0.3);
      bridge.add(post);
    }
  });

  // Tay vịn
  [-0.65, 0.65].forEach(side => {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6),
      bridgeMat
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side, 0.78, 0);
    bridge.add(rail);
  });

  g.add(bridge);

  // ─── Lau sậy quanh bờ ───
  const reedMat = toonMat(0x88a060);
  const tipMat = toonMat(0x6a4a30);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const r = pondR + 0.35;
    const reed = new THREE.Group();

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, 0.85, 4),
      reedMat
    );
    stem.position.y = 0.42;
    reed.add(stem);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      tipMat
    );
    tip.scale.set(1, 2, 1);
    tip.position.y = 0.92;
    reed.add(tip);

    reed.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.add(reed);
  }

  // Đặt ao vào khuôn viên — góc trước-phải
  g.position.set(18, 0, 8);
  parent.add(g);

  addCircleObstacle(18, 8, pondR + 0.3);
}

/* ═══════════════════════════════════════════════════════════
   Update fish animation — gọi từ main loop
   ═══════════════════════════════════════════════════════════ */
export function updateFish(dt, time) {
  for (let i = 0; i < fishObjects.length; i++) {
    const fish = fishObjects[i];
    const d = fish.userData;
    d.angle += d.speed * dt;

    fish.position.x = Math.cos(d.angle) * d.radius;
    fish.position.z = Math.sin(d.angle) * d.radius;
    fish.position.y = d.y + Math.sin(time * 2 + d.phase) * 0.03;

    // Hướng mặt theo phương chuyển động
    fish.rotation.y = Math.atan2(-Math.cos(d.angle), -Math.sin(d.angle));
  }
}

/* ═══════════ GATE ═══════════ */
function _gate(parent) {
  const mat = toonMat(P.woodMid);

  [-3.5, 3.5].forEach(x => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 5, 10), mat);
    p.position.set(x, 2.5, 18);
    p.castShadow = true;
    parent.add(p);
    addOutline(p, { thickness: 0.025 });
    addCircleObstacle(x, 18, 0.42);
  });

  const beam = new THREE.Mesh(
    new RoundedBoxGeometry(8, 0.42, 0.42, 2, 0.06),
    mat
  );
  beam.position.set(0, 4.8, 18);
  beam.castShadow = true;
  parent.add(beam);
  addOutline(beam, { thickness: 0.02 });

  const gateRoof = new THREE.Mesh(
    new THREE.ConeGeometry(5, 1.2, 4),
    toonMat(P.roof)
  );
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.position.set(0, 5.8, 18);
  gateRoof.castShadow = true;
  parent.add(gateRoof);
  addOutline(gateRoof, { thickness: 0.035 });

  // Pixel-style sign
  const c = document.createElement('canvas');
  c.width = 128; c.height = 48;
  const cx = c.getContext('2d');
  cx.fillStyle = '#3a2510'; cx.fillRect(0, 0, 128, 48);
  cx.strokeStyle = '#f0d080'; cx.lineWidth = 2; cx.strokeRect(3, 3, 122, 42);
  cx.fillStyle = '#f0d080'; cx.font = 'bold 22px Arial Black, sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText('TỊNH TÂM', 64, 25);

  const signTex = new THREE.CanvasTexture(c);
  signTex.magFilter = THREE.NearestFilter;
  signTex.minFilter = THREE.NearestFilter;
  signTex.generateMipmaps = false;

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.15),
    new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })
  );
  sign.position.set(0, 4.1, 17.75);
  parent.add(sign);
}