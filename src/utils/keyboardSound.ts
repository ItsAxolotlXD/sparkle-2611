// Web Audio API realistic iOS keyboard sound synthesizer
// Produces authentic, crisp, audible iOS keyboard clicks with pitch variation for different key types

class KeyboardSoundEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private enabled = true;

  constructor() {
    this.setupUnlockListeners();
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlockAudio();
    };

    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true, passive: true });
    window.addEventListener('click', unlock, { capture: true, passive: true });
  }

  public unlockAudio() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (!this.isUnlocked) {
        // Play an inaudible 1-sample buffer to unlock iOS Safari Web Audio
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch {}
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playKeyClick(type: 'char' | 'space' | 'delete' | 'action' | 'modifier' = 'char') {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      // If suspended, resume and play once resumed
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.doPlay(ctx, type);
        }).catch(() => {});
        return;
      }

      this.doPlay(ctx, type);
    } catch {
      // Audio playback fails silently if unsupported
    }
  }

  private doPlay(ctx: AudioContext, type: 'char' | 'space' | 'delete' | 'action' | 'modifier') {
    try {
      const now = Math.max(ctx.currentTime, 0.0001) + 0.001;

      // Master output gain
      const masterGain = ctx.createGain();
      const masterVol = type === 'action' ? 0.75 : type === 'delete' ? 0.70 : type === 'space' ? 0.68 : 0.65;
      masterGain.gain.setValueAtTime(masterVol, now);
      masterGain.connect(ctx.destination);

      // 1. High-pitch clean acoustic pop (fixed resonant frequency, NO downward pitch sweep / chíu chíu)
      let freq = 2150; // High-pitch crisp pop for standard characters
      let decay = 0.014; // 14ms snappy pop
      let popVolume = 0.72;

      if (type === 'delete') {
        freq = 1450;
        decay = 0.017;
        popVolume = 0.70;
      } else if (type === 'space') {
        freq = 1620;
        decay = 0.018;
        popVolume = 0.70;
      } else if (type === 'action') {
        freq = 2380;
        decay = 0.020;
        popVolume = 0.78;
      } else if (type === 'modifier') {
        freq = 1820;
        decay = 0.013;
        popVolume = 0.62;
      }

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      // Fixed frequency: zero downward sweep prevents "chíu chíu" laser effect
      osc.frequency.setValueAtTime(freq, now);

      // Snappy attack (0.8ms) and fast exponential decay
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(popVolume, now + 0.0008);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + decay);

      // 2. Micro tactile click transient (3.5ms) - provides crisp tactile glass/bubble pop attack
      const clickSamples = Math.floor(ctx.sampleRate * 0.0035);
      if (clickSamples > 0) {
        const clickBuffer = ctx.createBuffer(1, clickSamples, ctx.sampleRate);
        const clickData = clickBuffer.getChannelData(0);
        for (let i = 0; i < clickSamples; i++) {
          clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickSamples * 0.28));
        }

        const clickSource = ctx.createBufferSource();
        clickSource.buffer = clickBuffer;

        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(freq * 1.5, now);
        clickFilter.Q.setValueAtTime(1.8, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.28, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.0035);

        clickSource.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(masterGain);
        clickSource.start(now);
      }
    } catch {
      // Audio playback fails silently if unsupported
    }
  }
}

export const keyboardSound = new KeyboardSoundEngine();
