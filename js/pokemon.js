/**
 * pokemon.js — 9 nhân vật Pokémon chạy quanh sân chùa
 * Sử dụng procedural 3D (không cần tải file ngoài)
 */
import * as THREE from 'three';
import { G } from './state.js';
import { toonMat, addOutline } from './utils.js';

var pokeList = [];
var SPAWN_RADIUS_MIN = 4;
var SPAWN_RADIUS_MAX = 18;
var MOVE_SPEED_MIN = 1.8;
var MOVE_SPEED_MAX = 3.5;

/* ═══════════ TẠO CÁC MÔ HÌNH POKÉMON ═══════════ */

function makeEye(size, x, y, z) {
  var eye = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a1008 })
  );
  eye.position.set(x, y, z);
  return eye;
}

function makeCheek(size, x, y, z, color) {
  var cheek = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 6),
    new THREE.MeshBasicMaterial({ color: color })
  );
  cheek.scale.set(1, 0.6, 0.5);
  cheek.position.set(x, y, z);
  return cheek;
}

// 1. Pikachu
function createPikachu() {
  var g = new THREE.Group();
  var yellow = toonMat(0xf8d030);
  var black = toonMat(0x201810);
  var red = toonMat(0xe03020);
  var brown = toonMat(0x8a5030);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), yellow);
  body.scale.set(1, 1.1, 0.9);
  body.position.y = 0.45;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Tai
  var earGeo = new THREE.ConeGeometry(0.12, 0.5, 6);
  [-0.2, 0.2].forEach(function(x) {
    var ear = new THREE.Mesh(earGeo, yellow);
    ear.position.set(x, 0.85, 0);
    ear.rotation.z = x > 0 ? -0.3 : 0.3;
    g.add(ear);
    addOutline(ear, { thickness: 0.015 });

    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 6), black);
    tip.position.set(x * 1.1, 1.05, 0);
    tip.rotation.z = x > 0 ? -0.3 : 0.3;
    g.add(tip);
  });

  // Mắt & Má
  g.add(makeEye(0.055, -0.12, 0.6, 0.3));
  g.add(makeEye(0.055, 0.12, 0.6, 0.3));
  g.add(makeCheek(0.07, -0.22, 0.48, 0.28, 0xe03020));
  g.add(makeCheek(0.07, 0.22, 0.48, 0.28, 0xe03020));

  // Đuôi hình tia sét
  var tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.05), yellow);
  tail1.position.set(0, 0.6, -0.35);
  tail1.rotation.x = 0.4;
  g.add(tail1);
  
  var tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.05), brown);
  tail2.position.set(0, 0.85, -0.45);
  g.add(tail2);

  return g;
}

// 2. Eevee
function createEevee() {
  var g = new THREE.Group();
  var brown = toonMat(0x9a6038);
  var cream = toonMat(0xf0e0c0);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), brown);
  body.scale.set(1, 0.95, 1.1);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Bờm cổ
  var collar = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), cream);
  collar.scale.set(1.1, 0.6, 1.1);
  collar.position.set(0, 0.65, 0.1);
  g.add(collar);
  addOutline(collar, { thickness: 0.015 });

  // Tai to
  var earGeo = new THREE.ConeGeometry(0.15, 0.6, 6);
  [-0.18, 0.18].forEach(function(x) {
    var ear = new THREE.Mesh(earGeo, brown);
    ear.position.set(x, 0.9, 0);
    ear.rotation.z = x > 0 ? -0.5 : 0.5;
    g.add(ear);
    addOutline(ear, { thickness: 0.015 });
  });

  // Đuôi xù
  var tail = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), brown);
  tail.scale.set(0.8, 1.5, 0.8);
  tail.position.set(0, 0.5, -0.4);
  tail.rotation.x = -0.5;
  g.add(tail);
  addOutline(tail, { thickness: 0.015 });

  g.add(makeEye(0.05, -0.12, 0.6, 0.27));
  g.add(makeEye(0.05, 0.12, 0.6, 0.27));

  return g;
}

