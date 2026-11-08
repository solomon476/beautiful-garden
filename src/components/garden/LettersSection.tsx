import React, { useState, useEffect } from 'react';
import {
  PenLine,
  Lock,
  Globe2,
  Trash2,
  Edit3,
  X,
  Sparkles,
  Clock,
  Filter,
} from 'lucide-react';
import { notesService, authService } from '../../services/gardenService';
import type { NoteEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';
import styles from './LettersSection.module.css';

export const LettersSection: React.FC = () => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Form State
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<NoteEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const partner = authService.getPartner();

  const loadNotes = async () => {
    try {
      setLoading(true);
      const list = await notesService.getNotes();
      setNotes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadNotes();
    });
    return unsubscribe;
  }, []);

  const handleStartCompose = () => {
    soundEngine.playSparkle();
    setEditingId(null);
    setTitle('');
    setBody('');
    setIsShared(false);
    setErrorMsg(null);
    setIsComposing(true);
  };

  const handleEditNote = (note: NoteEntry) => {
    if (note.authorId !== currentUser.id) return;
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setIsShared(note.isShared);
    setErrorMsg(null);
    setIsComposing(true);
    setSelectedNote(null);
  };

  const handleSave = async () => {
    if (!body.trim()) {
      setErrorMsg('Please write your letter before saving.');
      return;
    }

    try {
      await notesService.saveNote({
        id: editingId || undefined,
        title,
        body,
        isShared,
      });

      soundEngine.playChime(659.25, 1.2, 0.08);
      setIsComposing(false);
      setEditingId(null);
      setTitle('');
      setBody('');
      setIsShared(false);
      await loadNotes();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save letter.');
    }
  };

  const handleDelete = async (note: NoteEntry) => {
    if (note.authorId !== currentUser.id) return;
    if (window.confirm(`Delete letter "${note.title || 'Untitled'}"?`)) {
      await notesService.deleteNote(note.id);
      setSelectedNote(null);
      await loadNotes();
    }
  };

  const handleToggleReaction = (note: NoteEntry) => {
    soundEngine.playSparkle();
    const reactions = ['Kept close 💖', 'In my heart 💌', 'Touched ✨', 'Cherished 🌸'];
    const currentReaction = (note as any).reaction || '';
    const currentIdx = reactions.findIndex((r) => r.includes(currentReaction.replace(/[^\w\s]/gi, '').trim()));
    const nextReaction = reactions[(currentIdx + 1) % reactions.length];

    const updated = notes.map((n) => (n.id === note.id ? { ...n, reaction: nextReaction } : n));
    setNotes(updated);
    if (selectedNote?.id === note.id) {
      setSelectedNote({ ...selectedNote, reaction: nextReaction } as any);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'shared') return n.isShared;
    if (activeFilter === 'private') return !n.isShared;
    return true;
  });

  return (
    <div className={styles.lettersSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientBg} />
        <div className={styles.heroRadialGlow} />

        <div className={styles.heroContent}>
          {/* Left Decorative Illuminated Artwork & Titles */}
          <div className={styles.heroLeft}>
            <div className={styles.heroArtwork}>
              <img
                src="/assets/garden/card_letters.jpg"
                alt="Letters in the Garden"
              />
              <div className={styles.heroArtworkOverlay}>
                <PenLine className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className={styles.heroText}>
              <div className={styles.heroTag}>
                <span>〰️ Letters in the Garden</span>
                <span>✦</span>
              </div>

              <h2 className={styles.heroTitle}>
                <span>Letters</span>
                <span className={styles.heroTitleHeart}>♡</span>
              </h2>

              <p className={styles.heroSubtitle}>
                Quiet thoughts, long letters, and feelings you wish to keep in bloom.
              </p>

              {/* Direct Left Column Add Trigger Button */}
              <div>
                <button
                  type="button"
                  onClick={handleStartCompose}
                  className={styles.heroTriggerBtn}
                >
                  <PenLine className="w-4 h-4 text-white" />
                  <span>Write New Letter ✉️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center / Balance: Romantic Stats Chips */}
          <div className={styles.heroStatsRow}>
            <div className={`${styles.heroStatChip} ${styles.statChipNeutral}`}>
              <span>💌</span>
              <span>{notes.length} Total Letters</span>
            </div>
            <div className={`${styles.heroStatChip} ${styles.statChipShared}`}>
              <span>✨</span>
              <span>{notes.filter((n) => n.isShared).length} Shared in Bloom</span>
            </div>
            <div className={`${styles.heroStatChip} ${styles.statChipPrivate}`}>
              <span>🔒</span>
              <span>{notes.filter((n) => !n.isShared).length} Private Keepsakes</span>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className={styles.heroRightBtnWrapper}>
            <button
              type="button"
              onClick={handleStartCompose}
              className={styles.heroRightActionBtn}
            >
              <PenLine className="w-4 h-4 text-white" />
              <span>Write New Letter</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Letters Grid — 2 Column Responsive Glass Cards */}
      {loading ? (
        <div className="py-16 text-center text-pink-300/60 text-xs font-mono animate-pulse">
          Opening parchment seals...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyStateIcon}>
            <PenLine className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className={styles.emptyStateTitle}>No letters in this view yet</h4>
          <p className={styles.emptyStateText}>
            {activeFilter === 'all'
              ? 'Pour your heart onto parchment. Write a quiet letter to keep forever in this sanctuary.'
              : `No letters currently marked as "${activeFilter}".`}
          </p>
          <button
            type="button"
            onClick={handleStartCompose}
            className={styles.heroTriggerBtn}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Write First Letter 💌</span>
          </button>
        </div>
      ) : (
        <div className={styles.lettersGrid}>
          {filteredNotes.map((note) => {
            const isAddedByMe = note.authorId === currentUser.id;

            return (
              <div key={note.id} className={styles.letterCard}>
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className={styles.letterCardUpper}>
                  {/* Left Square Artwork with Wax Seal Icon */}
                  <div
                    onClick={() => setSelectedNote(note)}
                    className={styles.letterCardCover}
                    title="Click to read full letter"
                  >
                    <img
                      src="/assets/garden/card_letters.jpg"
                      alt="Letter envelope"
                    />
                    <div className={styles.letterCardCoverOverlay}>
                      <div className={styles.waxSealBadge}>
                        <PenLine className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Privacy Badge, Date & Excerpt */}
                  <div className={styles.letterCardMeta}>
                    <div className={styles.letterCardHeaderRow}>
                      <h3
                        onClick={() => setSelectedNote(note)}
                        className={styles.letterCardTitle}
                      >
                        {note.title || 'Untitled Letter'}
                      </h3>

                      <span
                        className={`${styles.privacyBadge} ${
                          note.isShared ? styles.privacyBadgeShared : styles.privacyBadgePrivate
                        }`}
                      >
                        {note.isShared ? (
                          <Globe2 className="w-3 h-3" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        <span>{note.isShared ? 'Shared' : 'Private'}</span>
                      </span>
                    </div>

                    {/* Date */}
                    <div className={styles.letterDateRow}>
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Body Excerpt */}
                    <p className={styles.letterExcerpt}>
                      “{note.body}” <span className="font-sans not-italic text-pink-300">♡</span>
                    </p>
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + Read Button */}
                <div className={styles.letterCardFooter}>
                  {/* Contributor Avatar & Name */}
                  <div className={styles.authorRow}>
                    <span className={styles.authorAvatar}>👤</span>
                    <span className={styles.authorName}>
                      By: {isAddedByMe ? 'You' : note.authorName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & Read Button */}
                  <div className={styles.actionsGroup}>
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(note)}
                      className={styles.reactionPill}
                      title="Click to cycle reaction"
                    >
                      <span>{(note as any).reaction || 'Kept close 💖'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNote(note)}
                      className={styles.readLetterBtn}
                    >
                      <span>Read Full Letter</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Action & Filter Section */}
      <section className={styles.bottomActionSection}>
        {/* Left Card: Write Letter Banner */}
        <div className={styles.writeLetterCard}>
          <div className={styles.writeLetterLeft}>
            <div className={styles.writeLetterThumb}>
              <img
                src="/assets/garden/card_letters.jpg"
                alt="Parchment Letters"
              />
            </div>
            <div className={styles.writeLetterMeta}>
              <h4 className={styles.writeLetterTitle}>
                Write a Heartfelt Letter
              </h4>
              <p className={styles.writeLetterSubtitle}>
                Express thoughts that are easier said in ink than aloud.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartCompose}
            className={styles.writeLetterBtn}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write Letter →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters */}
        <div className={styles.filtersCard}>
          <div>
            <div className={styles.filtersHeader}>
              <Filter className="w-3.5 h-3.5 text-pink-300" />
              <span>Quick Filters</span>
            </div>

            <div className={styles.filterPillsGroup} style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('all');
                }}
                className={`${styles.filterPill} ${
                  activeFilter === 'all' ? styles.filterPillActiveAll : ''
                }`}
              >
                💌 All Letters
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('shared');
                }}
                className={`${styles.filterPill} ${
                  activeFilter === 'shared' ? styles.filterPillActiveShared : ''
                }`}
              >
                ✨ Shared
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('private');
                }}
                className={`${styles.filterPill} ${
                  activeFilter === 'private' ? styles.filterPillActivePrivate : ''
                }`}
              >
                🔒 Private
              </button>
            </div>
          </div>

          <div className={styles.filtersQuoteRow}>
            <span>Words written from the heart never fade ♡</span>
            <span>🌸</span>
          </div>
        </div>
      </section>

      {/* 4. Reading Modal — Spacious Keepsake Parchment Presentation */}
      {selectedNote && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedNote(null)}
        >
          <div
            className={styles.readingModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLabel}>
                <PenLine className="w-4 h-4 text-pink-300" />
                <span>Letter Parchment Keepsake</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title, Badge & Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.readingTitleRow}>
                <h3 className={styles.readingTitle}>
                  {selectedNote.title || 'Untitled Letter'}
                </h3>
                <span
                  className={`${styles.privacyBadge} ${
                    selectedNote.isShared ? styles.privacyBadgeShared : styles.privacyBadgePrivate
                  }`}
                >
                  {selectedNote.isShared ? (
                    <Globe2 className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{selectedNote.isShared ? 'Shared in Garden' : 'Private Secret Draft'}</span>
                </span>
              </div>

              <div className={styles.readingDateRow}>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Penned on{' '}
                  {new Date(selectedNote.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Letter Parchment Scroll Box */}
              <div className={styles.parchmentScrollBox}>
                <p className={styles.parchmentBodyText}>
                  {selectedNote.body}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.readingFooter}>
              {selectedNote.authorId === currentUser.id ? (
                <div className={styles.readingAuthorActions}>
                  <button
                    type="button"
                    onClick={() => handleEditNote(selectedNote)}
                    className={styles.editActionBtn}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Letter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedNote)}
                    className={styles.deleteActionBtn}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-mono text-pink-300/70">
                  Written with love by {selectedNote.authorName || partner.displayName}
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className={styles.foldLetterBtn}
              >
                <span>Fold Letter ✉️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Compose / Edit Modal — Spacious, Breathable Writing Sanctuary */}
      {isComposing && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsComposing(false)}
        >
          <div
            className={styles.composeModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.composeHeader}>
              <div className={styles.composeHeaderLeft}>
                <div className={styles.composeHeaderIcon}>
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={styles.composeHeaderTitle}>
                    {editingId ? 'Edit Letter' : 'Pen a Letter in the Garden'}
                  </h4>
                  <p className={styles.composeHeaderSubtitle}>
                    {isShared ? `Shared with ${partner.displayName}` : 'Kept strictly private to you'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className={styles.modalCloseBtn}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className={styles.composeForm}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Letter Title (Optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A small note for when you wake up..."
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Letter Contents *</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write whatever is in your heart... thoughts, memories, little notes, or feelings you cherish."
                  className={styles.formTextarea}
                />
              </div>

              {/* Privacy Toggle & Checkbox */}
              <div>
                <DecoratedPrivacyToggle
                  isShared={isShared}
                  onToggle={setIsShared}
                  partnerName={partner.displayName}
                />
              </div>

              {errorMsg && (
                <p className={styles.formError}>
                  {errorMsg}
                </p>
              )}

              <div className={styles.composeFooter}>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Seal & Save Letter 💌</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
