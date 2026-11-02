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

const TABS: { id: TabKey; label: string; icon: any; priority?: boolean }[] = [
  { id: 'letters', label: 'Letters', icon: PenLine, priority: true },
  { id: 'sound', label: 'Sound Garden', icon: Headphones, priority: true },
  { id: 'shelf', label: 'Exchange Shelf', icon: Layers },
  { id: 'archive', label: 'Archive', icon: Camera },
  { id: 'petals', label: 'Petal Notes', icon: Sparkles },
  { id: 'time', label: 'Our Time', icon: CalendarDays },
  { id: 'questions', label: 'Questions', icon: HelpCircle },
  { id: 'capsule', label: 'Time Capsule', icon: Hourglass },
  { id: 'moods', label: 'Moods', icon: Heart },
  { id: 'security', label: 'Privacy Test', icon: ShieldCheck },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-hidden">
      <div
        className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl bg-slate-900/90 border border-pink-400/30 shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Brand & User Switcher */}
        <header className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Our Garden <span className="text-xs font-mono font-normal text-pink-300">🌿 A Shared Space</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Switcher Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <span className="text-slate-400 hidden xs:inline font-mono text-[11px]">Active Account:</span>
              <span className="font-semibold text-pink-200">{currentUser.displayName}</span>
              <button
                onClick={handleSwitchUser}
                className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[10px] font-mono border border-pink-400/30 transition-all hover:scale-105 active:scale-95"
                title={`Switch active user to ${currentUser.username === 'noella' ? 'Solomon' : 'Noella'}`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Switch to {currentUser.username === 'noella' ? 'Solomon 🌿' : 'Noella ✨'}</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close Our Garden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Feature Tab Navigation Bar */}
        <nav className="px-4 py-2 border-b border-white/10 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
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
                    ? 'bg-pink-500/25 text-pink-200 border border-pink-400/40 shadow-sm shadow-pink-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
            <div className="space-y-6 max-w-2xl mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Row Level Security & Privacy Verification
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto font-light">
                  Validate account isolation, private note invisibility, author-controlled deletion, and server-enforced time capsule release dates.
                </p>

                <button
                  onClick={handleRunSecurityAudit}
                  disabled={testingAudit}
                  className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {testingAudit ? 'Running Audit...' : 'Execute Security Audit Test'}
                </button>
              </div>

              {auditResults && (
                <div className="space-y-3 pt-4 animate-fade-in">
                  {auditResults.map((res, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        res.passed
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <span className="text-lg">{res.passed ? '✅' : '❌'}</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {res.name}
                        </h4>
                        <p className="text-xs font-light mt-0.5 opacity-90">
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
