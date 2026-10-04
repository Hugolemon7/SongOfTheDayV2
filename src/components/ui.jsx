import React from 'react';

// Etiqueta de sección compartida (lectura tipo consola)
export const EYEBROW = 'font-mono text-[11px] font-medium uppercase tracking-[0.16em]';

// Botón con sombra dura "impresa" sobre papel
export const HARD_BUTTON = 'text-sm font-semibold text-ink bg-paper-hi border-2 border-ink rounded-full px-4 py-1.5 shadow-[3px_3px_0_var(--color-ink)] hover:shadow-[1px_1px_0_var(--color-ink)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_var(--color-ink)]';

// Acción de texto subrayada en bermellón
export const TEXT_ACTION = 'text-sm font-semibold text-ink underline decoration-rec decoration-2 underline-offset-4 hover:decoration-[3px]';

export function Title({ size }) {
  return (
    <h1 className={`font-display font-semibold tracking-tight text-ink whitespace-nowrap ${size}`} style={{ fontVariationSettings: '"opsz" 144' }}>
      Song <em className="font-normal italic text-rec">of the</em> day
    </h1>
  );
}

// Botón de regreso: borde visible para que se note sin competir con la acción principal
export function BackButton({ onClick, label = 'Inicio', ariaLabel = 'Volver al inicio' }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 rounded-full border-2 border-ink/70 bg-paper-hi px-2.5 sm:px-3.5 text-sm font-semibold text-ink hover:border-ink hover:bg-white transition-colors"
    >
      <span aria-hidden="true">←</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
