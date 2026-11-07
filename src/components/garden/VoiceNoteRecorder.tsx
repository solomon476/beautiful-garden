import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw } from 'lucide-react';
import { mediaStorage } from '../../utils/mediaStorage';
import { soundEngine } from '../../utils/audio';

interface VoiceNoteRecorderProps {
  onRecorded: (dataUrl: string, durationSeconds: number, fileName: string) => void;
  onReset?: () => void;
  onCancel?: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onRecorded, onReset, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setAudioUrl(null);
    setDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      soundEngine.playSparkle();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blobType = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        const stored = await mediaStorage.saveFile(audioBlob, `VoiceNote-${Date.now()}.${blobType.includes('mp4') ? 'm4a' : 'webm'}`);
        setAudioUrl(stored.dataUrl);
        soundEngine.playSparkle();
        onRecorded(stored.dataUrl, duration, `Voice Note (${formatTime(duration)})`);
      };

      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Microphone access denied or not supported on this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      soundEngine.playChime(440, 0.4, 0.08);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setErrorMsg(null);
    onReset?.();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-[#170e2c] border border-pink-400/30 text-white space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
            <Mic className="w-4 h-4" />
          </span>
          <span className="font-serif text-sm font-semibold text-pink-100">
            Record a Personal Voice Note 🎙️
          </span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] font-mono text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      {errorMsg ? (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
          {errorMsg}
        </div>
      ) : isRecording ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-mono text-sm text-rose-200 font-bold tracking-widest">
              Recording: {formatTime(duration)}
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Recording</span>
          </button>
        </div>
      ) : audioUrl ? (
        <div className="p-3.5 rounded-2xl bg-pink-500/15 border border-pink-400/40 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="min-w-0">
                <span className="font-serif text-sm text-pink-100 font-semibold block truncate">
                  Voice Note Recorded ✨
                </span>
                <span className="text-[11px] text-pink-300/80 font-mono block">
                  Duration: {formatTime(duration)} • Attached & ready to save
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-pink-200 text-xs font-mono transition-all cursor-pointer shrink-0"
              title="Record again"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-record</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 space-y-2">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white text-sm font-semibold shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <Mic className="w-5 h-5 text-white animate-pulse" />
            <span>Tap to Record Voice Note</span>
          </button>
          <p className="text-[11px] text-pink-200/70 font-light max-w-sm mx-auto">
            Speak from the heart — records cleanly right from your phone or mic.
          </p>
        </div>
      )}
    </div>
  );
};

