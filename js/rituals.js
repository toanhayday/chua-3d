/**
 * rituals.js — 5 nghi lễ: Lạy, Thiền, Tụng kinh, Thắp hương, Dâng lễ
 */
import * as THREE from 'three';
import { G, PLAT, inTemple } from './state.js';
import { formatTime } from './utils.js';
import {
  startBowAnimation, nearestEmptyCushion, sitOnCushion, standUp
} from './character.js';

/* ============ (1) LẠY PHẬT ============ */
export function startBow(count = 1) {
  if (!inTemple()) return { ok: false, msg: 'Hãy vào chánh điện để lạy Phật' };
  if (G.charState.bowing) return { ok: false };
  if (G.charState.sitting) standUp();
  startBowAnimation(count);
  return { ok: true };
}

/* ============ (2) THIỀN ============ */
export function startMeditation(durationSec, onOpenFirstPerson) {
  if (G.meditationActive) return;
  if (!G.charState.sitting) {
    const nearest = nearestEmptyCushion();
    if (nearest < 0) return { ok: false, msg: 'Không còn bồ đoàn trống' };
    sitOnCushion(nearest);
  }
  if (onOpenFirstPerson) onOpenFirstPerson();

  G.meditationActive = true;
  G.meditationDuration = durationSec;
  G.meditationEndTime = durationSec > 0 ? performance.now() + durationSec * 1000 : 0;

  document.getElementById('meditationOverlay').classList.add('show');
  document.body.classList.add('meditating');
  document.getElementById('meditationModal').classList.remove('show');

  const timerEl = document.getElementById('medTimer');
  if (durationSec > 0) {
    timerEl.style.display = 'block';
    timerEl.textContent = formatTime(durationSec);
  } else {
    timerEl.style.display = 'none';
  }

  G.audio.bell();

  if (G.meditationInterval) clearInterval(G.meditationInterval);
  G.meditationInterval = setInterval(() => {
    if (!G.meditationActive) return;
    if (G.meditationDuration > 0) {
      const remaining = Math.max(0, (G.meditationEndTime - performance.now()) / 1000);
      timerEl.textContent = formatTime(Math.ceil(remaining));
      if (remaining <= 0) endMeditation(true);
    }
  }, 200);

  _startBreathLabelCycle();
}

function _startBreathLabelCycle() {
  const labelEl = document.getElementById('breathLabel');
  const cycle = () => {
    if (!G.meditationActive) return;
    labelEl.textContent = 'Hít vào';
    labelEl.style.opacity = '1';
    setTimeout(() => { if (G.meditationActive) { labelEl.textContent = 'Giữ hơi'; labelEl.style.opacity = '0.9'; } }, 4000);
    setTimeout(() => { if (G.meditationActive) { labelEl.textContent = 'Thở ra'; labelEl.style.opacity = '0.85'; } }, 6000);
    G.breathLabelTimeout = setTimeout(cycle, 12000);
  };
  cycle();
}

export function endMeditation(completed) {
  if (!G.meditationActive) return;
  G.meditationActive = false;
  if (G.meditationInterval) { clearInterval(G.meditationInterval); G.meditationInterval = null; }
  if (G.breathLabelTimeout) { clearTimeout(G.breathLabelTimeout); G.breathLabelTimeout = null; }
  document.getElementById('meditationOverlay').classList.remove('show');
  document.body.classList.remove('meditating');
  G.audio.bell();
  if (completed) return { msg: 'Thiền định viên mãn · An lạc' };
  return null;
}

