// Web Audio API Ambient Music Box & Chime Generator
// Provides continuous, dreamy, romantic soundscapes without external audio dependencies.

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  // Warm chord progression notes
  private chordProgressions = [
    [261.63, 329.63, 392.0, 523.25], // C maj
    [220.0, 261.63, 329.63, 440.0],  // A min
    [174.61, 220.0, 261.63, 349.23], // F maj
    [196.0, 246.94, 293.66, 392.0],  // G maj
  ];

  private currentChordIndex = 0;

  constructor() {
    // Check if custom audio exists
    try {
      this.customAudio = new Audio('/assets/music.mp3');
      this.customAudio.loop = true;
      this.customAudio.volume = 0.5;
    } catch {
      this.customAudio = null;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async start(): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return false;

      this.isPlaying = true;

      // Smooth fade in
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.35, now + 2.5);

      this.startMelodyLoop();
      return true;
    } catch (e) {
      console.warn('Audio autoplay prevented or error:', e);
      return false;
    }
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    setTimeout(() => {
      this.isPlaying = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }, 1300);
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

  // Play a soft bell/chime note (music box tone)
  public playChime(freq: number, duration: number = 2.0, gainAmount: number = 0.15) {
    if (!this.ctx || !this.masterGain || !this.isPlaying || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      // Sine wave with subtle harmonics for a crystalline music box timbre
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Delicate envelope
      const now = this.ctx.currentTime;
      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(gainAmount, now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (e) {
      console.warn('Chime playback error', e);
    }
  }

  // Play a sparkling sound effect for unlocking petals / surprises
  public playSparkle() {
    if (!this.ctx || !this.isPlaying) return;
    const sparklePitches = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    sparklePitches.forEach((pitch, i) => {
      setTimeout(() => {
        this.playChime(pitch, 1.2, 0.12);
      }, i * 70);
    });
  }

  // Play a tender harp strum when opening the letter
  public playHarpStrum() {
    if (!this.ctx || !this.isPlaying) return;
    const notes = [329.63, 392.0, 440.0, 523.25, 659.25, 880.0];
    notes.forEach((pitch, i) => {
      setTimeout(() => {
        this.playChime(pitch, 2.2, 0.14);
      }, i * 90);
    });
  }

  private startMelodyLoop() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Play initial gentle chord
    this.playChordPass();

    let step = 0;
    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying) return;

      // Every 8 beats, shift harmony
      if (step % 8 === 0) {
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chordProgressions.length;
        this.playChordPass();
      }

      // Random gentle music box chime from the current chord palette
      const currentChord = this.chordProgressions[this.currentChordIndex];
      const randomNote = currentChord[Math.floor(Math.random() * currentChord.length)];
      // 70% chance to play on each beat, creating natural organic lullaby rhythm
      if (Math.random() > 0.25) {
        const octaveShift = Math.random() > 0.5 ? 1 : 2;
        this.playChime(randomNote * octaveShift, 2.8, 0.08);
      }

      step++;
    }, 900);
  }

  private playChordPass() {
    const chord = this.chordProgressions[this.currentChordIndex];
    chord.forEach((freq, i) => {
      setTimeout(() => {
        this.playChime(freq, 4.0, 0.04);
      }, i * 160);
    });
  }
}

export const soundEngine = new AmbientSoundEngine();
