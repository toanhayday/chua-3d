import * as THREE from 'three';
import { G } from './state.js';
import { EventBus } from './events.js';

let ws;
let myId = null;
const remotePlayers = {};

export function initMultiplayer() {
  try {
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => { console.log('🔗 Đã kết nối Server'); };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'init') {
        myId = msg.id;
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
      // Nhận hành động nông trại từ người khác
      else if (msg.type === 'farm_action') {
        EventBus.emit('RemoteFarmAction', msg);
      }
      // Nhận thông tin chuyển ngày từ người khác
      else if (msg.type === 'time_update') {
        EventBus.emit('RemoteTimeUpdate', msg.time);
      }
    };

    // Lắng nghe hành động của BẢN THÂN để gửi lên Server
    EventBus.on('LocalFarmAction', (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'farm_action', x: data.x, z: data.z, state: data.state }));
      }
    });
    
    EventBus.on('LocalSleep', () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'time_update', time: { hour: 6, minute: 0, day: G.TimeManager?.day + 1 || 1, season: 'Spring' } }));
      }
    });

  } catch (e) {
    console.warn('Multiplayer disabled.');
  }
}

function createRemotePlayer(id, data) {
  const clone = G.player.clone();
  clone.position.set(data.x, data.y, data.z);
  clone.rotation.y = data.rotY;
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

  if (Math.floor(elapsed * 20) % 2 === 0) {
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
    
    let diff = p.userData.targetRotY - p.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.rotation.y += diff * lerpFactor;

    // Animation cơ bản cho người khác
    if (p.userData.state === 'walk') {
      p.position.y += Math.abs(Math.sin(elapsed * 10)) * 0.05;
    } else if (p.userData.state === 'sit') {
      p.scale.y = THREE.MathUtils.lerp(p.scale.y, 0.7, lerpFactor);
    } else {
      p.scale.y = THREE.MathUtils.lerp(p.scale.y, 1, lerpFactor);
    }
  }
}