/* ============ (3) TỤNG KINH ============ */
export const CHANT_TEXTS = {
  niemphat: {
    title: 'Niệm Danh Hiệu Phật',
    lines: [
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô A Di Đà Phật',
      'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật',
      'Nam Mô Đại Từ Đại Bi Quán Thế Âm Bồ Tát',
      'Nam Mô Đại Thế Chí Bồ Tát',
      'Nam Mô Địa Tạng Vương Bồ Tát',
      'Nguyện đem công đức này',
      'Hướng về khắp tất cả',
      'Đệ tử và chúng sanh',
      'Đều trọn thành Phật đạo'
    ]
  },
  batnha: {
    title: 'Bát Nhã Tâm Kinh',
    lines: [
      'Quán Tự Tại Bồ Tát',
      'Hành thâm Bát Nhã Ba La Mật Đa thời',
      'Chiếu kiến ngũ uẩn giai không',
      'Độ nhất thiết khổ ách',
      'Xá Lợi Tử',
      'Sắc bất dị không, không bất dị sắc',
      'Sắc tức thị không, không tức thị sắc',
      'Thọ tưởng hành thức diệc phục như thị',
      'Xá Lợi Tử',
      'Thị chư pháp không tướng',
      'Bất sanh bất diệt',
      'Bất cấu bất tịnh',
      'Bất tăng bất giảm'
    ]
  },
  samhoi: {
    title: 'Sám Hối',
    lines: [
      'Đệ tử từ vô thỉ kiếp đến nay',
      'Do tham sân si, khởi tạo các nghiệp',
      'Thân nghiệp, khẩu nghiệp, ý nghiệp',
      'Gây tạo ác nghiệp, không thể kể hết',
      'Nay con thành tâm sám hối',
      'Cầu xin Tam Bảo từ bi gia hộ',
      'Xóa tan mọi phiền não',
      'Thanh tịnh ba nghiệp',
      'Tinh tấn tu hành',
      'Cầu Vô Thượng Bồ Đề'
    ]
  }
};

export function openChanting() {
  if (!inTemple()) return { ok: false, msg: 'Hãy vào chánh điện để tụng kinh' };
  G.chantActive = true;
  G.chantLineIndex = 0;
  _renderChantText();
  document.getElementById('chantingPanel').classList.add('show');
  return { ok: true };
}

export function closeChanting() {
  G.chantActive = false;
  document.getElementById('chantingPanel').classList.remove('show');
}

export function selectChant(key) {
  if (!CHANT_TEXTS[key]) return;
  G.currentChant = key;
  G.chantLineIndex = 0;
  _renderChantText();
}

function _renderChantText() {
  const textEl = document.getElementById('chantText');
  const data = CHANT_TEXTS[G.currentChant];
  textEl.innerHTML = '';
  data.lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'line';
    if (i < G.chantLineIndex) div.classList.add('done');
    if (i === G.chantLineIndex) div.classList.add('current');
    div.textContent = line;
    textEl.appendChild(div);
  });
  const current = textEl.querySelector('.line.current');
  if (current) current.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function tapMo() {
  G.audio.woodenFish();
  if (G.chantActive) {
    const data = CHANT_TEXTS[G.currentChant];
    G.chantLineIndex = (G.chantLineIndex + 1) % data.lines.length;
    _renderChantText();
  }
}

