import * as THREE from 'three';

/* ═══════════ TOON MATERIAL ═══════════ */
let _toonGrad = null;
export function getToonGradient() {
  if (_toonGrad) return _toonGrad;
  // 3-step gradient: shadow / mid / highlight
  const data = new Uint8Array([90, 170, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  _toonGrad = tex;
  return tex;
}

export function toonMat(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradient(),
    ...opts
  });
}

/* ═══════════ OUTLINE (inverted hull) ═══════════ */
export function addOutline(mesh, opts = {}) {
  const color = opts.color ?? 0x3a2010;
  const thickness = opts.thickness ?? 0.025;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      outlineColor: { value: new THREE.Color(color) },
      outlineThickness: { value: thickness }
    },
    vertexShader: `
      uniform float outlineThickness;
      void main() {
        vec3 pos = position + normal * outlineThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      void main() { gl_FragColor = vec4(outlineColor, 1.0); }
    `,
    side: THREE.BackSide
  });

  const outline = new THREE.Mesh(mesh.geometry, mat);
  mesh.add(outline);
  return outline;
}

/* ═══════════ PIXEL TEXTURES ═══════════ */
export function makePixelTileTexture(baseHex, lineHex, gridSize = 4, res = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = res;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#' + new THREE.Color(baseHex).getHexString();
  ctx.fillRect(0, 0, res, res);

  // chunky noise
  const img = ctx.getImageData(0, 0, res, res);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 20;
    img.data[i]     = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // grid
  ctx.strokeStyle = '#' + new THREE.Color(lineHex).getHexString();
  ctx.lineWidth = 2;
  const cell = res / gridSize;
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, res); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(res, i * cell); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  return tex;
}

export function makePixelWoodTexture(baseHex, res = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = res;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(baseHex);

  ctx.fillStyle = '#' + base.getHexString();
  ctx.fillRect(0, 0, res, res);

  // chunky grain stripes
  for (let i = 0; i < 10; i++) {
    const darker = base.clone().multiplyScalar(0.72 + Math.random() * 0.2);
    ctx.fillStyle = '#' + darker.getHexString();
    const y = Math.floor(Math.random() * res);
    const h = 1 + Math.floor(Math.random() * 3);
    ctx.fillRect(0, y, res, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  return tex;
}

/* ═══════════ MATH HELPERS ═══════════ */
export function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export function smoothstep(t) { return t * t * (3 - 2 * t); }

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}