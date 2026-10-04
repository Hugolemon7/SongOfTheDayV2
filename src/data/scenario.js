import { GENEROS, PROGRESIONES, INITIAL_KEYS, getModo } from './musicData.js';
import {
  SENTIMIENTOS, OBJETOS, COLORES, FECHAS, CONCEPTOS, conArticulo, fraseFecha
} from './words.js';

// Sin género elegido, un tempo neutro para practicar
export const DEFAULT_BPM = 100;

// El escenario del día siempre usa todos los pilares: es igual para todos
export const ALL_PILLARS = {
  sentimiento: true,
  objeto: true,
  color: true,
  fecha: true,
  concepto: true,
  tonalidad: true,
  progresion: true,
  genero: true
};

// En el inicio las cards empiezan deseleccionadas
export const NO_PILLARS = Object.fromEntries(Object.keys(ALL_PILLARS).map((key) => [key, false]));

// PRNG determinista (mulberry32): misma semilla → misma secuencia en cualquier dispositivo
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a de 32 bits
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Fecha local (no UTC): el día cambia a la medianoche de cada persona
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const dailyRng = (date) => mulberry32(hashString(`song-of-the-day:${toDateKey(date)}`));

// Nº del día dentro del año (1 de enero = 1)
export function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86400000) + 1;
}

export const formatLongDate = (date) =>
  new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);

// Construye un escenario completo a partir de un generador aleatorio.
// Importante: el orden de las llamadas a rng() es fijo para que la semilla diaria sea estable.
export function buildScenario(rng, pillars) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  const sentimiento = pillars.sentimiento ? pick(SENTIMIENTOS) : null;
  const objeto = pillars.objeto ? pick(OBJETOS) : null;
  const color = pillars.color ? pick(COLORES) : null;
  const fecha = pillars.fecha ? pick(FECHAS) : null;
  const concepto = pillars.concepto ? pick(CONCEPTOS) : null;
  const generoObj = pillars.genero ? pick(GENEROS) : null;
  const progresionObj = pillars.progresion ? pick(PROGRESIONES) : PROGRESIONES[1];

  // La tonalidad sigue el modo de la progresión para que los grados suenen bien
  const isMinor = getModo(progresionObj) === 'menor';
  const key = pillars.tonalidad
    ? pick(INITIAL_KEYS.filter((k) => k.isMinor === isMinor))
    : { rootIndex: isMinor ? 9 : 0, isMinor };

  // Redacción del escenario con frases fluidas y congruentes para el cantante
  const partGenre = generoObj ? `Propuesta estilística orientada al género ${generoObj.name}.` : '';
  // Instrucción directa: "Crea una canción con…"
  const partCore = sentimiento && concepto
    ? `Crea una canción con un sentimiento de ${sentimiento}, en torno al concepto de ${concepto}.`
    : sentimiento
      ? `Crea una canción con un sentimiento de ${sentimiento}.`
      : concepto
        ? `Crea una canción con el concepto de ${concepto} como centro.`
        : 'Crea una canción con una interpretación vocal íntima y expresiva.';

  const sujeto = objeto ? conArticulo(objeto) : { texto: 'un elemento clave', plural: false };
  const partContext = (objeto || color || fecha)
    ? `La composición se sitúa en un marco donde ${sujeto.texto}${color ? ` de color ${color}` : ''} ${sujeto.plural ? 'cobran' : 'cobra'} protagonismo, evocando memorias ${fecha ? fraseFecha(fecha) : 'de un momento suspendido en el tiempo'}.`
    : 'El contexto lírico permanece abierto a la libre inspiración del autor.';

  return {
    sentimiento,
    objeto,
    color,
    fecha,
    concepto,
    generoObj,
    progresionObj,
    partGenre,
    partCore,
    partContext,
    key: { rootIndex: key.rootIndex, isMinor: key.isMinor },
    bpm: generoObj ? generoObj.defaultBpm : DEFAULT_BPM
  };
}

export function buildDailyScenario(date) {
  return {
    ...buildScenario(dailyRng(date), ALL_PILLARS),
    source: 'daily',
    dateKey: toDateKey(date),
    number: dayOfYear(date),
    dateLabel: formatLongDate(date)
  };
}
