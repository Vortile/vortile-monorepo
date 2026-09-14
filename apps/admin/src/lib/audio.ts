/**
 * Web Audio API Chime Synthesizer for Kitchen & Delivery Orders
 * Generates pleasant, non-jarring chimes without external audio assets.
 */

export type ChimeType = "ding_dong" | "bell" | "energetic";

export interface PlayChimeOptions {
  volume?: number; // 0.0 to 1.0
  type?: ChimeType;
}

export const playOrderChime = ({ volume = 0.5, type = "ding_dong" }: PlayChimeOptions = {}) => {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.connect(ctx.destination);

    if (type === "ding_dong") {
      // First tone: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(volume * 0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Second tone: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.25);
      gain2.gain.setValueAtTime(volume * 0.9, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.1);
    } else if (type === "bell") {
      // Bell harmonic tone: 1046.50 Hz (C6) + octave harmonics
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, now);
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(2093, now);

      bellGain.gain.setValueAtTime(volume * 0.8, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(bellGain);
      subOsc.connect(bellGain);
      bellGain.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 1.2);
      subOsc.stop(now + 1.2);
    } else if (type === "energetic") {
      // Tri-tone ascending arpeggio: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(volume * 0.7, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    }
  } catch (err) {
    console.warn("[Audio] Could not play kitchen audio chime:", err);
  }
}
