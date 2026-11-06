import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  PenLine,
  HelpCircle,
  Hourglass,
  Globe,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import type { UserProfile } from '../../types/garden';
import { UserSwitcher } from './UserSwitcher';
import type { QuickAddType } from './QuickAddStudioModal';

interface GardenDashboardOverviewProps {
  onSelectTab: (tab: any) => void;
  currentUser: UserProfile;
  onOpenAddStudio?: (type: QuickAddType) => void;
}

export const GardenDashboardOverview: React.FC<GardenDashboardOverviewProps> = ({
  onSelectTab,
  currentUser,
  onOpenAddStudio,
}) => {

  // 6 Main Keepsake Cards matching Photo 3 (media_1793957441024_e4a2ec37.jpg)
  const keepsakeCards = [
    {
      id: 'archive',
      title: 'Our Memories',
      subtitle: 'Relive our favourite moments together.',
      image: '/assets/garden/keepsake_memories.jpg',
      targetTab: 'archive',
    },
    {
      id: 'petals',
      title: 'Petal Notes',
      subtitle: 'Write and read our personal notes.',
      image: '/assets/garden/keepsake_petals.jpg',
      targetTab: 'petals',
    },
    {
      id: 'moods',
      title: 'Mood Garden',
      subtitle: 'Share how we feel today.',
      image: '/assets/garden/keepsake_moods.jpg',
      targetTab: 'moods',
    },
    {
      id: 'sound',
      title: 'Sound Garden',
      subtitle: 'Listen to our special playlist.',
      image: '/assets/garden/keepsake_sound.jpg',
      targetTab: 'sound',
    },
    {
      id: 'archive_shelf',
      title: 'Our Little Archive',
      subtitle: 'Keep our precious memories safe.',
      image: '/assets/garden/keepsake_archive.jpg',
      targetTab: 'archive',
    },
    {
      id: 'shelf',
      title: 'Exchange Shelf',
      subtitle: 'Share and discover little treasures.',
      image: '/assets/garden/keepsake_shelf.jpg',
      targetTab: 'shelf',
    },
  ];

  // 4 Recent Additions Polaroid Cards matching Photo 3
  const recentAdditions = [
    {
      id: 'sunset',
      title: 'Perfect sunset',
      subtitle: 'A beautiful evening ❤️',
      date: 'Nov 5, 2026',
      image: '/assets/garden/recent_sunset.jpg',
    },
    {
      id: 'roses',
      title: 'Our roses',
      subtitle: 'Blooming with love 🌸',
      date: 'Nov 4, 2026',
      image: '/assets/garden/recent_roses.jpg',
    },
    {
      id: 'coffee',
      title: 'Coffee time',
      subtitle: 'Better together 💕',
      date: 'Nov 2, 2026',
      image: '/assets/garden/recent_coffee.jpg',
    },
    {
      id: 'garden_vibes',
      title: 'Garden vibes',
      subtitle: 'Our little paradise 💜',
      date: 'Nov 1, 2026',
      image: '/assets/garden/recent_garden.jpg',
    },
  ];

  // Additional sanctuary treasures
  const secondaryKeepsakes = [
    {
      id: 'time',
      title: 'Our Time',
      subtitle: 'Adventures & countdowns',
      icon: CalendarDays,
      badge: '📅 Dates',
      color: 'text-teal-300',
    },
    {
      id: 'letters',
      title: 'Letters in Garden',
      subtitle: 'Quiet ink from the heart',
      icon: PenLine,
      badge: '💌 Letters',
      color: 'text-rose-300',
    },
    {
      id: 'questions',
      title: 'Little Questions',
      subtitle: 'Closeness & deep talks',
      icon: HelpCircle,
      badge: '💡 Prompts',
      color: 'text-sky-300',
    },
    {
      id: 'capsule',
      title: 'Time Capsule',
      subtitle: 'Sealed for our future',
      icon: Hourglass,
      badge: '🔒 Sealed',
      color: 'text-amber-300',
    },
    {
      id: 'world',
      title: 'The World Around Us',
      subtitle: 'Causes that matter to us',
      icon: Globe,
      badge: '🌍 Causes',
      color: 'text-blue-300',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 w-full max-w-7xl mx-auto font-sans select-none">
      {/* Top Bar: User Switcher */}
      <div className="flex justify-end items-center">
        <UserSwitcher currentUser={currentUser} />
      </div>

      {/* ============================================================== */}
      {/* 1. HERO GARDEN SHOWCASE: Lantern on Mossy Stone with Script    */}
      {/* ============================================================== */}
      <div
        className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-400/30 shadow-2xl p-6 sm:p-10 md:p-14 text-white min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center text-center select-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(16, 7, 34, 0.45) 0%, rgba(16, 7, 34, 0.25) 50%, rgba(16, 7, 34, 0.55) 100%), url(/assets/garden/garden_lantern_hero_bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="relative z-10 space-y-2 max-w-3xl mx-auto">
          {/* Main Title in Script Calligraphy matching Mockup */}
          <h1 className="font-script text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-normal tracking-wide drop-shadow-[0_3px_14px_rgba(0,0,0,0.9)] flex items-center justify-center gap-3">
            <span>Our Garden</span>
            <span className="text-pink-300 text-3xl sm:text-5xl md:text-6xl drop-shadow-[0_0_15px_rgba(244,114,182,0.9)]">
              🌸
            </span>
          </h1>

          {/* Subtitle in Italic Serif */}
          <p className="font-serif italic text-sm sm:text-xl md:text-2xl text-pink-100 font-light tracking-wide leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            A special place for our thoughts, memories and dreams... ♡
          </p>

          {/* Heart Swirl Flourish Underline matching Mockup */}
          <div className="pt-1 flex justify-center">
            <img
              src="/assets/garden/moods/heart_flourish_transparent.png"
              alt="Heart Flourish"
              className="w-32 sm:w-44 h-auto opacity-95 filter drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SIX KEEPSAKE FEATURE CARDS (3x2 Grid matching Photo 3)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {keepsakeCards.map((card) => (
          <div
            key={card.id}
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab(card.targetTab);
            }}
            className="group relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-[#291045]/90 via-[#210d3a]/90 to-[#18092d]/90 hover:from-[#351559]/95 hover:to-[#220c3d]/95 border border-purple-400/25 hover:border-pink-400/50 shadow-xl hover:shadow-2xl hover:shadow-pink-500/15 backdrop-blur-xl transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] overflow-hidden"
          >
            {/* Left: Artwork Thumbnail */}
            <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-purple-300/30 shadow-md bg-purple-950/60">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Center: Title & Subtitle */}
            <div className="flex-1 min-w-0 pr-1">
              <h3 className="font-serif font-bold text-white text-base sm:text-lg leading-tight group-hover:text-pink-200 transition-colors truncate">
                {card.title}
              </h3>
              <p className="font-serif italic text-purple-200/80 text-xs sm:text-sm leading-tight mt-1 line-clamp-2">
                {card.subtitle}
              </p>
            </div>

            {/* Right: Circular Purple Arrow Button (→) */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-900/80 border border-purple-400/40 flex items-center justify-center text-white shrink-0 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-600 group-hover:border-pink-300 transition-all shadow-md group-hover:scale-105">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM ROW: Recent Additions (8 cols) + Quote Box (4 cols)  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left: Recent Additions Polaroid Row (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl sm:rounded-[2rem] border border-purple-400/25 bg-gradient-to-b from-[#200c38]/90 via-[#18082c]/92 to-[#110521]/96 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base sm:text-lg">⭐</span>
              <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-white">
                Recent Additions
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                onSelectTab('archive');
              }}
              className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/35 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer hover:border-pink-300/50"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3 text-pink-300" />
            </button>
          </div>

          {/* 4 Polaroid Memory Cards in a Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            {recentAdditions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  soundEngine.playSparkle();
                  onSelectTab('archive');
                }}
                className="group rounded-2xl bg-[#f4eaf7] hover:bg-[#faeffb] p-2 sm:p-2.5 text-slate-800 shadow-md hover:shadow-xl hover:shadow-pink-500/20 border border-purple-200/60 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-purple-950/40 mb-2 border border-purple-200/40">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-[9px] text-white">
                    📷
                  </div>
                </div>

                {/* Polaroid Text Area */}
                <div className="px-0.5 space-y-0.5">
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-purple-900">
                    {item.title}
                  </h4>
                  <p className="font-sans text-[11px] sm:text-xs text-slate-700 truncate leading-tight">
                    {item.subtitle}
                  </p>
                  <span className="font-mono text-[10px] text-slate-500 block leading-tight pt-0.5">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Keepsake Quote Box (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl sm:rounded-[2rem] border border-purple-400/25 bg-gradient-to-b from-[#220d3d]/90 via-[#18082c]/95 to-[#10051e]/98 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-radial from-pink-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Quote Text */}
          <div className="relative z-10 space-y-3">
            <p className="font-serif italic text-white text-lg sm:text-xl md:text-2xl leading-relaxed drop-shadow-sm">
              “Together, every moment is perfect.”
            </p>

            {/* Glowing Script Heart Flourish */}
            <div className="pt-1 flex justify-center">
              <span className="text-pink-300 font-script text-3xl sm:text-4xl filter drop-shadow-[0_0_10px_rgba(244,114,182,0.9)]">
                ♡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SECONDARY SANCTUARY EXPLORER & QUICK CREATION STRIP         */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-purple-400/20 bg-gradient-to-r from-[#1c0b33]/80 via-[#160829]/80 to-[#120520]/80 backdrop-blur-xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span className="font-serif text-sm sm:text-base font-bold text-white">
              More to Cherish in Our Garden
            </span>
          </div>

          {/* Quick Add Pills */}
          {onOpenAddStudio && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenAddStudio('photo')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-pink-300" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddStudio('date')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-teal-300" />
                <span>Date</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddStudio('song')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-purple-300" />
                <span>Music</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddStudio('letter')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-medium transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-rose-300" />
                <span>Letter</span>
              </button>
            </div>
          )}
        </div>

        {/* Secondary Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {secondaryKeepsakes.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  onSelectTab(sec.id);
                }}
                className="p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-purple-400/15 hover:border-pink-300/40 text-left transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${sec.color} shrink-0`} />
                    <span className="font-serif font-bold text-xs text-white truncate group-hover:text-pink-200">
                      {sec.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-200/70 font-sans block truncate mt-0.5">
                    {sec.subtitle}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-pink-300 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Keepsake Footer Whisper */}
      <div className="pt-2 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-pink-400/40" />
          <p className="font-serif italic text-xs sm:text-sm text-pink-200/90 tracking-wide flex items-center gap-1.5">
            <span>Words written from the heart never fade</span>
            <span className="font-sans text-pink-300">♡</span>
            <span>🌸</span>
          </p>
          <span className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-pink-400/40" />
        </div>
      </div>
    </div>
  );
};
