import React, { useState } from 'react';
import { SECTION_TYPES, ENERGY_OPTIONS, getKeyName, getKeyDisplay, transposeProgression, GENEROS } from '../data/musicData';
import { previewChords } from '../audio/engine';
import { EYEBROW, TEXT_ACTION } from '../components/ui';
import { suggestionsFor } from './model';

const PAGE_SIZE = 3;

const STEPS = {
  new: ['seccion', 'tono', 'progresion', 'energia'],
  add: ['seccion', 'progresion']
};

const QUESTIONS = {
  seccion: { title: '¿Qué parte de la canción quieres crear?', help: 'Empieza por la que tengas más clara; luego puedes agregar las demás.' },
  tono: { title: '¿En qué tono está la canción?', help: 'Si no lo sabes, elige uno cómodo para tu voz o deja que te sorprendamos.' },
  progresion: { title: 'Elige una progresión', help: 'Tres sugerencias para esta sección. Escúchalas antes de decidir.' },
  energia: { title: '¿Cómo se siente la canción?', help: 'Define el tempo y el ritmo de partida. Podrás cambiarlos después.' }
};

const grooveName = (id) => GENEROS.find((g) => g.id === id)?.name ?? id;

// Tarjeta de opción: tinta cuando está elegida, papel cuando no
function OptionTile({ selected, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`text-left rounded-xl border-2 p-4 md:p-5 transition-colors ${
        selected
          ? 'bg-ink border-ink text-paper'
          : 'bg-paper-hi border-rule text-ink hover:border-ink'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function Quiz({ mode, projectKey, onCancel, onComplete }) {
  const steps = STEPS[mode];
  const [stepIndex, setStepIndex] = useState(0);
  const [type, setType] = useState(null);
  const [key, setKey] = useState(projectKey ?? { rootIndex: 0, isMinor: false });
  const [progression, setProgression] = useState(null);
  const [page, setPage] = useState(0);

  const step = steps[stepIndex];
  const question = QUESTIONS[step];
  const suggestions = type ? suggestionsFor(type, key.isMinor) : [];
  const pageCount = Math.max(1, Math.ceil(suggestions.length / PAGE_SIZE));
  const visible = suggestions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const chooseType = (id) => {
    if (id !== type) {
      setProgression(null);
      setPage(0);
    }
    setType(id);
    next();
  };

  const setMode = (isMinor) => {
    if (isMinor === key.isMinor) return;
    setKey((k) => ({ ...k, isMinor }));
    setProgression(null);
    setPage(0);
  };

  const surprise = () => setKey((k) => ({ ...k, rootIndex: Math.floor(Math.random() * 12) }));

  const finishProgression = () => {
    if (!progression) return;
    if (mode === 'add') onComplete({ type, progression });
    else next();
  };

  const chooseEnergy = (energy) => onComplete({ type, key, progression, energy });

  return (
    <main className="max-w-2xl w-full flex flex-col gap-8 animate-fade-in" aria-labelledby="quiz-titulo">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className={EYEBROW + ' text-rec-deep'}>
            {mode === 'new' ? 'Nueva maqueta' : 'Nueva sección'} · Paso {stepIndex + 1} de {steps.length}
          </p>
          <button onClick={onCancel} className="text-sm font-semibold text-ink-soft hover:text-ink">
            Cancelar
          </button>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-ink' : 'bg-rule'}`} />
          ))}
        </div>
      </div>

      <div>
        <h2 id="quiz-titulo" className="font-display text-3xl md:text-4xl font-semibold text-ink text-balance leading-tight">
          {question.title}
        </h2>
        <p className="text-ink-soft mt-2">{question.help}</p>
      </div>

      {step === 'seccion' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTION_TYPES.map((t) => (
            <OptionTile key={t.id} selected={type === t.id} onClick={() => chooseType(t.id)}>
              <span className="block font-display text-2xl font-semibold">{t.id}</span>
              <span className={`block text-sm mt-1 ${type === t.id ? 'text-paper/75' : 'text-ink-soft'}`}>{t.descripcion}</span>
            </OptionTile>
          ))}
        </div>
      )}

      {step === 'tono' && (
        <div className="flex flex-col gap-5">
          <div role="group" aria-label="Modo" className="inline-flex self-start rounded-full border-2 border-ink p-1 bg-paper-hi">
            {[false, true].map((isMinor) => (
              <button
                key={String(isMinor)}
                onClick={() => setMode(isMinor)}
                aria-pressed={key.isMinor === isMinor}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  key.isMinor === isMinor ? 'bg-ink text-paper' : 'text-ink hover:bg-rule/60'
                }`}
              >
                {isMinor ? 'Menor' : 'Mayor'}
              </button>
            ))}
          </div>

          <div role="group" aria-label="Tónica" className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, root) => (
              <button
                key={root}
                onClick={() => setKey((k) => ({ ...k, rootIndex: root }))}
                aria-pressed={key.rootIndex === root}
                aria-label={getKeyDisplay(root, key.isMinor)}
                className={`rounded-lg border-2 py-3 font-mono text-lg font-semibold transition-colors ${
                  key.rootIndex === root ? 'bg-ink border-ink text-paper' : 'bg-paper-hi border-rule text-ink hover:border-ink'
                }`}
              >
                {getKeyName(root, key.isMinor)}{key.isMinor ? 'm' : ''}
              </button>
            ))}
          </div>

          <p className="text-sm text-ink-soft">
            Tonalidad: <strong className="text-ink">{getKeyDisplay(key.rootIndex, key.isMinor)}</strong>
            {' · '}
            <button onClick={surprise} className={TEXT_ACTION}>Sorpréndeme</button>
          </p>
        </div>
      )}

      {step === 'progresion' && (
        <div className="flex flex-col gap-4">
          <p className={EYEBROW + ' text-ink-mute'}>
            {type} en {getKeyDisplay(key.rootIndex, key.isMinor)}
          </p>
          <div className="flex flex-col gap-3">
            {visible.map((option) => {
              const chords = transposeProgression(option.numerales, key.rootIndex, key.isMinor);
              const selected = progression?.name === option.name;
              return (
                <div
                  key={option.name}
                  className={`rounded-xl border-2 p-4 flex items-center gap-3 transition-colors ${
                    selected ? 'bg-ink border-ink text-paper' : 'bg-paper-hi border-rule text-ink'
                  }`}
                >
                  <button
                    onClick={() => setProgression(option)}
                    aria-pressed={selected}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true" className={selected ? 'text-signal' : 'text-ink-mute'}>{selected ? '●' : '○'}</span>
                      {option.name}
                    </span>
                    <span className="flex flex-wrap gap-1.5 mt-2.5">
                      {chords.map((c, i) => (
                        <span
                          key={i}
                          className={`font-mono text-sm font-semibold rounded-md px-2.5 py-1 border ${
                            selected ? 'border-paper/25 text-paper' : 'border-rule bg-paper text-ink'
                          }`}
                        >
                          {c.name}
                        </span>
                      ))}
                    </span>
                  </button>
                  <button
                    onClick={() => previewChords(chords)}
                    aria-label={`Escuchar ${option.name}`}
                    className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected ? 'border-paper/40 text-paper hover:bg-paper/10' : 'border-ink/30 text-ink hover:border-ink'
                    }`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 translate-x-[1px]"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
          {pageCount > 1 && (
            <button onClick={() => setPage((p) => (p + 1) % pageCount)} className={TEXT_ACTION + ' self-start'}>
              ↻ Ver otras opciones
            </button>
          )}
        </div>
      )}

      {step === 'energia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENERGY_OPTIONS.map((e) => (
            <OptionTile key={e.id} selected={false} onClick={() => chooseEnergy(e)}>
              <span className="block font-display text-2xl font-semibold">{e.label}</span>
              <span className="block text-sm mt-1 text-ink-soft">{e.descripcion}</span>
              <span className="block font-mono text-xs mt-3 text-ink-mute">{e.bpm} BPM · {grooveName(e.groove)}</span>
            </OptionTile>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        {stepIndex > 0 ? (
          <button onClick={back} className="text-sm font-semibold text-ink-soft hover:text-ink">← Atrás</button>
        ) : <span />}

        {step === 'tono' && (
          <button onClick={next} className="rounded-full bg-ink text-paper font-semibold px-6 py-3 hover:bg-black transition-colors">
            Continuar →
          </button>
        )}
        {step === 'progresion' && (
          <button
            onClick={finishProgression}
            disabled={!progression}
            className="rounded-full bg-ink text-paper font-semibold px-6 py-3 hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'Agregar sección' : 'Continuar →'}
          </button>
        )}
      </div>
    </main>
  );
}
