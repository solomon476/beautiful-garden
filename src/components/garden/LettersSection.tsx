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
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup Format */}
      <section
        className="relative rounded-3xl overflow-hidden border border-pink-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
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
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-pink-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/card_letters.jpg"
                alt="Letters in the Garden"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PenLine className="w-8 h-8 text-pink-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Letters in the Garden</span>
                <span className="text-pink-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Letters</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-pink-200/90 max-w-xl leading-relaxed">
                Quiet thoughts, long letters, and feelings you wish to keep in bloom.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-pink-300/70 pt-1">
                Write • Read • Cherish • Connect
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleStartCompose}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
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
                className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-pink-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(36, 14, 44, 0.65) 0%, rgba(18, 7, 24, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Left Square Artwork with Wax Seal Icon */}
                  <div
                    onClick={() => setSelectedNote(note)}
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer"
                    style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px', maxWidth: '112px', maxHeight: '112px' }}
                    title="Click to read full letter"
                  >
                    <img
                      src="/assets/garden/card_letters.jpg"
                      alt="Letter envelope"
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover/cover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-pink-500/80 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        <PenLine className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Privacy Badge, Date & Excerpt */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors truncate">
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

                    {/* Body Excerpt */}
                    <p className="text-xs text-pink-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                      “{note.body}” <span className="font-sans not-italic text-pink-300">♡</span>
                    </p>
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + Read Button */}
                <div className="pt-3 border-t border-pink-400/20 flex items-center justify-between gap-3 text-xs">
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
                      className="btn-glow-romantic text-[11px] py-1 px-3.5 shadow-sm"
                    >
                      <span>Read Letter</span>
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

      {/* 4. Reading Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-pink-300/80 uppercase tracking-wider">
                <PenLine className="w-4 h-4 text-pink-300" />
                <span>Letter Parchment</span>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-white">
                  {selectedNote.title || 'Untitled Letter'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                    selectedNote.isShared
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                      : 'bg-purple-500/25 border-purple-400/50 text-purple-200'
                  }`}
                >
                  {selectedNote.isShared ? <Globe2 className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-purple-300" />}
                  <span>{selectedNote.isShared ? 'Shared' : 'Private'}</span>
                </span>
              </div>

              <div className="text-xs font-mono text-pink-300/70">
                Penned on{' '}
                {new Date(selectedNote.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              {/* Letter Parchment Scroll Box */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-pink-300/20 max-h-[340px] overflow-y-auto space-y-3">
                <p className="font-serif text-sm sm:text-base text-pink-100/95 leading-relaxed whitespace-pre-wrap">
                  {selectedNote.body}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-pink-400/20 flex items-center justify-between gap-3">
              {selectedNote.authorId === currentUser.id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="px-3.5 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/30 text-pink-200 text-xs font-medium transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Letter</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedNote)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-mono text-pink-300/60">
                  Written with love by {selectedNote.authorName || partner.displayName}
                </span>
              )}

              <button
                onClick={() => setSelectedNote(null)}
                className="btn-glow-romantic text-xs py-2 px-5"
              >
                <span>Fold Letter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Compose / Edit Modal */}
      {isComposing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsComposing(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-pink-400/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                  <PenLine className="w-4 h-4 text-pink-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    {editingId ? 'Edit Letter' : 'Pen a Letter in the Garden'}
                  </h4>
                  <p className="text-[11px] text-pink-200/70 font-mono uppercase tracking-wider">
                    {isShared ? `Shared with ${partner.displayName}` : 'Kept strictly private to you'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
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
              className="space-y-5"
            >
              <div>
                <label className="form-field-label">
                  <span>Letter Title (Optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A small note for when you wake up..."
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Letter Contents *</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write whatever is in your heart..."
                  className="w-full rounded-2xl bg-white/[0.04] border border-pink-300/20 p-4 text-white placeholder-slate-400 focus:outline-none focus:border-pink-400 font-serif text-sm leading-relaxed"
                />
              </div>

              {/* Privacy Toggle */}
              <div className="pt-2">
                <DecoratedPrivacyToggle
                  isShared={isShared}
                  onToggle={setIsShared}
                  partnerName={partner.displayName}
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-400/20">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
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
