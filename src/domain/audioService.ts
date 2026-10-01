import { AlertVoiceWhat } from '../types';

class TacticalAudioService {
  private ctx: AudioContext | null = null;
  private lastGeigerClick = 0;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * High-contrast tactical alert double-beep for watchlist/signature hits
   */
  playAlertBeep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // First chirp (high tone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1480, now);
      osc1.frequency.exponentialRampToValueAtTime(1920, now + 0.08);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Second chirp (even higher tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2100, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(2600, now + 0.22);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.25);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Geiger counter tick for hunt mode based on RSSI strength (-100 to -35 dBm)
   */
  tickHuntRssi(rssi: number) {
    const nowMs = Date.now();
    // Clamp RSSI between -100 and -35
    const clamped = Math.max(-100, Math.min(-35, rssi));
    const factor = (clamped - -100) / (-35 - -100); // 0 (weak) to 1 (max)
    // Delay: from 800ms (weak) down to 60ms (point blank)
    const minDelay = 800 - factor * 740;

    if (nowMs - this.lastGeigerClick < minDelay) {
      return;
    }
    this.lastGeigerClick = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Crisp click impulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + factor * 800, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.02);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // audio error handling
    }
  }

  /**
   * Radar sweep sound
   */
  playRadarSweep() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Web Speech alert for spoken warnings
   */
  speakWatchlistAlert(
    className: string,
    fleetName: string,
    what: AlertVoiceWhat
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let phrase = 'Alert.';
    if (what === 'CLASS') {
      phrase = `Alert. ${className}.`;
    } else if (what === 'SIGNATURE') {
      phrase = `Alert. ${fleetName}.`;
    } else {
      phrase = `Alert. ${className}. ${fleetName}.`;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 1.15;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

export const audioService = new TacticalAudioService();
