/**
 * Konohapoly - WebAudio Sound Synthesizer (Zero External Files)
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.3) {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    g.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playDice() {
    if (this.muted) return;
    this.init();
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(180 + Math.random() * 200, 'triangle', 0.04, 0.4);
      }, i * 60);
    }
  }

  playStep() {
    this.playTone(400, 'sine', 0.05, 0.2);
  }

  playCashIn() {
    if (this.muted) return;
    this.init();
    this.playTone(523.25, 'sine', 0.08, 0.3); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.08, 0.3), 70); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.4), 140); // G5
  }

  playPay() {
    if (this.muted) return;
    this.init();
    this.playTone(400, 'sawtooth', 0.1, 0.25);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.15, 0.3), 80);
  }

  playTurnAlert() {
    if (this.muted) return;
    this.init();

    // Gong effect (Low sine + long decay)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3
    g.gain.setValueAtTime(0.7, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);

    // High Bell chime
    setTimeout(() => this.playTone(1046.5, 'triangle', 0.4, 0.5), 100);

    // Device Vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  playJail() {
    this.playTone(120, 'sawtooth', 0.4, 0.5);
  }

  playBankrupt() {
    if (this.muted) return;
    this.init();
    const notes = [300, 260, 220, 180];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.2, 0.4), idx * 120);
    });
  }
}

export const sfx = new SoundEngine();
