/**
 * world.js - Quy hoạch tổng thể thế giới 200x200m
 * Cấu trúc: Khu tâm linh (Giữa) - Khu dân cư (Bắc) - Sông/Cầu (Nam) - Nông trại (Đông Nam)
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { G, PLAT, addBoxObstacle, addCircleObstacle } from './state.js';
import { toonMat, addOutline, makePixelTileTexture, makePixelWoodTexture } from './utils.js';

// ═══════════ BẢNG MÀU (PASTEL WARM) ═══════════
const P = {
  groundBase: 0xecd0b0, groundLine: 0xd4b090,
  path: 0xf4e4cc,
  woodLight: 0xc89868, woodMid: 0xb08050, woodDark: 0x8a5a38,
  roof: 0xc07048, roofDark: 0x8a5030,
  gold: 0xf0d080, goldDark: 0xd4b050,
  skin: 0xf0d8b8, hair: 0x402818,
  water: 0x5a98b8,
  leafLight: 0xa8d080, leafMid: 0x88b868, leafDark: 0x689a50,
  stone: 0xd8d0c0, bronze: 0xc09060,
  cushion1: 0xb8a888, cushion2: 0xc8b898, cushionBorder: 0xe0c8a0
};

const _tileTex = makePixelTileTexture(P.groundBase, P.groundLine, 4, 64);
const _woodTex = makePixelWoodTexture(P.woodLight, 64);

// Mảng chứa nước hồ để animate
const pondWaters = [];
// Mảng chứa ngọn lửa nến để animate
const candleFlames = [];
// Mảng chứa cá để animate
const fishObjects = [];

export function buildWorld() {
  const g = new THREE.Group();
  G.world = g;
  G.scene.add(g);

  // 1. Nền tảng môi trường (200x200)
  _buildEnvironmentBase(g);
  _buildRiverAndBridge(g);
  
  // 2. Khu Trung Tâm (Tâm Linh)
  _buildTempleComplex(g);
  _buildPondsAndLanterns(g);

  // 3. Khu Dân Cư & Thương Mại (Phía Bắc)
  _buildModernHouse(g, -45, -35, Math.PI / 4); // Biệt thự 1 (Tây Bắc)
  _buildModernOffice(g, 45, -35, -Math.PI / 4); // Văn phòng (Đông Bắc)
  _buildModernHouse(g, 0, -60, Math.PI); // Biệt thự 2 (Chính Bắc)

  // 4. Cảnh quan & Cây cối (Instanced)
  _buildBoundaryForests(g);
}

/* ═══════════════════════════════════════════════════════════
   1. NỀN TẢNG MÔI TRƯỜNG & SÔNG
   ═══════════════════════════════════════════════════════════ */
function _buildEnvironmentBase(parent) {
  // Mặt cỏ khổng lồ 200x200
  const gTex = _tileTex.clone(); gTex.needsUpdate = true; gTex.repeat.set(100, 100);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    toonMat(0x88c060, { map: gTex }) // Cỏ xanh
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  parent.add(ground);
}

function _buildRiverAndBridge(parent) {
  // Sông ngang (Z = 30), rộng 16m, dài 200m
  const riverMat = new THREE.MeshStandardMaterial({
    color: P.water, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.85
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(200, 16), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.05, 30);
  parent.add(river);
  G.pondWaters.push(river);

  // Cầu gỗ lớn (X = 0, Z = 30)
  const bridgeGroup = new THREE.Group();
  
  // Mặt cầu
  const deck = new THREE.Mesh(new RoundedBoxGeometry(8, 0.4, 18, 2, 0.1), toonMat(P.woodMid));
  deck.position.y = 0.5;
  deck.receiveShadow = true;
  bridgeGroup.add(deck);
  addOutline(deck, { thickness: 0.02 });

  // Lan can 2 bên
  [-3.8, 3.8].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 18), toonMat(P.woodDark));
    rail.position.set(x, 1.2, 0);
    bridgeGroup.add(rail);
    addOutline(rail, { thickness: 0.015 });
    
    // Trụ lan can
    for (let z = -8; z <= 8; z += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), toonMat(P.woodDark));
      post.position.set(x, 1.1, z);
      bridgeGroup.add(post);
    }
  });

  bridgeGroup.position.set(0, 0, 30);
  parent.add(bridgeGroup);
}

/* ═══════════════════════════════════════════════════════════
   2. KHU TRUNG TÂM (CHÙA)
   ═══════════════════════════════════════════════════════════ */
