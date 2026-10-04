// Modelo del proyecto de maqueta: secciones con grados armónicos (no nombres de
// acordes), así cambiar la tonalidad transpone toda la canción.
import { SECTION_PROGRESSIONS, SECTION_TYPES } from '../data/musicData';

const STORAGE_KEY = 'sotd:maqueta:v1';

const newId = () => Math.random().toString(36).slice(2, 10);

export const suggestionsFor = (type, isMinor) =>
  SECTION_PROGRESSIONS[type]?.[isMinor ? 'menor' : 'mayor'] ?? [];

export function createSection(type, progression) {
  return {
    id: newId(),
    type,
    progressionName: progression.name,
    numerales: [...progression.numerales]
  };
}

export function duplicateSection(section) {
  return { ...section, id: newId(), numerales: [...section.numerales] };
}

export function createProject({ type, key, progression, energy }) {
  const section = createSection(type, progression);
  return {
    version: 1,
    key: { rootIndex: key.rootIndex, isMinor: key.isMinor },
    bpm: energy.bpm,
    groove: energy.groove,
    sections: [section],
    activeId: section.id
  };
}

// "Verso 1", "Verso 2"… solo numera cuando hay más de una sección del mismo tipo
export function sectionLabels(sections) {
  const totals = {};
  sections.forEach((s) => { totals[s.type] = (totals[s.type] ?? 0) + 1; });
  const seen = {};
  const labels = {};
  sections.forEach((s) => {
    seen[s.type] = (seen[s.type] ?? 0) + 1;
    labels[s.id] = totals[s.type] > 1 ? `${s.type} ${seen[s.type]}` : s.type;
  });
  return labels;
}

// ── Guardado local (solo en este navegador) ──────────────────────────

const NUMERAL = /^[b#]?[ivIV]+°?$/;
const SECTION_IDS = new Set(SECTION_TYPES.map((t) => t.id));

function isValidProject(p) {
  return (
    p && p.version === 1 &&
    p.key && Number.isInteger(p.key.rootIndex) && p.key.rootIndex >= 0 && p.key.rootIndex < 12 &&
    typeof p.key.isMinor === 'boolean' &&
    Number.isFinite(p.bpm) && typeof p.groove === 'string' &&
    Array.isArray(p.sections) &&
    p.sections.every((s) =>
      s && typeof s.id === 'string' && SECTION_IDS.has(s.type) &&
      Array.isArray(s.numerales) && s.numerales.length > 0 && s.numerales.every((n) => NUMERAL.test(n))
    )
  );
}

export function loadProject() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const project = JSON.parse(raw);
    return isValidProject(project) ? project : null;
  } catch {
    return null;
  }
}

export function saveProject(project) {
  try {
    if (project) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento (modo privado): la maqueta vive solo en esta sesión
  }
}
