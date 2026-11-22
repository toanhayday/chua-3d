/**
 * audio.js - Web Audio API: SFX + Background music
 * Hỗ trợ 2 chế độ:
 *   1. File local assets/music.mp3 (nếu có)
 *   2. Procedural Buddhist melody (fallback)
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;

    // Music state
    this.musicPlaying = false;
    this.musicEnabled = true;
    this.musicAudio = null;       // HTML5 Audio nếu dùng MP3
    this.hasMusicFile = false;
    this.musicInterval = null;
    this.musicNotes = [220.00, 261.63, 293.66, 329.63, 392.00, 220.00, 174.61, 196.00, 220.00, 261.63];
    this.musicNoteIdx = 0;

    // Procedural music gain (tách biệt với SFX)
    this.musicGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;   // nhạc nền nhỏ hơn SFX
      this.musicGain.connect(this.masterGain);

      this._startWind();
      this._tryLoadMusicFile();
    } catch (e) { console.warn('Audio init failed:', e); }
  }

  ensure() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  /* ═══════ WIND AMBIENCE ═══════ */
  _startWind() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.022;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(gain.gain);

    source.connect(filter).connect(gain).connect(this.masterGain);
    source.start();
    lfo.start();
  }

  /* ═══════ MUSIC: Try load MP3 ═══════ */
  _tryLoadMusicFile() {
    const audio = new Audio();
    audio.src = 'assets/music.mp3';
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';

    const onReady = () => {
      this.hasMusicFile = true;
      this.musicAudio = audio;
      if (this.musicEnabled && this.musicPlaying) this._playMusicFile();
      console.log('🎵 Đã tải nhạc nền từ assets/music.mp3');
    };

    const onError = () => {
      this.hasMusicFile = false;
      console.log('🎵 Không có assets/music.mp3 → dùng nhạc procedural');
    };

    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });

    setTimeout(() => {
      if (!this.hasMusicFile && !this.musicAudio) {
        onError();
      }
    }, 1500);
  }

  /* ═══════ MUSIC: Start / Stop ═══════ */
  startMusic() {
    this.ensure();
    if (!this.ctx) return;
    if (this.musicPlaying) return;

    this.musicPlaying = true;

    if (this.hasMusicFile && this.musicAudio) {
      this._playMusicFile();
    } else {
      this._startProceduralMusic();
    }
  }

  _playMusicFile() {
    if (!this.musicAudio) return;
    this.musicAudio.play().catch(err => {
      console.warn('Không phát được MP3, dùng procedural:', err);
      this.hasMusicFile = false;
      this._startProceduralMusic();
    });
  }

  stopMusic() {
    this.musicPlaying = false;

    if (this.musicAudio) {
      this.musicAudio.pause();
    }

    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  /* ═══════ PROCEDURAL BUDDHIST MELODY ═══════ */
  _startProceduralMusic() {
    if (!this.ctx || !this.musicGain) return;

    const scheduleNext = () => {
      if (!this.musicPlaying) return;

      const freq = this.musicNotes[this.musicNoteIdx % this.musicNotes.length];
      this.musicNoteIdx++;

      this._playFluteNote(freq);

      if (Math.random() < 0.3) {
        this._playFluteNote(freq * 1.5, 0.4);
      }

      const nextDelay = 1800 + Math.random() * 700;
      this.musicInterval = setTimeout(scheduleNext, nextDelay);
    };

    this.musicInterval = setTimeout(scheduleNext, 1000);
  }

  _playFluteNote(freq, volScale = 1) {
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

    const now = this.ctx.currentTime;
    const duration = 2.8;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = 0.15;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = freq * 0.006;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.connect(lfoGain).connect(osc2.frequency);

    const envGain = this.ctx.createGain();
    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(0.09 * volScale, now + 0.35);
    envGain.gain.linearRampToValueAtTime(0.06 * volScale, now + 1.5);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const delay = this.ctx.createDelay(1.5);
    delay.delayTime.value = 0.55;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.35;
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.4;

    osc.connect(osc2Gain).connect(envGain);
    osc2.connect(envGain);
    envGain.connect(this.musicGain);
    envGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain).connect(this.musicGain);

    osc.start(now);
    osc2.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
    lfo.stop(now + duration);
  }

  /* ═══════ SFX: Bell ═══════ */
  bell() {
    this.ensure();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [196, 392, 588, 784, 980, 1176];
    const gains = [0.22, 0.14, 0.09, 0.05, 0.03, 0.02];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gains[i], now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + 6 - i * 0.5);
      osc.connect(g).connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 7);
    });
  }

  /* ═══════ SFX: Wooden Fish ═══════ */
  woodenFish() {
    this.ensure();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);

    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = 900;
    g2.gain.setValueAtTime(0.04, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc2.connect(g2).connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.03);
  }

  /* ═══════ Toggle SFX ═══════ */
  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) this.masterGain.gain.value = this.enabled ? 1 : 0;
    return this.enabled;
  }
}