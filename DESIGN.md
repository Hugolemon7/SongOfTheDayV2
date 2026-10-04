# Song of the Day — Design

> **Status: working direction, still exploring** (see PRODUCT.md). This file documents the visual system as implemented. Refine it freely; if the direction is replaced, rewrite this file rather than patching it.

## Concept: notebook + console

The product has two activities, so it has two places:

| | **Notebook** (writing) | **Console** (playing) |
|---|---|---|
| Where | Page background, start screen, the scenario, lyric inspiration | The Maqueta panel: key, chords, transport, recorder |
| Feel | Cream ruled paper, ink, a highlighter | Dark studio hardware: lit pads, LEDs, readouts |
| Type lead | Fraunces (serif) | IBM Plex Mono (readouts) |

Nothing else gets a dark surface except the console and the "Escenario del día" card (which borrows the selected-pillar ink treatment). One vermilion accent ties both worlds together.

## Tokens

Defined once in `src/index.css` under `@theme`. Tailwind exposes them as `bg-paper`, `text-ink-soft`, `border-console-line`, and so on. Never hard-code hex values in components; the only exception is the console error tint `#ff8a73`, which should become a token if it is reused.

### Color

| Token | Value | Use |
|---|---|---|
| `paper` | `#f4efe6` | Page background (with ruled lines) |
| `paper-hi` | `#fbf8f2` | Raised paper: tags, synonym cards, secondary buttons |
| `rule` | `#ddd3c2` | Hairlines, borders on paper, ruled-line base |
| `ink` | `#1b1714` | Primary text; selected pillars; hard drop shadows |
| `ink-soft` | `#5e554c` | Secondary text, body copy under headlines (6.4:1) |
| `ink-mute` | `#71675b` | Small labels and eyebrows on paper (4.8:1) |
| `rec` | `#d43f22` | The single accent: primary CTA, lit chord pad, title italic, marker, beat 1 |
| `rec-deep` | `#b53519` | Small red **text** on paper; hover for `rec` fills |
| `signal` | `#f2b33d` | Console-only LEDs and indicators (amber) |
| `console` | `#17140f` | Console panel background |
| `console-2` | `#221e18` | Pads and raised controls on the console |
| `console-line` | `#3a342b` | Borders and dividers on the console; "off" LEDs |
| `console-text` | `#f4efe6` | Text on the console |
| `console-mute` | `#9a9183` | Labels on the console (5.9:1) |

Contrast rules (all checked):
- White on `rec` is 4.6:1, which is fine for the CTA and lit pads.
- `rec` on paper is only 4.0:1, so **never use it for small text**. Use `rec-deep` (≥4.5:1) instead.
- `rec` and `signal` are fine for glyphs, LEDs and decoration.

### Typography

| Token | Family | Role |
|---|---|---|
| `font-display` | Fraunces (variable, opsz 9–144) | Title, scenario headline, key name, section headings, synonym words (italic) |
| `font-sans` | Instrument Sans | Body, buttons, tags' values |
| `font-mono` | IBM Plex Mono | Eyebrows, labels, chord names, BPM, numbers (Nº, 01–08, bar numbers) |

All three load from Google Fonts in `index.html` with `display=swap`, falling back to Georgia and the system fonts.

| Style | Spec |
|---|---|
| Title (start) | Fraunces semibold, 52px → 96px (`md:text-8xl`), leading 0.95, `opsz 144`. "*of the*" in normal italic, `rec` |
| Title (compact header) | Same treatment, 20–24px |
| Scenario headline | Fraunces medium, 30px → 42px, leading 1.12, tracking tight, `opsz 96`, `text-pretty` |
| Section heading | Fraunces semibold 24–30px, `text-balance` |
| Body lead | Instrument Sans 18–20px, `ink-soft`, relaxed leading, ≤58ch |
| Eyebrow | `EYEBROW` constant in App.jsx: Plex Mono 11px, medium, uppercase, tracking 0.16em |
| Readouts | Plex Mono semibold: chords 18–20px, BPM 30px, `tabular-nums` |

## Surfaces and texture

- **Ruled paper** (`.paper-ruled`): a 1px line every 32px in `rule` at 38%. It's a texture, not a grid; text does not snap to it.
- **Marker** (`.marker`): rolled words inside the scenario prose get a `rec` 28% band from 58% to 92% of the line height, cloned across line breaks. The `Highlighted` component applies it to **whole words only**.
- **Console panel:** 28px radius, `console` background, a deep soft shadow plus `ring-black/40`, and `color-scheme: dark` so native controls (the audio player) match.

## Shape and elevation

| Element | Radius | Elevation |
|---|---|---|
| Pills (CTA, header actions, recorder buttons) | full | — |
| Console panel | 28px | Soft deep shadow |
| Daily card | 16px | Hard offset shadow, `rec` |
| Chord pads | 12px | Lit pad: `rec` glow `0 0 28px -4px` |
| Pillar tiles, synonym cards, track toggles | 8px | — |
| Tags | 6px | — |

