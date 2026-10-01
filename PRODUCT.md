# Song of the Day — Product

## What it is

A web tool that hands a songwriter a random creative scenario — a feeling, an object, a colour, a moment, a narrative concept — paired with a playable musical bed (key, chord progression, genre groove, tempo), so they can sing over it and capture a first sketch in a few minutes.

## Who it's for

Public, hobbyist-to-working **songwriters** who want a daily push past the blank page. They know what a key and a chord progression are, may not read roman numerals fluently, and usually have a phone or laptop with a microphone at hand. Many will use it on mobile.

## What success looks like

A good session ends with a **recorded sketch**: the user generates a scenario, presses play, sings or hums over the loop, and exports a voice memo. Everything on the results screen serves that path, in this order:

1. **Read the prompt.** The scenario has to spark something within seconds.
2. **Hear the bed.** Key, chords and groove play instantly and correctly.
3. **Record over it.** Recording is one tap away from playback and works on the first try.
4. **Take it away.** Export the recording; copying the scenario text is secondary.

Secondary success: the user comes back the next day for the new **Escenario del día**.

## Escenario del día

- **One scenario per local date, identical for everyone.** It is built from a seed derived from `YYYY-MM-DD` (mulberry32 over an FNV-1a hash in `src/data/scenario.js`), so it needs no backend and works offline. The day changes at each user's local midnight.
- **Always complete:** it uses every pillar and ignores the user's pillar toggles. Toggles apply only to free ideas ("Generar escenario" / "↻ Otra idea"), which stay random.
- **Instant:** no loading state; it is one tap from the start screen to a playable scenario.
- **Numbered** by day of the year ("Nº 274") to give each day an identity.
- **Personal tweaks stay personal.** Transposing or changing the tempo never changes the shared scenario.
- **The pillar screen remains the front door.** The daily card sits above the pillars. Opening straight onto today's scenario is a candidate for later if most users tap the card.
- **Stability caveat:** the daily scenario is recomputed from the word banks, so editing a bank can change that day's scenario after a deploy. Anything persisted or shared must therefore store the picked words, not just the date.

## Surfaces and modes

| Surface | Mode | The visitor succeeds when… |
|---|---|---|
| Pillar selection (start) | Operate | they open today's scenario in one tap, or choose what to randomise and generate in one move |
| Results (scenario + maqueta) | Operate | they go from prompt to recorded sketch without friction |

There is no marketing or landing surface yet. If one is added, it is a Persuade surface with its own brief.

## Product principles

- **Musically correct, always.** Wrong chords break trust immediately. Chord spelling follows the key (B♭, not A#); the key's mode follows the progression; every progression plays in full, one chord per bar.
- **Off means off.** A pillar the user turns off must not appear as if it had been chosen. Musical pillars that are off fall back to neutral defaults (C/Am, "Cuatro Acordes", 100 BPM) that are never presented as picked.
- **The prompt is the hero; the console is the instrument.** Writing and playing are two different activities and should look like two different places.
- **Fast to sound.** Play is one tap and starts immediately; changing tempo, key or tracks never restarts or interrupts the loop.
- **Fail in plain words.** Microphone, audio and clipboard failures explain what happened and what to do next. No `alert()` and no silent failure.
- **Mobile is first-class.** 375px wide, with thumb-sized targets (≥36px), no horizontal scroll, no truncated labels.

## Voice and copy

- Spanish (es) UI and prompts, written in an evocative but plain register, like a good writing teacher's prompt, not a marketing tagline.
- Grammar must hold for every random combination: correct articles and gender (`conArticulo`), agreement (plural objects), and natural date phrases (`fraseFecha`).
- Proper nouns are capitalised (Navidad, Halloween); everything else is lowercase in data.

## Language roadmap

**Spanish now, English likely next.** Keep user-facing strings and sentence templates easy to externalise:
- Don't scatter new copy through the JSX.
- Keep grammar helpers per language.
- Format dates and numbers with `Intl` rather than by hand.

Music data (progressions, numerals) is language-neutral; word banks and synonyms are per-language content.

## Constraints

- Client-only React + Vite + Tailwind v4 app. No backend and no accounts; nothing leaves the device.
- Audio is synthesised in the Web Audio API (no samples). Recording uses MediaRecorder with whichever format the browser supports (webm or mp4).
- Needs a secure context (HTTPS or localhost) for the microphone and clipboard.
- Must respect `prefers-reduced-motion`.

## Visual direction (still exploring)

The current direction is **"notebook + console"**:
- **Writing side:** cream ruled paper, ink-black serif (Fraunces) for the prompt, rolled words highlighted like a marker, a single vermilion accent.
- **Playing side:** a near-black studio console with monospace readouts (IBM Plex Mono), vermilion-lit chord pads and amber indicator lights.

This is the working identity, **not yet settled**. Treat it as the incumbent to refine, but a replacement direction is still on the table. Once it is settled, record the tokens and rules in DESIGN.md.

## Non-goals (for now)

- A full DAW, multitrack recording or MIDI export.
- Lyric generation. The tool provides prompts and synonyms; the songwriter writes.
- Social features, accounts or cloud storage.

## Open questions

- **Daily, phase 2.**
  - Share links (they must carry the picked words, not only the date).
  - A 7-dot weekly strip that fills in when the user records a sketch, stored locally.
  - Browsing past days.
  - Whether to open the app straight onto today's scenario.
- **Word banks.** About 20 of the 34 objects have no synonyms. Expand them, or drop the synonyms panel for words without entries?
- **Recording.** Should playback keep running while recording, with a count-in? Should takes be kept across regenerations?
- **Background tabs.** Playback can stutter when the tab is in the background (browsers throttle timers). Is that acceptable for v1?