function _buildTempleComplex(parent) {
  // --- Sân chùa & Bậc tam cấp ---
  const platformMat = toonMat(0xc9b39a);
  const platform = new THREE.Mesh(new RoundedBoxGeometry(PLAT.w, PLAT.y, PLAT.d, 2, 0.08), platformMat);
  platform.position.set(0, PLAT.y / 2, PLAT.z);
  platform.receiveShadow = platform.castShadow = true;
  parent.add(platform);
  addOutline(platform, { thickness: 0.02 });

  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new RoundedBoxGeometry(5, 0.12, 0.62, 2, 0.04), toonMat(P.stone));
    step.position.set(0, 0.06 + i * 0.1, PLAT.z + PLAT.d / 2 + 0.3 + i * 0.55);
    step.receiveShadow = step.castShadow = true;
    parent.add(step);
    addOutline(step, { thickness: 0.015 });
  }

  // --- Cột gỗ ---
  const pillarPos = [];
  [-6, -2.5, 2.5, 6].forEach(x => {
    pillarPos.push([x, PLAT.z + PLAT.d / 2 - 0.7]);
    pillarPos.push([x, PLAT.z - PLAT.d / 2 + 0.7]);
  });
  
  const shaftGeo = new THREE.CylinderGeometry(0.26, 0.3, 4, 12);
  const shafts = new THREE.InstancedMesh(shaftGeo, toonMat(P.woodMid), pillarPos.length);
  const d = new THREE.Object3D();
  pillarPos.forEach(([x, z], i) => {
    d.position.set(x, PLAT.y + 2.2, z); d.updateMatrix();
    shafts.setMatrixAt(i, d.matrix);
    addCircleObstacle(x, z, 0.48);
  });
  shafts.castShadow = true;
  parent.add(shafts);

  // --- Tường bao ---
  const backWall = new THREE.Mesh(new RoundedBoxGeometry(PLAT.w, 3.8, 0.28, 2, 0.05), toonMat(P.woodMid));
  backWall.position.set(0, PLAT.y + 1.9, PLAT.z - PLAT.d / 2 + 0.35);
  backWall.castShadow = backWall.receiveShadow = true;
  parent.add(backWall);
  addBoxObstacle(0, PLAT.z - PLAT.d / 2 + 0.35, PLAT.w, 0.3);

  // --- Mái chùa ---
  const roof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 2.4, 4, 1), toonMat(P.roof));
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, PLAT.y + 4.6, PLAT.z);
  roof.castShadow = true;
  parent.add(roof);
  addOutline(roof, { thickness: 0.04 });

  // --- Tượng Phật ---
  _buildBuddha(parent);
  // --- Bàn thờ & Đồ thờ tự ---
  _buildAltarAndItems(parent);
}

function _buildBuddha(parent) {
  const g = new THREE.Group();
  const goldMat = toonMat(P.gold);
  const skinMat = toonMat(P.skin);

  // Tòa sen
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.28, 16), toonMat(P.goldDark));
  base.position.y = 0.14; base.castShadow = true; g.add(base);
  addOutline(base, { thickness: 0.025 });

  // Thân
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.58, 0.5, 6, 16), skinMat);
  body.scale.set(1, 1.15, 0.78); body.position.y = 1.0; body.castShadow = true;
  g.add(body);
  
  // Cà sa
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 0.72, 14), goldMat);
  robe.position.y = 0.75; robe.castShadow = true; g.add(robe);

  // Đầu
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), skinMat);
  head.position.y = 1.98; head.castShadow = true; g.add(head);
  addOutline(head, { thickness: 0.025 });

  // Hào quang
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), new THREE.MeshBasicMaterial({ color: 0xffe090, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }));
  halo.position.set(0, 1.98, -0.6);
  halo.userData.isHalo = true;
  g.add(halo);

  g.position.set(0, PLAT.y + 1.3, PLAT.z - 3.2);
  parent.add(g);
  G.buddha = g;
}

function _buildAltarAndItems(parent) {
  const altarMat = toonMat(P.woodDark);
  
  // Bàn thờ
  const top = new THREE.Mesh(new RoundedBoxGeometry(5.5, 0.18, 1.8, 2, 0.06), toonMat(P.woodMid));
  top.position.set(0, PLAT.y + 1.15, PLAT.z - 3.2);
  top.castShadow = true; parent.add(top);
  addOutline(top, { thickness: 0.02 });
  addBoxObstacle(0, PLAT.z - 3.2, 5.5, 2.0);

  // Lư hương
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.55, 16), toonMat(P.bronze));
  bowl.position.set(0, PLAT.y + 1.55, PLAT.z - 3.2);
  bowl.castShadow = true;
  parent.add(bowl);
  G.incenseBurner = bowl;

  // Nến (2 bên)
  [-1.8, 1.8].forEach(x => {
    const candle = new THREE.Group();
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), toonMat(P.goldDark));
    stand.position.y = 0.25; candle.add(stand);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), toonMat(0xf5e8d0));
    body.position.y = 0.65; candle.add(body);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc44, toneMapped: false }));
    flame.position.y = 0.85; flame.scale.set(0.7, 1.4, 0.7); candle.add(flame);
    
    candle.position.set(x, PLAT.y + 1.24, PLAT.z - 3.2);
    parent.add(candle);
    candleFlames.push({ flame, base: PLAT.y + 2.1 });
  });
}

