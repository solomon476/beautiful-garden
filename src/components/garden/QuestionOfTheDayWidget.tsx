import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Shuffle, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    loadResponses();
    const unsub = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadResponses();
    });
    return unsub;
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

      // Send notification to partner
      notificationService.sendNotification({
        type: 'letter',
        title: '💬 Answered Daily Question',
        message: `${currentUser.displayName} answered: "${currentPrompt.question}" ♡`,
        targetTab: 'questions',
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

  return (
    <div className="relative my-3 overflow-hidden rounded-2xl sm:rounded-3xl border border-pink-400/30 bg-gradient-to-br from-[#1c0b33]/90 via-[#270f44]/80 to-[#120524]/95 p-3.5 sm:p-4 text-white shadow-xl backdrop-blur-xl transition-all duration-300">
      {/* Decorative Aura */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-pink-500/15 blur-2xl" />

      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-sm shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-pink-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide">
                Question of the Day
              </span>
              <span className="px-2 py-0.2 rounded-full bg-pink-500/20 border border-pink-400/30 text-[9px] font-mono text-pink-200">
                {currentPrompt.category}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShuffle}
          className="p-1.5 rounded-full hover:bg-white/10 text-pink-300/80 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px]"
          title="Shuffle to another question"
        >
          <Shuffle className="w-3 h-3" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
      </div>

      {/* The Question Prompt */}
      <p className="font-serif text-sm sm:text-base font-semibold text-pink-100 leading-snug mb-3">
        “{currentPrompt.question}”
      </p>

      {/* Answers Display or Answering Box */}
      <div className="space-y-2 mb-3">
        {/* Current User's Answer */}
        {myResponse ? (
          <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white/[0.06] border border-pink-400/30">
            <img
              src={currentUser.avatarUrl || '/assets/memories/photo-solomon-avatar.jpg'}
              alt={currentUser.displayName}
              className="w-6 h-6 rounded-full object-cover border border-pink-300/50 shrink-0 mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-pink-300/80 block">Your Answer:</span>
              <p className="text-xs text-white/95 font-serif italic leading-relaxed">
                “{myResponse.answer}”
              </p>
            </div>
          </div>
        ) : (
          /* Answering Form */
          <form onSubmit={handleAnswerSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={myAnswerText}
              onChange={(e) => setMyAnswerText(e.target.value)}
              placeholder="Share your quick thought... ♡"
              className="flex-1 bg-white/[0.07] border border-pink-400/30 rounded-xl px-3 py-2 text-xs text-white placeholder-pink-200/50 focus:outline-none focus:border-pink-400/70"
            />
            <button
              type="submit"
              disabled={!myAnswerText.trim() || isSubmitting}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1 shrink-0 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
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
              <span className="text-[10px] font-mono text-purple-300/80 block">{partner.displayName}'s Answer:</span>
              <p className="text-xs text-white/95 font-serif italic leading-relaxed">
                “{partnerResponse.answer}”
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl border border-dashed border-white/15 text-[11px] font-serif italic text-pink-200/60 flex items-center justify-between">
            <span>Waiting for {partner.displayName}'s answer... ✨</span>
            <span className="text-[9px] font-mono opacity-70">Shared prompt</span>
          </div>
        )}
      </div>

      {/* Footer link to full Questions section */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
        <span className="text-pink-300/70 font-mono text-[10px]">
          {responses.filter((r) => r.questionId === currentPrompt.id).length} answered
        </span>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            onSelectTab('questions');
          }}
          className="text-pink-300 hover:text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View All Questions</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
