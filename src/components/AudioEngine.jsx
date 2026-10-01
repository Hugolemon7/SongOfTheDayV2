import React, { useState, useEffect, useRef } from 'react';
import { getChordFrequencies } from '../data/musicData';

export const MIN_BPM = 60;
export const MAX_BPM = 180;

// Programación anticipada sobre el reloj del AudioContext: setInterval solo
// despierta al planificador, los sonidos se agendan con tiempo exacto.
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;
const STEPS_PER_BAR = 16;

const MUTE_TOGGLES = [
  { id: 'click', label: 'Metrónomo' },
  { id: 'drums', label: 'Beat' },
  { id: 'chords', label: 'Acordes' }
];

const STEP_BUTTON = 'w-9 h-9 rounded-lg border border-console-line text-console-text font-mono hover:bg-console-2 disabled:opacity-30 disabled:hover:bg-transparent';

function playClick(ctx, out, time, isDownbeat) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, time);
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.connect(gain).connect(out);
  osc.start(time);
  osc.stop(time + 0.05);
}

function playDrums(ctx, out, noise, time, step, genre) {
  const isKick = step === 0 || step === 8 || (genre === 'Punk' && step % 4 === 0);
  const isSnare = step === 4 || step === 12;
  const isHiHat = step % 2 === 0;

  if (isKick) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  if (isSnare) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    src.connect(filter).connect(gain).connect(out);
    src.start(time);
    src.stop(time + 0.1);
  }

  if (isHiHat) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(8000, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + 0.04);
  }
}

// Pad sostenido durante todo el compás
function playChord(ctx, out, time, chord, duration) {
  getChordFrequencies(chord).forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.07, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.95);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + duration);
  });
}

export default function AudioEngine({ bpm, setBpm, chords, genre, onChordChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mute, setMute] = useState({ click: false, drums: false, chords: false });
  const [beat, setBeat] = useState(-1);
  const [audioError, setAudioError] = useState(null);

  const audioRef = useRef(null); // { ctx, out, noise }
  // El planificador lee siempre los valores actuales sin reiniciarse
  const liveRef = useRef({ bpm, chords, genre, mute, onChordChange });
  useEffect(() => {
    liveRef.current = { bpm, chords, genre, mute, onChordChange };
  });

  const ensureAudio = () => {
    if (!audioRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('unsupported');
      const ctx = new AudioCtx();
      const out = ctx.createGain();
      out.gain.value = 0.8;
      out.connect(ctx.destination);
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      audioRef.current = { ctx, out, noise };
    }
    if (audioRef.current.ctx.state === 'suspended') audioRef.current.ctx.resume();
    return audioRef.current;
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    try {
      ensureAudio();
      setAudioError(null);
      setIsPlaying(true);
    } catch {
      setAudioError('Tu navegador no puede reproducir audio. Prueba con una versión reciente de Chrome, Safari o Firefox.');
    }
  };

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;
    const { ctx, out, noise } = audioRef.current;
    const queue = [];
    let step = 0;
    let bar = 0;
    let nextTime = ctx.currentTime + 0.05;

    const schedule = () => {
      const { bpm, chords, genre, mute } = liveRef.current;
      const sixteenth = 60 / bpm / 4;
      while (nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
        const chordIdx = chords.length > 0 ? bar % chords.length : -1;
        if (step % 4 === 0 && !mute.click) playClick(ctx, out, nextTime, step === 0);
        if (!mute.drums) playDrums(ctx, out, noise, nextTime, step, genre);
        if (step === 0 && chordIdx >= 0 && !mute.chords) {
          playChord(ctx, out, nextTime, chords[chordIdx], sixteenth * STEPS_PER_BAR);
        }
        queue.push({ time: nextTime, beat: Math.floor(step / 4), chordIdx });
        nextTime += sixteenth;
        step = (step + 1) % STEPS_PER_BAR;
        if (step === 0) bar++;
      }
    };

    let raf;
    const draw = () => {
      let current;
      while (queue.length && queue[0].time <= ctx.currentTime) current = queue.shift();
      if (current) {
        setBeat(current.beat);
        liveRef.current.onChordChange?.(current.chordIdx);
      }
      raf = requestAnimationFrame(draw);
    };

    schedule();
    const timer = setInterval(schedule, LOOKAHEAD_MS);
    raf = requestAnimationFrame(draw);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(raf);
      setBeat(-1);
      liveRef.current.onChordChange?.(-1);
    };
  }, [isPlaying]);

  // Liberar el dispositivo de audio al salir de la pantalla
  useEffect(() => () => {
    audioRef.current?.ctx.close();
    audioRef.current = null;
  }, []);

  const toggleMute = (id) => setMute((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Detener la maqueta' : 'Reproducir la maqueta'}
          className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-rec text-white shadow-[0_0_32px_-6px_var(--color-rec)]'
              : 'bg-console-text text-console hover:scale-105'
          }`}
        >
          {isPlaying ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-7 h-7 translate-x-[2px]"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-console-mute">Tempo</span>
            {/* Indicador visual de Beat */}
            <div className="flex gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                    beat === b
                      ? b === 0
                        ? 'bg-rec shadow-[0_0_10px_var(--color-rec)]'
                        : 'bg-signal shadow-[0_0_10px_var(--color-signal)]'
                      : 'bg-console-line'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-3xl font-semibold tabular-nums" aria-live="polite">{bpm}</span>
            <span className="font-mono text-xs font-medium text-signal">BPM</span>

            {/* Ajuste de BPM en intervalos de 5 en 5 */}
            <div className="flex gap-1 ml-1">
              <button
                onClick={() => setBpm((prev) => Math.max(MIN_BPM, prev - 5))}
                disabled={bpm <= MIN_BPM}
                aria-label="Bajar 5 BPM"
                className={STEP_BUTTON}
              >
                −
              </button>
              <button
                onClick={() => setBpm((prev) => Math.min(MAX_BPM, prev + 5))}
                disabled={bpm >= MAX_BPM}
                aria-label="Subir 5 BPM"
                className={STEP_BUTTON}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {audioError && (
        <p role="alert" className="text-sm font-medium text-[#ff8a73]">{audioError}</p>
      )}

      {/* Pistas: pulsar para silenciar */}
      <div role="group" aria-label="Pistas" className="grid grid-cols-3 gap-2">
        {MUTE_TOGGLES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => toggleMute(id)}
            aria-pressed={!mute[id]}
            className={`min-w-0 py-2.5 px-1.5 rounded-lg border text-[11px] sm:text-sm font-semibold leading-tight flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
              mute[id]
                ? 'border-console-line text-console-mute line-through'
                : 'border-console-line bg-console-2 text-console-text hover:border-console-mute'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-1.5 h-1.5 shrink-0 rounded-full ${mute[id] ? 'bg-console-line' : 'bg-signal shadow-[0_0_6px_var(--color-signal)]'}`}
            />
            <span className="truncate">{label}{id === 'drums' && genre ? <span className="hidden sm:inline"> · {genre}</span> : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
