import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, RefreshCw } from 'lucide-react';
import { mediaStorage } from '../../utils/mediaStorage';
import { soundEngine } from '../../utils/audio';

interface VoiceNoteRecorderProps {
  onRecorded: (dataUrl: string, durationSeconds: number, fileName: string) => void;
  onCancel?: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onRecorded, onCancel }) => {
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

  const handleConfirm = () => {
    if (!audioUrl) return;
    soundEngine.playSparkle();
    onRecorded(audioUrl, duration, `Voice Note (${formatTime(duration)})`);
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
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="text-xs">
                <span className="font-mono text-pink-200 font-medium">Voice Note Ready</span>
                <span className="text-[10px] text-slate-400 block font-mono">Duration: {formatTime(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Record again"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 text-xs hover:bg-white/[0.05]"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              Discard
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              Attach Voice Note
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-3">
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
          >
            <Mic className="w-4 h-4 text-white" />
            <span>Tap to Record Voice Note</span>
          </button>
          <p className="text-[11px] text-slate-400 font-light mt-2">
            Speak from the heart — records cleanly right from your phone.
          </p>
        </div>
      )}
    </div>
  );
};

