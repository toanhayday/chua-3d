import * as THREE from 'three';
import { G, checkCollision } from './state.js';
import { EventBus } from './events.js';
import { toonMat, addOutline } from './utils.js';
import { showToast } from './ui.js';

export const OfficeManager = {
  currentFloor: 1,
  floorHeight: 5,
  buildingX: -35, // Đặt tòa nhà bên trái khuôn viên
  buildingZ: 0,
  floors: [], // Mảng chứa 20 tầng
  elevatorPos: new THREE.Vector3(-35, 0, 4),
  isMoving: false,

  init() {
    this.buildExterior();
    this.buildFloors();
    this.setFloor(1); // Bắt đầu ở tầng 1
    
    // Lắng nghe sự kiện bấm nút thang máy
    EventBus.on('ElevatorGoTo', (floor) => this.travelToFloor(floor));
  },

  buildExterior() {
    // Vỏ ngoài tòa nhà (Kính xanh)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a4a7a, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.8
    });
    const frameMat = toonMat(0xaaaaaa);

    const totalHeight = 20 * this.floorHeight;
    const exterior = new THREE.Mesh(new THREE.BoxGeometry(20, totalHeight, 20), glassMat);
    exterior.position.set(this.buildingX, totalHeight / 2, this.buildingZ);
    G.scene.add(exterior);

    // Khung sắt dọc
    for (let i = -10; i <= 10; i += 2) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, totalHeight, 0.2), frameMat);
      frame.position.set(this.buildingX + i, totalHeight / 2, this.buildingZ + 10);
      G.scene.add(frame);
    }
  },

  buildFloors() {
    const floorMat = toonMat(0xd0d0d0);
    const wallMat = toonMat(0xffffff);
    const deskMat = toonMat(0x8a6040);
    const pcMat = toonMat(0x201810);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x60c0ff, toneMapped: false });
    const suitMat = toonMat(0x2050a0); // Vét xanh dương
    const skinMat = toonMat(0xf0d8b8);

    for (let f = 1; f <= 20; f++) {
      const floorGroup = new THREE.Group();
      const yPos = (f - 1) * this.floorHeight;

      // Sàn nhà
      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(19.8, 0.2, 19.8), floorMat);
      floorMesh.position.set(this.buildingX, yPos + 0.1, this.buildingZ);
      floorMesh.receiveShadow = true;
      floorGroup.add(floorMesh);

      // Tường trong (chừa lối đi thang máy ở Z=4)
      const wall1 = new THREE.Mesh(new THREE.BoxGeometry(19.8, this.floorHeight, 0.2), wallMat);
      wall1.position.set(this.buildingX, yPos + this.floorHeight/2, this.buildingZ - 10);
      floorGroup.add(wall1);

      // Thang máy
      const elevatorGroup = new THREE.Group();
      const eFloor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 4), toonMat(0x555555));
      eFloor.position.set(this.elevatorPos.x, yPos + 0.05, this.elevatorPos.z);
      elevatorGroup.add(eFloor);
      
      // Cửa thang máy
      const eDoor = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.2), toonMat(0x999999));
      eDoor.position.set(this.elevatorPos.x, yPos + 1.5, this.elevatorPos.z - 2);
      elevatorGroup.add(eDoor);

      // Nút bấm thang máy (chỉ cần 1 cái ở tầng 1, nhưng để mỗi tầng 1 cái cho dễ)
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.1), toonMat(0xff4444, {emissive: 0x440000}));
      btn.position.set(this.elevatorPos.x + 2, yPos + 1.5, this.elevatorPos.z - 1.9);
      btn.userData.isElevatorBtn = true;
      floorGroup.add(btn);
      
      floorGroup.add(elevatorGroup);

      if (f === 1) {
        this.buildBank(floorGroup, yPos);
      } else {
        this.buildOffice(floorGroup, yPos, deskMat, pcMat, screenMat, suitMat, skinMat);
      }

      floorGroup.visible = false;
      G.scene.add(floorGroup);
      this.floors.push(floorGroup);
    }
  },

  buildBank(group, yPos) {
    // Quầy giao dịch
    const counterMat = toonMat(0xeeeeee);
    const glassMat = new THREE.MeshStandardMaterial({color: 0x88ccee, transparent: true, opacity: 0.5});
    
    for (let i = 0; i < 3; i++) {
      const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.5), counterMat);
      counter.position.set(this.buildingX - 5 + i * 5, yPos + 0.6, this.buildingZ - 5);
      group.add(counter);
      addOutline(counter, { thickness: 0.02 });

      // Tấm kính chắn
      const glass = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.1), glassMat);
      glass.position.set(this.buildingX - 5 + i * 5, yPos + 1.7, this.buildingZ - 5);
      group.add(glass);
    }

    // Logo ngân hàng (Bảng hiệu)
    const logo = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 0.5), toonMat(0x0055aa));
    logo.position.set(this.buildingX, yPos + 3, this.buildingZ - 9.5);
    group.add(logo);
  },

  buildOffice(group, yPos, deskMat, pcMat, screenMat, suitMat, skinMat) {
    // Tạo 4 cụm bàn làm việc (2x2)
    const deskPositions = [
      [-5, -5], [5, -5], [-5, 0], [5, 0]
    ];

    deskPositions.forEach(pos => {
      // Bàn
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), deskMat);
      desk.position.set(this.buildingX + pos[0], yPos + 0.75, this.buildingZ + pos[1]);
      group.add(desk);
      
      // Chân bàn
      [-1.4, 1.4].forEach(x => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 1.4), deskMat);
        leg.position.set(this.buildingX + pos[0] + x, yPos + 0.375, this.buildingZ + pos[1]);
        group.add(leg);
      });

      // Máy tính
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), pcMat);
      monitor.position.set(this.buildingX + pos[0], yPos + 1.1, this.buildingZ + pos[1] - 0.4);
      group.add(monitor);

      // Màn hình phát sáng
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), screenMat);
      screen.position.set(this.buildingX + pos[0], yPos + 1.1, this.buildingZ + pos[1] - 0.34);
      group.add(screen);

      // Nhân viên (NPC)
      const npc = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 4, 8), suitMat);
      body.position.y = 0.6;
      npc.add(body);
      
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skinMat);
      head.position.y = 1.1;
      npc.add(head);

      npc.position.set(this.buildingX + pos[0], yPos, this.buildingZ + pos[1] + 0.8);
      npc.rotation.y = Math.PI; // Quay mặt về màn hình
      group.add(npc);
      
      // Đánh dấu ghế để tương tác
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), toonMat(0x333333));
      chair.position.set(this.buildingX + pos[0], yPos + 0.5, this.buildingZ + pos[1] + 0.8);
      chair.userData.isOfficeChair = true;
      chair.userData.floor = this.floors.length + 1;
      group.add(chair);
    });
  },

  setFloor(floorNum) {
    this.currentFloor = floorNum;
    
    // Ẩn tất cả, chỉ hiện tầng hiện tại
    this.floors.forEach((f, index) => {
      f.visible = (index + 1 === floorNum);
    });

    // Cập nhật độ cao nhân vật
    if (!this.isMoving) {
      const targetY = (floorNum - 1) * this.floorHeight;
      G.player.position.y = targetY;
    }
  },

  travelToFloor(floorNum) {
    if (this.isMoving || floorNum === this.currentFloor) return;
    if (floorNum < 1 || floorNum > 20) return;

    this.isMoving = true;
    G.audio.bell(); // Ting thang máy
    
    // Hiệu ứng màn hình đen (Fade)
    const fade = document.createElement('div');
    fade.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 0.5s ease;z-index:9998;';
    document.body.appendChild(fade);
    
    // Fade Out
    setTimeout(() => { fade.style.opacity = '1'; }, 10);

    // Chuyển tầng khi màn hình đã đen
    setTimeout(() => {
      this.setFloor(floorNum);
      // Đưa nhân vật ra khỏi thang máy
      G.player.position.x = this.elevatorPos.x;
      G.player.position.z = this.elevatorPos.z + 2.5; 
      this.isMoving = false;
      
      // Fade In
      fade.style.opacity = '0';
      setTimeout(() => fade.remove(), 500);
      
      showToast(`Đã đến tầng ${floorNum}`);
    }, 600);
  }
};