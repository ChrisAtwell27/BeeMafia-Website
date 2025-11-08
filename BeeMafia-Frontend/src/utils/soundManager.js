// Sound Manager for BeeMafia
// Uses Web Audio API for simple sound effects

class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
    this.audioContext = null;
    this.sounds = {};
  }

  init() {
    if (!this.audioContext && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Create simple beep sounds using Web Audio API
  playBeep(frequency = 440, duration = 200, type = 'sine') {
    if (!this.enabled) return;

    try {
      this.init();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Sound error:', error);
    }
  }

  // Predefined sound effects
  playNotification() {
    this.playBeep(800, 150, 'sine');
    setTimeout(() => this.playBeep(1000, 150, 'sine'), 150);
  }

  playJoin() {
    this.playBeep(400, 100, 'sine');
    setTimeout(() => this.playBeep(600, 100, 'sine'), 100);
    setTimeout(() => this.playBeep(800, 150, 'sine'), 200);
  }

  playLeave() {
    this.playBeep(800, 100, 'sine');
    setTimeout(() => this.playBeep(600, 100, 'sine'), 100);
    setTimeout(() => this.playBeep(400, 150, 'sine'), 200);
  }

  playSuccess() {
    this.playBeep(500, 100, 'sine');
    setTimeout(() => this.playBeep(700, 100, 'sine'), 100);
    setTimeout(() => this.playBeep(900, 200, 'sine'), 200);
  }

  playError() {
    this.playBeep(300, 300, 'sawtooth');
  }

  playClick() {
    this.playBeep(600, 50, 'square');
  }

  playMessage() {
    this.playBeep(700, 100, 'sine');
    setTimeout(() => this.playBeep(500, 100, 'sine'), 100);
  }

  playCountdown() {
    this.playBeep(1000, 100, 'sine');
  }

  playCountdownFinal() {
    this.playBeep(1200, 500, 'sine');
  }

  // Settings
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', this.volume);
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

// Export singleton instance
const soundManager = new SoundManager();
export default soundManager;