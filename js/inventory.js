import { EventBus } from './events.js';

export const InventoryManager = {
  maxStamina: 100,
  stamina: 100,
  // Thêm cú pháp bấm phím 4, 5 cho Búa và Rìu
  hotbar: [
    { id: 'hoe', name: 'Cuốc', type: 'tool', icon: '⛏️' },
    { id: 'watering_can', name: 'Bình tưới', type: 'tool', icon: '🚰' },
    { id: 'turnip_seed', name: 'Hạt cải', type: 'seed', cropId: 'turnip', quantity: 99, icon: '🌱' },
    { id: 'hammer', name: 'Búa', type: 'tool', icon: '🔨' },
    { id: 'axe', name: 'Rìu', type: 'tool', icon: '🪓' }
  ],
  selectedSlot: 0,

  init() {
    EventBus.on('OnNewDay', () => {
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
    if (this.stamina === 0) EventBus.emit('OnExhausted');
    return this.stamina > 0;
  },

  getSelectedItem() { return this.hotbar[this.selectedSlot]; },

  // Tính năng nhận nguyên liệu mới
  addItem(itemId, amount) {
    // Tạm thời chỉ hiện thông báo, bạn có thể mở rộng thêm túi đồ
    console.log(`Đã nhận: ${amount} ${itemId}`);
  }
};