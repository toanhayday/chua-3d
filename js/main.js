/**
 * main.js - Khởi tạo toàn bộ game (Chùa 3D + Nông trại + Multiplayer)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Core Systems
import { G, PLAT } from './state.js';
import { AudioManager } from './audio-v2.js';
import { buildWorld } from './world.js';
import { createCharacter, bindKeyboard, updateMovement, updateCharacterAnim, updateBowAnimation } from './character.js';
import * as rituals from './rituals.js';
import { bindUI, setCameraMode, updatePrompt, fpState, showToast } from './ui.js';

// Extra Systems
import { initPokemons, updatePokemons } from './pokemon.js';
import { initMultiplayer, updateMultiplayer } from './multiplayer.js';
import { updateFish } from './world.js'; 

// Harvest Moon Systems
import { EventBus } from './events.js';
import { TimeManager } from './time.js';
import { InventoryManager } from './inventory.js';
import { FarmManager } from './farm.js';
import { initFarmUI } from './farm-ui.js';
import { initMobileControls } from './mobile.js';

function init() {
  /* ═══════ RENDERER ═══════ */
  G.renderer = new THREE.WebGLRenderer({
    antialias: false,      
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance'
  });
  G.renderer.setSize(window.innerWidth, window.innerHeight);
  G.renderer.setPixelRatio(1);           
  G.renderer.shadowMap.enabled = true;
  G.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  G.renderer.shadowMap.autoUpdate = false;
  G.renderer.shadowMap.needsUpdate = true;
  G.renderer.toneMapping = THREE.NoToneMapping;  
  G.renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(G.renderer.domElement);

  /* ═══════ SCENE & CAMERA ═══════ */
  G.scene = new THREE.Scene();
  G.scene.background = new THREE.Color(0xf4e4cc);

  G.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  G.camera.position.set(0, 4, 14);

  /* ═══════ LIGHTS ═══════ */
  G.scene.add(new THREE.HemisphereLight(0xfff0d0, 0xc8b090, 1.0));

  const sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
  sun.position.set(18, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  G.scene.add(sun);

  const fill = new THREE.DirectionalLight(0xb8d0f0, 0.3);
  fill.position.set(-14, 10, -16);
  G.scene.add(fill);

  const warm = new THREE.PointLight(0xffdd88, 0.5, 20);
  warm.position.set(0, 3, -12);
  G.scene.add(warm);

  const rim = new THREE.DirectionalLight(0xfff0d0, 0.25);
  rim.position.set(-8, 12, -20);
  G.scene.add(rim);

  /* ═══════ CONTROLS ═══════ */
  G.controls = new OrbitControls(G.camera, G.renderer.domElement);
  G.controls.enableDamping = true;
  G.controls.dampingFactor = 0.08;
  G.controls.minDistance = 2;
  G.controls.maxDistance = 30;
  G.controls.maxPolarAngle = Math.PI * 0.48;
  G.controls.enablePan = false;
  G.controls.target.set(0, 0.9, 0);

  /* ═══════ KHỞI TẠO HỆ THỐNG ═══════ */
  G.audio = new AudioManager();
  
  buildWorld();
  createCharacter();
  bindKeyboard();
initMobileControls(); // <-- Thêm dòng này
  bindUI(rituals);

  // Nông trại
  InventoryManager.init();
  FarmManager.init();
  initFarmUI();

  // Thành phần phụ
  initPokemons();
  initMultiplayer();
  setCameraMode('third');

  /* ═══════ PIXELATION PIPELINE ═══════ */
  let pixelFactor = 2;    
  let pixelEnabled = true;
  let pixelRT = null;
  let quadScene = null, quadCam = null, quadMesh = null;

  function setupPixelation() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (pixelRT) pixelRT.dispose();

    pixelRT = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(w / pixelFactor)),
      Math.max(1, Math.floor(h / pixelFactor)),
      { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false }
    );
    pixelRT.texture.colorSpace = THREE.SRGBColorSpace;

    if (!quadScene) {
      quadScene = new THREE.Scene();
      quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      quadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: pixelRT.texture, toneMapped: false })
      );
      quadScene.add(quadMesh);
    } else {
      quadMesh.material.map = pixelRT.texture;
      quadMesh.material.needsUpdate = true;
    }
  }
  setupPixelation();

  G.setPixelFactor = (f) => { pixelFactor = f; pixelEnabled = f > 1; if (pixelEnabled) setupPixelation(); };
  G.getPixelFactor = () => pixelFactor;

  /* ═══════ TƯƠNG TÁC NÔNG TRẠI (CLICK VÀO ĐẤT) ═══════ */
  const farmRaycaster = new THREE.Raycaster();
  const farmMouse = new THREE.Vector2();

  G.renderer.domElement.addEventListener('click', (e) => {
    if (G.cameraMode === 'first' || e.button !== 0) return;
    
    // Nếu đang trong UI thì bỏ qua
    if (e.target !== G.renderer.domElement) return;

    farmMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    farmMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    farmRaycaster.setFromCamera(farmMouse, G.camera);

    // Quét va chạm với các ô đất
    const farmMeshes = FarmManager.meshes.flat();
    if (farmMeshes.length > 0) {
      const intersects = farmRaycaster.intersectObjects(farmMeshes);
      if (intersects.length > 0) {
        // Ngăn không cho nhân vật đi bộ tới điểm này
        e.stopImmediatePropagation(); 
        
        const hitMesh = intersects[0].object;
        const currentItem = InventoryManager.getSelectedItem();
        FarmManager.interactWithTile(hitMesh, currentItem);
        return;
      }
    }
  }, true); // Dùng capture phase để chạy trước sự kiện click của ui.js

  /* ═══════ PHÍM TẮT NÔNG TRẠI (1, 2, 3, Z) ═══════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === '1') InventoryManager.selectSlot(0);
    if (e.key === '2') InventoryManager.selectSlot(1);
    if (e.key === '3') InventoryManager.selectSlot(2);
    
    // Phím Z để đi ngủ
    if (e.key.toLowerCase() === 'z') {
      if (!TimeManager.isSleeping) {
        G.audio.bell();
        TimeManager.sleep();
      }
    }
  });

  /* ═══════ CACHE HALO MATERIALS ═══════ */
  const haloMaterials = [];
  if (G.buddha) {
    G.buddha.children.forEach(c => {
      if (c.userData?.isHalo) haloMaterials.push(c.material);
    });
  }

  /* ═══════ MAIN LOOP ═══════ */
  const clock = new THREE.Clock();
  let frameCount = 0;
  let shadowTimer = 0;
  const lastShadowPos = new THREE.Vector3().copy(G.player.position);
  let fpsAccum = 0, fpsFrames = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    frameCount++;

    // 1. Cập nhật hệ thống cốt lõi
    TimeManager.update(dt);
    updateMovement(dt, G.cameraMode, fpState.yaw);
    updateCharacterAnim(dt);
    updateBowAnimation(dt);

    // 2. Cập nhật sinh vật & môi trường
    updatePokemons(dt, elapsed);
    updateMultiplayer(dt, elapsed);
    updateFish(dt, elapsed);

    // 3. Shadow throttle
    shadowTimer += dt;
    if (shadowTimer > 0.15) {
      shadowTimer = 0;
      if (G.player.position.distanceToSquared(lastShadowPos) > 0.01) {
        G.renderer.shadowMap.needsUpdate = true;
        lastShadowPos.copy(G.player.position);
      }
    }

    // 4. Hiệu ứng phụ (10 fps)
    if (frameCount % 6 === 0) {
      for (const f of G.candleFlames) {
        const fl = 0.85 + Math.sin(elapsed * 12 + f.base) * 0.1;
        f.flame.scale.set(0.7 * fl, 1.5 * fl, 0.7 * fl);
      }
      for (const w of G.pondWaters) {
        if (w?.material) w.material.opacity = 0.86 + Math.sin(elapsed * 1.5) * 0.03;
      }
      if (haloMaterials.length) {
        const pulse = Math.sin(elapsed * 0.8);
        if (haloMaterials[0]) haloMaterials[0].opacity = 0.42 + pulse * 0.08;
        if (haloMaterials[1]) haloMaterials[1].opacity = 0.18 + pulse * 0.05;
      }
    }

    for (const s of G.smokeSystems) s.update(dt);
    if (frameCount % 6 === 0) updatePrompt();

    // 5. Cập nhật Camera
    if (G.cameraMode === 'third') {
      const tgt = G.player.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      G.controls.target.lerp(tgt, Math.min(1, dt * 8));
      G.controls.update();
    } else if (G.cameraMode === 'overview') {
      G.controls.update();
    } else if (G.cameraMode === 'first') {
      const head = G.player.position.clone().add(new THREE.Vector3(0, 1.05, 0));
      G.camera.position.copy(head);
      const dir = new THREE.Vector3(
        -Math.sin(fpState.yaw) * Math.cos(fpState.pitch),
        Math.sin(fpState.pitch),
        -Math.cos(fpState.yaw) * Math.cos(fpState.pitch)
      );
      G.camera.lookAt(head.clone().add(dir));
      G.player.rotation.y = fpState.yaw;
    }

    // 6. Render (với Pixelation)
    if (pixelEnabled && pixelRT) {
      G.renderer.setRenderTarget(pixelRT);
      G.renderer.render(G.scene, G.camera);
      G.renderer.setRenderTarget(null);
      G.renderer.render(quadScene, quadCam);
    } else {
      G.renderer.render(G.scene, G.camera);
    }

    // 7. FPS
    fpsAccum += dt; fpsFrames++;
    if (fpsAccum >= 0.5) {
      const fps = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0; fpsFrames = 0;
      const el = document.getElementById('fps-counter');
      if (el) {
        el.textContent = `${fps} FPS · ${pixelFactor}x pixel`;
        el.style.color = fps >= 50 ? '#0f0' : fps >= 30 ? '#ff0' : '#f44';
      }
    }

    if (frameCount === 5) {
      const el = document.getElementById('loading');
      if (el) {
        el.classList.add('done');
        setTimeout(() => el.remove(), 900);
      }
      window.__gameBooted = true;
    }
  }

  // Tạo FPS counter
  const fpsEl = document.createElement('div');
  fpsEl.id = 'fps-counter';
  fpsEl.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:999;background:rgba(60,40,20,0.7);color:#0f0;font:600 11px monospace;padding:5px 10px;border-radius:6px;pointer-events:none;border:2px solid #8b6f47;';
  fpsEl.textContent = '...';
  document.body.appendChild(fpsEl);

  // Xử lý Resize
  window.addEventListener('resize', () => {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
    if (pixelEnabled) setupPixelation();
  });

  // Hiệu ứng chuyển cảnh khi ngủ (Fade đen)
  const fadeOverlay = document.createElement('div');
  fadeOverlay.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 1s ease;z-index:9999;';
  document.body.appendChild(fadeOverlay);

  EventBus.on('OnSleepStart', () => { fadeOverlay.style.opacity = '1'; });
  EventBus.on('OnSleepEnd', () => { 
    fadeOverlay.style.opacity = '0'; 
    showToast('Ngày mới bắt đầu!'); 
    G.audio.bell(); 
  });
  EventBus.on('OnPassOut', () => { showToast('Bạn đã ngất xỉu vì kiệt sức...'); });

  animate();
  setTimeout(() => showToast('Chào mừng đến Nông Trại Tịnh Tâm!'), 2500);
}

init();