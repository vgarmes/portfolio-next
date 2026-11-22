/**
 * Key-press sounds, synthesized with the Web Audio API (no audio files).
 *
 * Adapted from the button sounds in Shu Ding's spec-01
 * (https://github.com/shuding/spec-01, registry/hardware/lib/sound.ts),
 * MIT licensed. A key sounds in two parts, as a switch does: a thock as it
 * goes down (on the press, so nothing lags) and a lighter click as it comes
 * back up (on the click). Each play varies its pitch and level a little, as
 * no two presses of a real switch sound alike.
 */

export type Voice = "down" | "up";

// One context for the page, made on the first sound: browsers only let a
// page start audio inside a user gesture, which every sound here follows.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  // A context the browser closed is replaced.
  if (ctx?.state === "closed") ctx = null;
  if (!ctx) {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Context) return null;
    ctx = new Context({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    // Half a second of white noise, the raw material of every click.
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  // Not only "suspended": Safari parks a context as "interrupted" in the
  // background and never resumes it on its own.
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  return ctx;
}

const vary = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

// A burst of filtered noise: the contact of plastic on plastic.
function burst(
  c: AudioContext,
  out: AudioNode,
  at: number,
  {
    freq,
    q = 1,
    level,
    decay,
  }: { freq: number; q?: number; level: number; decay: number },
) {
  const source = c.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = vary(0.1);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq * vary(0.06);
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level * vary(0.15), at + 0.0008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  source.connect(filter).connect(gain).connect(out);
  source.start(at, Math.random() * 0.4);
  source.stop(at + decay + 0.02);
}

// A tone with a pitch drop and a fast decay: the key's body.
function tone(
  c: AudioContext,
  out: AudioNode,
  at: number,
  {
    freq,
    to = freq,
    level,
    decay,
  }: { freq: number; to?: number; level: number; decay: number },
) {
  const osc = c.createOscillator();
  osc.type = "sine";
  const f = freq * vary(0.04);
  osc.frequency.setValueAtTime(f, at);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(20, (to / freq) * f),
    at + decay,
  );
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level * vary(0.12), at + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

const voices: Record<
  Voice,
  (c: AudioContext, out: AudioNode, at: number) => void
> = {
  // A key bottoming out: a click on top of a short, falling body.
  down: (c, out, at) => {
    burst(c, out, at, { freq: 2600, q: 0.9, level: 0.32, decay: 0.022 });
    tone(c, out, at, { freq: 210, to: 130, level: 0.4, decay: 0.05 });
  },
  // The key returning: lighter and higher.
  up: (c, out, at) => {
    burst(c, out, at, { freq: 3900, q: 1.2, level: 0.16, decay: 0.012 });
    tone(c, out, at, { freq: 300, to: 240, level: 0.1, decay: 0.018 });
  },
};

export function play(voice: Voice) {
  const c = audio();
  if (!c || !master) return;
  voices[voice](c, master, c.currentTime + 0.002);
}
