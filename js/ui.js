/**
 * ui.js — Toàn bộ UI bindings, camera modes, prompt system
 * Phiên bản: Soft Clay 3D Cartoon Pixel
 *
 * EXPORT:
 *   - bindUI(rituals)      → gắn tất cả sự kiện UI
 *   - setCameraMode(mode)  → đổi góc nhìn
 *   - updatePrompt()       → cập nhật prompt tương tác
 *   - showToast(msg)       → thông báo nhanh
 *   - fpState              → { yaw, pitch } cho first-person
 */
import * as THREE from 'three';
import { G, inTemple, PLAT } from './state.js';
import { handleSitToggle, standUp } from './character.js';

/* ═══════════════════════════════════════════════════════════
   1. TOAST
   ═══════════════════════════════════════════════════════════ */
export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════════════════════════
   2. CAMERA MODES
   ═══════════════════════════════════════════════════════════ */
let fpDragging = false;
export const fpState = { yaw: 0, pitch: 0 };

export function setCameraMode(mode) {
  G.cameraMode = mode;

  // Cập nhật trạng thái active trên các nút
  document.querySelectorAll('[data-camera]').forEach(b => {
    b.classList.toggle('active', b.dataset.camera === mode);
  });

  if (mode === 'first') {
    /* ── Góc nhìn thứ nhất ── */
    G.controls.enabled = false;
    G.player.visible = false;
    fpState.yaw = G.player.rotation.y;
    fpState.pitch = 0;
  } else {
    /* ── Góc nhìn khác ── */
    G.controls.enabled = true;
    G.player.visible = true;

    if (mode === 'overview') {
      G.controls.minDistance = 8;
      G.controls.maxDistance = 40;
      G.camera.position.set(16, 18, 16);
      G.controls.target.set(0, 2, -6);
    } else {
      // third-person — theo sau nhân vật
      G.controls.minDistance = 2;
      G.controls.maxDistance = 24;
      G.camera.position.set(
        G.player.position.x,
        G.player.position.y + 3,
        G.player.position.z + 6
      );
      G.controls.target.copy(G.player.position).add(new THREE.Vector3(0, 0.9, 0));
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   3. BIND UI — Hàm chính
   ═══════════════════════════════════════════════════════════ */
export function bindUI(rituals) {
  const {
    startBow, startMeditation, endMeditation,
    openChanting, closeChanting, selectChant,
    tapMo, lightIncense, offerItem
  } = rituals;

  /* ─────── 3.1. INFO PANEL COLLAPSE ─────── */
  const infoToggle = document.getElementById('infoToggle');
  infoToggle?.addEventListener('click', () => {
    const panel = document.getElementById('infoPanel');
    panel.classList.toggle('collapsed');
    infoToggle.textContent = panel.classList.contains('collapsed') ? '▸' : '▾';
  });

/* ─────── 3.2. AUDIO + MUSIC TOGGLE ─────── */
document.getElementById('audioToggle')?.addEventListener('click', () => {
  G.audio.ensure();
  const on = G.audio.toggle();
  document.getElementById('audioToggle').textContent = on ? '🔊' : '🔇';
  showToast(on ? 'Âm thanh bật' : 'Âm thanh tắt');
});

document.getElementById('musicToggle')?.addEventListener('click', () => {
  G.audio.ensure();
  if (typeof G.audio.toggleMusic === 'function') {
    const on = G.audio.toggleMusic();
    document.getElementById('musicToggle').textContent = on ? '🎵' : '🔕';
    showToast(on ? 'Nhạc nền bật' : 'Nhạc nền tắt');
  } else {
    showToast('Nhạc nền chưa sẵn sàng — hãy tải lại trang');
  }
});

  /* ─────── 3.3. CAMERA MODE BUTTONS ─────── */
  document.querySelectorAll('[data-camera]').forEach(btn => {
    btn.addEventListener('click', () => setCameraMode(btn.dataset.camera));
  });

  /* ─────── 3.4. PIXEL QUALITY CYCLE ─────── */
  // 4 mức: Tắt (1) → Nhẹ (2) → Vừa (3) → Đậm (4)
  let pixelLevel = 2;
  const pixelLabels = ['Pixel: Tắt', 'Pixel: Nhẹ', 'Pixel: Vừa', 'Pixel: Đậm'];

  document.getElementById('qualityToggle')?.addEventListener('click', () => {
    pixelLevel = pixelLevel >= 4 ? 1 : pixelLevel + 1;

    if (G.setPixelFactor) G.setPixelFactor(pixelLevel);

    // Khi tắt pixel → tăng pixelRatio cho nét hơn
    if (pixelLevel === 1) {
      G.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      G.renderer.setPixelRatio(1);
    }
    G.renderer.setSize(window.innerWidth, window.innerHeight);

    const btn = document.getElementById('qualityToggle');
    btn.textContent = pixelLabels[pixelLevel - 1];
    showToast(pixelLabels[pixelLevel - 1]);
  });

  /* ─────── 3.5. TELEPORT ─────── */
  document.getElementById('tpCourt')?.addEventListener('click', () => {
    if (G.charState.bowing) return;
    if (G.charState.sitting) standUp();
    G.player.position.set(0, 0, 14);
    G.player.rotation.y = Math.PI;
    G.clickTargetPos = null;
    setCameraMode('third');
    showToast('Đã ra sân chùa');
  });

  document.getElementById('tpHall')?.addEventListener('click', () => {
    if (G.charState.bowing) return;
    if (G.charState.sitting) standUp();
    G.player.position.set(0, PLAT.y, -6);
    G.player.rotation.y = Math.PI;
    G.clickTargetPos = null;
    setCameraMode('third');
    showToast('Đã vào chánh điện');
  });

  /* ─────── 3.6. ACTION DOCK ─────── */
  document.getElementById('btnSit')?.addEventListener('click', () => {
    const r = handleSitToggle();
    if (r?.msg) showToast(r.msg);
  });

  document.getElementById('btnBow')?.addEventListener('click', () => {
    const r = startBow(1);
    if (!r.ok && r.msg) showToast(r.msg);
  });

  document.getElementById('btnMeditate')?.addEventListener('click', () => {
    if (G.meditationActive) return;
    if (!inTemple()) { showToast('Hãy vào chánh điện để thiền'); return; }
    document.getElementById('meditationModal').classList.add('show');
  });

  document.getElementById('btnChant')?.addEventListener('click', () => {
    if (G.chantActive) {
      closeChanting();
    } else {
      const r = openChanting();
      if (r && !r.ok && r.msg) showToast(r.msg);
    }
  });

  document.getElementById('btnIncense')?.addEventListener('click', () => {
    const r = lightIncense();
    if (r?.msg) showToast(r.msg);
  });

  document.getElementById('btnOffer')?.addEventListener('click', () => {
    if (!inTemple()) { showToast('Hãy vào chánh điện để dâng lễ'); return; }
    document.getElementById('offeringModal').classList.add('show');
  });

  /* ─────── 3.7. MEDITATION DURATIONS ─────── */
  document.querySelectorAll('[data-duration]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dur = parseInt(btn.dataset.duration, 10);
      startMeditation(dur, () => setCameraMode('first'));
    });
  });

  document.getElementById('medEndBtn')?.addEventListener('click', () => {
    const r = endMeditation(false);
    if (r?.msg) showToast(r.msg);
  });

  /* ─────── 3.8. CHANTING PANEL ─────── */
  document.getElementById('chantSelect')?.addEventListener('click', e => {
    const btn = e.target.closest('.chant-select-btn');
    if (!btn) return;
    document.querySelectorAll('.chant-select-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectChant(btn.dataset.chant);
  });

  document.getElementById('chantTapBtn')?.addEventListener('click', tapMo);
  document.getElementById('chantClose')?.addEventListener('click', closeChanting);

  /* ─────── 3.9. OFFERING ITEMS ─────── */
  document.querySelectorAll('[data-offering]').forEach(el => {
    el.addEventListener('click', () => {
      const r = offerItem(el.dataset.offering);
      if (r.ok) el.classList.add('offered');
      if (r.msg) showToast(r.msg);
    });
  });

  /* ─────── 3.10. MODAL CLOSE BUTTONS ─────── */
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.close)?.classList.remove('show');
    });
  });

  // Click backdrop để đóng modal
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('show');
    });
  });

  /* ─────── 3.11. KEYBOARD SHORTCUTS ─────── */
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();

    // E — ngồi / đứng
    if (k === 'e') {
      e.preventDefault();
      const r = handleSitToggle();
      if (r?.msg) showToast(r.msg);
    }

    // Space — gõ mõ
    if (k === ' ') {
      e.preventDefault();
      G.audio.ensure();
      if (G.charState.sitting || inTemple()) {
        tapMo();
      } else {
        showToast('Hãy vào chánh điện để gõ mõ');
      }
    }
  });

  /* ─────── 3.12. MOUSE-LOOK (first-person) ─────── */
  G.renderer.domElement.addEventListener('mousedown', e => {
    if (G.cameraMode === 'first' && e.button === 0) fpDragging = true;
  });

  window.addEventListener('mouseup', () => { fpDragging = false; });

  window.addEventListener('mousemove', e => {
    if (fpDragging && G.cameraMode === 'first') {
      fpState.yaw -= e.movementX * 0.003;
      fpState.pitch -= e.movementY * 0.003;
      // Clamp pitch để không lật đầu
      fpState.pitch = Math.max(-1.2, Math.min(1.2, fpState.pitch));
    }
  });

  /* ─────── 3.13. CLICK-TO-MOVE ─────── */
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  G.renderer.domElement.addEventListener('click', e => {
    if (G.cameraMode === 'first' || e.button !== 0) return;
    if (e.target !== G.renderer.domElement) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, G.camera);

    // Raycast vào mặt phẳng ngang y=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(plane, intersect)) {
      if (!G.charState.sitting && !G.charState.bowing) {
        G.clickTargetPos = intersect.clone();
        G.clickTargetPos.y = 0;
      }
    }
  });

  /* ─────── 3.14. RESIZE ─────── */
  window.addEventListener('resize', () => {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
    // Pixel RT được setup lại trong main.js thông qua setPixelFactor
    if (G.setPixelFactor && G.getPixelFactor) {
      G.setPixelFactor(G.getPixelFactor());
    }
  });

  /* ─────── 3.15. INIT AUDIO ON FIRST INTERACTION ─────── */
  const initAudioOnce = () => {
    G.audio.ensure();
    document.removeEventListener('click', initAudioOnce);
    document.removeEventListener('keydown', initAudioOnce);
  };
  document.addEventListener('click', initAudioOnce);
  document.addEventListener('keydown', initAudioOnce);
}

