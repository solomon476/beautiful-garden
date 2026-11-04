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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Balanced & Spacious Layout */}
      <section
        className="relative rounded-3xl overflow-hidden border border-pink-400/30 shadow-2xl p-6 sm:p-9 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 14, 40, 0.94) 0%, rgba(18, 7, 24, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_letters.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
          }}
        />

        <div
          className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 w-full"
        >
          {/* Left Decorative Illuminated Artwork & Titles */}
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div
              className="relative rounded-2xl overflow-hidden border border-pink-300/40 shadow-xl shrink-0 group w-20 h-20 sm:w-24 sm:h-24"
            >
              <img
                src="/assets/garden/card_letters.jpg"
                alt="Letters in the Garden"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PenLine className="w-7 h-7 sm:w-8 sm:h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Letters in the Garden</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Letters</span>
                <span className="text-pink-400 font-sans text-xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-xs sm:text-base text-pink-200/90 max-w-md sm:max-w-xl leading-relaxed">
                Quiet thoughts, long letters, and feelings you wish to keep in bloom.
              </p>

              {/* Direct Left Column Add Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartCompose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                >
                  <PenLine className="w-4 h-4 text-white" />
                  <span>Write New Letter ✉️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center / Balance: Romantic Stats Chips (Fills empty space gracefully) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center lg:justify-start">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-pink-400/25 text-xs font-mono text-pink-200 shadow-sm backdrop-blur-md whitespace-nowrap">
              <span className="text-pink-400">💌</span>
              <span>{notes.length} Total Letters</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-mono text-emerald-200 shadow-sm backdrop-blur-md whitespace-nowrap">
              <span className="text-emerald-400">✨</span>
              <span>{notes.filter((n) => n.isShared).length} Shared in Bloom</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-400/30 text-xs font-mono text-purple-200 shadow-sm backdrop-blur-md whitespace-nowrap">
              <span className="text-purple-400">🔒</span>
              <span>{notes.filter((n) => !n.isShared).length} Private Keepsakes</span>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 w-full sm:w-auto flex justify-center lg:justify-end">
            <button
              onClick={handleStartCompose}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 sm:px-7 shadow-xl w-full sm:w-auto justify-center"
            >
              <PenLine className="w-4 h-4 text-white" />
              <span>Write New Letter</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Letters Grid — 2 Column Responsive Glass Cards matching Mockup */}
      {loading ? (
        <div className="py-16 text-center text-pink-300/60 text-xs font-mono animate-pulse">
          Opening parchment seals...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-4 border border-pink-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <PenLine className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-2xl text-white">No letters in this view yet</h4>
          <p className="text-xs sm:text-sm text-pink-200/80 max-w-md mx-auto font-light leading-relaxed">
            {activeFilter === 'all'
              ? 'Pour your heart onto parchment. Write a quiet letter to keep forever in this sanctuary.'
              : `No letters currently marked as "${activeFilter}".`}
          </p>
          <button onClick={handleStartCompose} className="btn-glow-romantic text-xs mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Write First Letter 💌</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredNotes.map((note) => {
            const isAddedByMe = note.authorId === currentUser.id;

            return (
              <div
                key={note.id}
                className="group relative rounded-3xl p-5 sm:p-7 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-pink-400/50"
                style={{
                  background: 'linear-gradient(135deg, rgba(36, 14, 44, 0.72) 0%, rgba(18, 7, 24, 0.88) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.28)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-3.5 sm:gap-5">
                  {/* Left Square Artwork with Wax Seal Icon */}
                  <div
                    onClick={() => setSelectedNote(note)}
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer w-20 h-20 sm:w-28 sm:h-28"
                    title="Click to read full letter"
                  >
                    <img
                      src="/assets/garden/card_letters.jpg"
                      alt="Letter envelope"
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover/cover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-pink-500/80 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        <PenLine className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Privacy Badge, Date & Excerpt */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Title + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-lg sm:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors truncate">
                        {note.title || 'Untitled Letter'}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                          note.isShared
                            ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                            : 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                        }`}
                      >
                        {note.isShared ? <Globe2 className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-purple-300" />}
                        <span>{note.isShared ? 'Shared' : 'Private'}</span>
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[11px] text-pink-300/70 font-mono">
                      <Clock className="w-3 h-3 text-pink-300/70" />
                      <span>
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Body Excerpt — 3-4 lines with relaxed breathing room */}
                    <p className="text-xs sm:text-sm text-pink-100/90 font-serif italic line-clamp-3 sm:line-clamp-4 leading-relaxed pt-1">
                      “{note.body}” <span className="font-sans not-italic text-pink-300">♡</span>
                    </p>
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + Read Button */}
                <div className="pt-3.5 sm:pt-4 border-t border-pink-400/20 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs">
                  {/* Contributor Avatar & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-[11px] text-pink-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-pink-200/90 truncate">
                      By: {isAddedByMe ? 'You' : note.authorName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & Read Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(note)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-pink-400/30 text-[11px] text-pink-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle reaction"
                    >
                      <span>{(note as any).reaction || 'Kept close 💖'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedNote(note)}
                      className="btn-glow-romantic text-[11px] py-1.5 px-4 shadow-sm"
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

      {/* 3. Bottom Action & Filter Section — Matching Mockup Format */}
      <section className="flex flex-col lg:flex-row gap-5 sm:gap-6 pt-2 w-full">
        {/* Left Card: Write Letter Banner (~7 Cols) */}
        <div
          className="rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 justify-between border border-pink-400/30 shadow-xl"
          style={{
            flex: '1.35 1 0%',
            background: 'linear-gradient(135deg, rgba(34, 14, 40, 0.7) 0%, rgba(18, 7, 24, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
            <div
              className="rounded-2xl overflow-hidden border border-pink-400/30 shrink-0 shadow-lg group"
              style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
            >
              <img
                src="/assets/garden/card_letters.jpg"
                alt="Parchment Letters"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Write a Heartfelt Letter
              </h4>
              <p className="text-xs sm:text-sm text-pink-200/80 font-light leading-relaxed">
                Express thoughts that are easier said in ink than aloud.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartCompose}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write Letter →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters (~5 Cols) */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 border border-pink-400/30 shadow-xl"
          style={{
            flex: '1 1 0%',
            background: 'linear-gradient(135deg, rgba(28, 12, 36, 0.7) 0%, rgba(16, 6, 22, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-pink-300/80 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-pink-300" />
              <span>Quick Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('all');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-pink-500/30 border border-pink-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                💌 All Letters
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('shared');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'shared'
                    ? 'bg-emerald-500/30 border border-emerald-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✨ Shared
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('private');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'private'
                    ? 'bg-purple-500/30 border border-purple-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-pink-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🔒 Private
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-pink-400/15 flex items-center justify-between text-xs text-pink-300/80">
            <span className="font-serif italic text-pink-200/90 text-sm">
              Words written from the heart never fade ♡
            </span>
            <span className="text-base">🌸</span>
          </div>
        </div>
      </section>

      {/* 4. Reading Modal — Spacious Keepsake Parchment Presentation */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="glass-midnight-card max-w-2xl sm:max-w-3xl lg:max-w-4xl w-full p-6 sm:p-10 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-pink-300/90 uppercase tracking-wider">
                <PenLine className="w-4 h-4 text-pink-300" />
                <span>Letter Parchment Keepsake</span>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title, Badge & Date */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {selectedNote.title || 'Untitled Letter'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border shadow-sm ${
                    selectedNote.isShared
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                      : 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                  }`}
                >
                  {selectedNote.isShared ? <Globe2 className="w-3.5 h-3.5 text-emerald-300" /> : <Lock className="w-3.5 h-3.5 text-purple-300" />}
                  <span>{selectedNote.isShared ? 'Shared in Garden' : 'Private Secret Draft'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-pink-300/80">
                <Clock className="w-3.5 h-3.5 text-pink-300/70" />
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

              {/* Letter Parchment Scroll Box with generous breathing room */}
              <div
                className="p-6 sm:p-10 rounded-3xl border border-pink-300/25 max-h-[62vh] overflow-y-auto space-y-4 shadow-inner"
                style={{
                  background: 'linear-gradient(145deg, rgba(32, 16, 42, 0.8) 0%, rgba(18, 9, 26, 0.95) 100%)',
                }}
              >
                <p className="font-serif text-base sm:text-lg lg:text-xl text-pink-100/95 leading-relaxed sm:leading-loose whitespace-pre-wrap tracking-wide">
                  {selectedNote.body}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-pink-400/20 flex flex-wrap items-center justify-between gap-3">
              {selectedNote.authorId === currentUser.id ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="px-4 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Letter</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedNote)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5"
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
                onClick={() => setSelectedNote(null)}
                className="btn-glow-romantic text-xs sm:text-sm py-2.5 px-6"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsComposing(false)}
        >
          <div
            className="glass-midnight-card max-w-2xl sm:max-w-3xl w-full p-6 sm:p-10 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-pink-400/20">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-pink-500/20 border border-pink-400/40 text-pink-300 shadow-sm">
                  <PenLine className="w-5 h-5 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {editingId ? 'Edit Letter' : 'Pen a Letter in the Garden'}
                  </h4>
                  <p className="text-xs text-pink-200/75 font-mono uppercase tracking-wider">
                    {isShared ? `Shared with ${partner.displayName}` : 'Kept strictly private to you'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all"
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
              className="space-y-6"
            >
              <div>
                <label className="form-field-label block mb-2 text-xs sm:text-sm font-mono uppercase tracking-wider text-pink-200">
                  <span>Letter Title (Optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A small note for when you wake up..."
                  className="w-full rounded-2xl bg-white/[0.04] border border-pink-300/25 p-4 sm:p-4.5 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 font-serif text-base sm:text-lg"
                />
              </div>

              <div>
                <label className="form-field-label block mb-2 text-xs sm:text-sm font-mono uppercase tracking-wider text-pink-200">
                  <span>Letter Contents *</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write whatever is in your heart... thoughts, memories, little notes, or feelings you cherish."
                  className="w-full rounded-2xl bg-white/[0.04] border border-pink-300/25 p-5 sm:p-6 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 font-serif text-base sm:text-lg leading-relaxed"
                />
              </div>

              {/* Privacy Toggle & Checkbox with generous breathing room */}
              <div className="pt-2">
                <DecoratedPrivacyToggle
                  isShared={isShared}
                  onToggle={setIsShared}
                  partnerName={partner.displayName}
                />
              </div>

              {errorMsg && (
                <p className="text-xs sm:text-sm text-rose-300 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-5 border-t border-pink-400/20">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto btn-glow-romantic py-3 px-8 text-xs sm:text-sm font-semibold justify-center shadow-lg shadow-pink-500/20"
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