// 3. Jigglypuff
function createJigglypuff() {
  var g = new THREE.Group();
  var pink = toonMat(0xf8b0c8);
  var teal = toonMat(0x40a8b0);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), pink);
  body.position.y = 0.45;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.025 });

  // Tai mèo
  var earGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
  [-0.3, 0.3].forEach(function(x) {
    var ear = new THREE.Mesh(earGeo, pink);
    ear.position.set(x, 0.8, 0);
    ear.rotation.z = x > 0 ? -0.4 : 0.4;
    g.add(ear);
    addOutline(ear, { thickness: 0.015 });
  });

  // Mắt to tròn
  [-0.14, 0.14].forEach(function(x) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), teal);
    eye.scale.set(1, 1.3, 0.5);
    eye.position.set(x, 0.55, 0.38);
    g.add(eye);
    var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({color:0x000000}));
    pupil.position.set(x, 0.53, 0.42);
    g.add(pupil);
  });

  // Xoáy tóc
  var curl = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12, Math.PI), pink);
  curl.position.set(0, 0.85, 0.2);
  g.add(curl);

  return g;
}

// 4. Dragonite
function createDragonite() {
  var g = new THREE.Group();
  var orange = toonMat(0xf0a060);
  var cream = toonMat(0xf8e0a0);
  var teal = toonMat(0x60b0b8);

  var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.5, 4, 12), orange);
  body.position.y = 0.75;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.025 });

  // Bụng
  var belly = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 10), cream);
  belly.position.set(0, 0.7, 0.18);
  g.add(belly);

  // Đầu
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), orange);
  head.position.y = 1.25;
  head.castShadow = true;
  g.add(head);
  addOutline(head, { thickness: 0.02 });

  // Râu
  [-0.15, 0.15].forEach(function(x) {
    var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), orange);
    antenna.position.set(x, 1.55, 0);
    antenna.rotation.z = x > 0 ? -0.5 : 0.5;
    g.add(antenna);
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), orange);
    ball.position.set(x * 1.4, 1.7, 0);
    g.add(ball);
  });

  // Cánh
  [-0.4, 0.4].forEach(function(x) {
    var wing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), teal);
    wing.position.set(x, 1.0, -0.25);
    wing.rotation.y = x > 0 ? 0.4 : -0.4;
    wing.rotation.z = x > 0 ? -0.2 : 0.2;
    g.add(wing);
  });

  g.add(makeEye(0.05, -0.12, 1.3, 0.26));
  g.add(makeEye(0.05, 0.12, 1.3, 0.26));

  return g;
}

// 5. Totodile
function createTotodile() {
  var g = new THREE.Group();
  var blue = toonMat(0x58b8f0);
  var red = toonMat(0xe03030);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), blue);
  body.scale.set(1, 1.2, 1);
  body.position.y = 0.45;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Hàm to
  var jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.35), blue);
  jaw.position.set(0, 0.65, 0.15);
  g.add(jaw);
  addOutline(jaw, { thickness: 0.015 });

  // Gai lưng
  for (var i = 0; i < 3; i++) {
    var spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), red);
    spike.position.set(0, 0.85 - i * 0.2, -0.25 + i * 0.05);
    spike.rotation.x = -0.4;
    g.add(spike);
  }

  g.add(makeEye(0.055, -0.15, 0.65, 0.25));
  g.add(makeEye(0.055, 0.15, 0.65, 0.25));

  return g;
}

// 6. Chikorita
function createChikorita() {
  var g = new THREE.Group();
  var green = toonMat(0xa8d880);
  var darkGreen = toonMat(0x508040);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), green);
  body.scale.set(0.9, 1.1, 0.9);
  body.position.y = 0.45;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Lá trên đầu
  var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), darkGreen);
  leaf.scale.set(0.3, 1.5, 1);
  leaf.position.set(0, 0.95, -0.1);
  leaf.rotation.x = -0.5;
  g.add(leaf);
  addOutline(leaf, { thickness: 0.015 });

  g.add(makeEye(0.05, -0.12, 0.55, 0.3));
  g.add(makeEye(0.05, 0.12, 0.55, 0.3));

  return g;
}

