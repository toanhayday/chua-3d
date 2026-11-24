import { G } from './state.js';

export function initMobileControls() {
  const container = document.getElementById('joystick-container');
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');

  if (!container || !base || !knob) return;

  let baseRect;
  let maxDistance = 35; // Bán kính di chuyển tối đa của núm
  let isDragging = false;

  // Khởi tạo G.mobileInput nếu chưa có
  if (!G.mobileInput) {
    G.mobileInput = { x: 0, y: 0 };
  }

  function updateKnobPosition(clientX, clientY) {
    if (!baseRect) baseRect = base.getBoundingClientRect();
    
    // Tọa độ tâm của base
    const centerX = baseRect.left + baseRect.width / 2;
    const centerY = baseRect.top + baseRect.height / 2;

    // Khoảng cách từ tâm đến ngón tay
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Giới hạn núm trong vòng tròn
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }

    // Di chuyển núm
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Tính toán hướng di chuyển (-1 đến 1)
    // dy âm là đi lên (W), dx âm là đi sang trái (A)
    G.mobileInput.x = dx / maxDistance; // Trái/Phải
    G.mobileInput.y = -dy / maxDistance; // Trước/Sau (Đảo dấu để W là số dương)
  }

  function resetKnob() {
    isDragging = false;
    knob.style.transform = `translate(-50%, -50%)`;
    G.mobileInput.x = 0;
    G.mobileInput.y = 0;
    baseRect = null; // Reset lại để tính toán lại khi cần
  }

  // Xử lý sự kiện chạm
  base.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn Camera xoay khi chạm vào Joystick
    isDragging = true;
    baseRect = base.getBoundingClientRect();
    updateKnobPosition(e.clientX, e.clientY);
    base.setPointerCapture(e.pointerId);
  });

  base.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    updateKnobPosition(e.clientX, e.clientY);
  });

  base.addEventListener('pointerup', (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetKnob();
  });

  base.addEventListener('pointercancel', (e) => {
    resetKnob();
  });
}