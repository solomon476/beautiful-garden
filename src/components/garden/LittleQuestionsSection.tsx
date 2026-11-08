import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  X,
  Sparkles,
  Lock,
  Globe2,
} from 'lucide-react';
import {
  questionsService,
  authService,
  CONVERSATION_PROMPTS,
} from '../../services/gardenService';
import type { QuestionResponseEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './LittleQuestionsSection.module.css';

interface CustomPrompt {
  id: string;
  question: string;
  category: string;
  author?: string;
  date?: string;
}

export const LittleQuestionsSection: React.FC = () => {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([
    {
      id: 'q-season',
      question: "What's your favourite season?",
      category: 'Curiosity',
      author: 'Solomon',
      date: 'Nov 8, 2026',
    },
    ...CONVERSATION_PROMPTS.map((p) => ({
      ...p,
      author: 'Sanctuary Prompt',
      date: 'Together',
    })),
  ]);

  const [responses, setResponses] = useState<QuestionResponseEntry[]>([]);
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);
  const [myAnswer, setMyAnswer] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [isAnsweringOpen, setIsAnsweringOpen] = useState<boolean>(false);
  const [isAskingOpen, setIsAskingOpen] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const partner = authService.getPartner();
  const currentPrompt = prompts[activePromptIndex] || prompts[0];

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
        setIsShared(true);
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
    setActivePromptIndex((prev) => (prev + 1) % prompts.length);
  };

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    try {
      await questionsService.saveResponse(currentPrompt.id, myAnswer, isShared);
      soundEngine.playChime(659.25, 1.2, 0.08);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Could not save answer.');
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    soundEngine.playChime(784.0, 1.0, 0.08);
    const newPrompt: CustomPrompt = {
      id: `custom-q-${Date.now()}`,
      question: newQuestionText.trim(),
      category: 'Heartfelt',
      author: currentUser.displayName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setPrompts((prev) => [newPrompt, ...prev]);
    setActivePromptIndex(0);
    setNewQuestionText('');
    setIsAskingOpen(false);
  };

  // Get partner's answer if shared
  const partnerResponse = responses.find(
    (r) => r.questionId === currentPrompt.id && r.userId !== currentUser.id && r.isShared
  );

  return (
    <div className={styles.questionsSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroTagline}>
            <span>Deep Intimacy</span>
            <span className={styles.heroTagDot}>✦</span>
            <span>Little Questions</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>Little Questions</span>
            <span className={styles.heroTitleHeart}>♡</span>
          </h1>

          <p className={styles.heroVerbs}>Ask · Discover · Learn</p>

          <p className={styles.heroSubtitle}>
            Let's explore each other's thoughts... ♡
          </p>
        </div>

        {/* 3D Glowing Dialog Artwork Frame */}
        <div className={styles.heroArtworkContainer}>
          <img
            src="/assets/garden/card_questions.jpg"
            alt="Little questions dialogue art"
            className={styles.heroArtworkImg}
          />
        </div>
      </section>

      {/* 2. Main Question Card — Exactly matching master Row 3, Col 1 */}
      <div className={styles.mainPanel}>
        <div className={styles.questionCard}>
          <div className={styles.questionLeft}>
            <div className={styles.questionBadge}>
              <span className={styles.questionBadgeIcon}>?</span>
            </div>

            <div className={styles.questionBody}>
              <h2 className={styles.questionTitle}>
                {currentPrompt.question}
              </h2>

              <div className={styles.questionMeta}>
                <span>Asked by {currentPrompt.author || 'Solomon'}</span>
                <span className={styles.questionMetaDot}>•</span>
                <span>{currentPrompt.date || 'Nov 8, 2026'}</span>
                <span className={styles.questionMetaDot}>•</span>
                <span className={styles.questionCategoryBadge}>
                  {currentPrompt.category}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setIsAnsweringOpen(!isAnsweringOpen);
            }}
            className={styles.viewAnswersBtn}
          >
            <span>{isAnsweringOpen ? 'Hide Answers' : 'View Answers'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Bottom Row: Shuffle / Next Prompt & Ask a New Question ＋ */}
        <div className={styles.bottomBar}>
          <button
            type="button"
            onClick={handleNextPrompt}
            className={styles.shuffleBtn}
            title="Cycle to next question"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Next Question ({activePromptIndex + 1}/{prompts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setIsAskingOpen(true);
            }}
            className={styles.askNewBtn}
          >
            <Plus className="w-4 h-4" />
            <span>Ask a New Question ＋</span>
          </button>
        </div>

        {/* 4. Interactive Answer Sanctuary Drawer */}
        {isAnsweringOpen && (
          <div className={styles.drawerPanel}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>
                Answers & Thoughts ♡
              </h3>
              <button
                type="button"
                onClick={() => setIsAnsweringOpen(false)}
                className={styles.drawerCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Partner's answer if available */}
            {partnerResponse && (
              <div className={styles.partnerWhisperCard}>
                <div className={styles.partnerWhisperHeader}>
                  <MessageCircle className="w-4 h-4" />
                  <span>{partner.displayName}'s Shared Response</span>
                </div>
                <p className={styles.partnerWhisperText}>
                  “{partnerResponse.answer}”
                </p>
              </div>
            )}

            {/* User's Answer Form */}
            <form onSubmit={handleSaveAnswer} className={styles.answerForm}>
              <label style={{ fontSize: '13px', color: 'var(--qst-muted)', fontWeight: 500 }}>
                Your Heartfelt Answer:
              </label>
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Share whatever comes to mind... there are no wrong answers here ♡"
                className={styles.textareaField}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                {/* Privacy toggle */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setIsShared(!isShared);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: isShared ? 'rgba(240, 68, 181, 0.15)' : 'rgba(141, 53, 189, 0.15)',
                    border: `1px solid ${isShared ? 'rgba(240, 68, 181, 0.4)' : 'rgba(141, 53, 189, 0.4)'}`,
                    color: isShared ? '#ff8acb' : '#c69ae8',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, monospace',
                    cursor: 'pointer',
                  }}
                >
                  {isShared ? (
                    <>
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Shared with {partner.displayName} 🌸</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private to you 🔒</span>
                    </>
                  )}
                </button>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveAnswerBtn}>
                    <Sparkles className="w-4 h-4" />
                    <span>Save My Answer ✨</span>
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  color: '#a7f3d0',
                  fontSize: '13px',
                }}>
                  Your answer has been preserved in Our Garden. 🌿
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* 5. Modal for Asking New Custom Question */}
      {isAskingOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAskingOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#fff' }}>
                Ask a New Question 💭
              </h3>
              <button
                type="button"
                onClick={() => setIsAskingOpen(false)}
                className={styles.drawerCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--qst-muted)' }}>
              Ask something sweet, deep, playful, or curious for both of you to answer...
            </p>

            <form onSubmit={handleAskQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="e.g. What is one small moment from our week you loved?"
                className={styles.modalInput}
                autoFocus
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAskingOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '999px',
                    background: 'transparent',
                    border: '0',
                    color: 'var(--qst-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newQuestionText.trim()}
                  className={styles.saveAnswerBtn}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Question ✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
