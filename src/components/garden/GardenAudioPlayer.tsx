import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

interface GardenAudioPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  isVoiceNote?: boolean;
}

export const GardenAudioPlayer: React.FC<GardenAudioPlayerProps> = ({
  src,
  title,
  subtitle,
  isVoiceNote = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => console.warn('Audio playback error', err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.05] border border-pink-400/25 backdrop-blur-md flex flex-col gap-2 shadow-inner overflow-hidden">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
              isVoiceNote
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/25'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/25'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play audio'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              {isVoiceNote && <Mic className="w-3.5 h-3.5 text-pink-300 shrink-0" />}
              <span className="font-medium text-xs text-white truncate">
                {title || (isVoiceNote ? 'Voice Note' : 'Audio Track')}
              </span>
            </div>
            {subtitle && (
              <span className="text-[10px] text-pink-200/70 block truncate font-mono">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-pink-300/80 shrink-0">
          <Volume2 className="w-3 h-3 text-pink-400" />
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="flex items-center gap-2 pt-0.5">
        <input
          type="range"
          min={0}
          max={isFinite(duration) && duration > 0 ? duration : 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#ec4899' }}
        />
      </div>
    </div>
  );
};

