// Teoría musical: géneros, progresiones, tonalidades y deletreo de acordes

// Géneros: cada uno tiene su patrón de batería en src/audio/patterns.js
export const GENEROS = [
  { id: 'Rock', name: 'Rock', defaultBpm: 120 },
  { id: 'Pop', name: 'Pop', defaultBpm: 115 },
  { id: 'Punk', name: 'Punk', defaultBpm: 145 },
  { id: 'Balada', name: 'Balada', defaultBpm: 70 },
  { id: 'Folk', name: 'Folk', defaultBpm: 95 },
  { id: 'Country', name: 'Country', defaultBpm: 105 },
  { id: 'BossaNova', name: 'Bossa Nova', defaultBpm: 80 },
  { id: 'Indie Rock', name: 'Indie Rock', defaultBpm: 125 },
  { id: 'Bolero', name: 'Bolero', defaultBpm: 75 }
];

// Progresiones ampliadas
export const PROGRESIONES = [
  { name: 'Pop Básico', numerales: ['I', 'IV', 'V'] },
  { name: 'Cuatro Acordes', numerales: ['I', 'V', 'vi', 'IV'] },
  { name: 'Cadencia Jazz / Pop', numerales: ['ii', 'V', 'I'] },
  { name: 'Balada 50s', numerales: ['I', 'vi', 'IV', 'V'] },
  { name: 'Nostálgica', numerales: ['vi', 'IV', 'I', 'V'] },
  { name: 'Canon de Pachelbel', numerales: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'] },
  { name: 'Épica Moderna', numerales: ['I', 'IV', 'vi', 'V'] },
  { name: 'Melancólica', numerales: ['I', 'vi', 'ii', 'V'] },
  { name: 'Pop Épico Menor', numerales: ['i', 'VI', 'III', 'VII'], modo: 'menor' },
  { name: 'Rock Modal', numerales: ['I', 'bVII', 'IV', 'I'] },
  { name: 'Andaluza / Épica', numerales: ['i', 'VII', 'VI', 'VII'], modo: 'menor' },
  { name: 'Cambio de Modo (Picardía)', numerales: ['I', 'III', 'IV', 'iv'] },
  { name: 'Menor Sencilla', numerales: ['i', 'iv', 'v'], modo: 'menor' },
  { name: 'Folk Acústico', numerales: ['I', 'IV', 'I', 'V'] }
];

// Las progresiones sin `modo` se escriben en grados de la escala mayor.
// La tonalidad siempre adopta el modo de la progresión para que los grados
// (i, VI, bVII...) se interpreten sobre la escala correcta.
export const getModo = (progresion) => (progresion.modo === 'menor' ? 'menor' : 'mayor');

export const INITIAL_KEYS = [
  { rootIndex: 0, isMinor: false },  // C Mayor
  { rootIndex: 9, isMinor: true },   // A menor
  { rootIndex: 7, isMinor: false },  // G Mayor
  { rootIndex: 2, isMinor: false },  // D Mayor
  { rootIndex: 4, isMinor: true },   // E menor
  { rootIndex: 5, isMinor: false },  // F Mayor
  { rootIndex: 9, isMinor: false },  // A Mayor
  { rootIndex: 2, isMinor: true },   // D menor
  { rootIndex: 7, isMinor: true }    // G menor
];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const SCALES = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10]
};
// Nombre de la tónica según la armadura más habitual de cada tonalidad
const MAJOR_KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const CHORD_INTERVALS = { major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6] };

