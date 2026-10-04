# Song of the Day

Generador de ideas y maquetas de composición. Propone un escenario creativo (sentimiento, objeto, color, fecha y concepto) junto con una base musical que se puede tocar: tonalidad, progresión de acordes, groove del género y tempo. Sobre esa base puedes cantar y grabar un primer boceto.

- **Escenario del día:** uno por fecha local, igual para todos y sin necesidad de servidor (sale de una semilla calculada a partir de la fecha).
- **Idea libre:** escenarios aleatorios con los pilares que elijas.
- **Idea:** batería con un patrón propio por género, metrónomo (apagado al inicio) y acordes sintetizados con Web Audio, un acorde por compás. La progresión se puede cambiar.
- **Modo avanzado, «Crea una maqueta»:** un cuestionario (sección, tono, progresión y energía) lleva a un proyecto por secciones. Ahí puedes reordenar, duplicar, eliminar y cambiar acordes desde los grados de la tonalidad, y escuchar o grabar la canción completa.
- **Grabadora:** graba la voz, sola o junto con la base, y la exporta en WAV. Donde el navegador lo permite, la comparte con el menú del sistema (Notas, Archivos…).

## Desarrollo

```bash
npm install
npm run dev
```

- `npm run lint`: revisa el código con Oxlint.
- `npm run build`: genera la versión de producción en `dist/`.

El micrófono y el portapapeles solo funcionan en un contexto seguro (`localhost` o HTTPS).

## Estructura

- `src/data/musicData.js`: géneros, progresiones, deletreo de acordes, progresiones por sección y paleta de acordes.
- `src/data/words.js`: listas de palabras, «Otras palabras» y reglas de redacción.
- `src/data/scenario.js`: construcción de escenarios y semilla del escenario del día.
- `src/audio/engine.js`: contexto de audio compartido, voces sintetizadas, mezcla para grabar y conversión a WAV.
- `src/audio/patterns.js`: patrones de batería por género.
- `src/components/AudioEngine.jsx`: programador de audio y controles de la consola.
- `src/components/VoiceRecorder.jsx`: grabación, errores de micrófono, WAV y compartir.
- `src/maqueta/`: Modo avanzado (`Quiz.jsx`, `Project.jsx` y el modelo con guardado local en `model.js`).
- `PRODUCT.md`: contexto de producto, principios y preguntas abiertas.
