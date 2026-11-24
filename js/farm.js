/**
 * farm.js - Quản lý Lưới đất và Trồng trọt (Multiplayer Sync)
 */
import * as THREE from 'three';
import { G } from './state.js';
import { EventBus } from './events.js';
import { InventoryManager } from './inventory.js';

export const FarmManager = {
  gridSize: 5,
  tileSpacing: 1.2,
  startX: 8,
  startZ: 8,
  tiles: [], 
  meshes: [],

  init() {
    this.createFarmVisuals();
    
    // 1. Lắng nghe sự kiện qua ngày (cây lớn)
    EventBus.on('OnNewDay', () => this.growCrops());
    
    // 2. Lắng nghe hành động từ người chơi khác (Cuốc, tưới, trồng)
    EventBus.on('RemoteFarmAction', (msg) => {
      this.applyTileState(msg.x, msg.z, msg.state);
    });

    // 3. Đồng bộ toàn bộ trạng thái nông trại khi mới vào game
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
    // Vật liệu cho các trạng thái đất
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.9 });
    const tillMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 1.0 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.3, metalness: 0.5 });
    
    const planeGeo = new THREE.PlaneGeometry(this.tileSpacing * 0.9, this.tileSpacing * 0.9);
    
    for (let x = 0; x < this.gridSize; x++) {
      this.tiles[x] = [];
      this.meshes[x] = [];
      for (let z = 0; z < this.gridSize; z++) {
        // Dữ liệu ô đất
        this.tiles[x][z] = {
          tilled: false,
          watered: false,
          crop: null, // { id, stage, daysGrown }
          mesh: null  // Lưu mesh của cây trồng
        };

        // Mesh hiển thị ô đất
        const mesh = new THREE.Mesh(planeGeo, dirtMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
          this.startX + x * this.tileSpacing,
          0.02, 
          this.startZ + z * this.tileSpacing
        );
        mesh.receiveShadow = true;
        
        mesh.userData = { 
          baseMat: dirtMat, 
          tillMat: tillMat, 
          waterMat: waterMat,
          gridX: x, 
          gridZ: z 
        };

        G.scene.add(mesh);
        this.meshes[x][z] = mesh;
      }
    }
  },

  // Hàm cập nhật giao diện ô đất (Dùng chung cho cả Local và Remote)
  applyTileState(x, z, state) {
    const tile = this.tiles[x][z];
    const mesh = this.meshes[x][z];
    if (!tile || !mesh) return;

    // Đồng bộ data
    tile.tilled = state.tilled;
    tile.watered = state.watered;
    tile.crop = state.crop;

    // 1. Cập nhật màu nền đất
    if (tile.watered) mesh.material = mesh.userData.waterMat;
    else if (tile.tilled) mesh.material = mesh.userData.tillMat;
    else mesh.material = mesh.userData.baseMat;

    // 2. Cập nhật mesh cây trồng
    if (tile.crop) {
      // Xóa cây cũ (nếu có) để vẽ lại theo stage mới
      if (tile.mesh) {
        G.scene.remove(tile.mesh);
        tile.mesh = null;
      }
      // Vẽ cây mới
      const cropMesh = this.createCropMesh(tile.crop.id, tile.crop.stage);
      cropMesh.position.copy(mesh.position);
      cropMesh.position.y = 0.05;
      G.scene.add(cropMesh);
      tile.mesh = cropMesh;
    } else if (!tile.crop && tile.mesh) {
      // Nếu không có cây mà có mesh -> Xóa mesh
      G.scene.remove(tile.mesh);
      tile.mesh = null;
    }
  },

  // Xử lý khi người chơi click chuột vào đất
  interactWithTile(mesh, item) {
    if (!item) return;
    const x = mesh.userData.gridX;
    const z = mesh.userData.gridZ;
    const tile = this.tiles[x][z];
    let actionTaken = false;

    // 1. Dùng Cuốc
    if (item.id === 'hoe' && !tile.tilled) {
      if (InventoryManager.useStamina(5)) {
        tile.tilled = true;
        actionTaken = true;
        G.audio.woodenFish();
      }
    }
    // 2. Dùng Bình tưới
    else if (item.id === 'watering_can' && tile.tilled && !tile.watered) {
      if (InventoryManager.useStamina(2)) {
        tile.watered = true;
        actionTaken = true;
        G.audio.woodenFish(); 
      }
    }
    // 3. Trồng hạt giống
    else if (item.type === 'seed' && tile.tilled && !tile.crop && item.quantity > 0) {
      if (InventoryManager.useStamina(1)) {
        tile.crop = { id: item.cropId, stage: 0, daysGrown: 0 };
        item.quantity -= 1;
        actionTaken = true;
        EventBus.emit('OnInventoryChanged');
        G.audio.woodenFish();
      }
    }

    // Nếu có thay đổi, cập nhật đồ họa và BẮN SỰ KIỆN qua mạng
    if (actionTaken) {
      this.applyTileState(x, z, tile);
      EventBus.emit('LocalFarmAction', { x, z, state: tile });
    }
  },

  createCropMesh(cropId, stage) {
    const group = new THREE.Group();
    if (stage === 0) {
      // Mầm non
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x88c060 }));
      sprout.position.y = 0.1; group.add(sprout);
    } else if (stage === 1) {
      // Cây nhỡ
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0x58a040 }));
      bush.position.y = 0.2; group.add(bush);
    } else if (stage >= 2) {
      // Cây trưởng thành
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshStandardMaterial({ color: 0x48a038 }));
      bush.position.y = 0.25; group.add(bush);
      
      const root = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }));
      root.position.set(0, 0.05, 0); root.scale.set(1, 0.6, 1); group.add(root);
    }
    return group;
  },

  growCrops() {
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const tile = this.tiles[x][z];
        let changed = false;

        // Chỉ cây mới lớn nếu hôm qua có tưới nước
        if (tile.watered) {
          if (tile.crop) {
            tile.crop.daysGrown += 1;
            // Cứ 2 ngày thì lớn 1 giai đoạn (tối đa stage 2)
            tile.crop.stage = Math.min(2, Math.floor(tile.crop.daysGrown / 2));
          }
          changed = true;
        }
        
        // Hết nước vào ngày mới
        if (tile.watered) {
          tile.watered = false;
          changed = true;
        }
        
        if (changed) this.applyTileState(x, z, tile);
      }
    }
  }
};