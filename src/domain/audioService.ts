class TacticalAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Geiger click for proximity hunt
   */
  playGeigerClick(volume = 0.15) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.02);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // AudioContext ignored if blocked
    }
  }

  /**
   * Radar sweep beam sound
   */
  playRadarSweep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch {
      // AudioContext ignored
    }
  }

  /**
   * Target blip detection sound when sweep beam hits contact
   */
  playRadarTargetBlip(freq = 1150, isThreat = false) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isThreat ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isThreat ? 1650 : freq, now);
      osc.frequency.exponentialRampToValueAtTime(isThreat ? 880 : freq * 0.7, now + 0.12);

      gain.gain.setValueAtTime(isThreat ? 0.22 : 0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // AudioContext ignored
    }
  }

  /**
   * Priority alert chirp (Watchlist or Drone detected)
   */
  playTacticalAlert(type: 'WATCHLIST' | 'CLASSIFIED' | 'IMMEDIATE' = 'CLASSIFIED') {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      const startF = type === 'IMMEDIATE' ? 2200 : type === 'WATCHLIST' ? 1800 : 1200;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.setValueAtTime(startF * 1.3, now + 0.08);
      osc.frequency.setValueAtTime(startF * 1.6, now + 0.16);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.27);
    } catch {
      // AudioContext ignored
    }
  }

  /**
   * Synthesized voice alerts using Web Speech API
   */
  speakTactical(text: string) {
    if (this.isMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech failure
    }
  }
}

export const audioService = new TacticalAudioService();
