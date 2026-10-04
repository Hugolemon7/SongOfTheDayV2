// Patrones de batería de un compás (16 semicorcheas) por género.
// Cada carácter es un paso: X acento · x normal · g fantasma (suave) · . silencio
//
// Voces: kick (bombo), snare (caja), rim (aro / cross-stick),
//        hat (charles cerrado), open (charles abierto), shaker (maracas)

export const PATTERNS = {
  Rock: {
    kick:  'X.......X.x.....',
    snare: '....X.......X...',
    hat:   'x.x.x.x.x.x.x.x.'
  },
  Pop: {
    kick:   'X.....x.X.......',
    snare:  '....X.......X...',
    hat:    'x.x.x.x.x.x.x.x.',
    shaker: '.g.g.g.g.g.g.g.g'
  },
  // Ritmo "polka" punk: bombo en cada tiempo, caja a contratiempo
  Punk: {
    kick:  'X...X...X...X...',
    snare: '..X...X...X...X.',
    hat:   'x.x.x.x.x.x.x.x.'
  },
  Balada: {
    kick:  'X.........x.....',
    snare: '....x.......x...',
    hat:   'g.g.g.g.g.g.g.g.',
    open:  '..............g.'
  },
  // Escobillas: aro suave en 2 y 4, maracas en semicorcheas
  Folk: {
    kick:   'X.......X.......',
    rim:    '....x.......x...',
    shaker: 'xgxgxgxgxgxgxgxg'
  },
  // "Train beat": caja continua con acento en 2 y 4
  Country: {
    kick:  'X.......X.......',
    snare: 'ggggXgggggggXggg'
  },
  // Surdo en 1, 1a, 2... y clave de bossa con el aro
  BossaNova: {
    kick: 'X..xX..xX..xX..x',
    rim:  'x..x..x...x..x..',
    hat:  'g.g.g.g.g.g.g.g.'
  },
  'Indie Rock': {
    kick:  'X......xX.......',
    snare: '....X.......X...',
    hat:   'xgxgxgxgxgxgxgxg'
  },
  // Maracas en corcheas y el "martillo" del bongó en el aro
  Bolero: {
    kick:   'X.......X.....x.',
    rim:    '....x.....x.x...',
    shaker: 'X.x.x.x.X.x.x.x.'
  }
};

export const DEFAULT_PATTERN = PATTERNS.Pop;

const VELOCITY = { X: 1, x: 0.75, g: 0.35 };

// Devuelve [{ voice, velocity }] para un paso del compás
export function hitsAt(genre, step) {
  const pattern = PATTERNS[genre] ?? DEFAULT_PATTERN;
  const hits = [];
  for (const [voice, line] of Object.entries(pattern)) {
    const velocity = VELOCITY[line[step]];
    if (velocity) hits.push({ voice, velocity });
  }
  return hits;
}
