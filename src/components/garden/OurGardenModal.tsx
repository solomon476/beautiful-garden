import React, { useState, useEffect } from 'react';
import {
  X,
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
  ArrowRightLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { LettersSection } from './LettersSection';
import { SoundGardenSection } from './SoundGardenSection';
import { ExchangeShelfSection } from './ExchangeShelfSection';
import { LittleArchiveSection } from './LittleArchiveSection';
import { PetalNotesSpace } from './PetalNotesSpace';
import { OurTimeSection } from './OurTimeSection';
import { LittleQuestionsSection } from './LittleQuestionsSection';
import { TimeCapsuleSection } from './TimeCapsuleSection';
import { MoodGardenSection } from './MoodGardenSection';
import { authService } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';
import { runPrivacyAndSecurityAudit, type PrivacyTestResult } from '../../utils/privacyTests';
import { soundEngine } from '../../utils/audio';

interface OurGardenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey =
  | 'letters'
  | 'sound'
  | 'shelf'
  | 'archive'
  | 'petals'
  | 'time'
  | 'questions'
  | 'capsule'
  | 'moods'
  | 'security';

const TABS: { id: TabKey; label: string; icon: any; color: string }[] = [
  { id: 'letters', label: 'Letters', icon: PenLine, color: 'from-pink-500 to-rose-400' },
  { id: 'sound', label: 'Sound Garden', icon: Headphones, color: 'from-purple-500 to-indigo-400' },
  { id: 'shelf', label: 'Exchange Shelf', icon: Layers, color: 'from-amber-400 to-orange-400' },
  { id: 'archive', label: 'Our Archive', icon: Camera, color: 'from-pink-400 to-purple-400' },
  { id: 'petals', label: 'Petal Notes', icon: Sparkles, color: 'from-rose-400 to-pink-500' },
  { id: 'time', label: 'Our Time', icon: CalendarDays, color: 'from-teal-400 to-emerald-400' },
  { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'from-sky-400 to-indigo-400' },
  { id: 'capsule', label: 'Time Capsule', icon: Hourglass, color: 'from-amber-300 to-yellow-500' },
  { id: 'moods', label: 'Moods', icon: Heart, color: 'from-fuchsia-400 to-pink-400' },
  { id: 'security', label: 'Privacy Test', icon: ShieldCheck, color: 'from-emerald-400 to-teal-400' },
];

export const OurGardenModal: React.FC<OurGardenModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('letters');
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [auditResults, setAuditResults] = useState<PrivacyTestResult[] | null>(null);
  const [testingAudit, setTestingAudit] = useState<boolean>(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSwitchUser = () => {
    soundEngine.playSparkle();
    const nextUsername = currentUser.username === 'noella' ? 'solomon' : 'noella';
    authService.switchUser(nextUsername);
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#070311] animate-fade-in overflow-hidden font-body">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 80% 5%, rgba(244, 114, 182, 0.18) 0%, transparent 45%), radial-gradient(circle at 15% 95%, rgba(192, 132, 252, 0.16) 0%, transparent 50%), linear-gradient(175deg, #130a24 0%, #070311 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Ambient Background Orbs */}
        <div className="garden-glow-orb-top" />
        <div className="garden-glow-orb-bottom" />

        {/* Top Header — Cleanly Docked at Top of Sanctuary */}
        <header className="relative z-10 px-6 sm:px-12 py-5 border-b border-pink-400/20 flex flex-wrap items-center justify-between gap-4 bg-[#0d071d]/85 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 shrink-0 border border-white/20">
              <Sparkles className="w-6 h-6 fill-white/80" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gradient-garden tracking-tight">
                  Our Garden
                </h2>
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 border border-pink-400/40 shadow-sm">
                  Shared Sanctuary 🌿
                </span>
              </div>
              <p className="font-handwriting text-xl text-pink-200/90 leading-none mt-1">
                A private corner for laughs, playlists, keepsakes & memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Account Switcher Pill */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/80 border border-pink-400/35 text-xs backdrop-blur-md shadow-md">
              <span className="text-slate-300 hidden sm:inline font-mono text-[11px]">Viewing as:</span>
              <span className="font-semibold text-pink-200 flex items-center gap-1">
                {currentUser.displayName}
              </span>
              <button
                onClick={handleSwitchUser}
                className="flex items-center gap-1.5 ml-1 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-rose-500/30 hover:from-pink-500/50 hover:to-rose-500/50 text-white text-[11px] font-medium border border-pink-300/40 transition-all hover:scale-105 active:scale-95 shadow-sm shadow-pink-500/20"
                title={`Switch active user to ${currentUser.username === 'noella' ? 'Solomon' : 'Noella'}`}
              >
                <ArrowRightLeft className="w-3 h-3 text-pink-300" />
                <span>Switch to {currentUser.username === 'noella' ? 'Solomon 🌿' : 'Noella ✨'}</span>
              </button>
            </div>

            {/* Prominent Frosted Close Button */}
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-rose-500/30 border border-white/20 hover:border-pink-300/50 text-slate-200 hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md ml-1"
              aria-label="Close Our Garden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Feature Tab Navigation Bar */}
        <nav className="relative z-10 px-6 sm:px-12 py-3.5 border-b border-pink-400/15 bg-[#0b0518]/70 flex items-center gap-3 overflow-x-auto scrollbar-none shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive ? 'nav-tab-active' : 'nav-tab-inactive'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-pink-300'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Canvas with Luxurious Padding */}
        <main className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-12 py-8 sm:py-10 space-y-10 max-w-7xl mx-auto w-full">
          {activeTab === 'letters' && <LettersSection />}
          {activeTab === 'sound' && <SoundGardenSection />}
          {activeTab === 'shelf' && <ExchangeShelfSection />}
          {activeTab === 'archive' && <LittleArchiveSection />}
          {activeTab === 'petals' && <PetalNotesSpace />}
          {activeTab === 'time' && <OurTimeSection />}
          {activeTab === 'questions' && <LittleQuestionsSection />}
          {activeTab === 'capsule' && <TimeCapsuleSection />}
          {activeTab === 'moods' && <MoodGardenSection />}

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
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                            {res.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
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
      </div>
    </div>
  );
};
