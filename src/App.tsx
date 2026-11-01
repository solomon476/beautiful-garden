import React, { useState, useEffect } from 'react';
import { ParticleBackdrop } from './components/ParticleBackdrop';
import { GardenHeader } from './components/GardenHeader';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TimingSection } from './components/TimingSection';
import { ScrapbookSection } from './components/ScrapbookSection';
import { FlowerNotesSection } from './components/FlowerNotesSection';
import { HiddenSurpriseSection } from './components/HiddenSurpriseSection';
import { FinalLetterSection } from './components/FinalLetterSection';
import { giftContent } from './data/giftContent';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('welcome');

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
    </div>
  );
};

export default App;
