// Motor de audio compartido: un solo AudioContext para la consola, las vistas previas
// de acordes y la grabación (que puede mezclar la voz con la base).
import { getChordFrequencies } from '../data/musicData';

let audio = null;

export function isAudioSupported() {
  return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
}

// Crear o reanudar el contexto; llamar siempre desde un gesto del usuario
export function getAudio() {
  if (!audio) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) throw new Error('unsupported');
    const ctx = new AudioCtx();
    const out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(ctx.destination);
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    audio = { ctx, out, noise };
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio;
}

// ── Voces ────────────────────────────────────────────────────────────

function envelope(ctx, time, peak, decay) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  return gain;
}

function noiseHit(time, { peak, decay, type, frequency, q = 1 }) {
  const { ctx, out, noise } = audio;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = envelope(ctx, time, peak, decay);
  src.connect(filter).connect(gain).connect(out);
  src.start(time);
  src.stop(time + decay + 0.02);
}

function toneHit(time, { peak, decay, frequency, endFrequency, type = 'sine' }) {
  const { ctx, out } = audio;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, time);
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, time + decay);
  const gain = envelope(ctx, time, peak, decay);
  osc.connect(gain).connect(out);
  osc.start(time);
  osc.stop(time + decay + 0.02);
}

const VOICES = {
  kick: (t, v) => toneHit(t, { peak: 0.55 * v, decay: 0.16, frequency: 140, endFrequency: 42 }),
  snare: (t, v) => {
    noiseHit(t, { peak: 0.26 * v, decay: 0.12, type: 'highpass', frequency: 1200 });
    toneHit(t, { peak: 0.1 * v, decay: 0.07, frequency: 190, type: 'triangle' });
  },
  rim: (t, v) => {
    noiseHit(t, { peak: 0.18 * v, decay: 0.03, type: 'bandpass', frequency: 2400, q: 4 });
    toneHit(t, { peak: 0.08 * v, decay: 0.03, frequency: 1700, type: 'triangle' });
  },
  hat: (t, v) => noiseHit(t, { peak: 0.07 * v, decay: 0.035, type: 'highpass', frequency: 7500 }),
  open: (t, v) => noiseHit(t, { peak: 0.06 * v, decay: 0.25, type: 'highpass', frequency: 7000 }),
  shaker: (t, v) => noiseHit(t, { peak: 0.06 * v, decay: 0.05, type: 'bandpass', frequency: 5500, q: 1.5 })
};

export function playDrum(voice, time, velocity) {
  VOICES[voice]?.(time, velocity);
}

export function playClick(time, isDownbeat) {
  toneHit(time, { peak: 0.2, decay: 0.04, frequency: isDownbeat ? 1200 : 800, type: 'square' });
}

// Pad sostenido; `duration` en segundos
export function playChord(time, chord, duration, peak = 0.07) {
  const { ctx, out } = audio;
  getChordFrequencies(chord).forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.95);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + duration);
  });
}

// Vista previa: escuchar un acorde o una progresión corta al tocarla
export function previewChords(chords, secondsEach = 0.7) {
  try {
    const { ctx } = getAudio();
    const start = ctx.currentTime + 0.03;
    chords.forEach((chord, i) => playChord(start + i * secondsEach, chord, secondsEach, 0.09));
    return true;
  } catch {
    return false;
  }
}

// ── Grabación ────────────────────────────────────────────────────────

// Mezcla el micrófono (y opcionalmente la base) en un stream grabable
export function createRecordingMix(micStream, includeBase) {
  const { ctx, out } = getAudio();
  const dest = ctx.createMediaStreamDestination();
  const mic = ctx.createMediaStreamSource(micStream);
  mic.connect(dest);
  if (includeBase) out.connect(dest);
  return {
    stream: dest.stream,
    dispose() {
      mic.disconnect();
      if (includeBase) {
        try { out.disconnect(dest); } catch { /* ya desconectado */ }
      }
    }
  };
}

// Convierte la grabación (webm/mp4) a WAV PCM de 16 bits, mono
export async function toWav(blob) {
  const { ctx } = getAudio();
  const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
  const length = buffer.length;
  const channels = buffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }

  const sampleRate = buffer.sampleRate;
  const view = new DataView(new ArrayBuffer(44 + length * 2));
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}
