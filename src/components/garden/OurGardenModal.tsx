import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  PenLine,
  Headphones,
  Layers,
  Camera,
  CalendarDays,
  HelpCircle,
  Hourglass,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  Flower2,
  ArrowLeft,
} from 'lucide-react';
import { GardenDashboardOverview } from './GardenDashboardOverview';
import { LettersSection } from './LettersSection';
import { SoundGardenSection } from './SoundGardenSection';
import { ExchangeShelfSection } from './ExchangeShelfSection';
import { LittleArchiveSection } from './LittleArchiveSection';
import { PetalNotesSpace } from './PetalNotesSpace';
import { OurTimeSection } from './OurTimeSection';
import { LittleQuestionsSection } from './LittleQuestionsSection';
import { TimeCapsuleSection } from './TimeCapsuleSection';
import { MoodGardenSection } from './MoodGardenSection';
import { WorldAroundUsSection } from './WorldAroundUsSection';
import { MoreGardenSection } from './MoreGardenSection';
import { authService } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';
import { runPrivacyAndSecurityAudit, type PrivacyTestResult } from '../../utils/privacyTests';
import { soundEngine } from '../../utils/audio';
import { UserSwitcher } from './UserSwitcher';
import { GardenNotificationBell } from './GardenNotificationBell';
import { QuickAddStudioModal, type QuickAddType } from './QuickAddStudioModal';
import { MobileBottomNav } from './MobileBottomNav';

interface OurGardenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabKey;
}

type TabKey =
  | 'garden'
  | 'letters'
  | 'sound'
  | 'shelf'
  | 'archive'
  | 'petals'
  | 'time'
  | 'questions'
  | 'capsule'
  | 'moods'
  | 'world'
  | 'security'
  | 'more';

const TABS: { id: TabKey; label: string; icon: any; color: string }[] = [
  { id: 'garden', label: 'Our Garden', icon: Flower2, color: 'from-pink-500 to-rose-400' },
  { id: 'letters', label: 'Letters', icon: PenLine, color: 'from-pink-500 to-rose-400' },
  { id: 'sound', label: 'Sound Garden', icon: Headphones, color: 'from-purple-500 to-indigo-400' },
  { id: 'shelf', label: 'Exchange Shelf', icon: Layers, color: 'from-amber-400 to-orange-400' },
  { id: 'archive', label: 'Our Archive', icon: Camera, color: 'from-pink-400 to-purple-400' },
  { id: 'petals', label: 'Petal Notes', icon: Sparkles, color: 'from-rose-400 to-pink-500' },
  { id: 'time', label: 'Our Time', icon: CalendarDays, color: 'from-teal-400 to-emerald-400' },
  { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'from-sky-400 to-indigo-400' },
  { id: 'capsule', label: 'Time Capsule', icon: Hourglass, color: 'from-amber-300 to-yellow-500' },
  { id: 'moods', label: 'Mood Garden', icon: Heart, color: 'from-fuchsia-400 to-pink-400' },
  { id: 'world', label: 'The World Around Us', icon: Globe, color: 'from-blue-400 to-teal-400' },
  { id: 'more', label: 'More Spaces', icon: Sparkles, color: 'from-pink-500 to-purple-500' },
  { id: 'security', label: 'Privacy Test', icon: ShieldCheck, color: 'from-emerald-400 to-teal-400' },
];

