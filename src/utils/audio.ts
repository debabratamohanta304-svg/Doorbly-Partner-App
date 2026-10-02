// Doorbly Partner App Web Audio Synthesizer
// Provides the signature Doorbly alert ringtone and tactile sound feedback

class DoorblyAudioEngine {
  private ctx: AudioContext | null = null;
  private alertInterval: any = null;
  private isAlerting = false;
  private soundEnabled = true;

  constructor() {
    // Lazy init audio context on user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopIncomingAlert();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Play a single synthesized chime note
  private playNote(freq: number, type: OscillatorType = 'triangle', duration = 0.25, gainLevel = 0.2) {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Signature Doorbly Dispatch Ringtone: 4 melodious, urgent yet pleasant ascending tones
  public playIncomingAlert() {
    if (!this.soundEnabled || this.isAlerting) return;
    this.isAlerting = true;

    const playSequence = () => {
      if (!this.isAlerting) return;
      // Doorbly signature notes: E5 (659Hz) -> G5 (784Hz) -> B5 (987Hz) -> E6 (1318Hz)
      const notes = [
        { f: 659, delay: 0 },
        { f: 784, delay: 100 },
        { f: 987, delay: 200 },
        { f: 1318, delay: 320 },
      ];

      notes.forEach(({ f, delay }) => {
        setTimeout(() => {
          if (this.isAlerting) {
            this.playNote(f, 'sine', 0.22, 0.25);
          }
        }, delay);
      });
    };

    playSequence();
    this.alertInterval = setInterval(playSequence, 1200);
  }

  public stopIncomingAlert() {
    this.isAlerting = false;
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
  }

  // Work Accepted Sound (Positive 2-tone chime)
  public playAcceptChime() {
    if (!this.soundEnabled) return;
    this.stopIncomingAlert();
    setTimeout(() => this.playNote(523.25, 'triangle', 0.15, 0.2), 0); // C5
    setTimeout(() => this.playNote(783.99, 'sine', 0.35, 0.25), 120); // G5
  }

  // Payment / Job Completed Sound (Fanfare chord)
  public playPaymentSuccessChime() {
    if (!this.soundEnabled) return;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
    chords.forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 'triangle', 0.3, 0.22), idx * 80);
    });
  }

  // Work Started Sound (Clock tick chime)
  public playStartWorkChime() {
    if (!this.soundEnabled) return;
    this.playNote(440, 'sine', 0.1, 0.15);
    setTimeout(() => this.playNote(880, 'sine', 0.2, 0.2), 100);
  }

  // Subdued tactile tap click
  public playClickSound() {
    if (!this.soundEnabled) return;
    this.playNote(320, 'triangle', 0.04, 0.08);
  }
}

export const doorblyAudio = new DoorblyAudioEngine();
