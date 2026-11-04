import React, { useState, useEffect } from 'react';
import { ParticleBackdrop } from './components/ParticleBackdrop';
import { GardenHeader } from './components/GardenHeader';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TimingSection } from './components/TimingSection';
import { ScrapbookSection } from './components/ScrapbookSection';
import { FlowerNotesSection } from './components/FlowerNotesSection';
import { HiddenSurpriseSection } from './components/HiddenSurpriseSection';
import { FinalLetterSection } from './components/FinalLetterSection';
import { OurGardenModal } from './components/garden/OurGardenModal';
import { QuickAddStudioModal, type QuickAddType } from './components/garden/QuickAddStudioModal';
import { giftContent } from './data/giftContent';
import { Sparkles, Plus } from 'lucide-react';
import { soundEngine } from './utils/audio';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('welcome');
  const [isOurGardenOpen, setIsOurGardenOpen] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('photo');

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 84;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['welcome', 'timing', 'memories', 'notes', 'surprise', 'letter'];
      const scrollPos = window.scrollY + 200;

      for (const s of sections) {
        const el = document.getElementById(s);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(s);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-pink-500/30 selection:text-pink-100">
      {/* Visual Ambiance: Background + Particles */}
      <ParticleBackdrop />

      {/* Floating Header */}
      <GardenHeader
        onScrollTo={scrollToSection}
        activeSection={activeSection}
        onOpenOurGarden={() => setIsOurGardenOpen(true)}
      />

      {/* Our Garden Collaborative Suite Modal */}
      <OurGardenModal
        isOpen={isOurGardenOpen}
        onClose={() => setIsOurGardenOpen(false)}
      />

      {/* Main Experience Stream */}
      <main className="relative z-10 flex-grow pb-16">
        {/* Step 1: The Welcome Portal */}
        <WelcomeScreen onEnter={() => scrollToSection('timing')} />

        {/* Step 2: Timing Section — Journal Message */}
        <TimingSection />

        {/* Step 3: The Memories Scrapbook */}
        <ScrapbookSection />

        {/* Step 4: Interactive Flower Notes */}
        <FlowerNotesSection />

        {/* Step 5: Playful VIP Perk Card */}
        <HiddenSurpriseSection />

        {/* Step 6: The Final Letter */}
        <FinalLetterSection onScrollToTop={() => scrollToSection('welcome')} />
      </main>

      {/* Garden Footer */}
      <footer className="relative z-10 py-8 px-4 text-center border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-light">
          <span>Crafted for</span>
          <span className="text-pink-300 font-medium">{giftContent.recipientName}</span>
          <span>•</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{giftContent.senderName}</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">
          Perfect Time ✨ • A Private Corner
        </p>
      </footer>

      {/* Floating Action Button: Add to Our Garden (Accessible Anywhere) */}
      {!isOurGardenOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-2 pointer-events-auto animate-fade-in">
          <button
            onClick={() => {
              soundEngine.playSparkle();
              setQuickAddType('photo');
              setIsQuickAddOpen(true);
            }}
            className="group flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all border border-white/30 backdrop-blur-md"
            aria-label="Add to Our Garden"
            title="Upload photo, suggest a date, add music or book"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="tracking-wide">Add to Garden 🌸</span>
          </button>
        </div>
      )}

      {/* Floating Quick Add Studio Modal */}
      <QuickAddStudioModal
        isOpen={isQuickAddOpen}
        initialType={quickAddType}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          setIsOurGardenOpen(true);
        }}
      />
    </div>
  );
};

export default App;
