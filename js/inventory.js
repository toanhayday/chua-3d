// js/inventory.js
import { EventBus } from './events.js';

export const InventoryManager = {
  maxStamina: 100,
  stamina: 100,
  
  // Hotbar: 1, 2, 3
  hotbar: [
    { id: 'hoe', name: 'Cuốc', type: 'tool', icon: '⛏️' },
    { id: 'watering_can', name: 'Bình tưới', type: 'tool', icon: '🚰' },
    { id: 'turnip_seed', name: 'Hạt cải', type: 'seed', cropId: 'turnip', quantity: 10, icon: '🌱' }
  ],
  selectedSlot: 0,

  init() {
    EventBus.on('OnNewDay', () => {
      // Hồi phục 50% thể lực mỗi ngày (nếu không ngủ)
      this.stamina = Math.min(this.maxStamina, this.stamina + 50);
      EventBus.emit('OnStaminaChanged', this.stamina);
    });
  },

  selectSlot(index) {
    if (index >= 0 && index < this.hotbar.length) {
      this.selectedSlot = index;
      EventBus.emit('OnSlotChanged', this.hotbar[this.selectedSlot]);
    }
  },

  useStamina(amount) {
    this.stamina = Math.max(0, this.stamina - amount);
    EventBus.emit('OnStaminaChanged', this.stamina);
    if (this.stamina === 0) {
      EventBus.emit('OnExhausted'); // Ngất xỉu nếu làm việc kiệt sức
    }
    return this.stamina > 0;
  },

  getSelectedItem() {
    return this.hotbar[this.selectedSlot];
  }
};