/* ═══════════════════════════════════════════════════════════
   4. INTERACTION PROMPT (bottom center)
   ═══════════════════════════════════════════════════════════ */
let promptVisible = false;
let lastPromptHTML = '';

export function updatePrompt() {
  const promptEl = document.getElementById('prompt');
  if (!promptEl) return;

  // Ẩn khi đang lạy hoặc thiền
  if (G.charState.bowing || G.meditationActive) {
    if (promptVisible) {
      promptEl.classList.remove('show');
      promptVisible = false;
    }
    return;
  }

  let html = '';

  if (G.charState.sitting) {
    // Đang ngồi — gợi ý đứng dậy
    html = `Nhấn <span class="kbd">E</span> để đứng dậy`;
  } else {
    // Tìm bồ đoàn trống gần nhất
    let nearest = -1;
    let bestDist = Infinity;

    for (let i = 0; i < G.cushions.length; i++) {
      if (G.cushions[i].occupied) continue;
      const dx = G.cushions[i].position.x - G.player.position.x;
      const dz = G.cushions[i].position.z - G.player.position.z;
      const d = Math.hypot(dx, dz);
      if (d < bestDist) {
        bestDist = d;
        nearest = i;
      }
    }

    if (nearest >= 0 && bestDist < 1.8) {
      html = `Nhấn <span class="kbd">E</span> để ngồi thiền trên bồ đoàn`;
    }
  }

  // Cập nhật DOM chỉ khi thay đổi (tránh reflow)
  if (html) {
    if (lastPromptHTML !== html) {
      promptEl.innerHTML = html;
      lastPromptHTML = html;
    }
    if (!promptVisible) {
      promptEl.classList.add('show');
      promptVisible = true;
    }
  } else if (promptVisible) {
    promptEl.classList.remove('show');
    promptVisible = false;
  }
}