// 7. Tepig
function createTepig() {
  var g = new THREE.Group();
  var orange = toonMat(0xf08848);
  var black = toonMat(0x3a2820);
  var red = toonMat(0xe05050);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), orange);
  body.scale.set(1, 0.9, 1);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), black);
  head.position.y = 0.72;
  head.castShadow = true;
  g.add(head);
  addOutline(head, { thickness: 0.02 });

  // Mũi
  var nose = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8), red);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.65, 0.28);
  g.add(nose);

  // Tai
  [-0.15, 0.15].forEach(function(x) {
    var ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), orange);
    ear.position.set(x, 0.95, -0.1);
    g.add(ear);
  });

  g.add(makeEye(0.04, -0.12, 0.8, 0.24));
  g.add(makeEye(0.04, 0.12, 0.8, 0.24));

  return g;
}

// 8. Roselia
function createRoselia() {
  var g = new THREE.Group();
  var green = toonMat(0x88c060);
  var red = toonMat(0xe04050);
  var blue = toonMat(0x5080c0);

  var body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8), green);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Hoa tay
  [-0.35, 0.35].forEach(function(x) {
    var rose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), x < 0 ? red : blue);
    rose.position.set(x, 0.5, 0);
    g.add(rose);
    addOutline(rose, { thickness: 0.015 });
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), green);
    leaf.position.set(x * 0.8, 0.65, 0);
    leaf.rotation.z = x > 0 ? 0.5 : -0.5;
    g.add(leaf);
  });

  // Lá đầu
  var headLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), green);
  headLeaf.position.set(0, 0.8, 0);
  g.add(headLeaf);

  g.add(makeEye(0.04, -0.1, 0.55, 0.22));
  g.add(makeEye(0.04, 0.1, 0.55, 0.22));

  return g;
}

// 9. Oddish
function createOddish() {
  var g = new THREE.Group();
  var blue = toonMat(0x6888d0);
  var green = toonMat(0x60b040);

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), blue);
  body.position.y = 0.35;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.02 });

  // Lá đầu
  for (var i = 0; i < 3; i++) {
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), green);
    leaf.position.set((i - 1) * 0.1, 0.75, 0);
    leaf.rotation.z = (i - 1) * 0.4;
    leaf.rotation.x = -0.2;
    g.add(leaf);
    addOutline(leaf, { thickness: 0.01 });
  }

  g.add(makeEye(0.05, -0.1, 0.42, 0.25));
  g.add(makeEye(0.05, 0.1, 0.42, 0.25));

  return g;
}
// 10. Squirtle (Rùa Kini)
function createSquirtle() {
  var g = new THREE.Group();
  var blue = toonMat(0x80c8e8);
  var shell = toonMat(0xa06040);
  var belly = toonMat(0xf8e0b0);

  // Mai rùa (nửa sau)
  var backShell = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), shell);
  backShell.scale.set(1, 1, 0.6);
  backShell.position.set(0, 0.45, -0.15);
  backShell.castShadow = true;
  g.add(backShell);
  addOutline(backShell, { thickness: 0.02 });

  // Bụng (nửa trước)
  var frontBelly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), belly);
  frontBelly.scale.set(1, 1, 0.5);
  frontBelly.position.set(0, 0.45, 0.15);
  g.add(frontBelly);

  // Đầu
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), blue);
  head.position.set(0, 0.85, 0.05);
  head.castShadow = true;
  g.add(head);
  addOutline(head, { thickness: 0.02 });

  // Mắt to tròn màu đỏ nâu
  [-0.12, 0.12].forEach(function(x) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), toonMat(0xa03050));
    eye.scale.set(0.8, 1.2, 0.5);
    eye.position.set(x, 0.88, 0.3);
    g.add(eye);
    
    var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({color:0x000000}));
    pupil.position.set(x, 0.87, 0.34);
    g.add(pupil);
    
    // Đốm sáng mắt
    var highlight = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
    highlight.position.set(x + 0.02, 0.9, 0.36);
    g.add(highlight);
  });

  // Miệng cười
  var smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 4, 8, Math.PI), new THREE.MeshBasicMaterial({color:0x201810}));
  smile.rotation.x = Math.PI;
  smile.position.set(0, 0.75, 0.33);
  g.add(smile);

  // Tay
  [-0.35, 0.35].forEach(function(x) {
    var arm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), blue);
    arm.scale.set(1, 1.4, 1);
    arm.position.set(x, 0.5, 0.15);
    arm.rotation.z = x > 0 ? -0.5 : 0.5;
    g.add(arm);
    addOutline(arm, { thickness: 0.01 });
  });

  // Chân
  [-0.18, 0.18].forEach(function(x) {
    var leg = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), blue);
    leg.scale.set(1, 0.8, 1.2);
    leg.position.set(x, 0.15, 0.05);
    g.add(leg);
    addOutline(leg, { thickness: 0.01 });
  });

  // Đuôi xoắn ốc
  var tail = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.06, 6, 10, Math.PI * 1.5), blue);
  tail.position.set(0, 0.35, -0.35);
  tail.rotation.y = Math.PI / 2;
  tail.rotation.z = Math.PI;
  g.add(tail);
  addOutline(tail, { thickness: 0.015 });

  return g;
}

