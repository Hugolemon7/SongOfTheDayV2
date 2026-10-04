import React, { useState, useEffect, useRef } from 'react';
import { getAudio, playClick, playDrum, playChord } from '../audio/engine';
import { hitsAt } from '../audio/patterns';

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

// El metrónomo empieza apagado
const INITIAL_MUTE = { click: true, drums: false, chords: false };

export default function AudioEngine({ bpm, setBpm, chords, genre, genreLabel, onChordChange, subject = 'la idea' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mute, setMute] = useState(INITIAL_MUTE);
  const [beat, setBeat] = useState(-1);
  const [audioError, setAudioError] = useState(null);

  // El planificador lee siempre los valores actuales sin reiniciarse
  const liveRef = useRef({ bpm, chords, genre, mute, onChordChange });
  useEffect(() => {
    liveRef.current = { bpm, chords, genre, mute, onChordChange };
  });

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    try {
      getAudio();
      setAudioError(null);
      setIsPlaying(true);
    } catch {
      setAudioError('Tu navegador no puede reproducir audio. Prueba con una versión reciente de Chrome, Safari o Firefox.');
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const { ctx } = getAudio();
    const queue = [];
    let step = 0;
    let bar = 0;
    let nextTime = ctx.currentTime + 0.05;

    const schedule = () => {
      const { bpm, chords, genre, mute } = liveRef.current;
      const sixteenth = 60 / bpm / 4;
      while (nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
        const chordIdx = chords.length > 0 ? bar % chords.length : -1;
        if (step % 4 === 0 && !mute.click) playClick(nextTime, step === 0);
        if (!mute.drums) {
          for (const { voice, velocity } of hitsAt(genre, step)) playDrum(voice, nextTime, velocity);
        }
        if (step === 0 && chordIdx >= 0 && !mute.chords) {
          playChord(nextTime, chords[chordIdx], sixteenth * STEPS_PER_BAR);
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

  const toggleMute = (id) => setMute((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? `Detener ${subject}` : `Reproducir ${subject}`}
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

      {/* Pistas: pulsar para activar o silenciar */}
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
            <span className="truncate">{label}{id === 'drums' && genreLabel ? <span className="hidden sm:inline"> · {genreLabel}</span> : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
