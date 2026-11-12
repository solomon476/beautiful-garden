import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Volume2, Mic, Heart } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface GardenAudioPlayerProps {
  src: string;
  title?: string;
  subtitle?: string;
  isVoiceNote?: boolean;
}

// Generates a realistic, pleasing voice soundwave profile based on src and bar count
function generateWaveformPattern(seedStr: string, count: number = 32): number[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // Combine sinusoidal curves with pseudo-random harmonics for natural speech contours
    const t = i / (count - 1);
    const envelope = Math.sin(t * Math.PI); // Envelope peaks in the center like natural speaking
    const pseudoRand = Math.abs(Math.sin((i + 1) * (hash || 12345) * 0.231));
    const harmonic = Math.sin(i * 0.7) * 0.25;
    
    // Normalized height between 22% and 100%
    const height = Math.min(100, Math.max(22, Math.round((envelope * 0.7 + pseudoRand * 0.45 + harmonic) * 100)));
    bars.push(height);
  }
  return bars;
}

export const GardenAudioPlayer: React.FC<GardenAudioPlayerProps> = ({
  src,
  title,
  subtitle,
  isVoiceNote = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [waveSeed] = useState(() => src || 'voice-note');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  const waveformBars = useMemo(() => generateWaveformPattern(waveSeed, 30), [waveSeed]);

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

    soundEngine.playSparkle();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => console.warn('Audio playback error', err));
      setIsPlaying(true);
    }
  };

  const togglePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    soundEngine.playSparkle();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const container = waveformContainerRef.current;
    if (!audio || !container) return;

    soundEngine.playSparkle();
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = (duration || 1) * percentage;

    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * waveformBars.length);

  return (
    <div className="w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-950/70 to-pink-950/50 border border-pink-400/30 backdrop-blur-md flex flex-col gap-2.5 shadow-lg overflow-hidden transition-all hover:border-pink-400/50">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Top Details & Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all active:scale-90 cursor-pointer ${
              isPlaying
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-pink-500/40 ring-2 ring-pink-400/60'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-purple-500/30 hover:scale-105'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play voice note'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-white" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              {isVoiceNote && <Mic className="w-3.5 h-3.5 text-pink-300 shrink-0" />}
              <span className="font-serif font-bold text-xs sm:text-sm text-white truncate">
                {title || (isVoiceNote ? 'Voice Note' : 'Audio Track')}
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-pink-300 bg-pink-500/20 px-1.5 py-0.2 rounded-full border border-pink-400/30 animate-pulse">
                  <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                  <span>Listening</span>
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[10px] text-pink-200/70 block truncate font-mono">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Timer & Speed Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={togglePlaybackRate}
            className="px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-pink-200 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Toggle playback speed (1x, 1.5x, 2x)"
          >
            {playbackRate}x
          </button>

          <div className="flex items-center gap-1 text-[11px] font-mono text-pink-200/80">
            <Volume2 className="w-3 h-3 text-pink-400" />
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Heartbeat Soundwave Waveform Visualizer */}
      <div
        ref={waveformContainerRef}
        onClick={handleWaveformClick}
        className="relative h-10 w-full flex items-center justify-between gap-[3px] sm:gap-1 px-1 cursor-pointer group py-1 select-none"
        title="Tap anywhere on the waveform to seek"
      >
        {waveformBars.map((heightPercent, idx) => {
          const isPassed = idx <= activeBarIndex;
          const isCurrent = idx === activeBarIndex && isPlaying;

          // Pulsing height animation when actively playing this bar
          const barHeight = isCurrent
            ? Math.min(100, heightPercent * 1.25)
            : heightPercent;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col justify-center items-center h-full group-hover:scale-y-105 transition-transform"
            >
              <div
                className={`w-full rounded-full transition-all duration-150 ${
                  isCurrent
                    ? 'bg-gradient-to-t from-rose-400 via-pink-400 to-amber-300 shadow-[0_0_12px_rgba(244,63,94,0.8)] scale-y-110'
                    : isPassed
                    ? 'bg-gradient-to-t from-pink-500 to-rose-400 shadow-[0_0_6px_rgba(236,72,153,0.4)]'
                    : 'bg-white/20 group-hover:bg-white/30'
                }`}
                style={{
                  height: `${barHeight}%`,
                  minHeight: '6px',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
