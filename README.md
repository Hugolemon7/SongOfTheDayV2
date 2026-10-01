# Song of the Day

Generador de ideas y maquetas de composición. Propone un escenario creativo (sentimiento, objeto, color, fecha y concepto) junto con una base musical que se puede tocar: tonalidad, progresión de acordes, groove del género y tempo. Sobre esa base puedes cantar y grabar un primer boceto.

- **Escenario del día:** uno por fecha local, igual para todos y sin necesidad de servidor (sale de una semilla calculada a partir de la fecha).
- **Idea libre:** escenarios aleatorios con los pilares que elijas.
- **Maqueta:** batería, metrónomo y acordes sintetizados con Web Audio, un acorde por compás.
- **Grabadora:** graba tu voz sobre la maqueta y expórtala (webm, o m4a en Safari).

## Desarrollo

```bash
npm install
npm run dev
```

- `npm run lint`: revisa el código con Oxlint.
- `npm run build`: genera la versión de producción en `dist/`.

El micrófono y el portapapeles solo funcionan en un contexto seguro (`localhost` o HTTPS).

## Estructura

- `src/data/musicData.js`: listas de palabras, progresiones, deletreo de acordes y reglas de redacción.
- `src/data/scenario.js`: construcción de escenarios y semilla del escenario del día.
- `src/components/AudioEngine.jsx`: programador de audio y controles de la consola.
- `src/components/VoiceRecorder.jsx`: grabación, errores de micrófono y exportación.
- `PRODUCT.md`: contexto de producto, principios y preguntas abiertas.
