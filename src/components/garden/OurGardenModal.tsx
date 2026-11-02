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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in overflow-hidden font-body">
      <div
        className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl border border-purple-400/30 shadow-2xl shadow-purple-950/80 overflow-hidden animate-scale-up"
        style={{
          background: 'radial-gradient(circle at 85% 12%, rgba(192, 132, 252, 0.18) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(244, 114, 182, 0.16) 0%, transparent 45%), linear-gradient(160deg, #130d28 0%, #0c0819 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Ambient Background Orbs */}
        <div className="garden-glow-orb-top" />
        <div className="garden-glow-orb-bottom" />

        {/* Top Header */}
        <header className="relative z-10 px-5 sm:px-7 py-4 border-b border-purple-400/20 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 fill-white/80" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gradient-garden">
                  Our Garden
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  Shared Sanctuary 🌿
                </span>
              </div>
              <p className="font-handwriting text-base text-pink-200/90 leading-none mt-0.5">
                A private corner for laughs, playlists, keepsakes & memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Account Switcher Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-400/30 text-xs backdrop-blur-md shadow-sm">
              <span className="text-slate-400 hidden xs:inline font-mono text-[11px]">Viewing as:</span>
              <span className="font-medium text-pink-200 flex items-center gap-1">
                {currentUser.displayName}
              </span>
              <button
                onClick={handleSwitchUser}
                className="flex items-center gap-1 ml-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 text-purple-100 text-[11px] font-medium border border-purple-400/40 transition-all hover:scale-105 active:scale-95 shadow-sm shadow-purple-500/20"
                title={`Switch active user to ${currentUser.username === 'noella' ? 'Solomon' : 'Noella'}`}
              >
                <ArrowRightLeft className="w-3 h-3 text-pink-300" />
                <span>Switch to {currentUser.username === 'noella' ? 'Solomon 🌿' : 'Noella ✨'}</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:rotate-90"
              aria-label="Close Our Garden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Feature Tab Navigation Bar */}
        <nav className="relative z-10 px-4 sm:px-6 py-2.5 border-b border-purple-400/15 bg-slate-950/30 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/35 via-pink-500/30 to-rose-500/35 text-white border border-pink-400/50 shadow-md shadow-purple-500/20 font-semibold scale-102'
                    : 'text-slate-300/80 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Canvas */}
        <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
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