export const OurGardenModal: React.FC<OurGardenModalProps> = ({ isOpen, onClose, initialTab = 'garden' }) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [auditResults, setAuditResults] = useState<PrivacyTestResult[] | null>(null);
  const [testingAudit, setTestingAudit] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('photo');
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialTab && isOpen) {
      let normalized = initialTab as string;
      if (normalized === 'mood') normalized = 'moods';
      if (normalized === 'question') normalized = 'questions';
      if (normalized === 'capsules' || normalized === 'timecapsule') normalized = 'capsule';
      if (normalized === 'theworld' || normalized === 'worldaroundus') normalized = 'world';
      setActiveTab(normalized as TabKey);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const handleOpenQuickAdd = (type: QuickAddType = 'photo') => {
    soundEngine.playSparkle();
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };

  useEffect(() => {
    const unsub = authService.subscribeUser((u) => setCurrentUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (activeTab !== 'garden') {
          setActiveTab('garden');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, onClose]);

  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Phone Back Button & Browser History Handling
  useEffect(() => {
    if (!isOpen) return;

    // Push initial garden state
    window.history.pushState({ gardenModal: true, tab: activeTab }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (!e.state || !e.state.gardenModal) {
        // Phone back button pressed from root of modal -> close modal back to main page
        onCloseRef.current();
      } else if (e.state.tab) {
        setActiveTab(e.state.tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTab = (tab: TabKey) => {
    soundEngine.playSparkle();
    setActiveTab(tab);
    window.history.pushState({ gardenModal: true, tab }, '');
  };

  const handleGoBackToSanctuary = () => {
    soundEngine.playSparkle();
    setActiveTab('garden');
    window.history.pushState({ gardenModal: true, tab: 'garden' }, '');
  };

  const handleGoHome = () => {
    soundEngine.playSparkle();
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', window.location.pathname);
      } catch (e) {
        console.warn('History pushState error', e);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onClose();
  };

  const handleRunSecurityAudit = async () => {
    setTestingAudit(true);
    soundEngine.playChime(587.33, 1.2, 0.08);
    try {
      const results = await runPrivacyAndSecurityAudit();
      setAuditResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingAudit(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-modal flex flex-col bg-garden-canvas animate-fade-in overflow-hidden font-body"
      style={{ zIndex: 1000, backgroundColor: '#070311' }}
    >
      <div
        className="relative w-full h-full flex flex-col min-h-0 overflow-hidden bg-garden-canvas"
        style={{
          minHeight: 0,
          backgroundColor: '#0c031a',
          background:
            'radial-gradient(circle at 50% 10%, rgba(217, 70, 239, 0.22) 0%, transparent 50%), radial-gradient(circle at 12% 85%, rgba(168, 85, 247, 0.18) 0%, transparent 50%), radial-gradient(circle at 88% 85%, rgba(244, 114, 182, 0.16) 0%, transparent 45%), linear-gradient(180deg, #18082e 0%, #0c031a 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Ambient Background Orbs */}
        <div className="garden-glow-orb-top" />
        <div className="garden-glow-orb-bottom" />

        {/* Top Header — Uncramped, Mobile-Optimized with Photos of Both & Notifications */}
        <header
          className="relative z-40 px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-purple-400/15 flex items-center justify-between gap-2 sm:gap-4 bg-garden-header backdrop-blur-xl shrink-0"
          style={{ backgroundColor: 'rgba(13, 8, 30, 0.98)' }}
        >
          {/* Logo & Brand Title — Calligraphy Script Matching Sanctuary Mockup (Click to return Home) */}
          <button
            type="button"
            onClick={handleGoHome}
            className="flex items-center gap-2 sm:gap-3 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer group transition-transform active:scale-95"
            title="Return to Home page"
          >
            <div className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 items-center justify-center text-white shadow-md shadow-pink-500/25 shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
              <Flower2 className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl text-white font-script tracking-wide flex items-center gap-1.5 truncate drop-shadow-[0_2px_10px_rgba(236,72,153,0.5)] group-hover:text-pink-100 transition-colors">
                <span>Perfect Time</span>
                <span className="text-pink-300 font-sans text-sm sm:text-base font-light">♡</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-pink-200/90 font-serif italic tracking-wide leading-none pt-0.5">
                Together... always
              </p>
            </div>
          </button>

          {/* Right Header Area: Balanced Notification Bell & Partner Avatar */}
          <div
            className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 pr-1"
            style={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}
          >
            {/* Quick Add Studio Launcher Button (Shown on Sanctuary Dashboard) */}
            {activeTab === 'garden' && (
              <button
                onClick={() => handleOpenQuickAdd('photo')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20 shrink-0"
                aria-label="Add to Our Garden"
                title="Add photos, suggest a date, upload audio/book, write letter"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                <span>Add to Garden</span>
              </button>
            )}

            {/* Notification Bell Dropdown */}
            <GardenNotificationBell
              currentUser={currentUser}
              onSelectTab={(tab) => handleSelectTab(tab)}
            />

            {/* Partner Avatar (Displays her photo for Solomon, his photo for Noella) */}
            <UserSwitcher currentUser={currentUser} compact={true} />
          </div>
        </header>

        {/* Feature Tab Navigation Bar — Desktop / Tablet Bar */}
        <nav
          className="relative z-10 px-3 sm:px-8 py-2 sm:py-2.5 border-b border-purple-400/10 bg-[#090514]/80 hidden sm:flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
          aria-label="Garden feature sections"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 focus-visible:ring-2 focus-visible:ring-pink-400/50 outline-none ${
                  isActive ? 'nav-tab-active' : 'nav-tab-inactive'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-300' : 'text-purple-300/70'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Canvas */}
        <main
          ref={mainScrollRef}
          className={`relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-8 lg:px-10 py-5 sm:py-8 space-y-6 sm:space-y-8 mx-auto w-full ${
            activeTab === 'garden' ? 'max-w-7xl' : 'max-w-6xl'
          }`}
          style={{
            minHeight: 0,
            paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 24px))',
          }}
        >
          {/* Quick Back to Sanctuary Bar */}
          {activeTab !== 'garden' && (
            <div className="flex items-center justify-between pb-2.5 border-b border-purple-400/15 gap-2">
              <button
                onClick={handleGoBackToSanctuary}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 hover:border-pink-300/50 text-pink-200 text-xs font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-pink-300" />
                <span>← Back to Sanctuary</span>
              </button>
            </div>
          )}

          {activeTab === 'garden' && (
            <GardenDashboardOverview
              onSelectTab={(tab) => handleSelectTab(tab)}
              currentUser={currentUser}
              onOpenAddStudio={handleOpenQuickAdd}
            />
          )}

          {activeTab === 'letters' && <LettersSection />}
          {activeTab === 'sound' && <SoundGardenSection />}
          {activeTab === 'shelf' && <ExchangeShelfSection />}
          {activeTab === 'archive' && <LittleArchiveSection />}
          {activeTab === 'petals' && <PetalNotesSpace />}
          {activeTab === 'time' && <OurTimeSection />}
          {activeTab === 'questions' && <LittleQuestionsSection />}
          {activeTab === 'capsule' && <TimeCapsuleSection />}
          {activeTab === 'moods' && <MoodGardenSection />}
          {activeTab === 'world' && <WorldAroundUsSection />}
          {activeTab === 'more' && (
            <MoreGardenSection
              currentUser={currentUser}
              onSelectTab={(tab) => handleSelectTab(tab)}
            />
          )}

          {/* Privacy & Security Audit Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl mx-auto py-6 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-lavender-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-xl shadow-emerald-500/10">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300">
                    Live Security Protocol
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                    Row Level Security & Privacy Verification
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300/90 max-w-lg mx-auto font-light leading-relaxed">
                  Verify cryptographic user isolation, private draft concealment, author-controlled deletions, and server-enforced time capsule release dates.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleRunSecurityAudit}
                    disabled={testingAudit}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border border-white/20"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{testingAudit ? 'Executing Verification...' : 'Run Automated Security Test'}</span>
                  </button>
                </div>
              </div>

              {auditResults && (
                <div className="space-y-3.5 pt-4 animate-scale-up">
                  {auditResults.map((res, i) => (
                    <div
                      key={i}
                      className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 backdrop-blur-md transition-all ${
                        res.passed
                          ? 'glass-mint-card text-emerald-100'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0 mt-0.5">
                        {res.passed ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                            {res.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                            {res.passed ? 'PASSED (RLS Active)' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-xs font-light mt-1 text-slate-300 leading-relaxed">
                          {res.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <MobileBottomNav
          currentView={activeTab}
          isGardenOpen={true}
          onNavigate={(target) => {
            if (target === 'home') {
              handleGoHome();
            } else if (target === 'garden') {
              handleSelectTab('garden');
            } else if (target === 'music') {
              handleSelectTab('sound');
            } else if (target === 'archive') {
              handleSelectTab('archive');
            } else if (target === 'more') {
              handleSelectTab('more');
            } else {
              handleSelectTab(target as TabKey);
            }
          }}
        />
      </div>

      {/* Global Quick Add Studio Modal */}
      <QuickAddStudioModal
        isOpen={isQuickAddOpen}
        initialType={quickAddType}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={(type) => {
          if (type === 'photo') setActiveTab('archive');
          else if (type === 'date') setActiveTab('time');
          else if (type === 'song') setActiveTab('sound');
          else if (type === 'book') setActiveTab('shelf');
          else if (type === 'letter') setActiveTab('letters');
        }}
      />
    </div>
  );
};
