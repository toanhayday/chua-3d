/**
 * time.js - Quản lý thời gian và lịch
 */
import { EventBus } from './events.js';

export const TimeManager = {
  minute: 0,
  hour: 6,     
  day: 1,
  season: 'Spring',
  year: 1,
  timeAccumulator: 0,
  isSleeping: false,

  update(dt) {
    if (this.isSleeping) return;
    
    this.timeAccumulator += dt;
    // 1 giây thực tế = 1 phút trong game
    if (this.timeAccumulator >= 1.0) { 
      this.timeAccumulator -= 1.0;
      this.minute += 1;
      
      if (this.minute >= 60) {
        this.minute = 0;
        this.hour += 1;
        EventBus.emit('OnHourChanged', this.hour);
      }

      if (this.hour >= 24) {
        this.hour = 0;
        this.nextDay();
      }
      
      // Ngất xỉu nếu thức quá 2h sáng
      if (this.hour === 2 && !this.isSleeping) {
        EventBus.emit('OnPassOut');
        this.sleep();
      }
    }
  },

  sleep() {
    if (this.isSleeping) return;
    this.isSleeping = true;
    EventBus.emit('OnSleepStart');
    EventBus.emit('LocalSleep'); // Báo cho Server biết mình đi ngủ
    
    // Đợi 2 giây cho hiệu ứng màn hình đen mượt mà
    setTimeout(() => {
      this.nextDay();
      this.hour = 6;
      this.minute = 0;
      this.isSleeping = false;
      EventBus.emit('OnSleepEnd');
    }, 2000);
  },

  nextDay() {
    this.day += 1;
    if (this.day > 28) {
      this.day = 1;
      this.year += 1;
      const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
      let idx = seasons.indexOf(this.season);
      this.season = seasons[(idx + 1) % 4];
    }
    EventBus.emit('OnNewDay');
  },

  getTimeString() {
    const ampm = this.hour >= 12 ? 'PM' : 'AM';
    let displayHour = this.hour % 12;
    if (displayHour === 0) displayHour = 12;
    const minStr = this.minute < 10 ? '0' + this.minute : this.minute;
    return `${displayHour}:${minStr} ${ampm}`;
  }
};

// Lắng nghe sự kiện: Nếu người chơi khác đi ngủ, mình cũng chuyển sang ngày mới theo
EventBus.on('RemoteTimeUpdate', (time) => {
  if (!TimeManager.isSleeping) {
    TimeManager.isSleeping = true;
    EventBus.emit('OnSleepStart');
    
    setTimeout(() => {
      TimeManager.nextDay();
      TimeManager.hour = time.hour;
      TimeManager.minute = time.minute;
      TimeManager.isSleeping = false;
      EventBus.emit('OnSleepEnd');
    }, 2000);
  }
});