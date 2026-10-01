import React, { useState, useEffect, useRef } from 'react';
import AudioEngine from './components/AudioEngine';
import VoiceRecorder from './components/VoiceRecorder';
import { SINONIMOS_DB, getKeyDisplay, transposeProgression } from './data/musicData';
import { ALL_PILLARS, buildScenario, buildDailyScenario, dayOfYear, formatLongDate } from './data/scenario';

const PILLARS = [
  { id: 'sentimiento', label: 'Sentimiento' },
  { id: 'objeto', label: 'Objeto' },
  { id: 'color', label: 'Color' },
  { id: 'fecha', label: 'Fecha' },
  { id: 'concepto', label: 'Concepto' },
  { id: 'tonalidad', label: 'Tonalidad' },
  { id: 'progresion', label: 'Progresión' },
  { id: 'genero', label: 'Género' }
];

// Etiqueta de sección compartida (lectura tipo consola)
const EYEBROW = 'font-mono text-[11px] font-medium uppercase tracking-[0.16em]';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Marca con rotulador las palabras sorteadas dentro de una frase
function Highlighted({ text, words }) {
  const list = words.filter(Boolean);
  if (list.length === 0) return text;
  const alternatives = [...list].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
  const pattern = new RegExp(`(?<!\\p{L})(${alternatives})(?!\\p{L})`, 'gu');
  return text.split(pattern).map((part, i) =>
    list.includes(part) ? <mark key={i} className="marker">{part}</mark> : part
  );
}

function Title({ size }) {
  return (
    <h1 className={`font-display font-semibold tracking-tight text-ink whitespace-nowrap ${size}`} style={{ fontVariationSettings: '"opsz" 144' }}>
      Song <em className="font-normal italic text-rec">of the</em> day
    </h1>
  );
}

