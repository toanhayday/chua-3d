import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { G, PLAT } from './state.js';
import { AudioManager } from './audio-v2.js';
import { buildWorld, updateFish } from './world.js';
import { initPokemons, updatePokemons } from './pokemon.js';
import { createCharacter, bindKeyboard, updateMovement, updateCharacterAnim, updateBowAnimation } from './character.js';
import * as rituals from './rituals.js';
import { bindUI, setCameraMode, updatePrompt, fpState, showToast } from './ui.js';

function init() {
  // RENDERER
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

  // SCENE
  G.scene = new THREE.Scene();
  G.scene.background = new THREE.Color(0xf4e4cc);

  // CAMERA
  G.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  G.camera.position.set(0, 4, 14);

  // LIGHTS
  G.scene.add(new THREE.HemisphereLight(0xfff0d0, 0xc8b090, 1.0));

  var sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
  sun.position.set(18, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  G.scene.add(sun);

  var fill = new THREE.DirectionalLight(0xb8d0f0, 0.3);
  fill.position.set(-14, 10, -16);
  G.scene.add(fill);

  var warm = new THREE.PointLight(0xffdd88, 0.5, 20);
  warm.position.set(0, 3, -12);
  G.scene.add(warm);

  var rim = new THREE.DirectionalLight(0xfff0d0, 0.25);
  rim.position.set(-8, 12, -20);
  G.scene.add(rim);

  // CONTROLS
  G.controls = new OrbitControls(G.camera, G.renderer.domElement);
  G.controls.enableDamping = true;
  G.controls.dampingFactor = 0.08;
  G.controls.minDistance = 2;
  G.controls.maxDistance = 24;
  G.controls.maxPolarAngle = Math.PI * 0.48;
  G.controls.enablePan = false;
  G.controls.target.set(0, 0.9, 0);

  // AUDIO
  G.audio = new AudioManager();
// ═══════════════════════════════════════════════════════════════
// RUNTIME PATCH: Kiểm tra và vá audio nếu file cũ được load
// ═══════════════════════════════════════════════════════════════
(function patchAudio() {
  var methods = Object.getOwnPropertyNames(Object.getPrototypeOf(G.audio));
  console.log('🔍 Các hàm audio hiện có:', methods.join(', '));

  if (typeof G.audio.startMusic === 'function' &&
      typeof G.audio.toggleMusic === 'function' &&
      typeof G.audio.stopMusic === 'function') {
    console.log('✅ audio.js đã đúng phiên bản mới');
    return;
  }

  console.warn('⚠️ audio.js cũ! Đang áp dụng bản vá runtime...');

  // Tạo musicGain nếu chưa có
  if (!G.audio.musicGain && G.audio.ctx) {
    G.audio.musicGain = G.audio.ctx.createGain();
    G.audio.musicGain.gain.value = 0.35;
    G.audio.musicGain.connect(G.audio.masterGain);
  }

  // State mặc định
  if (G.audio.musicPlaying === undefined) G.audio.musicPlaying = false;
  if (G.audio.musicInterval === undefined) G.audio.musicInterval = null;
  if (G.audio.musicNotes === undefined) {
    G.audio.musicNotes = [220.00, 261.63, 293.66, 329.63, 392.00, 220.00, 174.61, 196.00, 220.00, 261.63];
  }
  if (G.audio.musicNoteIdx === undefined) G.audio.musicNoteIdx = 0;

  // Hàm phát 1 nốt sáo
  G.audio._playFluteNote = function (freq, volScale) {
    volScale = volScale || 1;
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;
    var now = this.ctx.currentTime;
    var duration = 2.8;

    var osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    var osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    var osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = 0.15;

    var lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4.5;
    var lfoGain = this.ctx.createGain();
    lfoGain.gain.value = freq * 0.006;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.connect(lfoGain).connect(osc2.frequency);

    var envGain = this.ctx.createGain();
    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(0.09 * volScale, now + 0.35);
    envGain.gain.linearRampToValueAtTime(0.06 * volScale, now + 1.5);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    var delay = this.ctx.createDelay(1.5);
    delay.delayTime.value = 0.55;
    var feedback = this.ctx.createGain();
    feedback.gain.value = 0.35;
    var wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.4;

    osc.connect(osc2Gain).connect(envGain);
    osc2.connect(envGain);
    envGain.connect(this.musicGain);
    envGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain).connect(this.musicGain);

    osc.start(now); osc2.start(now); lfo.start(now);
    osc.stop(now + duration); osc2.stop(now + duration); lfo.stop(now + duration);
  };

  // Hàm bắt đầu nhạc
  G.audio.startMusic = function () {
    this.ensure();
    if (!this.ctx) return;
    if (this.musicPlaying) return;

    // Tạo musicGain nếu chưa có
    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);
    }

    this.musicPlaying = true;
    var self = this;
    var scheduleNext = function () {
      if (!self.musicPlaying) return;
      var freq = self.musicNotes[self.musicNoteIdx % self.musicNotes.length];
      self.musicNoteIdx++;
      self._playFluteNote(freq);
      if (Math.random() < 0.3) self._playFluteNote(freq * 1.5, 0.4);
      self.musicInterval = setTimeout(scheduleNext, 1800 + Math.random() * 700);
    };
    this.musicInterval = setTimeout(scheduleNext, 1000);
    console.log('🎵 Nhạc nền đã bắt đầu');
  };

  // Hàm dừng nhạc
  G.audio.stopMusic = function () {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  };

  // Hàm bật/tắt nhạc
  G.audio.toggleMusic = function () {
    if (this.musicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  };

  console.log('✅ Đã vá xong. Các hàm audio hiện có:',
    Object.getOwnPropertyNames(Object.getPrototypeOf(G.audio)).join(', '));
})();

  // WORLD + CHARACTER
  buildWorld();
  createCharacter();
  bindKeyboard();
  initPokemons(); // Gọi khởi tạo Pokémon

  // UI
  bindUI(rituals);
  setCameraMode('third');

  // PIXELATION
  var pixelFactor = 2;
  var pixelEnabled = true;
  var pixelRT = null;
  var quadScene = null;
  var quadCam = null;
  var quadMesh = null;

  function setupPixelation() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (pixelRT) pixelRT.dispose();

    pixelRT = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(w / pixelFactor)),
      Math.max(1, Math.floor(h / pixelFactor)),
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        depthBuffer: true,
        stencilBuffer: false
      }
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

  G.setPixelFactor = function (f) {
    pixelFactor = f;
    pixelEnabled = f > 1;
    if (pixelEnabled) setupPixelation();
  };
  G.getPixelFactor = function () { return pixelFactor; };

  // HALO CACHE
  var haloMaterials = [];
  if (G.buddha) {
    G.buddha.children.forEach(function (c) {
      if (c.userData && c.userData.isHalo) haloMaterials.push(c.material);
    });
  }

  // MAIN LOOP
  var clock = new THREE.Clock();
  var frameCount = 0;
  var shadowTimer = 0;
  var lastShadowPos = new THREE.Vector3().copy(G.player.position);
  var fpsAccum = 0;
  var fpsFrames = 0;

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var elapsed = clock.elapsedTime;
    frameCount++;

    updateMovement(dt, G.cameraMode, fpState.yaw);
    updateCharacterAnim(dt);
    updateBowAnimation(dt);

    shadowTimer += dt;
    if (shadowTimer > 0.15) {
      shadowTimer = 0;
      if (G.player.position.distanceToSquared(lastShadowPos) > 0.01) {
        G.renderer.shadowMap.needsUpdate = true;
        lastShadowPos.copy(G.player.position);
      }
    }

    if (frameCount % 6 === 0) {
      for (var i = 0; i < G.candleFlames.length; i++) {
        var f = G.candleFlames[i];
        var fl = 0.85 + Math.sin(elapsed * 12 + f.base) * 0.1;
        f.flame.scale.set(0.7 * fl, 1.5 * fl, 0.7 * fl);
      }
    }

    if (frameCount % 6 === 0) {
      for (var j = 0; j < G.pondWaters.length; j++) {
        var wtr = G.pondWaters[j];
        if (wtr && wtr.material) {
          wtr.material.opacity = 0.86 + Math.sin(elapsed * 1.5) * 0.03;
        }
      }
    }
