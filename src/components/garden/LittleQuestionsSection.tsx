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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Little Questions</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Playful Prompts & Gentle Thoughts
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Answer privately, share when you wish, or skip freely with zero pressure.
          </p>
        </div>

        <button
          onClick={handleNextPrompt}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
        >
          <span>Next Prompt</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Current Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-pink-500/15 border border-pink-400/30 text-pink-300 mb-3">
            Prompt {activePromptIndex + 1} of {CONVERSATION_PROMPTS.length} • {currentPrompt.category}
          </span>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
            “{currentPrompt.question}”
          </h4>
        </div>

        {/* Answer submission */}
        <form onSubmit={handleSaveAnswer} className="space-y-4 pt-2 border-t border-white/10">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Your Answer
            </label>
            <textarea
              rows={3}
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Jot down whatever comes to mind..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded text-pink-500 focus:ring-0"
              />
              <span>
                {isShared ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" /> Shared with {partner.displayName}
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Private to you (Unshared)
                  </span>
                )}
              </span>
            </label>

            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md transition-all self-end"
            >
              Save Answer
            </button>
          </div>
        </form>

        {/* Partner's answer if shared */}
        {partnerResponse && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 animate-fade-in">
            <span className="text-[11px] font-mono text-pink-300 flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {partner.displayName}'s Shared Answer:
            </span>
            <p className="text-xs text-slate-200 font-light leading-relaxed italic">
              “{partnerResponse.answer}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