// 11. Bulbasaur (Ếch Kì Diệu)
function createBulbasaur() {
  var g = new THREE.Group();
  var teal = toonMat(0x88d0b8);
  var darkTeal = toonMat(0x489070);
  var bulbGreen = toonMat(0x38a040);

  // Thân (hơi dẹt và dài)
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), teal);
  body.scale.set(1.1, 0.9, 1.2);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);
  addOutline(body, { thickness: 0.025 });

  // Củ hành trên lưng
  var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), bulbGreen);
  bulb.position.set(0, 0.65, -0.15);
  bulb.castShadow = true;
  g.add(bulb);
  addOutline(bulb, { thickness: 0.02 });

  // Lá bao quanh củ
  for (var i = 0; i < 3; i++) {
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), darkTeal);
    leaf.position.set(-0.2 + i * 0.2, 0.6, -0.3);
    leaf.rotation.x = -0.8;
    leaf.rotation.z = (i - 1) * 0.5;
    g.add(leaf);
  }

  // Tai nhọn
  [-0.22, 0.22].forEach(function(x) {
    var ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), teal);
    ear.position.set(x, 0.65, 0.1);
    ear.rotation.z = x > 0 ? -0.6 : 0.6;
    ear.rotation.x = -0.2;
    g.add(ear);
    addOutline(ear, { thickness: 0.01 });
  });

  // Vết đốm trên trán
  [-0.1, 0.1].forEach(function(x) {
    var spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), darkTeal);
    spot.scale.set(1, 0.3, 1);
    spot.position.set(x, 0.58, 0.28);
    spot.rotation.x = -0.5;
    g.add(spot);
  });

  // Mắt đỏ
  [-0.15, 0.15].forEach(function(x) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), new THREE.MeshBasicMaterial({color:0xe02020}));
    eye.scale.set(0.8, 1.1, 0.5);
    eye.position.set(x, 0.5, 0.32);
    g.add(eye);

    var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({color:0x000000}));
    pupil.position.set(x, 0.5, 0.36);
    g.add(pupil);
    
    // Đốm sáng
    var highlight = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
    highlight.position.set(x + 0.02, 0.52, 0.38);
    g.add(highlight);
  });

  // Miệng cười rộng
  var smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 4, 12, Math.PI), new THREE.MeshBasicMaterial({color:0x1a4a30}));
  smile.rotation.x = Math.PI;
  smile.position.set(0, 0.38, 0.34);
  g.add(smile);

  // 4 chân ngắn
  [[-0.25, 0.15], [0.25, 0.15], [-0.25, -0.15], [0.25, -0.15]].forEach(function(pos) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 6), teal);
    leg.position.set(pos[0], 0.1, pos[1]);
    g.add(leg);
    addOutline(leg, { thickness: 0.01 });

    // Móng vuốt trắng
    for (var j = -1; j <= 1; j++) {
      var claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), toonMat(0xf0f0f0));
      claw.position.set(pos[0] + j * 0.04, 0.03, pos[1] + 0.1);
      claw.rotation.x = Math.PI / 2;
      g.add(claw);
    }
  });

  return g;
}

