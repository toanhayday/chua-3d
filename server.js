const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) { res.writeHead(404); res.end('404'); } 
    else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content, 'utf-8'); }
  });
});

const wss = new WebSocket.Server({ server });
let players = {}; 

// Trạng thái chung của thế giới (để người mới vào có thể đồng bộ)
let worldState = {
  time: { hour: 6, minute: 0, day: 1, season: 'Spring' },
  farm: {} // Lưu trạng thái các ô đất: { "x_z": { tilled, watered, crop } }
};

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).substr(2, 9);
  players[id] = { x: 0, z: 14, rotY: Math.PI, state: 'idle' };
  
  // Gửi thông tin thế giới hiện tại cho người mới
  ws.send(JSON.stringify({ type: 'init', id: id, players: players, worldState: worldState }));

  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'playerJoined', id: id, data: players[id] }));
    }
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 1. Đồng bộ di chuyển
      if (data.type === 'update') {
        players[id] = data.data;
        broadcast(ws, { type: 'update', id: id, data: data.data });
      }
      
      // 2. Đồng bộ hành động nông trại (Cuốc, Tưới, Trồng)
      else if (data.type === 'farm_action') {
        const key = `${data.x}_${data.z}`;
        worldState.farm[key] = data.state;
        broadcast(ws, { type: 'farm_action', x: data.x, z: data.z, state: data.state, playerId: id });
      }

      // 3. Đồng bộ thời gian (Khi có người đi ngủ)
      else if (data.type === 'time_update') {
        worldState.time = data.time;
        broadcast(ws, { type: 'time_update', time: data.time });
      }
    } catch(e) {}
  });

  ws.on('close', () => {
    delete players[id];
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'playerLeft', id: id }));
      }
    });
  });
});

function broadcast(sender, msg) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

// Thay đổi từ:
// const PORT = 8080;
// Thành:
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
});