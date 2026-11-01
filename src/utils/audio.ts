// Background Music & Ambient Sound Engine
// Features "Flying (Instrumental)" by Tom Odell, with Web Audio chimes & interactive soundscapes

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private fadeInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.customAudio = new Audio('/assets/music.mp3');
        this.customAudio.loop = true;
        this.customAudio.preload = 'auto';
        this.customAudio.volume = 0;
      } catch {
        this.customAudio = null;
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async start(): Promise<boolean> {
    try {
      this.initContext();
      this.isPlaying = true;

      if (this.customAudio) {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        
        // Start playing the Tom Odell instrumental track
        const playPromise = this.customAudio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }

        // Smooth fade-in to ~0.5 volume over 2 seconds
        const targetVolume = 0.5;
        let vol = this.customAudio.volume;
        this.fadeInterval = window.setInterval(() => {
          if (!this.customAudio) return;
          vol = Math.min(targetVolume, vol + 0.05);
          this.customAudio.volume = vol;
          if (vol >= targetVolume) {
            if (this.fadeInterval) clearInterval(this.fadeInterval);
          }
        }, 100);
      }
      return true;
    } catch (e) {
      console.warn('Audio playback notice:', e);
      return false;
    }
  }

  public stop() {
    if (!this.isPlaying) return;

    if (this.customAudio) {
      if (this.fadeInterval) clearInterval(this.fadeInterval);
      
      // Smooth fade-out before pausing
      let vol = this.customAudio.volume;
      this.fadeInterval = window.setInterval(() => {
        if (!this.customAudio) return;
        vol = Math.max(0, vol - 0.08);
        this.customAudio.volume = vol;
        if (vol <= 0.01) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.customAudio.pause();
          this.isPlaying = false;
        }
      }, 80);
    } else {
      this.isPlaying = false;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Play a soft bell/chime note (music box tone on touch)
  public playChime(freq: number, duration: number = 2.0, gainAmount: number = 0.15) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(gainAmount, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch {
      // Ignore audio context glitches gracefully
    }
  }

  // Play a sparkling sound effect for unlocking petals / surprises
  public playSparkle() {
    if (!this.ctx) return;
    const sparklePitches = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    sparklePitches.forEach((pitch, i) => {
      setTimeout(() => {
        this.playChime(pitch, 1.2, 0.12);
      }, i * 70);
    });
  }

  // Play a tender harp strum when opening the letter
  public playHarpStrum() {
    if (!this.ctx) return;
    const notes = [329.63, 392.0, 440.0, 523.25, 659.25, 880.0];
    notes.forEach((pitch, i) => {
      setTimeout(() => {
        this.playChime(pitch, 2.2, 0.14);
      }, i * 90);
    });
  }
}

export const soundEngine = new AmbientSoundEngine();