/* ============ (4) THẮP HƯƠNG ============ */
class SmokeSystem {
  constructor(origin, count = 80) {
    this.origin = origin.clone();
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = origin.x;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = origin.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xcccccc, size: 0.12, transparent: true, opacity: 0.35,
      depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    G.scene.add(this.points);

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({ pos: origin.clone(), vel: new THREE.Vector3(), life: 0, maxLife: 4 });
    }
  }

  emit(n = 1) {
    for (let k = 0; k < n; k++) {
      const p = this.particles.find(p => p.life <= 0);
      if (!p) return;
      p.pos.copy(this.origin);
      p.pos.x += (Math.random() - 0.5) * 0.08;
      p.pos.z += (Math.random() - 0.5) * 0.08;
      p.vel.set((Math.random() - 0.5) * 0.15, 0.35 + Math.random() * 0.25, (Math.random() - 0.5) * 0.15);
      p.life = p.maxLife = 3.5 + Math.random() * 2;
    }
  }

  update(dt) {
    const arr = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.pos.addScaledVector(p.vel, dt);
        p.vel.x += (Math.random() - 0.5) * 0.08 * dt;
        p.vel.z += (Math.random() - 0.5) * 0.08 * dt;
        p.vel.y *= 0.997;
        arr[i * 3]     = p.pos.x;
        arr[i * 3 + 1] = p.pos.y;
        arr[i * 3 + 2] = p.pos.z;
      } else {
        arr[i * 3 + 1] = -100;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

export function lightIncense() {
  if (!inTemple()) return { ok: false, msg: 'Hãy vào chánh điện để thắp hương' };
  if (G.incenseLit) return { ok: false, msg: 'Hương đã được thắp rồi' };

  if (G.charState.sitting) standUp();
  G.incenseLit = true;

  const burnerPos = new THREE.Vector3();
  G.incenseBurner.getWorldPosition(burnerPos);
  burnerPos.y += 0.5;

  const smoke = new SmokeSystem(burnerPos, 80);
  G.smokeSystems.push(smoke);

  let emitTime = 0;
  const interval = setInterval(() => {
    if (!G.incenseLit) { clearInterval(interval); return; }
    smoke.emit(1);
    emitTime += 0.15;
    if (emitTime > 30) clearInterval(interval);
  }, 150);

  G.audio.bell();
  return { ok: true, msg: 'Hương thơm thanh tịnh dâng lên Tam Bảo' };
}

/* ============ (5) DÂNG LỄ ============ */
export function offerItem(type) {
  if (!inTemple()) return { ok: false, msg: 'Hãy vào chánh điện để dâng lễ' };
  if (G.offeredItems[type]) return { ok: false, msg: 'Lễ vật này đã được dâng' };

  G.offeredItems[type] = true;
  const pos = new THREE.Vector3(0, PLAT.y + 1.3, PLAT.z - 3.2);
  let obj = null;

  if (type === 'flower') {
    obj = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf5b8c8, roughness: 0.6, emissive: 0x331520, emissiveIntensity: 0.2 })
      );
      petal.scale.set(0.6, 1.2, 0.5);
      petal.position.set(Math.cos(a) * 0.08, 0.08, Math.sin(a) * 0.08);
      obj.add(petal);
    }
    pos.set(-1.5, PLAT.y + 1.35, PLAT.z - 3.0);
  } else if (type === 'candle') {
    obj = new THREE.Group();
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xf5e8d0, emissive: 0xffaa44, emissiveIntensity: 0.15 })
    );
    c.position.y = 0.15;
    obj.add(c);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcc44 })
    );
    flame.scale.set(0.7, 1.4, 0.7);
    flame.position.y = 0.36;
    obj.add(flame);
    const light = new THREE.PointLight(0xffaa44, 0.7, 4);
    light.position.y = 0.4;
    obj.add(light);
    pos.set(1.5, PLAT.y + 1.3, PLAT.z - 3.0);
  } else if (type === 'fruit') {
    obj = new THREE.Group();
    const colors = [0xd44a3a, 0xe8b04a, 0xd44a3a, 0xe8b04a, 0x88c060];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.6 })
      );
      fruit.position.set(Math.cos(a) * 0.15, 0.09, Math.sin(a) * 0.15);
      obj.add(fruit);
    }
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.23, 0.04, 20),
      new THREE.MeshStandardMaterial({ color: 0xc0a070 })
    );
    plate.position.y = 0.02;
    obj.add(plate);
    pos.set(0, PLAT.y + 1.32, PLAT.z - 3.0);
  } else if (type === 'water') {
    obj = new THREE.Group();
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    cup.position.y = 0.1;
    obj.add(cup);
    const w = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0x88bbee, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.7 })
    );
    w.position.y = 0.2;
    obj.add(w);
    pos.set(0.7, PLAT.y + 1.35, PLAT.z - 2.9);
  }

  if (obj) {
    obj.position.copy(pos);
    G.world.add(obj);
if (obj) {
  obj.position.copy(pos);
  G.world.add(obj);

  // ⚡ Cập nhật shadow map 1 lần khi có vật mới
  G.renderer.shadowMap.needsUpdate = true;

  // ... phần glow effect giữ nguyên
}
    const glow = new THREE.PointLight(0xffdd88, 1.5, 3);
    glow.position.copy(pos).add(new THREE.Vector3(0, 0.3, 0));
    G.world.add(glow);
    let glowTime = 0;
    const gi = setInterval(() => {
      glowTime += 0.05;
      glow.intensity = Math.max(0, 1.5 - glowTime * 1.2);
      if (glowTime > 1.5) { clearInterval(gi); G.world.remove(glow); }
    }, 50);
  }

  G.audio.bell();
  return { ok: true, msg: 'Lễ vật đã được dâng lên' };
}