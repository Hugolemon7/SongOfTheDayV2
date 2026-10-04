import React, { useState, useRef, useEffect } from 'react';
import { createRecordingMix, toWav } from '../audio/engine';

// Safari graba en mp4, Chrome/Firefox en webm/ogg: se graba en el formato nativo
// y luego se convierte a WAV para exportar.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const pickMimeType = () =>
  MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';

const extensionFor = (mime) =>
  mime.includes('wav') ? 'wav' : mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const formatSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function fileStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function describeError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Permiso de micrófono denegado. Actívalo en la configuración del navegador y vuelve a intentarlo.';
    case 'NotFoundError':
      return 'No se encontró ningún micrófono conectado.';
    case 'NotReadableError':
      return 'El micrófono está siendo usado por otra aplicación.';
    default:
      return 'No se pudo iniciar la grabación. Vuelve a intentarlo.';
  }
}

export default function VoiceRecorder({
  title = 'Grabadora de ideas',
  recordLabel = 'Grabar idea',
  fileBase = 'idea'
}) {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording | processing
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(null); // { url, file }
  const [elapsed, setElapsed] = useState(0);
  const [includeBase, setIncludeBase] = useState(true);
  const [shareNote, setShareNote] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const mixRef = useRef(null);
  const chunksRef = useRef([]);
  const urlRef = useRef(null);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const releaseStream = () => {
    mixRef.current?.dispose();
    mixRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const finishRecording = async (rawBlob, rawType) => {
    setStatus('processing');
    let blob = rawBlob;
    try {
      blob = await toWav(rawBlob);
    } catch {
      // Si el navegador no puede decodificarla, se exporta en su formato original
      blob = new Blob([rawBlob], { type: rawType });
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(blob);
    const file = new File([blob], `${fileBase}-${fileStamp()}.${extensionFor(blob.type)}`, { type: blob.type });
    setRecording({ url: urlRef.current, file });
    setStatus('idle');
  };

  const startRecording = async () => {
    if (!isSupported || status !== 'idle') return;
    setError(null);
    setShareNote(null);
    setStatus('requesting');
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mic;
      // Mezcla voz + base en el mismo contexto de audio; si falla, solo micrófono
      let source = mic;
      try {
        mixRef.current = createRecordingMix(mic, includeBase);
        source = mixRef.current.stream;
      } catch {
        mixRef.current = null;
      }

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(source, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        releaseStream();
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size === 0) {
          setError('La grabación quedó vacía. Vuelve a intentarlo.');
          setStatus('idle');
          return;
        }
        finishRecording(blob, type);
      };

      recorder.start();
      setElapsed(0);
      setStatus('recording');
    } catch (err) {
      releaseStream();
      setError(describeError(err));
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  // Menú de compartir del sistema: Notas, Archivos, WhatsApp, correo…
  const canShare = !!(recording && navigator.canShare?.({ files: [recording.file] }));
  const shareRecording = async () => {
    setShareNote(null);
    try {
      await navigator.share({ files: [recording.file], title: recording.file.name });
    } catch (err) {
      if (err?.name !== 'AbortError') setShareNote('No se pudo abrir el menú de compartir. Usa «Descargar».');
    }
  };

  useEffect(() => {
    if (status !== 'recording') return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Al salir: detener micrófono y liberar el archivo en memoria
  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseStream();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const busy = status === 'requesting' || status === 'processing';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-console-mute">{title}</span>
        {status === 'recording' && (
          <span className="font-mono text-xs font-medium text-rec tabular-nums flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rec animate-pulse" aria-hidden="true" />
            REC {formatTime(elapsed)}
          </span>
        )}
      </div>

      {!isSupported ? (
        <p className="text-sm text-console-mute">
          Tu navegador no permite grabar audio desde la página. Prueba con una versión reciente de Chrome, Safari o Firefox.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {status !== 'recording' ? (
              <button
                onClick={startRecording}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-rec text-console-text text-sm font-semibold hover:bg-rec transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rec" aria-hidden="true" />
                {status === 'requesting' ? 'Esperando permiso…' : status === 'processing' ? 'Preparando WAV…' : recording ? 'Grabar otra toma' : recordLabel}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-console-text text-console text-sm font-semibold hover:bg-white transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-console" aria-hidden="true" />
                Detener
              </button>
            )}

            <label className={`inline-flex items-center gap-2 text-sm text-console-text select-none ${status === 'recording' ? 'opacity-50' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={includeBase}
                disabled={status === 'recording'}
                onChange={(e) => setIncludeBase(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-rec)]"
              />
              Incluir la base
            </label>
          </div>

          <p className="text-xs text-console-mute">
            {includeBase
              ? 'La grabación mezcla tu voz con lo que suene en la consola. Pulsa ▶ para grabar con la base.'
              : 'Solo se graba el micrófono.'}
          </p>

          {recording && status !== 'recording' && (
            <div className="flex flex-col gap-2 rounded-xl border border-console-line bg-console-2 p-3">
              <audio src={recording.url} controls className="h-9 w-full" />
              <div className="flex flex-wrap items-center gap-2">
                {canShare && (
                  <button
                    onClick={shareRecording}
                    className="px-3.5 py-2 rounded-full bg-console-text text-console text-sm font-semibold hover:bg-white transition-colors"
                  >
                    Compartir…
                  </button>
                )}
                <a
                  href={recording.url}
                  download={recording.file.name}
                  className="px-3.5 py-2 rounded-full border border-console-line text-console-text text-sm font-semibold hover:bg-console hover:border-console-mute transition-colors"
                >
                  Descargar
                </a>
                <span className="font-mono text-[11px] text-console-mute">
                  {extensionFor(recording.file.type).toUpperCase()} · {formatSize(recording.file.size)}
                </span>
              </div>
              {canShare && (
                <p className="text-xs text-console-mute">«Compartir» abre el menú del sistema para guardarla en Notas, Archivos o enviarla.</p>
              )}
              {shareNote && <p role="alert" className="text-xs font-medium text-[#ff8a73]">{shareNote}</p>}
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-[#ff8a73]">{error}</p>
      )}
    </div>
  );
}