/* ═══════════ KHỞI TẠO & DI CHUYỂN ═══════════ */

export function initPokemons() {
  var spawns = [
    createPikachu, createEevee, createJigglypuff,
    createDragonite, createTotodile, createChikorita,
    createTepig, createRoselia, createOddish, createSquirtle, createBulbasaur  // <-- Thêm 2 dòng này
  ];

  spawns.forEach(function(createFn, index) {
    var mesh = createFn();
    // Thu nhỏ tổng thể để cân đối với nhân vật chính
    mesh.scale.set(0.8, 0.8, 0.8);
    
    // Vị trí xuất phát ngẫu nhiên
    var angle = Math.random() * Math.PI * 2;
    var dist = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
    mesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist + 8);

    mesh.userData = {
      speed: MOVE_SPEED_MIN + Math.random() * (MOVE_SPEED_MAX - MOVE_SPEED_MIN),
      target: new THREE.Vector3(),
      bounceOffset: Math.random() * Math.PI * 2,
      baseScale: 0.8,
      waitTimer: Math.random() * 2
    };

    // Đặt mục tiêu đầu tiên
    pickNewTarget(mesh);

    G.scene.add(mesh);
    pokeList.push(mesh);
  });
}

function pickNewTarget(pokemon) {
  // Vị trí ngẫu nhiên trong sân chùa, tránh khu vực chánh điện (Z < 0) và quá xa
  var tx = (Math.random() - 0.5) * 32; // -16 đến 16
  var tz = Math.random() * 20 + 2;     // 2 đến 22
  
  // Tránh rơi vào hồ sen / vườn rau / ao cá
  if (tx > -20 && tx < -13 && tz > 5 && tz < 11) tx = 0; // vườn rau
  if (tx > 15 && tx < 21 && tz > 5 && tz < 11) tx = 0;   // ao cá
  
  pokemon.userData.target.set(tx, 0, tz);
}

export function updatePokemons(dt, time) {
  for (var i = 0; i < pokeList.length; i++) {
    var p = pokeList[i];
    var data = p.userData;

    // Nếu đang chờ
    if (data.waitTimer > 0) {
      data.waitTimer -= dt;
      // Nhấp nhô tại chỗ
      p.position.y = Math.sin(time * 5 + data.bounceOffset) * 0.05;
      continue;
    }

    var dx = data.target.x - p.position.x;
    var dz = data.target.z - p.position.z;
    var distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.5) {
      // Đã tới đích -> chờ 1-3 giây rồi đi tiếp
      data.waitTimer = 1 + Math.random() * 2;
      pickNewTarget(p);
    } else {
      // Di chuyển tới đích
      var vx = (dx / distance) * data.speed;
      var vz = (dz / distance) * data.speed;
      
      p.position.x += vx * dt;
      p.position.z += vz * dt;

      // Xoay mặt theo hướng đi
      var targetAngle = Math.atan2(vx, vz);
      // Xoay mượt
      var diff = targetAngle - p.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.rotation.y += diff * Math.min(1, dt * 10);

      // Nhấp nhô khi chạy
      var hop = Math.abs(Math.sin(time * 8 + data.bounceOffset));
      p.position.y = hop * 0.15;
      
      // Hiệu ứng squash & stretch (dẹt xuống khi chạm đất)
      p.scale.y = data.baseScale * (1 - hop * 0.1);
      p.scale.x = p.scale.z = data.baseScale * (1 + hop * 0.05);
    }
  }
}