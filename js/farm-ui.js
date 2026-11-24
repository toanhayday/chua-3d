// js/farm-ui.js
import { EventBus } from './events.js';
import { TimeManager } from './time.js';
import { InventoryManager } from './inventory.js';

export function initFarmUI() {
  // Cập nhật Đồng hồ liên tục
  setInterval(() => {
    document.getElementById('clockDisplay').innerText = 
      `📅 ${TimeManager.season}, Ngày ${TimeManager.day} - ${TimeManager.getTimeString()}`;
  }, 100);

  // Cập nhật Thể lực
  EventBus.on('OnStaminaChanged', (val) => {
    document.getElementById('staminaDisplay').innerText = `⚡ ${val}/100`;
  });

  // Render Hotbar
  function renderHotbar() {
    const container = document.getElementById('hotbar');
    container.innerHTML = '';
    
    InventoryManager.hotbar.forEach((item, index) => {
      const slot = document.createElement('div');
      const isSelected = index === InventoryManager.selectedSlot;
      
      slot.style.cssText = `
        width: 50px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: ${isSelected ? '#fff' : 'rgba(250, 240, 225, 0.8)'};
        border: 3px solid ${isSelected ? '#b8935a' : '#8b6f47'};
        border-radius: 8px; cursor: pointer; font-size: 20px;
        box-shadow: 0 4px 0 rgba(0,0,0,0.2);
        transition: all 0.1s;
      `;
      
      slot.innerHTML = `<span>${item.icon || '❓'}</span><span style="font-size: 10px; color: #3d2b17;">${item.quantity || ''}</span>`;
      
      slot.addEventListener('click', () => InventoryManager.selectSlot(index));
      container.appendChild(slot);
    });
  }

  EventBus.on('OnSlotChanged', renderHotbar);
  EventBus.on('OnInventoryChanged', renderHotbar);
  renderHotbar();
}