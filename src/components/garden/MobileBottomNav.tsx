import React, { useState } from 'react';
import { Home, Sparkles, Music2, BookOpen, Heart, PenLine, Smile, HelpCircle, Hourglass, Globe, X } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface MobileBottomNavProps {
  currentView: 'home' | 'garden' | 'music' | 'archive' | 'more' | string;
  onNavigate: (target: 'home' | 'garden' | 'music' | 'archive' | 'more' | string) => void;
  isGardenOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  isGardenOpen,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleNavClick = (target: 'home' | 'garden' | 'music' | 'archive' | 'more') => {
    soundEngine.playSparkle();
    if (target === 'more') {
      setIsMoreMenuOpen(!isMoreMenuOpen);
    } else {
      setIsMoreMenuOpen(false);
      onNavigate(target);
    }
  };

  const handleSelectMoreOption = (subTab: string) => {
    soundEngine.playSparkle();
    setIsMoreMenuOpen(false);
    onNavigate(subTab);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: !isGardenOpen || currentView === 'home',
    },
    {
      id: 'garden',
      label: 'Our Garden',
      icon: Sparkles,
      isActive: isGardenOpen && (currentView === 'garden' || currentView === 'overview'),
    },
    {
      id: 'music',
      label: 'Music',
      icon: Music2,
      isActive: isGardenOpen && currentView === 'sound',
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: BookOpen,
      isActive: isGardenOpen && currentView === 'archive',
    },
    {
      id: 'more',
      label: 'More',
      icon: Heart,
      isActive: isMoreMenuOpen || ['letters', 'petals', 'moods', 'questions', 'shelf', 'capsule', 'world'].includes(currentView),
    },
  ];

  const moreFeatures = [
    { id: 'petals', label: 'Petal Notes', icon: Sparkles, desc: 'Whispers of love' },
    { id: 'letters', label: 'Letters in Garden', icon: PenLine, desc: 'Quiet shared letters' },
    { id: 'moods', label: 'Mood Garden', icon: Smile, desc: 'Check in with feelings' },
    { id: 'questions', label: 'Little Questions', icon: HelpCircle, desc: 'Thoughtful prompts' },
    { id: 'capsule', label: 'Time Capsule', icon: Hourglass, desc: 'Future sealed messages' },
    { id: 'world', label: 'The World Around Us', icon: Globe, desc: 'Causes that matter' },
  ];

  return (
    <>
      {/* More Options Floating Bottom Sheet (when More is tapped) */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm sm:hidden flex flex-col justify-end animate-fade-in"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="w-full bg-[#180a2f] border-t border-purple-400/40 rounded-t-3xl p-5 shadow-2xl text-white space-y-4 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="font-serif text-base font-bold text-white">More Garden Spaces</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full bg-white/10 text-purple-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreFeatures.map((feat) => {
                const Icon = feat.icon;
                const isSelected = currentView === feat.id;
                return (
                  <button
                    key={feat.id}
                    onClick={() => handleSelectMoreOption(feat.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-800/80 border-pink-400 shadow-md scale-[1.02]'
                        : 'bg-white/[0.06] border-white/10 hover:border-purple-300/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 text-pink-300" />
                      <span className="text-[10px] text-purple-300">→</span>
                    </div>
                    <div>
                      <span className="font-serif font-bold text-xs text-white block leading-tight">
                        {feat.label}
                      </span>
                      <span className="text-[10px] text-purple-200/70 font-sans block leading-tight mt-0.5 truncate">
                        {feat.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar — Mobile Only */}
      <nav
        className="mobile-bottom-nav sm:hidden"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id as any)}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-[#8b25a8]' : 'text-[#65487d]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8b25a8]" />
                )}
              </div>
              <span className={`text-[10px] font-sans ${isActive ? 'font-bold text-[#8b25a8]' : 'text-[#65487d]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
