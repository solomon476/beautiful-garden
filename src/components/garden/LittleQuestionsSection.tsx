import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Lock,
  Globe2,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import {
  questionsService,
  authService,
  CONVERSATION_PROMPTS,
} from '../../services/gardenService';
import type { QuestionResponseEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

export const LittleQuestionsSection: React.FC = () => {
  const [responses, setResponses] = useState<QuestionResponseEntry[]>([]);
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);
  const [myAnswer, setMyAnswer] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  const partner = authService.getPartner();
  const currentPrompt = CONVERSATION_PROMPTS[activePromptIndex];

  const loadData = async () => {
    try {
      const list = await questionsService.getResponses();
      setResponses(list);

      // Check if user already answered current prompt
      const existing = list.find(
        (r) => r.questionId === currentPrompt.id && r.userId === currentUser.id
      );
      if (existing) {
        setMyAnswer(existing.answer);
        setIsShared(existing.isShared);
      } else {
        setMyAnswer('');
        setIsShared(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadData();
    });
    return unsubscribe;
  }, [activePromptIndex]);

  const handleNextPrompt = () => {
    soundEngine.playSparkle();
    setActivePromptIndex((prev) => (prev + 1) % CONVERSATION_PROMPTS.length);
  };

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    try {
      await questionsService.saveResponse(currentPrompt.id, myAnswer, isShared);
      soundEngine.playChime(659.25, 1.2, 0.08);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Could not save answer.');
    }
  };

  // Get partner's answer if shared
  const partnerResponse = responses.find(
    (r) => r.questionId === currentPrompt.id && r.userId !== currentUser.id && r.isShared
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-400/15">
        <div>
          <div className="flex items-center gap-2 text-sky-300 text-xs font-mono uppercase tracking-wider mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Little Questions</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Playful Prompts & Gentle Thoughts
          </h3>
          <p className="font-handwriting text-lg text-sky-200/80 mt-0.5">
            Answer privately, share when you wish, or skip freely with zero pressure.
          </p>
        </div>

        <button
          onClick={handleNextPrompt}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 hover:from-sky-500/35 hover:to-indigo-500/35 text-sky-200 text-xs font-semibold uppercase tracking-wider border border-sky-400/30 transition-all hover:scale-105"
        >
          <span>Next Prompt</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Current Question Card */}
      <div className="glass-midnight-card p-6 sm:p-9 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-sky-500/20 border border-sky-400/40 text-sky-200 shadow-sm">
              Prompt {activePromptIndex + 1} of {CONVERSATION_PROMPTS.length} • {currentPrompt.category}
            </span>
          </div>
          <h4 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
            “{currentPrompt.question}”
          </h4>
        </div>

        {/* Answer submission */}
        <form onSubmit={handleSaveAnswer} className="space-y-4 pt-3 border-t border-purple-400/15">
          <div>
            <label className="block text-xs font-mono text-sky-200/70 uppercase tracking-wider mb-1.5">
              Your Answer
            </label>
            <textarea
              rows={3}
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Jot down whatever comes to mind..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-sky-400/20 text-white text-sm focus:outline-none focus:border-sky-400 shadow-inner resize-y font-light leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded text-sky-500 focus:ring-0"
              />
              <span>
                {isShared ? (
                  <span className="text-emerald-300 flex items-center gap-1 font-medium">
                    <Globe2 className="w-3.5 h-3.5" /> Shared with {partner.displayName}
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1 font-medium">
                    <Lock className="w-3.5 h-3.5" /> Private to you (Unshared)
                  </span>
                )}
              </span>
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all self-end border border-white/20"
            >
              Save Answer ✨
            </button>
          </div>
        </form>

        {/* Partner's answer if shared */}
        {partnerResponse && (
          <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-400/30 space-y-2 animate-fade-in shadow-inner">
            <span className="text-xs font-mono text-pink-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              {partner.displayName}'s Shared Answer:
            </span>
            <p className="font-handwriting text-2xl text-pink-100 leading-relaxed">
              “{partnerResponse.answer}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
