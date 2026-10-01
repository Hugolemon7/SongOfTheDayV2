// Banco de datos enriquecido V2

export const SENTIMIENTOS = [
  'amor', 'tristeza', 'alegría', 'enojo', 'miedo', 'repulsión', 'intriga', 
  'ansiedad', 'aburrimiento', 'envidia', 'pasión', 'deseo', 'nostalgia', 
  'melancolía', 'euforia', 'soledad', 'gratitud', 'culpa', 'desesperanza', 
  'serenidad', 'vulnerabilidad', 'asombro', 'frustración', 'esperanza',
  'vergüenza', 'orgullo', 'despecho', 'desolación', 'compasión', 'rencor'
];

export const OBJETOS = [
  'familiar', 'infante', 'amigo', 'pareja', 'desconocido', 'luna', 'ojos', 
  'boca', 'nariz', 'cabello', 'cama', 'taza', 'instrumento musical', 'juguete', 
  'espejo', 'reloj antiguo', 'fotografía desgastada', 'carta sin enviar', 
  'teléfono descompuesto', 'ventana lluviosa', 'llave oxidada', 'diario íntimo', 
  'boleto de tren', 'chaqueta de cuero', 'anillo', 'radio de transistores',
  'maleta vieja', 'faro distante', 'piano desafinado', 'vela encendida', 
  'disco de vinilo', 'caja de cerillos', 'paraguas roto', 'botella con nota'
];

// Color, Fecha y Género se mantienen acotados según tus indicaciones
export const COLORES = [
  'rojo', 'verde', 'azul', 'negro', 'amarillo', 'blanco', 'violeta', 
  'gris', 'dorado', 'turquesa', 'rosa', 'marrón', 'naranja', 'plata'
];

export const FECHAS = [
  'primavera', 'verano', 'otoño', 'invierno', 'Halloween', 'Navidad', 
  'Año Nuevo', 'Día de Gracias', 'Día de la Independencia', 'cumpleaños', 'aniversario', 
  'madrugada de domingo', 'último día de clases', 'atardecer de verano', 
  'medianoche', 'lunes por la mañana', 'eclipse', 'solsticio'
];

export const CONCEPTOS = [
  'vida', 'muerte', 'pérdida', 'reflexión', 'carta', 'película', 'canción', 
  'recuerdo', 'sueño', 'idea', 'viaje sin retorno', 'tiempo perdido', 
  'identidad', 'transformación', 'secreto guardado', 'promesa rota', 
  'segunda oportunidad', 'destino', 'distancia', 'perdón', 'despedida', 'origen',
  'ambición', 'caos', 'iluminación', 'laberinto', 'renacimiento'
];

