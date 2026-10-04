import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AudioEngine from '../components/AudioEngine';
import VoiceRecorder from '../components/VoiceRecorder';
import { EYEBROW, TEXT_ACTION } from '../components/ui';
import { CHORD_PALETTE, GENEROS, getKeyDisplay, transposeProgression } from '../data/musicData';
import { previewChords } from '../audio/engine';
import { sectionLabels, duplicateSection } from './model';

const ICON_BASE = 'w-9 h-9 rounded-lg border border-rule bg-paper text-ink-soft disabled:opacity-30 flex items-center justify-center transition-colors';
const ICON_BUTTON = ICON_BASE + ' enabled:hover:text-ink enabled:hover:border-ink';
const ICON_DANGER = ICON_BASE + ' hover:text-rec-deep hover:border-rec-deep';

const gridColumns = (n) => ({ gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, n))}, minmax(0, 1fr))` });

function Icon({ path }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
const ICONS = {
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'
};

export default function Project({ project, setProject, onAddSection, onNewProject }) {
  const { key, sections, activeId } = project;
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [armed, setArmed] = useState(null); // grado elegido en la paleta
  const [undo, setUndo] = useState(null); // { section, index }
  const [confirmNew, setConfirmNew] = useState(false);
  const undoTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

  // Esc cancela el reemplazo de acorde
  useEffect(() => {
    if (!armed) return;
    const onKey = (e) => { if (e.key === 'Escape') setArmed(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [armed]);

  const labels = sectionLabels(sections);
  const activeSection = sections.find((s) => s.id === activeId) ?? null;
  const chordsBySection = sections.map((s) => transposeProgression(s.numerales, key.rootIndex, key.isMinor));

  // La canción completa en orden: un acorde por compás
  const flat = [];
  chordsBySection.forEach((chords, sectionIndex) =>
    chords.forEach((chord, slot) => flat.push({ ...chord, sectionIndex, slot }))
  );
  const playing = playingIdx >= 0 ? flat[playingIdx] : null;
  const palette = CHORD_PALETTE[key.isMinor ? 'menor' : 'mayor'];
  const toChord = (numeral) => transposeProgression([numeral], key.rootIndex, key.isMinor)[0];
  const armedChord = armed ? toChord(armed) : null;
  const grooveLabel = GENEROS.find((g) => g.id === project.groove)?.name ?? project.groove;

  const update = (patch) => setProject((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));

  const setBpm = (value) => update((p) => ({ bpm: typeof value === 'function' ? value(p.bpm) : value }));
  const transpose = (semitones) =>
    update((p) => ({ key: { ...p.key, rootIndex: (p.key.rootIndex + semitones + 12) % 12 } }));
  const setActive = (id) => update({ activeId: id });

  const move = (index, delta) => update((p) => {
    const next = [...p.sections];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    return { sections: next };
  });

  const duplicate = (index) => update((p) => {
    const copy = duplicateSection(p.sections[index]);
    const next = [...p.sections];
    next.splice(index + 1, 0, copy);
    return { sections: next, activeId: copy.id };
  });

  const remove = (index) => {
    const section = sections[index];
    update((p) => {
      const next = p.sections.filter((s) => s.id !== section.id);
      const neighbour = next[Math.min(index, next.length - 1)];
      return { sections: next, activeId: p.activeId === section.id ? neighbour?.id ?? null : p.activeId };
    });
    if (armed && activeId === section.id) setArmed(null);
    clearTimeout(undoTimerRef.current);
    setUndo({ section, index, label: labels[section.id] });
    undoTimerRef.current = setTimeout(() => setUndo(null), 6000);
  };

  const restore = () => {
    if (!undo) return;
    update((p) => {
      const next = [...p.sections];
      next.splice(Math.min(undo.index, next.length), 0, undo.section);
      return { sections: next, activeId: undo.section.id };
    });
    clearTimeout(undoTimerRef.current);
    setUndo(null);
  };

  const replaceChord = (sectionId, slot) => {
    if (!armed) return;
    update((p) => ({
      sections: p.sections.map((s) =>
        s.id === sectionId ? { ...s, numerales: s.numerales.map((n, i) => (i === slot ? armed : n)) } : s
      )
    }));
    setArmed(null);
  };

  const pickFromPalette = (numeral) => {
    previewChords([toChord(numeral)], 1);
    setArmed((current) => (current === numeral ? null : numeral));
  };

  const onSlotClick = (section, slot, chord) => {
    if (armed && section.id === activeId) {
      replaceChord(section.id, slot);
      return;
    }
    setActive(section.id);
    previewChords([chord], 1);
  };

  const totalBars = flat.length;

  return (
    <main className={`max-w-2xl w-full flex flex-col gap-12 md:gap-14 mb-12 animate-fade-in ${armed ? 'pb-40' : ''}`}>

      {/* 1. Estructura de la canción */}
      <section aria-labelledby="titulo-proyecto" className="flex flex-col gap-4">
        <p className={EYEBROW + ' text-rec-deep'}>
          Maqueta · {sections.length} {sections.length === 1 ? 'sección' : 'secciones'} · {totalBars} compases
        </p>
        <h2 id="titulo-proyecto" className="font-display text-[1.85rem] md:text-[2.6rem] leading-[1.12] font-medium tracking-tight text-ink text-pretty">
          {sections.length === 0 ? 'Tu maqueta está vacía' : sections.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <span className="text-rec" aria-label="luego"> → </span>}
              <span className={playing?.sectionIndex === i ? 'marker' : ''}>{labels[s.id]}</span>
            </React.Fragment>
          ))}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {!confirmNew ? (
            <button onClick={() => setConfirmNew(true)} className={TEXT_ACTION}>Nuevo proyecto</button>
          ) : (
            <p className="text-sm text-ink-soft flex flex-wrap items-center gap-x-3 gap-y-1">
              ¿Empezar de cero? Se borrará esta maqueta.
              <button onClick={onNewProject} className="font-semibold text-rec-deep underline underline-offset-4">Sí, empezar de nuevo</button>
              <button onClick={() => setConfirmNew(false)} className="font-semibold text-ink underline underline-offset-4">Cancelar</button>
            </p>
          )}
        </div>
      </section>

      {/* 2. Consola: escuchar y grabar la canción completa */}
      <section
        aria-labelledby="titulo-consola"
        style={{ colorScheme: 'dark' }}
        className="bg-console text-console-text rounded-[28px] p-5 md:p-8 flex flex-col gap-7 shadow-[0_30px_60px_-28px_rgba(27,23,20,0.75)] ring-1 ring-black/40"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="titulo-consola" className={EYEBROW + ' text-signal'}>
              <span aria-hidden="true">● </span>Maqueta
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
                <span className="sr-only">Tonalidad: </span>
                {getKeyDisplay(key.rootIndex, key.isMinor)}
              </p>
              <div className="flex gap-1">
                <button onClick={() => transpose(-1)} aria-label="Bajar un semitono" className="w-9 h-9 rounded-lg border border-console-line text-console-text font-mono hover:bg-console-2">−</button>
                <button onClick={() => transpose(1)} aria-label="Subir un semitono" className="w-9 h-9 rounded-lg border border-console-line text-console-text font-mono hover:bg-console-2">+</button>
              </div>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-console-mute">Ritmo</span>
            <select
              value={project.groove}
              onChange={(e) => update({ groove: e.target.value })}
              className="bg-console-2 border border-console-line rounded-lg px-3 py-2 text-sm font-semibold text-console-text"
            >
              {GENEROS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        </div>

        <p className="font-mono text-xs text-console-mute" aria-live="polite">
          {playing
            ? <>Sonando: <span className="text-signal">{labels[sections[playing.sectionIndex].id]}</span> · acorde {playing.slot + 1} de {chordsBySection[playing.sectionIndex].length} · {playing.name}</>
            : 'Pulsa ▶ para escuchar la canción completa, en el orden de las secciones.'}
        </p>

        <div className="border-t border-console-line pt-6">
          <AudioEngine
            bpm={project.bpm}
            setBpm={setBpm}
            chords={flat}
            genre={project.groove}
            genreLabel={grooveLabel}
            onChordChange={setPlayingIdx}
            subject="la maqueta"
          />
        </div>

        <div className="border-t border-console-line pt-6">
          <VoiceRecorder title="Grabar maqueta" recordLabel="Grabar maqueta" fileBase="maqueta" />
        </div>
      </section>

      {/* 3. Secciones */}
      <section aria-labelledby="titulo-secciones" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="titulo-secciones" className={EYEBROW + ' text-ink-mute'}>Secciones</h2>
          <p className="text-xs text-ink-mute">Toca una sección para editarla.</p>
        </div>

        <ol className="flex flex-col gap-3">
          {sections.map((section, index) => {
            const isActive = section.id === activeId;
            const isPlayingSection = playing?.sectionIndex === index;
            const chords = chordsBySection[index];
            const label = labels[section.id];
            return (
              <li
                key={section.id}
                onClick={() => !isActive && setActive(section.id)}
                className={`rounded-2xl p-4 md:p-5 flex flex-col gap-4 transition-all ${
                  isActive ? 'bg-paper-hi border-2 border-ink' : 'bg-paper-hi/60 border border-rule cursor-pointer hover:border-ink-mute'
                } ${isPlayingSection ? 'shadow-[inset_4px_0_0_var(--color-rec)]' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActive(section.id); }}
                    aria-pressed={isActive}
                    className="text-left min-w-0"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-mono text-[11px] text-ink-mute">{String(index + 1).padStart(2, '0')}</span>
                      <span className="font-display text-2xl font-semibold text-ink">{label}</span>
                      {isActive && <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-rec-deep">Editando</span>}
                    </span>
                    <span className="block font-mono text-xs text-ink-mute mt-0.5">{section.progressionName}</span>
                  </button>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${label}`} title="Subir" className={ICON_BUTTON}><Icon path={ICONS.up} /></button>
                    <button onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label={`Bajar ${label}`} title="Bajar" className={ICON_BUTTON}><Icon path={ICONS.down} /></button>
                    <button onClick={() => duplicate(index)} aria-label={`Duplicar ${label}`} title="Duplicar" className={ICON_BUTTON}><Icon path={ICONS.copy} /></button>
                    <button onClick={() => remove(index)} aria-label={`Eliminar ${label}`} title="Eliminar" className={ICON_DANGER}><Icon path={ICONS.trash} /></button>
                  </div>
                </div>

                <div className="grid gap-2" style={gridColumns(chords.length)}>
                  {chords.map((chord, slot) => {
                    const isPlayingChord = isPlayingSection && playing.slot === slot;
                    const isTarget = armed && isActive;
                    return (
                      <button
                        key={slot}
                        onClick={(e) => { e.stopPropagation(); onSlotClick(section, slot, chord); }}
                        aria-label={isTarget ? `Cambiar ${chord.name} por ${armedChord.name}` : `${chord.name}, grado ${section.numerales[slot]}`}
                        className={`rounded-xl border py-3 flex flex-col items-center gap-0.5 transition-colors ${
                          isPlayingChord
                            ? 'bg-rec border-rec text-white'
                            : isTarget
                              ? 'bg-paper border-2 border-dashed border-rec text-ink hover:bg-rec hover:text-white hover:border-solid'
                              : 'bg-paper border-rule text-ink hover:border-ink'
                        }`}
                      >
                        <span className={`font-mono text-[10px] ${isPlayingChord ? 'text-white/75' : 'text-ink-mute'}`}>{section.numerales[slot]}</span>
                        <span className="font-mono text-lg font-semibold">{chord.name}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>

        {undo && (
          <p role="status" className="text-sm text-ink-soft flex items-center gap-3">
            Se eliminó {undo.label}.
            <button onClick={restore} className={TEXT_ACTION}>Deshacer</button>
          </p>
        )}

        <button
          onClick={onAddSection}
          className="rounded-2xl border-2 border-dashed border-ink/40 hover:border-ink py-5 font-semibold text-ink transition-colors"
        >
          + Agregar sección
        </button>
      </section>

      {/* 4. Acordes de la tonalidad para experimentar */}
      <section aria-labelledby="titulo-paleta" className="flex flex-col gap-4">
        <div>
          <h2 id="titulo-paleta" className={EYEBROW + ' text-ink-mute'}>Acordes de {getKeyDisplay(key.rootIndex, key.isMinor)}</h2>
          <p className="text-sm text-ink-soft mt-1.5">
            {activeSection
              ? <>Toca un acorde para escucharlo y luego elige qué acorde de <strong className="text-ink">{labels[activeSection.id]}</strong> quieres reemplazar.</>
              : 'Agrega o selecciona una sección para cambiar sus acordes.'}
          </p>
        </div>
        {[
          { title: 'De la tonalidad', numerales: palette.diatonicos },
          { title: 'Para experimentar', numerales: palette.prestados }
        ].map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">{group.title}</p>
            <div className="flex flex-wrap gap-2">
              {group.numerales.map((numeral) => {
                const chord = toChord(numeral);
                const selected = armed === numeral;
                return (
                  <button
                    key={numeral}
                    onClick={() => pickFromPalette(numeral)}
                    disabled={!activeSection}
                    aria-pressed={selected}
                    aria-label={`${chord.name}, grado ${numeral}`}
                    className={`min-w-14 rounded-lg border-2 px-3 py-2 flex flex-col items-center transition-colors disabled:opacity-40 ${
                      selected ? 'bg-ink border-ink text-paper' : 'bg-paper-hi border-rule text-ink hover:border-ink'
                    }`}
                  >
                    <span className={`font-mono text-[10px] ${selected ? 'text-signal' : 'text-ink-mute'}`}>{numeral}</span>
                    <span className="font-mono text-base font-semibold">{chord.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Barra fija para elegir el acorde a reemplazar sin tener que volver a subir.
          En un portal: la animación de <main> deja un transform que rompería position: fixed */}
      {armed && activeSection && createPortal(
        <div role="dialog" aria-label="Reemplazar acorde" className="fixed inset-x-0 bottom-0 z-20 bg-ink text-paper border-t-2 border-rec px-4 py-4 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">
                Cambiar por <strong className="font-mono text-signal">{armedChord.name}</strong> en <strong>{labels[activeSection.id]}</strong>:
              </p>
              <button onClick={() => setArmed(null)} className="text-sm font-semibold text-paper/80 hover:text-paper underline underline-offset-4">Cancelar</button>
            </div>
            <div className="grid gap-2" style={gridColumns(activeSection.numerales.length)}>
              {chordsBySection[sections.indexOf(activeSection)].map((chord, slot) => (
                <button
                  key={slot}
                  onClick={() => replaceChord(activeSection.id, slot)}
                  aria-label={`Cambiar ${chord.name} por ${armedChord.name}`}
                  className="rounded-lg border border-paper/30 py-2.5 font-mono font-semibold hover:bg-rec hover:border-rec transition-colors"
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
