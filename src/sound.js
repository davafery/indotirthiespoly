(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KonohapolySound = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MUTE_KEY = 'konohapoly_muted_v1';
  let ctx = null;
  let muted = false;

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (_) {
    muted = false;
  }

  function ensureContext() {
    if (muted || typeof window === 'undefined') return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (_) {
        return null;
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function unlock() {
    ensureContext();
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = Boolean(val);
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (_) {}
    if (!muted) ensureContext();
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  function tone(freq, type, duration, delay, gainVal, slideTo) {
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(gainVal || 0.14, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noiseBurst(duration, delay, filterFreq, gainVal) {
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + (delay || 0);
    const sampleCount = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, sampleCount, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq || 900, t0);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(gainVal || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  function play(name) {
    if (muted) return;
    try {
      switch (name) {
        case 'click':
          tone(640, 'sine', 0.06, 0, 0.08, 760);
          break;
        case 'dice':
          for (let i = 0; i < 4; i++) {
            noiseBurst(0.055, i * 0.09, 1100 + i * 180, 0.14);
            tone(220 + i * 35, 'triangle', 0.06, i * 0.09, 0.11, 140);
          }
          tone(180, 'triangle', 0.12, 0.42, 0.15, 110);
          break;
        case 'step':
          tone(340, 'sine', 0.07, 0, 0.08, 460);
          break;
        case 'cash_in':
          tone(987.77, 'sine', 0.12, 0, 0.13);
          tone(1318.51, 'sine', 0.24, 0.09, 0.15);
          break;
        case 'cash_out':
          tone(330, 'triangle', 0.14, 0, 0.13, 250);
          tone(220, 'triangle', 0.22, 0.11, 0.13, 165);
          break;
        case 'buy':
          tone(523.25, 'triangle', 0.14, 0, 0.14);
          tone(659.25, 'triangle', 0.14, 0.08, 0.14);
          tone(783.99, 'triangle', 0.24, 0.16, 0.16);
          break;
        case 'build':
          tone(392, 'square', 0.09, 0, 0.08);
          tone(523.25, 'square', 0.09, 0.08, 0.08);
          tone(659.25, 'square', 0.09, 0.16, 0.08);
          tone(783.99, 'triangle', 0.22, 0.24, 0.14);
          break;
        case 'card':
          noiseBurst(0.09, 0, 1800, 0.1);
          tone(587.33, 'sine', 0.16, 0.06, 0.11, 740);
          break;
        case 'decree':
          tone(392, 'sawtooth', 0.14, 0, 0.08);
          tone(392, 'sawtooth', 0.14, 0.16, 0.08);
          tone(392, 'sawtooth', 0.14, 0.32, 0.08);
          tone(311.13, 'sawtooth', 0.42, 0.48, 0.1);
          break;
        case 'siren':
          tone(680, 'sine', 0.22, 0, 0.12, 940);
          tone(940, 'sine', 0.22, 0.22, 0.12, 680);
          tone(680, 'sine', 0.22, 0.44, 0.12, 940);
          break;
        case 'bankrupt':
          tone(293.66, 'sawtooth', 0.22, 0, 0.1);
          tone(277.18, 'sawtooth', 0.22, 0.22, 0.1);
          tone(261.63, 'sawtooth', 0.22, 0.44, 0.1);
          tone(246.94, 'sawtooth', 0.48, 0.66, 0.11, 185);
          break;
        case 'chat':
          tone(540, 'sine', 0.07, 0, 0.08, 780);
          break;
        default:
          break;
      }
    } catch (_) {}
  }

  return {
    unlock,
    isMuted,
    setMuted,
    toggleMute,
    play
  };
}));