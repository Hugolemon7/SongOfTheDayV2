import React, { useState, useRef, useEffect } from 'react';

// Safari graba en mp4, Chrome/Firefox en webm/ogg: usar el primero soportado
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const pickMimeType = () =>
  MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';

const extensionFor = (mime) =>
  mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

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

export default function VoiceRecorder() {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(null); // { url, ext }
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const urlRef = useRef(null);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!isSupported || status !== 'idle') return;
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(blob);
        setRecording({ url: urlRef.current, ext: extensionFor(type) });
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
    setStatus('idle');
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-console-mute">Grabadora de ideas</span>
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
        <div className="flex flex-wrap items-center gap-3">
          {status !== 'recording' ? (
            <button
              onClick={startRecording}
              disabled={status === 'requesting'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-rec text-console-text text-sm font-semibold hover:bg-rec transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rec" aria-hidden="true" />
              {status === 'requesting' ? 'Esperando permiso…' : recording ? 'Grabar otra toma' : 'Grabar maqueta'}
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

          {recording && status !== 'recording' && (
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <audio src={recording.url} controls className="h-9 w-full max-w-xs" />
              <a
                href={recording.url}
                download={`song-idea-sketch.${recording.ext}`}
                className="px-3.5 py-2 rounded-full border border-console-line text-console-text text-sm font-semibold hover:bg-console-2 transition-colors"
              >
                Exportar
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-[#ff8a73]">{error}</p>
      )}
    </div>
  );
}
