import { HitZone } from '../shared/types.ts';

class ArenaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private volume = 0.7;
  private hapticsEnabled = true;
  private menuInterval: number | null = null;
  private menuBeat = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.03,
      );
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.03,
      );
    }
  }

  public setHaptics(enabled: boolean): void {
    this.hapticsEnabled = enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.hapticsEnabled || this.muted) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playStrikeSwing(isHeavy: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHeavy ? 420 : 680, now);
    filter.frequency.exponentialRampToValueAtTime(isHeavy ? 180 : 320, now + 0.12);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isHeavy ? 0.16 : 0.09, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.15 : 0.1));

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.16);
  }

  public playStrikeHit(isHeavy: boolean, zone: HitZone = 'head'): void {
    const ctx = this.ensureContext();
    if (isHeavy) {
      this.vibrate([32, 18, 45]);
    } else {
      this.vibrate(14);
    }
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    // Low punch thump
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const startFreq = zone === 'body' ? 115 : isHeavy ? 145 : 185;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + (isHeavy ? 0.16 : 0.09));

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(isHeavy ? 0.55 : 0.34, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.18 : 0.1));

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Crisp leather slap transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHeavy ? 1800 : 2400, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(isHeavy ? 0.38 : 0.22, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.09);
  }

  public playBlock(): void {
    const ctx = this.ensureContext();
    this.vibrate(10);
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playTakedownSlam(): void {
    const ctx = this.ensureContext();
    this.vibrate([45, 20, 60]);
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.28);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.62, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.24);
  }

  public playFootstep(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(78, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.04);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playBell(rings = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const baseNow = ctx.currentTime;

    for (let r = 0; r < rings; r++) {
      const start = baseNow + r * 0.28;
      const freqs = [740, 1110, 1485, 2220];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, start);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18 / (idx + 1), start);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.95);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 1.0);
      });
    }
  }

  public playTenSecondClack(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(980, now + offset);
      osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.045);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.06);
    });
  }

  public playCrowdCheer(intensity = 0.6): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.linearRampToValueAtTime(920, now + 0.35);
    filter.frequency.linearRampToValueAtTime(480, now + 1.35);
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16 * intensity, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 1.45);
  }

  public setMenuMusic(active: boolean): void {
    if (!active) {
      if (this.menuInterval !== null) {
        window.clearInterval(this.menuInterval);
        this.menuInterval = null;
      }
      return;
    }
    if (this.menuInterval !== null) return;
    this.menuBeat = 0;
    this.menuInterval = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const step = this.menuBeat % 8;
      this.menuBeat += 1;

      if (step === 0 || step === 3 || step === 6) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(step === 0 ? 58 : 49, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.24);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    }, 260);
  }
}

export const arenaAudio = new ArenaAudioEngine();
