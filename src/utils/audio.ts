// Background Music & Ambient Sound Engine
// Features "Flying (Instrumental)" by Tom Odell, with Web Audio chimes & interactive soundscapes

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private currentTrack: 'piano' | 'vocal' = 'piano';

  private tracks = {
    piano: '/assets/music.mp3',
    vocal: '/assets/tom_odell_flying_vocal.mp3',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.customAudio = new Audio(this.tracks[this.currentTrack]);
        this.customAudio.loop = true;
        this.customAudio.preload = 'auto';
        this.customAudio.volume = 0.75;
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

  private listeners: Set<(playing: boolean) => void> = new Set();

  public subscribe(listener: (playing: boolean) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlaying));
  }

  public async start(): Promise<boolean> {
    try {
      this.initContext();
      this.isPlaying = true;
      this.notify();

      if (!this.customAudio && typeof window !== 'undefined') {
        this.customAudio = new Audio(this.tracks[this.currentTrack]);
        this.customAudio.loop = true;
      }

      if (this.customAudio) {
        this.customAudio.volume = 0.75;
        await this.customAudio.play();
      }
      return true;
    } catch (e) {
      console.warn('Audio playback notice:', e);
      return false;
    }
  }

  public stop() {
    this.isPlaying = false;
    this.notify();
    if (this.customAudio) {
      this.customAudio.pause();
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

  public setTrack(track: 'piano' | 'vocal') {
    this.currentTrack = track;
    const wasPlaying = this.isPlaying;
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.src = this.tracks[track];
      this.customAudio.load();
      if (wasPlaying) {
        this.customAudio.play().catch(() => {});
      }
    }
  }

  public getCurrentTrack(): 'piano' | 'vocal' {
    return this.currentTrack;
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
