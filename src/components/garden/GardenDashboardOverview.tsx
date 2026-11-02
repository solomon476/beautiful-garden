import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Music2,
  PenLine,
  Camera,
  Layers,
  CalendarDays,
  HelpCircle,
  Hourglass,
  Globe,
  Smile,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { moodGardenService } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';

interface GardenDashboardOverviewProps {
  onSelectTab: (tab: any) => void;
  currentUser: UserProfile;
}

export const GardenDashboardOverview: React.FC<GardenDashboardOverviewProps> = ({
  onSelectTab,
  currentUser,
}) => {
  const [selectedMoodMessage, setSelectedMoodMessage] = useState<string | null>(null);

  const handleQuickMood = async (moodKey: string, emoji: string, label: string) => {
    soundEngine.playChime(659.25, 1.0, 0.09);
    await moodGardenService.setMood(moodKey, `Feeling ${label.toLowerCase()} right now ✨`, true);
    setSelectedMoodMessage(`Mood set to ${emoji} ${label} in Our Shared Garden!`);
    setTimeout(() => setSelectedMoodMessage(null), 3500);
  };

  const featureCards = [
    {
      id: 'sound',
      badge: '🎵 Listen • Share • Feel',
      title: 'Sound Garden',
      description: 'Songs that remind us of each other.',
      buttonText: 'Explore Music',
      icon: Music2,
      image: '/assets/garden/card_sound.jpg',
      badgeColor: 'border-purple-400/40 text-purple-200 bg-purple-500/20',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'letters',
      badge: '✉ Write • Share • Connect',
      title: 'Letters in the Garden',
      description: "Say what's in your heart, anytime.",
      buttonText: 'Write a Letter',
      icon: PenLine,
      image: '/assets/garden/card_letters.jpg',
      badgeColor: 'border-pink-400/40 text-pink-200 bg-pink-500/20',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 'archive',
      badge: '📷 Capture • Remember',
      title: 'Our Little Archive',
      description: "Memories we'll keep forever.",
      buttonText: 'View Memories',
      icon: Camera,
      image: '/assets/garden/card_archive.jpg',
      badgeColor: 'border-rose-400/40 text-rose-200 bg-rose-500/20',
      gradient: 'from-rose-500 to-purple-600',
    },
    {
      id: 'shelf',
      badge: '⭐ Discover • Recommend',
      title: 'The Exchange Shelf',
      description: 'Books, movies, places and more.',
      buttonText: 'Explore More',
      icon: Layers,
      image: '/assets/garden/card_shelf.jpg',
      badgeColor: 'border-amber-400/40 text-amber-200 bg-amber-500/20',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 'petals',
      badge: '🌸 Share • Appreciate',
      title: 'Petal Notes',
      description: 'Small notes, big meanings.',
      buttonText: 'View Notes',
      icon: Sparkles,
      image: '/assets/garden/card_petals.jpg',
      badgeColor: 'border-pink-400/40 text-pink-200 bg-pink-500/20',
      gradient: 'from-pink-500 to-rose-400',
    },
    {
      id: 'time',
      badge: '📅 Plan • Enjoy',
      title: 'Our Time',
      description: 'Plan our next adventure together.',
      buttonText: 'Suggest an Activity',
      icon: CalendarDays,
      image: '/assets/garden/card_time.jpg',
      badgeColor: 'border-teal-400/40 text-teal-200 bg-teal-500/20',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      id: 'questions',
      badge: '💡 Explore • Learn',
      title: 'Little Questions',
      description: 'Thoughtful prompts for deeper chats.',
      buttonText: 'See a Question',
      icon: HelpCircle,
      image: '/assets/garden/card_questions.jpg',
      badgeColor: 'border-sky-400/40 text-sky-200 bg-sky-500/20',
      gradient: 'from-sky-500 to-indigo-600',
    },
    {
      id: 'capsule',
      badge: '🔒 Save • Reveal',
      title: 'Time Capsule',
      description: 'A message for our future selves.',
      buttonText: 'Create a Capsule',
      icon: Hourglass,
      image: '/assets/garden/card_capsule.jpg',
      badgeColor: 'border-amber-400/40 text-amber-200 bg-amber-500/20',
      gradient: 'from-amber-500 to-yellow-600',
    },
  ];

  const worldPills = [
    { label: "🎗 Men's Mental Health", category: 'Mental Wellbeing' },
    { label: '⚖ Gender Equality', category: 'Equality & Dignity' },
    { label: '🌍 Human Rights', category: 'Human Rights' },
    { label: '💖 Kindness', category: 'Kindness & Society' },
    { label: '🪷 Mental Wellness', category: 'Mental Wellbeing' },
    { label: '👥 Social Justice', category: 'Equality & Dignity' },
  ];

  const moodsList = [
    { key: 'happy', emoji: '😄', label: 'Happy' },
    { key: 'calm', emoji: '😌', label: 'Calm' },
    { key: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
    { key: 'tired', emoji: '😴', label: 'Tired' },
    { key: 'music', emoji: '🎧', label: 'Looking for Music' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* 1. HERO GARDEN SHOWCASE                                        */}
      {/* ============================================================== */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-purple-400/25 shadow-2xl bg-[#0e0720]">
        {/* Background Image with Twilight Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('/assets/garden/hero_bench.jpg')`,
            filter: 'brightness(0.92) contrast(1.05)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14, 7, 32, 0.45) 0%, rgba(14, 7, 32, 0.78) 60%, rgba(14, 7, 32, 0.95) 100%), radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.25) 0%, transparent 60%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 px-6 sm:px-12 py-12 sm:py-16 md:py-20 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-mono tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-pink-300 fill-pink-300" />
              <span>A Private Garden for Us ♡</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
              Our Garden <span className="font-sans text-pink-300 font-light">♡</span>
            </h1>

            <p className="font-handwriting text-xl sm:text-2xl md:text-3xl text-pink-200/90 leading-relaxed drop-shadow">
              A little corner for our thoughts, dreams and everything that matters... 💜
            </p>
          </div>

          {/* Floating Keepsake Quote Card */}
          <div className="relative md:max-w-xs shrink-0 self-start md:self-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-pink-300/40 backdrop-blur-xl shadow-2xl transition-all group">
            <span className="text-3xl text-pink-300 font-serif leading-none block select-none">“</span>
            <p className="font-serif italic text-sm sm:text-base text-slate-100 leading-relaxed">
              Some things are better shared... especially the beautiful ones.
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 text-right">
              <span className="text-[11px] font-mono text-pink-300 font-medium">
                — Perfect Time ♡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. EIGHT MAIN KEEPSAKE FEATURE CARDS (4x2 Balanced Grid)       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {featureCards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => {
                soundEngine.playSparkle();
                onSelectTab(card.id);
              }}
              className="group relative p-5 rounded-[2rem] bg-[#140b2b]/85 hover:bg-[#1a0f38]/95 border border-purple-400/20 hover:border-pink-400/50 shadow-xl hover:shadow-2xl hover:shadow-pink-500/15 backdrop-blur-xl cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Soft Ambient Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all pointer-events-none" />

              <div className="space-y-4">
                {/* Category Pill */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono px-3 py-1 rounded-full border tracking-wide whitespace-nowrap backdrop-blur-sm ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Card Artwork Thumbnail */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/25 shadow-md">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0720]/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-300/85 font-light mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white text-xs font-semibold tracking-wide shadow-md shadow-pink-500/25 group-hover:shadow-pink-500/40 group-hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/20"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM ROW: The World Around Us + Our Mood Garden           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The World Around Us Banner (8 cols) */}
        <div
          onClick={() => {
            soundEngine.playSparkle();
            onSelectTab('world');
          }}
          className="lg:col-span-8 group relative p-6 sm:p-7 rounded-[2rem] bg-[#140b2b]/90 hover:bg-[#1a0f38]/95 border border-blue-400/25 hover:border-blue-400/50 shadow-xl backdrop-blur-xl cursor-pointer transition-all duration-300 flex flex-col md:flex-row items-center gap-6 overflow-hidden"
        >
          {/* Earth Artwork Thumbnail */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-blue-400/30 shadow-lg group-hover:scale-105 transition-transform">
            <img
              src="/assets/garden/card_world.jpg"
              alt="The World Around Us"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Details & Clickable Cause Pills */}
          <div className="flex-1 space-y-3.5 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[10px] font-mono uppercase tracking-widest">
                <Globe className="w-3 h-3 text-blue-300" />
                <span>A World Worth Caring About</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white group-hover:text-blue-200 transition-colors mt-1">
                The World Around Us 🌍
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/85 font-light leading-relaxed">
                Thoughts, causes and conversations that matter.
              </p>
            </div>

            {/* Clickable Cause Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 pt-1">
              {worldPills.map((pill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-blue-500/20 border border-white/10 hover:border-blue-400/40 text-slate-300 hover:text-blue-200 text-[11px] font-medium transition-all"
                >
                  {pill.label}
                </span>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform border border-white/20"
              >
                <span>Explore Topics</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Our Mood Garden Banner (4 cols) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-[2rem] bg-[#140b2b]/90 border border-purple-400/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Our Mood Garden</span>
                <span className="text-purple-300 text-lg">🌙</span>
              </h3>
              <button
                onClick={() => onSelectTab('moods')}
                className="text-[11px] font-mono text-purple-300 hover:text-pink-200 underline underline-offset-4"
              >
                History →
              </button>
            </div>
            <p className="text-xs text-slate-300/85 font-light mt-1">
              How are you feeling today, {currentUser.displayName}?
            </p>
          </div>

          {/* Emoji Mood Pill Row */}
          <div className="flex items-center justify-between gap-1.5 bg-white/[0.03] p-2.5 rounded-2xl border border-white/10">
            {moodsList.map((m) => (
              <button
                key={m.key}
                onClick={() => handleQuickMood(m.key, m.emoji, m.label)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all text-center flex-1"
                title={`I'm feeling ${m.label}`}
              >
                <span className="text-2xl transition-transform hover:scale-125">{m.emoji}</span>
                <span className="text-[9px] font-mono text-slate-300 truncate max-w-[50px]">
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {selectedMoodMessage ? (
            <div className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-400/30 text-center text-xs text-pink-200 font-medium animate-fade-in">
              {selectedMoodMessage}
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => onSelectTab('moods')}
                className="inline-flex items-center gap-1.5 text-xs text-pink-300 hover:text-pink-200 font-medium"
              >
                <Smile className="w-3.5 h-3.5 text-pink-400" />
                <span>Open Full Mood Journal & Whispers</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