**Hard offset shadows** are the "printed" signature on paper. They are used only on paper-side primary actions:
- "Generar escenario": 5px, ink.
- The daily card: 5px, rec.
- "↻ Otra idea": 3px, ink.

On hover the shadow shrinks and the element shifts the same distance, so it looks pressed. On active it presses fully flat. Don't use hard shadows on the console.

## Components

- **Pillar tile:** a label wrapping an `sr-only` checkbox, with a mono index (01–08) and a ● / ○ marker.
  - On: `ink` fill, `paper` text, `signal` index.
  - Off: dashed `rule` border, `ink-mute` text.
  - Focus: a `rec` outline through `has-[:focus-visible]`.
- **Daily card:** the full-width `ink` button above the pillars. Mono eyebrow "Hoy · Nº N" in `signal`, Fraunces title, a one-line promise, and a `rec` arrow that nudges on hover.
- **Tags:** a `<dl>` row of chips, each with a mono 10px uppercase label (`dt`) and a semibold value (`dd`) on `paper-hi`.
- **Chord pads:** an `<ol>` grid with `min(4, n)` columns, one pad per bar and a mono bar number top-left. The pad that is playing is `rec` with a glow and gets `aria-current`.
- **Transport:**
  - Play button: a 64px circle. Paper fill with an ink triangle when stopped; `rec` fill with a glow while playing. Icons are SVG, not emoji.
  - Tempo: BPM readout in mono, "BPM" in `signal`, and 36px −/+ step buttons.
  - Beat LEDs: beat 1 in `rec`, the others in `signal`, off in `console-line`.
- **Track toggles:** `aria-pressed` buttons with a 6px LED. Off shows a dark LED, muted text and a strike-through.
- **Recorder:**
  - Record: a `rec`-outlined pill with a red dot.
  - Recording: a mono "REC m:ss" with a pulsing dot.
  - Stop: a paper pill.
  - Export: an outlined pill.
- **Text actions** on paper ("Copiar escenario", "Ver el escenario de hoy →"): ink text with a 2px `rec` underline, offset 4px, which thickens on hover.
- **Home entry cards:** two dark cards side by side ("Escenario del día" in ink with a `rec` hard shadow; "Crea una maqueta" in console black with a `signal` hard shadow and a mini row of pads).
- **Pillars:** start unselected. "Generar escenario" stays disabled (greyed, flat) with a helper line until at least one is on; "Seleccionar todos" toggles all.
- **Back button** (`BackButton`): a bordered paper pill "← Inicio" (arrow only on mobile), visible but quieter than the primary action.
- **Quiz:** progress segments, a Fraunces question, option tiles that flip to ink when chosen, a Mayor/Menor segmented control, a 12-key grid, and progression cards with a round ▶ preview.
- **Project section card:** mono index, Fraunces name, the progression name and chord slots showing degree + chord. Active: 2px ink border and an "Editando" tag. Playing: a `rec` inset bar on the left. Actions are 36px icon buttons (up, down, duplicate, delete).
- **Chord palette:** chips with degree + chord; the armed chip is ink. The replace bar is fixed to the bottom in ink with a `rec` top rule, rendered in a portal (the fade-in transform on `<main>` would otherwise break `position: fixed`).
- **Loading:** a five-bar `rec` level meter (`animate-meter`) with a mono caption. It's used only for free ideas; the daily scenario is instant.

## Layout

- **Single column** at `max-w-2xl`, with a 16px gutter on mobile.
- **Gaps:** 48–64px between results sections, 24–28px inside the console.
- **Start screen order:** date eyebrow → title → subtitle → daily card → divider and "O una idea libre" → pillars (2 columns, 4 at `sm`) → CTA.
- **Results order:** compact header → scenario (eyebrow, genre line, headline, context, tags, copy) → console → lyric inspiration (auto-fit cards, min 180px).
- **Mobile (375px):**
  - Header back button collapses to "←".
  - The daily date moves to its own line.
  - Track toggles use 11px text and hide the genre suffix.
  - No horizontal scroll and no truncated labels.

## Motion

- `animate-fade-in` (0.4s, 8px rise) when a screen or result appears.
- Fast colour transitions on pads and LEDs, which follow the audio clock rather than CSS timing.
- Press feedback through translate and the shadow shrinking.
- `prefers-reduced-motion` collapses all animation and transition durations.

## Voice in the UI

- Spanish, sentence case.
- Mono uppercase only for eyebrows and labels.
- Errors say what happened and what to do next, in plain words.
- No emoji in UI chrome. They remain only in the copied text output.

## Don'ts

- No blue, no gradients, no glassmorphism or backdrop blur. That was the discarded look.
- No second accent colour on paper; `signal` lives on the console.
- No `rec` for small text on paper.
- No cards nested inside cards; the console is the only panel.
- No emoji as icons.
