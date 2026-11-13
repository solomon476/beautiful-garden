import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Shuffle, ArrowRight, PenLine } from 'lucide-react';
import { questionsService, authService, CONVERSATION_PROMPTS } from '../../services/gardenService';
import { notificationService } from '../../services/notificationService';
import type { QuestionResponseEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface QuestionOfTheDayWidgetProps {
  onSelectTab: (tab: any) => void;
}

export const QuestionOfTheDayWidget: React.FC<QuestionOfTheDayWidgetProps> = ({ onSelectTab }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const partner = authService.getPartner();

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isEditingMyAnswer, setIsEditingMyAnswer] = useState(false);

  // Pick question based on day of year by default
  const todayDayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const [promptIndex, setPromptIndex] = useState<number>(
    () => todayDayOfYear % CONVERSATION_PROMPTS.length
  );
  const currentPrompt = CONVERSATION_PROMPTS[promptIndex] || CONVERSATION_PROMPTS[0];

  const [responses, setResponses] = useState<QuestionResponseEntry[]>([]);
  const [myAnswerText, setMyAnswerText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadResponses = async () => {
    try {
      const list = await questionsService.getResponses();
      setResponses(list);
    } catch (err) {
      console.error(err);
    }
  };

  const focusAndHighlight = (questionId?: string) => {
    if (questionId) {
      const idx = CONVERSATION_PROMPTS.findIndex((p) => p.id === questionId);
      if (idx !== -1) {
        setPromptIndex(idx);
      }
    }

    setTimeout(() => {
      widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 3600);

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    }, 150);
  };

  useEffect(() => {
    loadResponses();
    const unsub = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadResponses();
    });

    // Check if opened with pending question from notification
    const pendingQ = sessionStorage.getItem('pending_open_daily_question');
    if (pendingQ) {
      sessionStorage.removeItem('pending_open_daily_question');
      focusAndHighlight(pendingQ !== 'true' ? pendingQ : undefined);
    }

    // Listen for real-time notification direct navigation
    const handleOpenDailyQuestion = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      focusAndHighlight(detail?.questionId);
    };

    window.addEventListener('garden-open-daily-question', handleOpenDailyQuestion);

    return () => {
      unsub();
      window.removeEventListener('garden-open-daily-question', handleOpenDailyQuestion);
    };
  }, []);

  const myResponse = responses.find(
    (r) => r.questionId === currentPrompt.id && r.userId === currentUser.id
  );
  const partnerResponse = responses.find(
    (r) => r.questionId === currentPrompt.id && r.userId === partner.id
  );

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    setIsEditingMyAnswer(false);
    setMyAnswerText('');
    setPromptIndex((prev) => (prev + 1) % CONVERSATION_PROMPTS.length);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswerText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      soundEngine.playSparkle();
      const saved = await questionsService.saveResponse(currentPrompt.id, myAnswerText.trim(), true);
      setResponses((prev) => [saved, ...prev.filter((r) => !(r.questionId === currentPrompt.id && r.userId === currentUser.id))]);
      setMyAnswerText('');
      setIsEditingMyAnswer(false);

      // Send notification to partner with direct response navigation
      notificationService.sendNotification({
        type: 'question',
        title: '💬 Question of the Day',
        message: `${currentUser.displayName} answered: "${currentPrompt.question}" ♡ Tap to answer yours!`,
        targetTab: 'garden',
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        recipientId: partner.id,
        entityId: currentPrompt.id,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine balanced status badge
  const getStatusText = () => {
    if (myResponse && partnerResponse) {
      return '✨ Both answered • Shared hearts ♡';
    }
    if (myResponse && !partnerResponse) {
      return `🌸 You've answered • Waiting for ${partner.displayName}`;
    }
    if (!myResponse && partnerResponse) {
      return `💌 ${partner.displayName} answered! Your turn ♡`;
    }
    return '💬 Today’s conversation spark';
  };

  return (
    <div
      id="question-of-the-day-widget"
      ref={widgetRef}
      className={`relative my-4 overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-500 bg-gradient-to-br from-[#1c0b33]/92 via-[#280f46]/85 to-[#130526]/95 p-3.5 sm:p-4 text-white shadow-xl backdrop-blur-xl ${
        isHighlighted
          ? 'border-pink-400 ring-4 ring-pink-400/50 shadow-[0_0_35px_rgba(244,114,182,0.6)] scale-[1.01]'
          : 'border-pink-400/30 hover:border-pink-400/50'
      }`}
    >
      {/* Decorative Warm Ambient Glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-pink-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl" />

      {/* Header Row: Balanced Title, Category Tag, and Shuffle Action */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-sm shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
          </div>
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide">
              Question of the Day
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-[9px] font-mono text-pink-200">
              {currentPrompt.category}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-pink-200 hover:text-white text-[11px] font-medium transition-all active:scale-95 cursor-pointer shrink-0"
          title="Shuffle to another question"
        >
          <Shuffle className="w-3 h-3 text-pink-300" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* The Question Prompt */}
      <div className="py-1">
        <p className="font-serif text-sm sm:text-base font-semibold text-pink-100 leading-snug">
          “{currentPrompt.question}”
        </p>
      </div>

      {/* Answers Display or Answering Box */}
      <div className="space-y-2 mt-2.5 mb-3">
        {/* Current User's Answer */}
        {myResponse && !isEditingMyAnswer ? (
          <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.06] border border-pink-400/30">
            <img
              src={currentUser.avatarUrl || '/assets/memories/photo-solomon-avatar.jpg'}
              alt={currentUser.displayName}
              className="w-6 h-6 rounded-full object-cover border border-pink-300/50 shrink-0 mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-pink-300/90 font-semibold">Your Answer ♡</span>
                <button
                  type="button"
                  onClick={() => {
                    setMyAnswerText(myResponse.answer);
                    setIsEditingMyAnswer(true);
                  }}
                  className="text-[10px] text-pink-300/70 hover:text-pink-100 flex items-center gap-1 underline cursor-pointer"
                >
                  <PenLine className="w-2.5 h-2.5" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-xs text-white/95 font-serif italic leading-relaxed mt-0.5">
                “{myResponse.answer}”
              </p>
            </div>
          </div>
        ) : (
          /* Answering Form */
          <form onSubmit={handleAnswerSubmit} className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={myAnswerText}
              onChange={(e) => setMyAnswerText(e.target.value)}
              placeholder="Share your quick thought... ♡"
              className="flex-1 bg-white/[0.08] border border-pink-400/35 rounded-xl px-3 py-2 text-xs text-white placeholder-pink-200/50 focus:outline-none focus:border-pink-400/80 focus:ring-1 focus:ring-pink-400/50 transition-all"
            />
            <button
              type="submit"
              disabled={!myAnswerText.trim() || isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1 shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
            {isEditingMyAnswer && (
              <button
                type="button"
                onClick={() => setIsEditingMyAnswer(false)}
                className="px-2 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            )}
          </form>
        )}

        {/* Partner's Answer */}
        {partnerResponse ? (
          <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.06] border border-purple-400/30">
            <img
              src={partner.avatarUrl || '/assets/memories/photo-noella-avatar.jpg'}
              alt={partner.displayName}
              className="w-6 h-6 rounded-full object-cover border border-purple-300/50 shrink-0 mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-purple-300/90 font-semibold block">
                {partner.displayName}'s Answer ✨
              </span>
              <p className="text-xs text-white/95 font-serif italic leading-relaxed mt-0.5">
                “{partnerResponse.answer}”
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-serif italic text-pink-200/75">
            <span className="flex items-center gap-1.5">
              <span>💌</span>
              <span>Waiting for {partner.displayName}'s answer...</span>
            </span>
            <span className="text-[9px] font-mono text-purple-300/70 not-italic">Shared</span>
          </div>
        )}
      </div>

      {/* Balanced Footer: Connection status on left, View All on right */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
        <div className="text-pink-300/80 font-mono text-[10px] flex items-center gap-1">
          <span>{getStatusText()}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            onSelectTab('questions');
          }}
          className="text-pink-200 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View All Questions</span>
          <ArrowRight className="w-3 h-3 text-pink-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