export default function App() {
  // Estado de Selección de Pilares (Pantalla Inicio)
  const [activePillars, setActivePillars] = useState(ALL_PILLARS);
  // Fecha mostrada en el inicio; se refresca al volver para cubrir el cambio de medianoche
  const [today, setToday] = useState(() => new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [scenario, setScenario] = useState(null); // null = Pantalla Inicio
  const [keyState, setKeyState] = useState({ rootIndex: 0, isMinor: false });
  const [bpm, setBpm] = useState(115);
  const [copyStatus, setCopyStatus] = useState(null); // null | 'ok' | 'error'
  const [activeChord, setActiveChord] = useState(-1);
  const copyTimerRef = useRef(null);
  const generateTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(copyTimerRef.current);
    clearTimeout(generateTimerRef.current);
  }, []);

  // Una idea libre pendiente no debe aparecer si la persona ya navegó a otro sitio
  const cancelPendingGenerate = () => {
    clearTimeout(generateTimerRef.current);
    setIsLoading(false);
  };

  const togglePillar = (key) => {
    setActivePillars(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Aplica un escenario ya construido (diario o libre) a la pantalla de resultados
  const applyScenario = (next) => {
    setKeyState(next.key);
    setBpm(next.bpm);
    setActiveChord(-1);
    setCopyStatus(null);
    setScenario(next);
  };

  const goToPillars = () => {
    cancelPendingGenerate();
    setToday(new Date());
    setScenario(null);
  };

  // Escenario del día: determinista e instantáneo, sin pantalla de carga
  const openDaily = () => {
    cancelPendingGenerate();
    const now = new Date();
    setToday(now);
    applyScenario(buildDailyScenario(now));
    window.scrollTo({ top: 0 });
  };

  // Idea libre: aleatoria y respetando los pilares elegidos
  const handleGenerate = () => {
    clearTimeout(generateTimerRef.current);
    setIsLoading(true);
    generateTimerRef.current = setTimeout(() => {
      applyScenario({ ...buildScenario(Math.random, activePillars), source: 'free' });
      setIsLoading(false);
    }, 600); // Carga fluida de 600ms
  };

  const currentChords = scenario 
    ? transposeProgression(scenario.progresionObj.numerales, keyState.rootIndex, keyState.isMinor)
    : [];

  const synonymGroups = scenario
    ? [scenario.sentimiento, scenario.objeto, scenario.concepto]
        .filter(Boolean)
        .map(word => ({ word, syns: SINONIMOS_DB[word] || [] }))
        .filter(group => group.syns.length > 0)
    : [];

  const transpose = (semitones) => {
    setKeyState(prev => ({ ...prev, rootIndex: (prev.rootIndex + semitones + 12) % 12 }));
  };

  const copyToClipboard = async () => {
    if (!scenario) return;
    const lines = [
      '🎵 SONG OF THE DAY 🎵',
      scenario.source === 'daily' ? `Escenario del día Nº ${scenario.number} · ${scenario.dateLabel}` : null,
      '',
      'ESCENARIO:',
      scenario.partGenre || null,
      scenario.partCore,
      scenario.partContext,
      '',
      `• Tonalidad: ${getKeyDisplay(keyState.rootIndex, keyState.isMinor)}`,
      `• Progresión: ${scenario.progresionObj.name} (${currentChords.map(c => c.name).join(' - ')})`,
      scenario.generoObj ? `• Género: ${scenario.generoObj.name} (${bpm} BPM)` : `• Tempo: ${bpm} BPM`
    ].filter(line => line !== null);

    clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyStatus('ok');
    } catch {
      setCopyStatus('error');
    }
    copyTimerRef.current = setTimeout(() => setCopyStatus(null), 2500);
  };

  const pillarTags = scenario
    ? [
        { label: 'Sentimiento', value: scenario.sentimiento },
        { label: 'Objeto', value: scenario.objeto },
        { label: 'Color', value: scenario.color },
        { label: 'Fecha', value: scenario.fecha },
        { label: 'Concepto', value: scenario.concepto },
        { label: 'Género', value: scenario.generoObj?.name }
      ].filter(tag => tag.value)
    : [];

  return (
    <div className="min-h-screen paper-ruled text-ink font-sans px-4 py-6 md:px-8 md:py-10 flex flex-col items-center">

      {/* Cabecera: completa en el inicio, compacta con navegación en resultados */}
      {scenario ? (
        <header className="max-w-2xl w-full flex items-center justify-between gap-3 mb-10 md:mb-14">
          <Title size="text-xl md:text-2xl" />
          <nav className="flex items-center gap-1 whitespace-nowrap">
            <button
              onClick={goToPillars}
              aria-label="Volver a configurar pilares"
              className="text-sm font-semibold text-ink-soft hover:text-ink rounded-full px-3 py-2 transition-colors"
            >
              ←<span className="hidden sm:inline"> Pilares</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-sm font-semibold text-ink bg-paper-hi border-2 border-ink rounded-full px-4 py-1.5 shadow-[3px_3px_0_var(--color-ink)] hover:shadow-[1px_1px_0_var(--color-ink)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:cursor-wait disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_var(--color-ink)]"
            >
              {isLoading ? 'Generando…' : '↻ Otra idea'}
            </button>
          </nav>
        </header>
      ) : (
        <header className="max-w-2xl w-full mt-6 md:mt-12 mb-10 md:mb-14">
          <p className={EYEBROW + ' text-ink-mute'}>{formatLongDate(today)}</p>
          <Title size="text-[3.25rem] leading-[0.95] sm:text-7xl md:text-8xl mt-3" />
          <p className="text-ink-soft text-base md:text-lg mt-4 max-w-md">
            Generador de ideas y maquetas de composición
          </p>
        </header>
      )}

      {/* PANTALLA DE CARGA (solo la primera vez; al regenerar se atenúa el resultado) */}
      {isLoading && !scenario && (
        <div className="flex-1 flex flex-col items-center justify-center my-20 gap-5" role="status">
          <div className="flex items-end gap-1.5 h-10" aria-hidden="true">
            {[0, 1, 2, 3, 4].map(i => (
              <span key={i} className="w-2 h-full bg-rec rounded-sm origin-bottom animate-meter" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <p className={EYEBROW + ' text-ink-soft'}>Mezclando elementos creativos…</p>
        </div>
      )}

      {/* PANTALLA 1: SELECCIÓN DE PILARES (INICIO) */}
      {!isLoading && !scenario && (
        <main className="max-w-2xl w-full flex flex-col gap-8 animate-fade-in">
          {/* Escenario del día: el mismo para todos en la misma fecha local */}
          <button
            onClick={openDaily}
            className="group w-full text-left rounded-2xl bg-ink text-paper border-2 border-ink p-5 md:p-6 flex items-center justify-between gap-4 shadow-[5px_5px_0_var(--color-rec)] hover:shadow-[2px_2px_0_var(--color-rec)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all"
          >
            <span className="min-w-0">
              <span className={EYEBROW + ' text-signal block'}>Hoy · Nº {dayOfYear(today)}</span>
              <span className="block font-display text-2xl md:text-3xl font-semibold mt-1.5">Escenario del día</span>
              <span className="block text-sm text-paper/70 mt-1">El mismo para todos hoy, listo para tocar.</span>
            </span>
            <span aria-hidden="true" className="text-3xl text-rec shrink-0 transition-transform group-hover:translate-x-1">→</span>
          </button>

          <div className="border-t border-rule pt-8">
            <p className={EYEBROW + ' text-ink-mute mb-2'}>O una idea libre</p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink text-balance">Selecciona los pilares a aleatorizar</h2>
            <p className="text-sm text-ink-soft mt-1.5">Elige los elementos que quieres incluir en tu propuesta creativa de hoy.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PILLARS.map((pillar, idx) => (
              <label
                key={pillar.id}
                className={`relative rounded-lg border-2 px-3 py-3 flex flex-col gap-4 cursor-pointer select-none transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-rec ${
                  activePillars[pillar.id]
                    ? 'bg-ink border-ink text-paper'
                    : 'bg-paper-hi/60 border-dashed border-rule text-ink-mute hover:border-ink-mute'
                }`}
              >
                <input
                  type="checkbox"
                  checked={activePillars[pillar.id]}
                  onChange={() => togglePillar(pillar.id)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between font-mono text-[11px]">
                  <span className={activePillars[pillar.id] ? 'text-signal' : ''}>{String(idx + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true">{activePillars[pillar.id] ? '●' : '○'}</span>
                </span>
                <span className="font-semibold text-sm">{pillar.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-rec hover:bg-rec-deep text-white text-lg font-semibold px-9 py-4 border-2 border-ink shadow-[5px_5px_0_var(--color-ink)] hover:shadow-[2px_2px_0_var(--color-ink)] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all"
            >
              Generar escenario <span aria-hidden="true">→</span>
            </button>
          </div>
        </main>
      )}

      {/* PANTALLA 2: RESULTADOS — escenario (papel), maqueta (consola), inspiración */}
      {scenario && (
        <main
          aria-busy={isLoading}
          className={`max-w-2xl w-full flex flex-col gap-12 md:gap-16 mb-12 transition-opacity ${
            isLoading ? 'opacity-40 pointer-events-none' : 'animate-fade-in'
          }`}
        >

          {/* 1. Escenario */}
          <section aria-labelledby="titulo-escenario" className="flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="titulo-escenario" className={EYEBROW + ' text-rec-deep'}>
                  {scenario.source === 'daily' ? (
                    <>Escenario del día · Nº {scenario.number}{' '}<span className="text-ink-mute block sm:inline mt-1 sm:mt-0"><span className="hidden sm:inline">· </span>{scenario.dateLabel}</span></>
                  ) : (
                    'Idea libre'
                  )}
                </h2>
                {scenario.source === 'free' && (
                  <button
                    onClick={openDaily}
                    className="text-sm font-semibold text-ink underline decoration-rec decoration-2 underline-offset-4 hover:decoration-[3px]"
                  >
                    Ver el escenario de hoy →
                  </button>
                )}
              </div>
              {scenario.partGenre && (
                <p className="text-sm font-semibold text-ink-soft">
                  <Highlighted text={scenario.partGenre} words={[scenario.generoObj?.name]} />
                </p>
              )}
              <p
                className="font-display text-[1.85rem] md:text-[2.6rem] leading-[1.12] font-medium tracking-tight text-ink text-pretty"
                style={{ fontVariationSettings: '"opsz" 96' }}
              >
                <Highlighted text={scenario.partCore} words={[scenario.sentimiento, scenario.concepto]} />
              </p>
              <p className="text-lg md:text-xl text-ink-soft leading-relaxed text-pretty max-w-[58ch]">
                <Highlighted text={scenario.partContext} words={[scenario.objeto, scenario.color, scenario.fecha]} />
              </p>
            </div>

            {pillarTags.length > 0 && (
              <dl className="flex flex-wrap gap-2">
                {pillarTags.map(tag => (
                  <div key={tag.label} className="flex items-baseline gap-2 rounded-md bg-paper-hi border border-rule px-2.5 py-1.5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">{tag.label}</dt>
                    <dd className="text-sm font-semibold text-ink">{tag.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                onClick={copyToClipboard}
                className="text-sm font-semibold text-ink underline decoration-rec decoration-2 underline-offset-4 hover:decoration-[3px]"
              >
                {copyStatus === 'ok' ? '✓ Copiado al portapapeles' : 'Copiar escenario'}
              </button>
              <p aria-live="polite" className="text-sm font-semibold text-rec-deep">
                {copyStatus === 'error' && 'No se pudo copiar. Selecciona el texto y cópialo manualmente.'}
              </p>
            </div>
          </section>

          {/* 2. Maqueta: la consola */}
          <section
            aria-labelledby="titulo-maqueta"
            style={{ colorScheme: 'dark' }}
            className="bg-console text-console-text rounded-[28px] p-5 md:p-8 flex flex-col gap-7 shadow-[0_30px_60px_-28px_rgba(27,23,20,0.75)] ring-1 ring-black/40"
          >
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <h2 id="titulo-maqueta" className={EYEBROW + ' text-signal'}>
                  <span aria-hidden="true">● </span>Maqueta
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <p className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
                    <span className="sr-only">Tonalidad: </span>
                    {getKeyDisplay(keyState.rootIndex, keyState.isMinor)}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => transpose(-1)} aria-label="Bajar un semitono" className="w-9 h-9 rounded-lg border border-console-line text-console-text font-mono hover:bg-console-2">−</button>
                    <button onClick={() => transpose(1)} aria-label="Subir un semitono" className="w-9 h-9 rounded-lg border border-console-line text-console-text font-mono hover:bg-console-2">+</button>
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs text-console-mute">
                {scenario.progresionObj.name} · {currentChords.length} compases
              </p>
            </div>

            {/* Un compás por acorde */}
            <ol
              aria-label="Progresión de acordes"
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(4, currentChords.length)}, minmax(0, 1fr))` }}
            >
              {currentChords.map((chord, idx) => (
                <li
                  key={idx}
                  aria-current={idx === activeChord ? 'true' : undefined}
                  className={`relative rounded-xl border py-4 md:py-5 text-center font-mono text-lg md:text-xl font-semibold transition-all duration-150 ${
                    idx === activeChord
                      ? 'bg-rec border-rec text-white shadow-[0_0_28px_-4px_var(--color-rec)]'
                      : 'bg-console-2 border-console-line text-console-text'
                  }`}
                >
                  <span aria-hidden="true" className={`absolute left-2 top-1.5 text-[10px] font-medium ${idx === activeChord ? 'text-white/70' : 'text-console-mute'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {chord.name}
                </li>
              ))}
            </ol>

            <div className="border-t border-console-line pt-6">
              <AudioEngine
                bpm={bpm}
                setBpm={setBpm}
                chords={currentChords}
                genre={scenario.generoObj?.name ?? null}
                onChordChange={setActiveChord}
              />
            </div>

            <div className="border-t border-console-line pt-6">
              <VoiceRecorder />
            </div>
          </section>

          {/* 3. Inspiración lírica (solo si hay sinónimos para las palabras elegidas) */}
          {synonymGroups.length > 0 && (
            <section aria-labelledby="titulo-inspiracion" className="flex flex-col gap-4">
              <h2 id="titulo-inspiracion" className={EYEBROW + ' text-ink-mute'}>Inspiración lírica</h2>
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                {synonymGroups.map(({ word, syns }) => (
                  <div key={word} className="bg-paper-hi border border-rule rounded-lg p-4 shadow-[0_1px_0_var(--color-rule)]">
                    <p className="font-display italic text-xl text-ink first-letter:uppercase mb-1.5">{word}</p>
                    <p className="text-sm text-ink-soft leading-relaxed">{syns.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