function _buildPondsAndLanterns(parent) {
  // Hồ sen 2 bên
  [-8, 8].forEach(x => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.15, 6, 20), toonMat(P.stone));
    rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.1, PLAT.z + PLAT.d / 2 + 2);
    parent.add(rim);
    
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), new THREE.MeshStandardMaterial({ color: P.water, roughness: 0.1, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2; water.position.set(x, 0.08, PLAT.z + PLAT.d / 2 + 2);
    parent.add(water);
    G.pondWaters.push(water);
    addCircleObstacle(x, PLAT.z + PLAT.d / 2 + 2, 1.9);
  });

  // Đèn đá
  [[-4, 12], [4, 12], [-4, -18], [4, -18]].forEach(([x, z]) => {
    const g = new THREE.Group();
    const mat = toonMat(P.stone);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.22, 8), mat); base.position.y = 0.11; g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.8, 8), mat); post.position.y = 0.62; g.add(post);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), new THREE.MeshBasicMaterial({ color: 0xffe0a0, toneMapped: false })); box.position.y = 1.32; g.add(box);
    g.position.set(x, 0, z);
    parent.add(g);
    addCircleObstacle(x, z, 0.4);
  });
}

/* ═══════════════════════════════════════════════════════════
   3. KHU DÂN CƯ (NHÀ CỬA, VĂN PHÒNG)
   ═══════════════════════════════════════════════════════════ */
function _buildModernHouse(parent, x, z, rotY) {
  // Tạo một cụm nhà thu nhỏ gọn gàng
  const g = new THREE.Group();
  const wallMat = toonMat(0xf8f8f8);
  const roofMat = toonMat(P.roofDark);
  const glassMat = toonMat(0x1a2a3a);

  // Khối nhà chính
  const body = new THREE.Mesh(new RoundedBoxGeometry(12, 4, 10, 2, 0.2), wallMat);
  body.position.y = 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.03 });

  // Mái
  const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 1.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.9;
  roof.castShadow = true;
  g.add(roof);
  addOutline(roof, { thickness: 0.04 });

  // Cửa kính
  const door = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.1), glassMat);
  door.position.set(0, 1.25, 5.01);
  g.add(door);
  
  // Hàng rào
  for (let i = -8; i <= 8; i+=2) {
    const fence = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.2), wallMat);
    fence.position.set(i, 0.5, 8);
    g.add(fence);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);

  // Va chạm
  addBoxObstacle(x, z, 14, 14);
}

function _buildModernOffice(parent, x, z, rotY) {
  // Tòa nhà kính 20 tầng (Quản lý hiển thị bởi OfficeManager)
  const g = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a4a7a, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.8 });
  
  const totalHeight = 20 * 5; // 20 tầng, mỗi tầng 5m
  const tower = new THREE.Mesh(new THREE.BoxGeometry(20, totalHeight, 20), glassMat);
  tower.position.y = totalHeight / 2;
  g.add(tower);

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
  
  addBoxObstacle(x, z, 22, 22);
}

/* ═══════════════════════════════════════════════════════════
   4. CẢNH QUAN (RỪNG CÂY INSTANCED)
   ═══════════════════════════════════════════════════════════ */
function _buildBoundaryForests(parent) {
  const treeCount = 80; // 80 cái cây lớn rải rác
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 6);
  const leafGeo = new THREE.SphereGeometry(2, 8, 6);
  
  const trunks = new THREE.InstancedMesh(trunkGeo, toonMat(P.woodDark), treeCount);
  const leaves = new THREE.InstancedMesh(leafGeo, toonMat(P.leafMid), treeCount);
  
  const d = new THREE.Object3D();
  let placed = 0;
  
  while (placed < treeCount) {
    // Rải cây ngẫu nhiên, tránh khu vực trung tâm (Chùa, Nhà, Đường)
    let tx = (Math.random() - 0.5) * 180;
    let tz = (Math.random() - 0.5) * 180;
    
    // Tránh khu chùa (X:-20->20, Z:-30->20)
    if (Math.abs(tx) < 25 && tz > -30 && tz < 20) continue;
    // Tránh sông (Z: 22->38)
    if (tz > 22 && tz < 38) continue;

    const scale = 0.8 + Math.random() * 0.6;
    d.position.set(tx, 1.5 * scale, tz);
    d.scale.setScalar(scale);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix();
    
    trunks.setMatrixAt(placed, d.matrix);
    
    d.position.set(tx, 4 * scale, tz);
    d.updateMatrix();
    leaves.setMatrixAt(placed, d.matrix);
    
    addCircleObstacle(tx, tz, 0.8);
    placed++;
  }
  
  trunks.castShadow = true;
  leaves.castShadow = true;
  parent.add(trunks, leaves);
}

/* ═══════════════════════════════════════════════════════════
   5. UPDATE ANIMATIONS (Gọi từ main.js)
   ═══════════════════════════════════════════════════════════ */
export function updateFish(dt, time) {
  // Hàm trống nếu không dùng đến cá
}

export function updateEnvironmentAnimations(elapsed) {
  // Nến cháy
  for (const f of candleFlames) {
    const fl = 0.85 + Math.sin(elapsed * 12 + f.base) * 0.1;
    f.flame.scale.set(0.7 * fl, 1.4 * fl, 0.7 * fl);
  }

  // Nước gợn sóng
  for (const w of G.pondWaters) {
    if (w?.material) w.material.opacity = 0.85 + Math.sin(elapsed * 1.5) * 0.05;
  }
}