/**
 * multiplayer.js - Đồng bộ vị trí, hành động và thời gian
 */
import * as THREE from 'three';
import { G } from './state.js';
import { EventBus } from './events.js';
import { TimeManager } from './time.js'; // Import trực tiếp để lấy thông tin ngày

let ws;
let myId = null;
let isReconnecting = false;
const remotePlayers = {};

export function initMultiplayer() {
  try {
    // 1. Tự động nhận diện giao thức (ws cho local, wss cho server HTTPS)
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    ws = new WebSocket(`${protocol}${window.location.host}`);

    ws.onopen = () => { 
      console.log('🔗 Đã kết nối Server Multiplayer'); 
      isReconnecting = false;
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'init') {
        myId = msg.id;
        // Xóa hết người chơi cũ (nếu có) trước khi nhận danh sách mới
        for (const id in remotePlayers) {
          G.scene.remove(remotePlayers[id]);
          delete remotePlayers[id];
        }
        
        for (const id in msg.players) {
          if (id !== myId) createRemotePlayer(id, msg.players[id]);
        }
        // Đồng bộ lại thời gian và nông trại từ server
        if (msg.worldState) {
          EventBus.emit('SyncWorldState', msg.worldState);
        }
      } 
      else if (msg.type === 'playerJoined') {
        createRemotePlayer(msg.id, msg.data);
      } 
      else if (msg.type === 'update') {
        if (remotePlayers[msg.id]) {
          const p = remotePlayers[msg.id];
          p.userData.targetPos.set(msg.data.x, msg.data.y, msg.data.z);
          p.userData.targetRotY = msg.data.rotY;
          p.userData.state = msg.data.state;
        }
      } 
      else if (msg.type === 'playerLeft') {
        if (remotePlayers[msg.id]) {
          G.scene.remove(remotePlayers[msg.id]);
          delete remotePlayers[msg.id];
        }
      }
      else if (msg.type === 'farm_action') {
        EventBus.emit('RemoteFarmAction', msg);
      }
      else if (msg.type === 'time_update') {
        EventBus.emit('RemoteTimeUpdate', msg.time);
      }
    };

    // 2. Xử lý khi mất kết nối (Tự động thử lại sau 3 giây)
    ws.onclose = () => {
      if (!isReconnecting) {
        console.warn('⚠️ Mất kết nối Server. Đang thử lại sau 3 giây...');
        isReconnecting = true;
        setTimeout(initMultiplayer, 3000);
      }
    };

    ws.onerror = () => {
      // Không log lỗi quá nhiều để tránh spam console
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    // 3. Lắng nghe hành động của BẢN THÂN để gửi lên Server
    EventBus.on('LocalFarmAction', (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'farm_action', x: data.x, z: data.z, state: data.state }));
      }
    });
    
    EventBus.on('LocalSleep', () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Lấy thông tin ngày từ TimeManager thay vì G
        ws.send(JSON.stringify({ 
          type: 'time_update', 
          time: { hour: 6, minute: 0, day: TimeManager.day + 1, season: TimeManager.season } 
        }));
      }
    });

  } catch (e) {
    console.warn('Multiplayer disabled.', e);
  }
}

function createRemotePlayer(id, data) {
  const clone = G.player.clone();
  clone.position.set(data.x, data.y, data.z);
  clone.rotation.y = data.rotY;
  
  // Đảm bảo người chơi khác không có hiệu ứng nhấp nháy do shadow
  clone.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = false; 
    }
  });

  clone.userData = {
    targetPos: new THREE.Vector3(data.x, data.y, data.z),
    targetRotY: data.rotY,
    state: data.state
  };
  
  G.scene.add(clone);
  remotePlayers[id] = clone;
}

export function updateMultiplayer(dt, elapsed) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // Gửi vị trí của mình lên server (khoảng 15 lần/giây để tránh nghẽn mạng)
  if (Math.floor(elapsed * 15) % 2 === 0) {
    let state = 'idle';
    if (G.charState.sitting) state = 'sit';
    else if (G.charState.bowing) state = 'bow';
    else if (G.charState.walking) state = 'walk';

    ws.send(JSON.stringify({
      type: 'update',
      data: { x: G.player.position.x, y: G.player.position.y, z: G.player.position.z, rotY: G.player.rotation.y, state: state }
    }));
  }

  const lerpFactor = Math.min(1, dt * 15);
  
  for (const id in remotePlayers) {
    const p = remotePlayers[id];
    p.position.lerp(p.userData.targetPos, lerpFactor);
    
    // Xoay mượt mà
    let diff = p.userData.targetRotY - p.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.rotation.y += diff * lerpFactor;

    // Animation cơ bản cho người chơi khác
    if (p.userData.state === 'walk') {
      p.position.y = p.userData.targetPos.y + Math.abs(Math.sin(elapsed * 10)) * 0.05;
      p.scale.y = THREE.MathUtils.lerp(p.scale.y, 1, lerpFactor);
    } else if (p.userData.state === 'sit') {
      p.scale.y = THREE.MathUtils.lerp(p.scale.y, 0.7, lerpFactor);
      p.position.y = THREE.MathUtils.lerp(p.position.y, p.userData.targetPos.y - 0.2, lerpFactor);
    } else {
      p.position.y = p.userData.targetPos.y;
      p.scale.y = THREE.MathUtils.lerp(p.scale.y, 1, lerpFactor);
    }
  }
}