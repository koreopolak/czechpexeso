/**
 * Sound effects synthesised with the Web Audio API — no audio files to load
 * or license. Every sound is short and soft so it never gets annoying.
 */
type Wave = OscillatorType;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, at: number, dur: number, opts: { type?: Wave; gain?: number; to?: number } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
  const peak = opts.gain ?? 0.12;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  flip() {
    tone(540, 0, 0.07, { type: "triangle", gain: 0.07, to: 380 });
  },
  match() {
    tone(659.25, 0, 0.14, { gain: 0.11 });
    tone(987.77, 0.08, 0.22, { gain: 0.1 });
  },
  mismatch() {
    tone(233, 0, 0.16, { type: "triangle", gain: 0.08, to: 196 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.5 : 0.18, { gain: 0.1 }));
  },
  /** Browsers only allow audio after a user gesture; call this from a click. */
  unlock() {
    audio();
  },
};

export type SoundName = Exclude<keyof typeof sfx, "unlock">;
