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
  Plus,
  ChevronRight,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { moodGardenService } from '../../services/gardenService';
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
  const [selectedMoodMessage, setSelectedMoodMessage] = useState<string | null>(null);

  const handleQuickMood = async (moodKey: string, emoji: string, label: string) => {
    soundEngine.playChime(659.25, 1.0, 0.09);
    await moodGardenService.setMood(moodKey, `Feeling ${label.toLowerCase()} right now ✨`, true);
    setSelectedMoodMessage(`Mood set to ${emoji} ${label} in Our Shared Garden!`);
    setTimeout(() => setSelectedMoodMessage(null), 3500);
  };

  const featureCards = [
    {
      id: 'archive',
      badge: '📷 Upload • Photos • Voice',
      title: 'Our Little Archive',
      description: 'Upload moments from your phone to keep forever in this sanctuary.',
      buttonText: 'View Memories',
      addType: 'photo' as QuickAddType,
      addLabel: '+ Photo',
      icon: Camera,
      image: '/assets/garden/card_archive.jpg',
      badgeColor: 'border-rose-400/40 text-rose-200 bg-rose-500/20',
      gradient: 'from-rose-500 to-purple-600',
    },
    {
      id: 'time',
      badge: '📅 Dates • Reminders • Trips',
      title: 'Our Time',
      description: 'Plan our next adventure together with reminders and countdowns.',
      buttonText: 'View Hangouts',
      addType: 'date' as QuickAddType,
      addLabel: '+ Date',
      icon: CalendarDays,
      image: '/assets/garden/card_time.jpg',
      badgeColor: 'border-teal-400/40 text-teal-200 bg-teal-500/20',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      id: 'sound',
      badge: '🎙️ Listen • Upload • Voice',
      title: 'Sound Garden',
      description: 'Songs and personal voice notes for each other (links optional).',
      buttonText: 'Explore Music',
      addType: 'song' as QuickAddType,
      addLabel: '+ Music',
      icon: Music2,
      image: '/assets/garden/card_sound.jpg',
      badgeColor: 'border-purple-400/40 text-purple-200 bg-purple-500/20',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'shelf',
      badge: '📚 Reads • PDF Books • Cafes',
      title: 'The Exchange Shelf',
      description: 'Upload book PDFs directly, films, and favorite places to discover.',
      buttonText: 'Explore Shelf',
      addType: 'book' as QuickAddType,
      addLabel: '+ Book / PDF',
      icon: Layers,
      image: '/assets/garden/card_shelf.jpg',
      badgeColor: 'border-amber-400/40 text-amber-200 bg-amber-500/20',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      id: 'letters',
      badge: '✉ Write • Share • Connect',
      title: 'Letters in the Garden',
      description: "Say what's in your heart, anytime, in quiet shared or private ink.",
      buttonText: 'View Letters',
      addType: 'letter' as QuickAddType,
      addLabel: '+ Letter',
      icon: PenLine,
      image: '/assets/garden/card_letters.jpg',
      badgeColor: 'border-pink-400/40 text-pink-200 bg-pink-500/20',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      id: 'petals',
      badge: '🌸 Share • Appreciate',
      title: 'Petal Notes',
      description: 'Small notes, big meanings. Quick whispers of appreciation.',
      buttonText: 'View Notes',
      icon: Sparkles,
      image: '/assets/garden/card_petals.jpg',
      badgeColor: 'border-pink-400/40 text-pink-200 bg-pink-500/20',
      gradient: 'from-pink-500 to-rose-400',
    },
    {
      id: 'questions',
      badge: '💡 Explore • Learn',
      title: 'Little Questions',
      description: 'Thoughtful prompts for deeper conversations and closeness.',
      buttonText: 'See Questions',
      icon: HelpCircle,
      image: '/assets/garden/card_questions.jpg',
      badgeColor: 'border-sky-400/40 text-sky-200 bg-sky-500/20',
      gradient: 'from-sky-500 to-indigo-600',
    },
    {
      id: 'capsule',
      badge: '🔒 Save • Reveal',
      title: 'Time Capsule',
      description: 'A message for our future selves, sealed until the time comes.',
      buttonText: 'Create Capsule',
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
    { key: 'music', emoji: '🎧', label: 'Listening' },
  ];

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in pb-12 w-full max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* MOBILE EXPERIENCE (Faithfully Designed from Reference Guide)   */}
      {/* ============================================================== */}
      <div className="block sm:hidden space-y-4 font-sans select-none pb-6">
        {/* 1. Mobile Hero Rose Card (Faithful to Smartphone Reference) */}
        <div className="mobile-hero-rose" />

        {/* 2. Mobile Section Heading */}
        <div className="space-y-0.5 pt-1 px-1">
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-1.5 drop-shadow-sm">
            <span>🌸</span>
            <span>Our Garden</span>
          </h2>
          <p className="font-serif italic text-xs text-purple-200/90 leading-snug">
            Explore, share and cherish our special place together.
          </p>
        </div>

        {/* 3. Responsive Two-Column Feature Card Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Petal Notes */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('petals');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">🌸</span>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Petal Notes
                </span>
                <span className="mobile-garden-card-desc block">
                  Our thoughts & dreams
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 2: Letters in the Garden */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('letters');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 text-purple-700">
                <PenLine className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Letters in Garden
                </span>
                <span className="mobile-garden-card-desc block">
                  Messages from the heart
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 3: Mood Garden */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('moods');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">😊</span>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Mood Garden
                </span>
                <span className="mobile-garden-card-desc block">
                  Our moods, our moments
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 4: Our Little Archive */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('archive');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 text-purple-700">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Our Archive
                </span>
                <span className="mobile-garden-card-desc block">
                  Our favourite photographs
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 5: Sound Garden */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('sound');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Sound Garden
                </span>
                <span className="mobile-garden-card-desc block">
                  Our music together
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 6: Little Questions */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('questions');
            }}
            className="mobile-garden-card group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-fuchsia-100 flex items-center justify-center shrink-0 text-fuchsia-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="mobile-garden-card-title block truncate">
                  Little Questions
                </span>
                <span className="mobile-garden-card-desc block">
                  Fun thoughts to share
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4. Single-Column Full-Width Card: Our Time */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            onSelectTab('time');
          }}
          className="mobile-garden-card group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-10 rounded-xl overflow-hidden shrink-0 border border-purple-200/80 shadow-sm bg-purple-950">
              <img
                src="/assets/garden/card_time.jpg"
                alt="Our Time"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-xs">⭐</span>
                <span className="mobile-garden-card-title text-sm block leading-tight truncate">
                  Our Time
                </span>
              </div>
              <span className="mobile-garden-card-desc text-xs block leading-tight mt-0.5 truncate">
                Special moments and memories
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* 5. Additional Keepsake Cards: Shelf, Capsule, World */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('shelf');
            }}
            className="p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-center flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xl">📚</span>
            <span className="font-serif font-bold text-[11px] leading-tight block">Shelf</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('capsule');
            }}
            className="p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-center flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xl">🔒</span>
            <span className="font-serif font-bold text-[11px] leading-tight block">Capsule</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              onSelectTab('world');
            }}
            className="p-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-center flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xl">🌍</span>
            <span className="font-serif font-bold text-[11px] leading-tight block">World</span>
          </button>
        </div>

        {/* 6. Mobile Quick Add Studio Shortcut Pills */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              type="button"
              onClick={() => onOpenAddStudio && onOpenAddStudio('photo')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-[11px] font-semibold shrink-0"
            >
              <Camera className="w-3 h-3 text-pink-300" />
              <span>+ Photo</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddStudio && onOpenAddStudio('date')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-[11px] font-semibold shrink-0"
            >
              <CalendarDays className="w-3 h-3 text-teal-300" />
              <span>+ Date</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddStudio && onOpenAddStudio('song')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[11px] font-semibold shrink-0"
            >
              <Music2 className="w-3 h-3 text-purple-300" />
              <span>+ Music</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddStudio && onOpenAddStudio('letter')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-semibold shrink-0"
            >
              <PenLine className="w-3 h-3 text-rose-300" />
              <span>+ Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP / TABLET EXPERIENCE (Balanced Grid & Hero Bench)       */}
      {/* ============================================================== */}
      <div className="hidden sm:block space-y-6 sm:space-y-8">
        {/* Dual User Switcher: Active Partner Picture */}
        <div className="flex justify-end">
          <UserSwitcher currentUser={currentUser} />
        </div>

        {/* ============================================================== */}
        {/* 1. HERO GARDEN SHOWCASE                                        */}
        {/* ============================================================== */}
        <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-400/25 shadow-2xl bg-[#0e0720]">
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
          <div className="relative z-10 px-5 sm:px-10 lg:px-12 py-8 sm:py-12 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-mono tracking-wider uppercase backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-pink-300 fill-pink-300" />
                <span>A Private Garden for Us ♡</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                Our Garden <span className="font-sans text-pink-300 font-light">♡</span>
              </h1>

              <p className="font-handwriting text-lg sm:text-2xl md:text-3xl text-pink-200/90 leading-relaxed drop-shadow">
                A little corner for our thoughts, dreams and everything that matters... 💜
              </p>
            </div>

            {/* Keepsake Quote Box */}
            <div className="relative md:max-w-xs shrink-0 self-start md:self-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-pink-300/40 backdrop-blur-xl shadow-2xl transition-all group">
              <span className="text-2xl sm:text-3xl text-pink-300 font-serif leading-none block select-none">“</span>
              <p className="font-serif italic text-xs sm:text-base text-slate-100 leading-relaxed">
                Some things are better shared... especially the beautiful ones.
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-white/10 text-right">
                <span className="text-[11px] font-mono text-pink-300 font-medium">
                  — Perfect Time ♡
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* ============================================================== */}
      {/* 2. SANCTUARY QUICK CREATION HUB                                */}
      {/* ============================================================== */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#1c0d38]/90 via-[#140a2a]/90 to-[#0e0720]/90 border border-pink-400/30 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
                <span>Sanctuary Creation Studio</span>
                <span className="text-pink-300 font-sans text-sm">♡</span>
              </h3>
              <p className="text-xs text-pink-200/80 font-light">
                Add moments, suggest dates, record voice notes, or share book PDFs
              </p>
            </div>
          </div>

          {/* 5 Quick Creation Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                if (onOpenAddStudio) onOpenAddStudio('photo');
                else onSelectTab('archive');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 hover:border-pink-400/60 text-pink-200 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-pink-300" />
              <span>+ Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                if (onOpenAddStudio) onOpenAddStudio('date');
                else onSelectTab('time');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 hover:border-teal-400/60 text-teal-200 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5 text-teal-300" />
              <span>+ Date</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                if (onOpenAddStudio) onOpenAddStudio('song');
                else onSelectTab('sound');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 hover:border-purple-400/60 text-purple-200 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Music2 className="w-3.5 h-3.5 text-purple-300" />
              <span>+ Music</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                if (onOpenAddStudio) onOpenAddStudio('book');
                else onSelectTab('shelf');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 hover:border-amber-400/60 text-amber-200 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Book / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                if (onOpenAddStudio) onOpenAddStudio('letter');
                else onSelectTab('letters');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 hover:border-rose-400/60 text-rose-200 text-xs font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <PenLine className="w-3.5 h-3.5 text-rose-300" />
              <span>+ Letter</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. EIGHT MAIN KEEPSAKE FEATURE CARDS (4x2 Balanced Grid)       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {featureCards.map((card) => {
          return (
            <div
              key={card.id}
              onClick={() => {
                soundEngine.playSparkle();
                onSelectTab(card.id);
              }}
              className="group relative p-4 sm:p-5 rounded-3xl sm:rounded-[2rem] bg-[#140b2b]/85 hover:bg-[#1a0f38]/95 border border-purple-400/20 hover:border-pink-400/50 shadow-xl hover:shadow-2xl hover:shadow-pink-500/15 backdrop-blur-xl cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all pointer-events-none" />

              <div className="space-y-3 sm:space-y-4">
                {/* Category Pill */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono px-3 py-1 rounded-full border tracking-wide whitespace-nowrap backdrop-blur-sm ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Card Artwork Thumbnail */}
                <div className="relative w-full aspect-16/10 sm:aspect-square rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/25 shadow-md">
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
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-300/85 font-light mt-1 sm:mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Direct Add + View */}
              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10 flex items-center gap-2">
                {card.addType && onOpenAddStudio ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playSparkle();
                        onOpenAddStudio(card.addType as QuickAddType);
                      }}
                      className="flex-1 py-2 px-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-semibold tracking-wide shadow-md shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-1 border border-white/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="truncate">{card.addLabel}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playSparkle();
                        onSelectTab(card.id);
                      }}
                      className="py-2 px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-medium active:scale-95 transition-all flex items-center justify-center gap-1 border border-white/10 shrink-0"
                      title="View Section"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSparkle();
                      onSelectTab(card.id);
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white text-xs font-semibold tracking-wide shadow-md shadow-pink-500/25 group-hover:shadow-pink-500/40 group-hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/20"
                  >
                    <span>{card.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM ROW: The World Around Us + Our Mood Garden           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: The World Around Us Banner (8 cols) */}
        <div
          onClick={() => {
            soundEngine.playSparkle();
            onSelectTab('world');
          }}
          className="lg:col-span-8 group relative p-5 sm:p-7 rounded-3xl sm:rounded-[2rem] bg-[#140b2b]/90 hover:bg-[#1a0f38]/95 border border-blue-400/25 hover:border-blue-400/50 shadow-xl backdrop-blur-xl cursor-pointer transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 overflow-hidden"
        >
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-blue-400/30 shadow-lg group-hover:scale-105 transition-transform">
            <img
              src="/assets/garden/card_world.jpg"
              alt="The World Around Us"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 space-y-2.5 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-[10px] font-mono uppercase tracking-widest">
                <Globe className="w-3 h-3 text-blue-300" />
                <span>A World Worth Caring About</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors mt-1">
                The World Around Us 🌍
              </h3>
              <p className="text-xs sm:text-sm text-slate-300/85 font-light leading-relaxed">
                Thoughts, causes and conversations that matter to our shared future.
              </p>
            </div>

            {/* Clickable Cause Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {worldPills.map((pill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-blue-500/20 border border-white/10 hover:border-blue-400/40 text-slate-300 hover:text-blue-200 text-[10px] sm:text-[11px] font-medium transition-all"
                >
                  {pill.label}
                </span>
              ))}
            </div>

            <div className="pt-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform border border-white/20"
              >
                <span>Explore Topics</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Our Mood Garden Banner (4 cols) */}
        <div className="lg:col-span-4 p-5 sm:p-7 rounded-3xl sm:rounded-[2rem] bg-[#140b2b]/90 border border-purple-400/25 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Our Mood Garden</span>
                <span className="text-purple-300 text-base sm:text-lg">🌙</span>
              </h3>
              <button
                onClick={() => onSelectTab('moods')}
                className="text-[11px] font-mono text-purple-300 hover:text-pink-200 underline underline-offset-4"
              >
                History →
              </button>
            </div>
            <p className="text-xs text-slate-300/85 font-light mt-1">
              How are you feeling right now, {currentUser.displayName}?
            </p>
          </div>

          {/* Emoji Mood Pill Row */}
          <div className="flex items-center justify-between gap-1 bg-white/[0.03] p-2 rounded-2xl border border-white/10">
            {moodsList.map((m) => (
              <button
                key={m.key}
                onClick={() => handleQuickMood(m.key, m.emoji, m.label)}
                className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all text-center flex-1"
                title={`I'm feeling ${m.label}`}
              >
                <span className="text-xl sm:text-2xl transition-transform hover:scale-125">{m.emoji}</span>
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-300 truncate max-w-[45px]">
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

      {/* ============================================================== */}
      {/* 5. BOTTOM KEEPSAKE QUOTE                                       */}
      {/* ============================================================== */}
      <div className="pt-6 pb-2 text-center">
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
