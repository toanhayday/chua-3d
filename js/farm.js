import * as THREE from 'three';
import { G } from './state.js';
import { EventBus } from './events.js';
import { InventoryManager } from './inventory.js';

export const FarmManager = {
  gridSize: 40, // Lưới 40x40 ô (tương đương 80x80 mét)
  tileSpacing: 2,
startX: 10,  // Dời sang phải
startZ: 45,  // Dời xuống dưới qua cầu
  tiles: [], 
  
  // InstancedMeshes
  grassMesh: null, dirtMesh: null, rockMesh: null, woodMesh: null, cropMesh: null,
  
  // Data mảng lưu trữ trạng thái để update InstancedMatrix
  gridData: [],

  init() {
    this.createFarmVisuals();
    EventBus.on('OnNewDay', () => this.growCrops());
    EventBus.on('RemoteFarmAction', (msg) => this.applyTileState(msg.x, msg.z, msg.state));
    EventBus.on('SyncWorldState', (worldState) => {
      if (worldState.farm) {
        for (const key in worldState.farm) {
          const [x, z] = key.split('_').map(Number);
          this.applyTileState(x, z, worldState.farm[key]);
        }
      }
    });
  },

  createFarmVisuals() {
    const maxInstances = this.gridSize * this.gridSize;
    const dummy = new THREE.Object3D();

    // 1. Tạo các hình khối cơ bản
    const grassGeo = new THREE.PlaneGeometry(this.tileSpacing * 0.95, this.tileSpacing * 0.95);
    grassGeo.rotateX(-Math.PI / 2);
    const dirtGeo = grassGeo.clone();
    const rockGeo = new THREE.DodecahedronGeometry(0.6);
    const woodGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 5);
    woodGeo.rotateZ(Math.PI / 2);
    const cropGeo = new THREE.ConeGeometry(0.3, 0.8, 6);

    // 2. Tạo Materials
    this.grassMesh = new THREE.InstancedMesh(grassGeo, new THREE.MeshStandardMaterial({ color: 0x66aa44 }), maxInstances);
    this.dirtMesh = new THREE.InstancedMesh(dirtGeo, new THREE.MeshStandardMaterial({ color: 0x4a3018 }), maxInstances);
    this.rockMesh = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }), maxInstances);
    this.woodMesh = new THREE.InstancedMesh(woodGeo, new THREE.MeshStandardMaterial({ color: 0x5a3a20 }), maxInstances);
    this.cropMesh = new THREE.InstancedMesh(cropGeo, new THREE.MeshStandardMaterial({ color: 0x88c060 }), maxInstances);

    // Thiết lập nhận bóng
    [this.grassMesh, this.dirtMesh, this.rockMesh, this.woodMesh, this.cropMesh].forEach(m => {
      m.receiveShadow = true; m.castShadow = true;
    });
    
    // Khởi tạo tất cả các mesh bị ẩn (scale = 0)
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    for (let i = 0; i < maxInstances; i++) {
      this.grassMesh.setMatrixAt(i, dummy.matrix);
      this.dirtMesh.setMatrixAt(i, dummy.matrix);
      this.rockMesh.setMatrixAt(i, dummy.matrix);
      this.woodMesh.setMatrixAt(i, dummy.matrix);
      this.cropMesh.setMatrixAt(i, dummy.matrix);
    }

    G.scene.add(this.grassMesh, this.dirtMesh, this.rockMesh, this.woodMesh, this.cropMesh);

    // 3. Khởi tạo dữ liệu lưới
    for (let x = 0; x < this.gridSize; x++) {
      this.gridData[x] = [];
      for (let z = 0; z < this.gridSize; z++) {
        // Random đá hoặc gỗ (tỉ lệ 10%)
        let type = 'grass';
        let rand = Math.random();
        if (rand < 0.05) type = 'rock';
        else if (rand < 0.1) type = 'wood';

        this.gridData[x][z] = {
          id: x * this.gridSize + z,
          type: type, // 'grass', 'tilled', 'crop', 'rock', 'wood'
          watered: false,
          cropStage: 0,
          cropDays: 0,
          worldX: this.startX + x * this.tileSpacing,
          worldZ: this.startZ + z * this.tileSpacing
        };
        this.updateInstanceVisual(x, z);
      }
    }
  },

  // Cập nhật hình ảnh của 1 ô đất
  updateInstanceVisual(x, z) {
    const tile = this.gridData[x][z];
    if (!tile) return;
    
    const dummy = new THREE.Object3D();
    dummy.position.set(tile.worldX, 0, tile.worldZ);

    // Reset tất cả về 0 trước
    const hide = new THREE.Matrix4().makeScale(0, 0, 0);
    this.grassMesh.setMatrixAt(tile.id, hide);
    this.dirtMesh.setMatrixAt(tile.id, hide);
    this.rockMesh.setMatrixAt(tile.id, hide);
    this.woodMesh.setMatrixAt(tile.id, hide);
    this.cropMesh.setMatrixAt(tile.id, hide);

    // Hiển thị theo Type
    if (tile.type === 'grass') {
      dummy.position.y = 0.01; dummy.updateMatrix();
      this.grassMesh.setMatrixAt(tile.id, dummy.matrix);
    } 
    else if (tile.type === 'tilled') {
      dummy.position.y = 0.02; dummy.updateMatrix();
      this.dirtMesh.setMatrixAt(tile.id, dummy.matrix);
    }
    else if (tile.type === 'crop') {
      dummy.position.y = 0.02; dummy.updateMatrix();
      this.dirtMesh.setMatrixAt(tile.id, dummy.matrix);
      
      // Scale cây theo giai đoạn
      let s = 0.5 + tile.cropStage * 0.5; 
      dummy.position.y = 0.4 * s; 
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      this.cropMesh.setMatrixAt(tile.id, dummy.matrix);
    }
    else if (tile.type === 'rock') {
      dummy.position.y = 0.3; dummy.updateMatrix();
      this.rockMesh.setMatrixAt(tile.id, dummy.matrix);
    }
    else if (tile.type === 'wood') {
      dummy.position.y = 0.2; dummy.rotation.y = Math.random() * Math.PI; dummy.updateMatrix();
      this.woodMesh.setMatrixAt(tile.id, dummy.matrix);
    }

    // Đánh dấu cần cập nhật GPU
    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.dirtMesh.instanceMatrix.needsUpdate = true;
    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.woodMesh.instanceMatrix.needsUpdate = true;
    this.cropMesh.instanceMatrix.needsUpdate = true;
  },

  // Xử lý khi click chuột
  interactWithTile(hitMesh, item) {
    const instanceId = hitMesh.userData.instanceId;
    if (instanceId === undefined) return;

    // Tìm vị trí x,z từ instanceId
    const x = Math.floor(instanceId / this.gridSize);
    const z = instanceId % this.gridSize;
    const tile = this.gridData[x][z];
    let actionTaken = false;

    // 1. Đập đá / Chặt gỗ
    if (tile.type === 'rock' && item.id === 'hammer') {
      if (InventoryManager.useStamina(10)) {
        tile.type = 'tilled';
        InventoryManager.addItem('stone', 2); // Nhận đá
        actionTaken = true;
      }
    }
    else if (tile.type === 'wood' && item.id === 'axe') {
      if (InventoryManager.useStamina(10)) {
        tile.type = 'tilled';
        InventoryManager.addItem('wood', 2); // Nhận gỗ
        actionTaken = true;
      }
    }
    // 2. Cuốc đất cỏ
    else if (tile.type === 'grass' && item.id === 'hoe') {
      if (InventoryManager.useStamina(5)) {
        tile.type = 'tilled';
        actionTaken = true;
      }
    }
    // 3. Tưới nước
    else if (tile.type === 'tilled' && item.id === 'watering_can' && !tile.watered) {
      if (InventoryManager.useStamina(2)) {
        tile.watered = true;
        // Đổi màu đất ẩm (tạm bỏ qua vì đang dùng InstancedMesh chung 1 màu)
        actionTaken = true;
      }
    }
    // 4. Trồng cây
    else if (tile.type === 'tilled' && item.type === 'seed' && item.quantity > 0) {
      if (InventoryManager.useStamina(1)) {
        tile.type = 'crop';
        tile.cropStage = 0;
        tile.cropDays = 0;
        item.quantity--;
        EventBus.emit('OnInventoryChanged');
        actionTaken = true;
      }
    }
    // 5. Thu hoạch
    else if (tile.type === 'crop' && tile.cropStage >= 2) {
      tile.type = 'tilled';
      InventoryManager.addItem('turnip', 1);
      actionTaken = true;
    }

    if (actionTaken) {
      G.audio.woodenFish();
      this.updateInstanceVisual(x, z);
      EventBus.emit('LocalFarmAction', { x, z, state: tile });
    }
  },

  applyTileState(x, z, state) {
    if (this.gridData[x] && this.gridData[x][z]) {
      this.gridData[x][z] = Object.assign(this.gridData[x][z], state);
      this.updateInstanceVisual(x, z);
    }
  },

  // Cỏ/Đá/Gỗ mọc lại và cây lớn lên
  growCrops() {
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const tile = this.gridData[x][z];
        let changed = false;

        if (tile.type === 'crop') {
          if (tile.watered) {
            tile.cropDays++;
            tile.cropStage = Math.min(2, Math.floor(tile.cropDays / 2));
            changed = true;
          }
          tile.watered = false; // Hết nước
        } 
        else if (tile.type === 'tilled') {
          // Đất trống 3 ngày không trồng -> mọc lại cỏ/đá/gỗ
          tile.cropDays++;
          if (tile.cropDays > 3) {
            const rand = Math.random();
            if (rand < 0.1) tile.type = 'rock';
            else if (rand < 0.2) tile.type = 'wood';
            else tile.type = 'grass';
            tile.cropDays = 0;
            changed = true;
          }
        }

        if (changed) {
          this.updateInstanceVisual(x, z);
        }
      }
    }
  }
};