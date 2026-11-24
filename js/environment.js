import * as THREE from 'three';
import { G } from './state.js';

export const EnvironmentManager = {
  sunLight: null,
  hemiLight: null,
  rainSystem: null,
  currentWeather: 'sunny',
  skyColor: new THREE.Color(),

  init() {
    G.scene.children.forEach(child => {
      if (child.isDirectionalLight && child.castShadow) this.sunLight = child;
      if (child.isHemisphereLight) this.hemiLight = child;
    });
    this.createRain();
    this.updateRealTime();
    setInterval(() => this.updateRealTime(), 60000); // Cập nhật mỗi phút
  },

  updateRealTime() {
    const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Singapore" });
    const date = new Date(dateStr);
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Tính toán góc mặt trời
    const timeInRadians = ((hour + minute / 60) - 6) / 12 * Math.PI;
    const sunHeight = Math.sin(timeInRadians);
    
    if (this.sunLight) {
      this.sunLight.position.set(Math.cos(timeInRadians) * 50, sunHeight * 50, Math.sin(timeInRadians) * 20);
      this.sunLight.intensity = Math.max(0, sunHeight * 1.5);
      this.sunLight.color.setHSL(0.1, 0.5, Math.max(0.5, sunHeight));
    }
    if (this.hemiLight) this.hemiLight.intensity = 0.2 + Math.max(0, sunHeight * 0.8);

    // Bầu trời
    if (sunHeight > 0) {
      const dayColor = new THREE.Color(0x87ceeb);
      const sunsetColor = new THREE.Color(0xffa07a);
      this.skyColor.lerpColors(sunsetColor, dayColor, Math.min(1, sunHeight * 2));
    } else {
      this.skyColor.setHex(0x0a1a2a); // Ban đêm
    }
    G.scene.background = this.skyColor;

    // Thuật toán thời tiết (Đồng bộ cho mọi người chơi)
    const dateSeed = date.getFullYear() + date.getMonth() * 31 + date.getDate() + Math.floor(hour / 4);
    const weatherRoll = dateSeed % 10;

    if (weatherRoll < 2) this.currentWeather = 'rainy';
    else if (weatherRoll < 4) this.currentWeather = 'cloudy';
    else this.currentWeather = 'sunny';

    // Hiệu ứng mưa
    if (this.rainSystem) {
      this.rainSystem.visible = (this.currentWeather === 'rainy');
      if (this.rainSystem.visible) {
        if (this.sunLight) this.sunLight.intensity *= 0.3;
        G.scene.background = new THREE.Color(0x445566);
      }
    }

    // Cập nhật UI HUD
    const wText = this.currentWeather === 'rainy' ? '🌧️ Mưa' : (this.currentWeather === 'cloudy' ? '☁️ Mây' : '☀️ Nắng');
    const hDisplay = hour < 10 ? '0'+hour : hour;
    const mDisplay = minute < 10 ? '0'+minute : minute;
    const hud = document.getElementById('weatherDisplay');
    if (hud) hud.innerText = `${wText} | 🇸🇬 ${hDisplay}:${mDisplay}`;
  },

  createRain() {
    const rainCount = 5000;
    const positions = new Float32Array(rainCount * 3);
    const velocities = [];

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      velocities.push(0.5 + Math.random() * 0.5);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.2, transparent: true, opacity: 0.6 });

    this.rainSystem = new THREE.Points(geo, mat);
    this.rainSystem.visible = false;
    G.scene.add(this.rainSystem);
    this.rainSystem.userData.velocities = velocities;
  },

  update(dt) {
    if (this.currentWeather === 'rainy' && this.rainSystem) {
      const positions = this.rainSystem.geometry.attributes.position.array;
      const velocities = this.rainSystem.userData.velocities;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= velocities[i] * dt * 30;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 40 + Math.random() * 10;
          // Mưa luôn rơi xung quanh vị trí người chơi
          positions[i * 3] = G.player.position.x + (Math.random() - 0.5) * 80; 
          positions[i * 3 + 2] = G.player.position.z + (Math.random() - 0.5) * 80;
        }
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }
  }
};