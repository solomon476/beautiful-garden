import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-sky-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-[10px] font-mono uppercase tracking-widest">
            <HelpCircle className="w-3 h-3 text-sky-300" />
            <span>Little Questions</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Playful Prompts & Gentle Thoughts
          </h3>
          <p className="text-xs sm:text-sm text-sky-200/80 font-light leading-relaxed max-w-xl">
            Answer privately, share when you wish, or skip freely with zero pressure.
          </p>
        </div>

        <button
          onClick={handleNextPrompt}
          className="btn-glow-romantic self-start sm:self-auto shrink-0"
        >
          <span>Next Prompt</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Current Question Card */}
      <div className="glass-midnight-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-6 relative overflow-hidden shadow-2xl border border-sky-400/20">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-sky-500/15 border border-sky-400/30 text-sky-200">
              Prompt {activePromptIndex + 1} of {CONVERSATION_PROMPTS.length} • {currentPrompt.category}
            </span>
          </div>
          <h4 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug">
            “{currentPrompt.question}”
          </h4>
        </div>

        {/* Answer submission with spacious breathing room */}
        <form onSubmit={handleSaveAnswer} className="space-y-6 pt-6 border-t border-purple-400/20">
          <div>
            <label className="form-field-label">
              <span>Your Personal Answer</span>
            </label>
            <textarea
              rows={4}
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Jot down whatever comes to your mind... there are no wrong answers here."
            />
          </div>

          {/* Decorated Privacy Switch */}
          <DecoratedPrivacyToggle
            isShared={isShared}
            onToggle={setIsShared}
            partnerName={partner.displayName}
            sharedTitle={`Share Answer with ${partner.displayName}`}
            sharedSubtitle={`Once you both share answers, you'll get to read each other's heartfelt responses ✨`}
            privateTitle="Keep Answer Private to You"
            privateSubtitle="Recorded secretly in your personal reflections. Unshared until you choose 🔐"
          />

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="btn-glow-romantic"
            >
              <span>Save Answer ✨</span>
            </button>
          </div>
        </form>

        {/* Partner's answer if shared */}
        {partnerResponse && (
          <div className="quote-whisper-bubble p-5 rounded-2xl space-y-2 animate-fade-in border border-pink-400/20">
            <span className="text-xs font-mono text-pink-300 flex items-center gap-1.5 uppercase tracking-wider font-medium">
              <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
              {partner.displayName}'s Shared Answer
            </span>
            <p className="font-serif italic text-lg sm:text-xl text-pink-100 leading-relaxed pl-1">
              “{partnerResponse.answer}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