// Fish animation (mỗi frame — cần mượt)
updateFish(dt, elapsed);
    // Pokémon animation (mỗi frame)
    updatePokemons(dt, elapsed);

    if (frameCount % 6 === 0 && haloMaterials.length) {
      var pulse = Math.sin(elapsed * 0.8);
      if (haloMaterials[0]) haloMaterials[0].opacity = 0.42 + pulse * 0.08;
      if (haloMaterials[1]) haloMaterials[1].opacity = 0.18 + pulse * 0.05;
    }

    for (var k = 0; k < G.smokeSystems.length; k++) {
      G.smokeSystems[k].update(dt);
    }

    if (frameCount % 6 === 0) updatePrompt();

    if (G.cameraMode === 'third') {
      var tgt = G.player.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      G.controls.target.lerp(tgt, Math.min(1, dt * 8));
      G.controls.update();
    } else if (G.cameraMode === 'overview') {
      G.controls.update();
    } else if (G.cameraMode === 'first') {
      var head = G.player.position.clone().add(new THREE.Vector3(0, 1.05, 0));
      G.camera.position.copy(head);
      var dir = new THREE.Vector3(
        -Math.sin(fpState.yaw) * Math.cos(fpState.pitch),
        Math.sin(fpState.pitch),
        -Math.cos(fpState.yaw) * Math.cos(fpState.pitch)
      );
      G.camera.lookAt(head.clone().add(dir));
      G.player.rotation.y = fpState.yaw;
    }

    if (pixelEnabled && pixelRT) {
      G.renderer.setRenderTarget(pixelRT);
      G.renderer.render(G.scene, G.camera);
      G.renderer.setRenderTarget(null);
      G.renderer.render(quadScene, quadCam);
    } else {
      G.renderer.render(G.scene, G.camera);
    }

    fpsAccum += dt;
    fpsFrames++;
    if (fpsAccum >= 0.5) {
      var fps = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0;
      fpsFrames = 0;
      var el = document.getElementById('fps-counter');
      if (el) {
        el.textContent = fps + ' FPS - Pixel ' + pixelFactor + 'x';
        el.style.color = fps >= 50 ? '#0f0' : (fps >= 30 ? '#ff0' : '#f44');
      }
    }

    if (frameCount === 5) {
      var loadEl = document.getElementById('loading');
      if (loadEl) {
        loadEl.classList.add('done');
        setTimeout(function () { if (loadEl.parentNode) loadEl.remove(); }, 900);
      }
      window.__gameBooted = true;
    }
  }

  // FPS counter element
  var fpsEl = document.createElement('div');
  fpsEl.id = 'fps-counter';
  fpsEl.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:999;background:rgba(60,40,20,0.7);color:#0f0;font:600 11px monospace;padding:5px 10px;border-radius:6px;pointer-events:none;border:2px solid #8b6f47;';
  fpsEl.textContent = '...';
  document.body.appendChild(fpsEl);

  window.addEventListener('resize', function () {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
    if (pixelEnabled) setupPixelation();
  });

  animate();
// ═══════ START BACKGROUND MUSIC ═══════
// Nhạc chỉ được phát sau khi user click (browser autoplay policy)
var startMusicOnce = function () {
  G.audio.ensure();
  G.audio.startMusic();
  document.removeEventListener('click', startMusicOnce);
  document.removeEventListener('keydown', startMusicOnce);
};
document.addEventListener('click', startMusicOnce);
document.addEventListener('keydown', startMusicOnce);
  setTimeout(function () { showToast('Khong gian chua - Soft Clay Edition'); }, 2500);
}

init();