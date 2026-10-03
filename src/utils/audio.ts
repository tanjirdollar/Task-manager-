// Pure Web Audio API synthesizers for focus sound & timer completion chime
// Zero external network dependencies or broken audio files

class AudioController {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private currentAmbientType: 'rain' | 'whitenoise' | 'binaural' | 'none' = 'none';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play crisp gentle notification chime when timer completes
  public playChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Two harmonic chime tones
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.8); // C5
      playTone(659.25, now + 0.15, 0.9); // E5
      playTone(783.99, now + 0.3, 1.2); // G5
      playTone(1046.5, now + 0.45, 1.6); // C6
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  // Start continuous ambient sound
  public startAmbient(type: 'rain' | 'whitenoise' | 'binaural', volume = 0.3): void {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(volume, ctx.currentTime);
      this.ambientGain.connect(ctx.destination);

      if (type === 'whitenoise') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Bandpass filter to make it gentle and soothing pink-ish noise
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);
        whiteNoise.start();
        this.ambientSource = whiteNoise;
      } else if (type === 'rain') {
        // Rain simulation using modulated pink noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.15;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.6;

        rainSource.connect(filter);
        filter.connect(this.ambientGain);
        rainSource.start();
        this.ambientSource = rainSource;
      } else if (type === 'binaural') {
        // Calming binaural 432Hz sine wave beat
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(216, ctx.currentTime);
        osc2.frequency.setValueAtTime(222, ctx.currentTime);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.5, ctx.currentTime);

        osc1.connect(subGain);
        osc2.connect(subGain);
        subGain.connect(this.ambientGain);

        osc1.start();
        osc2.start();
        this.ambientSource = subGain;
      }

      this.isAmbientPlaying = true;
      this.currentAmbientType = type;
    } catch (e) {
      console.warn('Ambient sound startup failed:', e);
    }
  }

  public stopAmbient(): void {
    if (this.ambientSource) {
      try {
        if ('stop' in this.ambientSource && typeof (this.ambientSource as any).stop === 'function') {
          (this.ambientSource as any).stop();
        }
        this.ambientSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
    this.currentAmbientType = 'none';
  }

  public setAmbientVolume(vol: number): void {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  public getAmbientType(): string {
    return this.currentAmbientType;
  }
}

export const soundManager = new AudioController();