// Géneros (sin Reggae ni R&B)
export const GENEROS = [
  { id: 'Rock', name: 'Rock', defaultBpm: 120 },
  { id: 'Pop', name: 'Pop', defaultBpm: 115 },
  { id: 'Punk', name: 'Punk', defaultBpm: 145 },
  { id: 'Balada', name: 'Balada', defaultBpm: 70 },
  { id: 'Folk', name: 'Folk', defaultBpm: 95 },
  { id: 'Country', name: 'Country', defaultBpm: 105 },
  { id: 'BossaNova', name: 'Bossa Nova', defaultBpm: 80 },
  { id: 'Indie Rock', name: 'Indie Rock', defaultBpm: 125 },
  { id: 'Synthwave', name: 'Synthwave', defaultBpm: 110 },
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
  { name: '12-Bar Blues', numerales: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'] },
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
function spellNote(letterIndex, pc) {
  const letter = LETTERS[letterIndex % 7];
  let diff = (((pc - NATURAL_PC[letter]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
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
  const tonicLetter = LETTERS.indexOf(getKeyName(rootIndex, isMinor)[0]);

  return numerales.map((num) => {
    const match = /^([b#]?)([ivIV]+)(°?)$/.exec(num);
    const degree = match ? ROMAN.indexOf(match[2].toUpperCase()) : -1;
    if (degree === -1) throw new Error(`Grado no reconocido en la progresión: "${num}"`);

    const [, accidental, roman, dim] = match;
    const shift = accidental === 'b' ? -1 : accidental === '#' ? 1 : 0;
    const pc = (rootIndex + scale[degree] + shift + 12) % 12;
    const quality = dim ? 'dim' : roman === roman.toUpperCase() ? 'major' : 'minor';
    const suffix = quality === 'minor' ? 'm' : quality === 'dim' ? '°' : '';

    return { name: spellNote(tonicLetter + degree, pc) + suffix, pc, quality };
  });
}

// Frecuencias de la tríada en la octava de C4
export function getChordFrequencies(chord) {
  return CHORD_INTERVALS[chord.quality].map(
    (interval) => 261.63 * Math.pow(2, (chord.pc + interval) / 12)
  );
}

// Redacción en español: artículos y frases temporales correctas
const OBJETOS_FEMENINOS = new Set([
  'pareja', 'luna', 'boca', 'nariz', 'cama', 'taza', 'fotografía desgastada',
  'carta sin enviar', 'ventana lluviosa', 'llave oxidada', 'chaqueta de cuero',
  'radio de transistores', 'maleta vieja', 'vela encendida', 'caja de cerillos',
  'botella con nota'
]);
const OBJETOS_PLURALES = new Set(['ojos']);

export function conArticulo(objeto) {
  if (OBJETOS_PLURALES.has(objeto)) return { texto: `unos ${objeto}`, plural: true };
  return { texto: `${OBJETOS_FEMENINOS.has(objeto) ? 'una' : 'un'} ${objeto}`, plural: false };
}

const FRASES_FECHA = {
  'Día de Gracias': 'del Día de Gracias',
  'Día de la Independencia': 'del Día de la Independencia',
  'cumpleaños': 'de un cumpleaños',
  'aniversario': 'de un aniversario',
  'madrugada de domingo': 'de una madrugada de domingo',
  'último día de clases': 'del último día de clases',
  'atardecer de verano': 'de un atardecer de verano',
  'medianoche': 'de medianoche',
  'lunes por la mañana': 'de un lunes por la mañana',
  'eclipse': 'de un eclipse',
  'solsticio': 'del solsticio'
};

export const fraseFecha = (fecha) => FRASES_FECHA[fecha] ?? `de ${fecha}`;

// Base de datos de sinónimos para inspiración de letras
export const SINONIMOS_DB = {
  "amor": ["afecto", "cariño", "devoción", "apego", "ternura"],
  "tristeza": ["melancolía", "desolación", "pesadumbre", "nostalgia", "pena"],
  "alegría": ["gozo", "júbilo", "entusiasmo", "regocijo", "vitalidad"],
  "enojo": ["furia", "rabia", "indignación", "ira", "frustración"],
  "miedo": ["temor", "pavor", "angustia", "pánico", "recelo"],
  "repulsión": ["asco", "aversión", "rechazo", "desagrado", "repugnancia"],
  "intriga": ["curiosidad", "misterio", "fascinación", "suspenso", "interés"],
  "ansiedad": ["inquietud", "desasosiego", "impaciencia", "tensión", "zozobra"],
  "aburrimiento": ["apatía", "tedio", "desinterés", "hastío", "monotonía"],
  "envidia": ["celos", "anhelo", "resentimiento", "codicia", "despecho"],
  "pasión": ["ardor", "fervor", "fuego", "obsesión", "vehemencia"],
  "deseo": ["anhelo", "impulso", "tentación", "ambición", "aspiración"],
  "melancolía": ["añoranza", "tristeza", "soledad", "ensimismamiento"],
  "euforia": ["éxtasis", "exaltación", "frenesí", "exuberancia"],
  "soledad": ["aislamiento", "desamparo", "retiro", "vacío", "intimidad"],
  "gratitud": ["agradecimiento", "reconocimiento", "aprecio"],
  "culpa": ["remordimiento", "pesar", "cargo de conciencia"],
  "desesperanza": ["desaliento", "desesperación", "derrota"],
  "serenidad": ["calma", "paz", "tranquilidad", "sosiego"],
  "vulnerabilidad": ["fragilidad", "sensibilidad", "exposición"],
  "asombro": ["deslumbramiento", "estupefacción", "maravilla"],
  "frustración": ["impotencia", "desengaño", "contrariedad"],
  "esperanza": ["ilusión", "fe", "optimismo", "confianza"],
  "familiar": ["pariente", "allegado", "sangre", "ancestro"],
  "infante": ["niño", "criatura", "pequeño", "infancia"],
  "amigo": ["compañero", "confidente", "camarada"],
  "pareja": ["amante", "compañero/a", "amor", "mitad"],
  "desconocido": ["extraño", "forastero", "transeúnte", "sombra"],
  "luna": ["astro nocturno", "satélite", "plata celeste"],
  "ojos": ["mirada", "pupilas", "destellos", "visión"],
  "boca": ["labios", "sonrisa", "suspiro", "aliento"],
  "cama": ["lecho", "refugio", "sábanas", "descanso"],
  "espejo": ["reflejo", "cristal", "reverso", "duplicado"],
  "reloj antiguo": ["cronómetro", "péndulo", "segundero"],
  "fotografía desgastada": ["retrato", "instantánea", "captura"],
  "carta sin enviar": ["epístola", "confesión", "mensaje mudo"],
  "diario íntimo": ["cuaderno", "bitácora", "confesionario"],
  "vida": ["existencia", "latido", "transcurso", "camino"],
  "muerte": ["final", "despedida", "partida", "silencio eterno"],
  "pérdida": ["ausencia", "extravío", "vacío", "despojo"],
  "reflexión": ["meditación", "pensamiento", "introspección"],
  "recuerdo": ["memoria", "evocación", "huella", "reminiscencia"],
  "sueño": ["anhelo", "quimera", "ilusión", "fantasía"],
  "tiempo perdido": ["horas muertas", "pasado irrecuperable"],
  "secreto guardado": ["confidencia", "misterio oculto", "sigilo"],
  "promesa rota": ["juramento vano", "traición", "desengaño"],
  "destino": ["azar", "camino trazado", "futuro"],
  "distancia": ["lejanía", "abismo", "separación", "horizonte"]
};