// Deletrea una clase de altura sobre una letra concreta (p. ej. 10 sobre B → Bb)
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Las dobles alteraciones (Bbb, F##) se escriben con su equivalente simple (A, G)
function spellNote(letterIndex, pc, preferFlats) {
  const letter = LETTERS[letterIndex % 7];
  let diff = (((pc - NATURAL_PC[letter]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  if (Math.abs(diff) > 1) return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[pc];
  return letter + (diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff));
}

export function getKeyName(rootIndex, isMinor) {
  return (isMinor ? MINOR_KEY_NAMES : MAJOR_KEY_NAMES)[rootIndex];
}

export function getKeyDisplay(rootIndex, isMinor) {
  return `${getKeyName(rootIndex, isMinor)} ${isMinor ? 'menor' : 'Mayor'}`;
}

// Devuelve [{ name: 'Bb', pc: 10, quality: 'major' }, ...]
export function transposeProgression(numerales, rootIndex, isMinor) {
  const scale = SCALES[isMinor ? 'menor' : 'mayor'];
  const tonic = getKeyName(rootIndex, isMinor);
  const tonicLetter = LETTERS.indexOf(tonic[0]);
  const preferFlats = tonic.includes('b') || tonic === 'F';

  return numerales.map((num) => {
    const match = /^([b#]?)([ivIV]+)(°?)$/.exec(num);
    const degree = match ? ROMAN.indexOf(match[2].toUpperCase()) : -1;
    if (degree === -1) throw new Error(`Grado no reconocido en la progresión: "${num}"`);

    const [, accidental, roman, dim] = match;
    const shift = accidental === 'b' ? -1 : accidental === '#' ? 1 : 0;
    const pc = (rootIndex + scale[degree] + shift + 12) % 12;
    const quality = dim ? 'dim' : roman === roman.toUpperCase() ? 'major' : 'minor';
    const suffix = quality === 'minor' ? 'm' : quality === 'dim' ? '°' : '';

    return { name: spellNote(tonicLetter + degree, pc, preferFlats) + suffix, pc, quality };
  });
}

// Frecuencias de la tríada en la octava de C4
export function getChordFrequencies(chord) {
  return CHORD_INTERVALS[chord.quality].map(
    (interval) => 261.63 * Math.pow(2, (chord.pc + interval) / 12)
  );
}


// ── Modo avanzado: maqueta por secciones ─────────────────────────────

export const SECTION_TYPES = [
  { id: 'Intro', descripcion: 'Abre la canción y presenta el clima.' },
  { id: 'Verso', descripcion: 'Cuenta la historia.' },
  { id: 'Coro', descripcion: 'La parte que se repite y se recuerda.' },
  { id: 'Puente', descripcion: 'Un contraste antes del último coro.' }
];

// Sugerencias por sección y modo; se muestran de 3 en 3
export const SECTION_PROGRESSIONS = {
  Intro: {
    mayor: [
      { name: 'Apertura folk', numerales: ['I', 'IV', 'I', 'V'] },
      { name: 'Intro nostálgica', numerales: ['vi', 'IV', 'I', 'V'] },
      { name: 'Balada 50s', numerales: ['I', 'vi', 'IV', 'V'] },
      { name: 'Rock modal', numerales: ['I', 'bVII', 'IV', 'I'] },
      { name: 'Suspendida', numerales: ['IV', 'I', 'IV', 'V'] },
      { name: 'Cálida', numerales: ['I', 'iii', 'IV', 'iv'] }
    ],
    menor: [
      { name: 'Pop épico menor', numerales: ['i', 'VI', 'III', 'VII'] },
      { name: 'Oscura y simple', numerales: ['i', 'iv', 'i', 'v'] },
      { name: 'Andaluza', numerales: ['i', 'VII', 'VI', 'V'] },
      { name: 'Cinemática', numerales: ['i', 'VI', 'iv', 'V'] },
      { name: 'Pedal', numerales: ['i', 'VII', 'i', 'VI'] },
      { name: 'Misteriosa', numerales: ['i', 'III', 'iv', 'VI'] }
    ]
  },
  Verso: {
    mayor: [
      { name: 'Cuatro acordes', numerales: ['I', 'V', 'vi', 'IV'] },
      { name: 'Nostálgica', numerales: ['vi', 'IV', 'I', 'V'] },
      { name: 'Melancólica', numerales: ['I', 'vi', 'ii', 'V'] },
      { name: 'Épica moderna', numerales: ['I', 'IV', 'vi', 'V'] },
      { name: 'Cadencia jazz / pop', numerales: ['ii', 'V', 'I', 'vi'] },
      { name: 'Folk acústico', numerales: ['I', 'IV', 'I', 'V'] }
    ],
    menor: [
      { name: 'Pop épico menor', numerales: ['i', 'VI', 'III', 'VII'] },
      { name: 'Narrativa', numerales: ['i', 'iv', 'VII', 'III'] },
      { name: 'Andaluza', numerales: ['i', 'VII', 'VI', 'V'] },
      { name: 'Menor sencilla', numerales: ['i', 'iv', 'v', 'i'] },
      { name: 'Introspectiva', numerales: ['i', 'III', 'VII', 'VI'] },
      { name: 'Tensa', numerales: ['i', 'VI', 'iv', 'V'] }
    ]
  },
  Coro: {
    mayor: [
      { name: 'Camino real', numerales: ['IV', 'V', 'iii', 'vi'] },
      { name: 'Himno pop', numerales: ['I', 'V', 'vi', 'IV'] },
      { name: 'Despegue', numerales: ['IV', 'I', 'V', 'vi'] },
      { name: 'Estribillo clásico', numerales: ['I', 'IV', 'V', 'IV'] },
      { name: 'Resolución', numerales: ['IV', 'V', 'I', 'I'] },
      { name: 'Emotiva', numerales: ['vi', 'IV', 'I', 'V'] }
    ],
    menor: [
      { name: 'Coro épico', numerales: ['VI', 'VII', 'i', 'i'] },
      { name: 'Luminosa', numerales: ['III', 'VII', 'i', 'VI'] },
      { name: 'Himno menor', numerales: ['VI', 'III', 'VII', 'i'] },
      { name: 'Subida', numerales: ['iv', 'VI', 'VII', 'i'] },
      { name: 'Circular', numerales: ['i', 'VI', 'III', 'VII'] },
      { name: 'Dramática', numerales: ['VI', 'VII', 'V', 'i'] }
    ]
  },
  Puente: {
    mayor: [
      { name: 'Cambio de modo', numerales: ['IV', 'iv', 'I', 'V'] },
      { name: 'Subida', numerales: ['ii', 'iii', 'IV', 'V'] },
      { name: 'Contraste menor', numerales: ['vi', 'iii', 'IV', 'V'] },
      { name: 'Épica prestada', numerales: ['bVI', 'bVII', 'I', 'I'] },
      { name: 'Suspenso', numerales: ['vi', 'V', 'IV', 'V'] },
      { name: 'Giro inesperado', numerales: ['iii', 'vi', 'II', 'V'] }
    ],
    menor: [
      { name: 'Subida', numerales: ['iv', 'v', 'VI', 'VII'] },
      { name: 'Contraste', numerales: ['VI', 'iv', 'i', 'V'] },
      { name: 'Relativa mayor', numerales: ['III', 'VII', 'iv', 'V'] },
      { name: 'Respiro', numerales: ['VI', 'VII', 'III', 'V'] },
      { name: 'Napolitana', numerales: ['bII', 'V', 'i', 'i'] },
      { name: 'Descenso', numerales: ['i', 'VII', 'VI', 'V'] }
    ]
  }
};

// Acordes para experimentar: los de la escala y algunos prestados
export const CHORD_PALETTE = {
  mayor: {
    diatonicos: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    prestados: ['bVII', 'iv', 'bVI', 'II']
  },
  menor: {
    diatonicos: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    prestados: ['V', 'IV', 'bII']
  }
};

// Energía → tempo y ritmo inicial de la maqueta
export const ENERGY_OPTIONS = [
  { id: 'lenta', label: 'Lenta', descripcion: 'Una balada íntima.', bpm: 70, groove: 'Balada' },
  { id: 'media', label: 'Tranquila', descripcion: 'Acústica, a medio tiempo.', bpm: 92, groove: 'Folk' },
  { id: 'movida', label: 'Movida', descripcion: 'Para mover la cabeza.', bpm: 116, groove: 'Pop' },
  { id: 'energica', label: 'Energética', descripcion: 'Guitarras y empuje.', bpm: 138, groove: 'Rock' }
];
