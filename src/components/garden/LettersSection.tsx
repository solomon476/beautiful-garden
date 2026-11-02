import React, { useState, useEffect } from 'react';
import {
  PenLine,
  Lock,
  Globe2,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Clock,
  Send,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { notesService, authService } from '../../services/gardenService';
import type { NoteEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

export const LettersSection: React.FC = () => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form State
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(false); // ALWAYS false by default
  const [confirmShareModal, setConfirmShareModal] = useState<boolean>(false);
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
    setIsShared(false); // Default private
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
      setErrorMsg(err?.message || 'Failed to save note');
    }
  };

  const handleDelete = async (note: NoteEntry) => {
    if (note.authorId !== currentUser.id) return;
    if (window.confirm('Are you sure you want to delete this letter? This cannot be undone.')) {
      try {
        await notesService.deleteNote(note.id);
        if (selectedNote?.id === note.id) setSelectedNote(null);
        await loadNotes();
      } catch (err: any) {
        alert(err?.message || 'Could not delete note');
      }
    }
  };

  const handleToggleSharePrompt = () => {
    if (!isShared) {
      setConfirmShareModal(true);
    } else {
      setIsShared(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-pink-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[10px] font-mono uppercase tracking-widest">
            <PenLine className="w-3 h-3 text-pink-300" />
            <span>Letters in the Garden</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Thoughts, Letters & Keepsakes
          </h3>
          <p className="text-xs sm:text-sm text-pink-200/80 font-light leading-relaxed max-w-xl">
            A quiet desk for thoughts, letters, and feelings you wish to keep in bloom.
          </p>
        </div>

        {!isComposing && (
          <button
            onClick={handleStartCompose}
            className="btn-glow-romantic shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Write New Letter</span>
          </button>
        )}
      </div>

      {/* Composing / Editing Card */}
      {isComposing && (
        <div className="glass-parchment-card max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] space-y-6 sm:space-y-7 animate-fade-in relative overflow-hidden border border-pink-400/35 shadow-2xl">
          {/* Subtle stamp accent */}
          <div className="absolute top-5 right-5 w-11 h-14 rounded-xl border border-dashed border-pink-400/40 flex flex-col items-center justify-center text-[8px] text-pink-300 font-mono opacity-80 pointer-events-none bg-pink-500/10">
            <Heart className="w-3.5 h-3.5 text-rose-400 mb-1 animate-pulse" />
            <span>SEAL</span>
          </div>

          <div className="flex items-center justify-between pr-14 pb-3 border-b border-pink-400/20">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300">
                <PenLine className="w-4 h-4 text-pink-300" />
              </span>
              <div>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                  {editingId ? 'Editing Keepsake Letter' : 'Compose in Your Journal'}
                </h4>
                <p className="text-[11px] text-pink-200/70 font-mono uppercase tracking-wider">
                  Private desk with deliberate sharing
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

          <div className="space-y-5 sm:space-y-6">
            <div>
              <label className="form-field-label">
                <span>Letter Title (Optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A quiet thought from this evening..."
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Letter Thoughts & Words *</span>
              </label>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write freely... This letter starts completely private to you until you choose to bloom it."
              />
            </div>

            {/* Decorated Privacy Switch */}
            <DecoratedPrivacyToggle
              isShared={isShared}
              onToggle={handleToggleSharePrompt}
              partnerName={partner.displayName}
              sharedTitle={`Share Letter with ${partner.displayName}`}
              sharedSubtitle={`Visible in ${partner.displayName}'s letter feed with a loving sealed washi tape ✨`}
              privateTitle="Keep Letter Private to You (Draft)"
              privateSubtitle="Strictly locked to your profile. Invisible to anyone else until you decide to share 🔐"
            />

            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-300 text-xs p-3 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pink-400/20">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-glow-romantic"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Update Letter' : 'Save to Garden ✨'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Share */}
      {confirmShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full glass-midnight-card border border-emerald-400/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white">
              Share with {partner.displayName}?
            </h4>
            <p className="text-xs text-slate-300/90 font-light leading-relaxed">
              Once confirmed, this letter will be visible to {partner.displayName} in their garden letters tab. You can make it private again at any time.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setConfirmShareModal(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Keep Private
              </button>
              <button
                onClick={() => {
                  setIsShared(true);
                  setConfirmShareModal(false);
                }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-md"
              >
                Yes, Share 💌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Letters Grid */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Opening parchment letters...
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-parchment-card p-10 rounded-2xl text-center space-y-3.5 border border-pink-400/25">
          <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <PenLine className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-xl text-white">The Letter Parchment is Quiet</h4>
          <p className="text-xs sm:text-sm text-pink-200/80 max-w-md mx-auto font-light leading-relaxed">
            Write your first letter or private thought. Every letter begins completely private to you until you explicitly choose to share.
          </p>
          <button
            onClick={handleStartCompose}
            className="btn-glow-romantic text-xs mx-auto"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Start Writing</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {notes.map((note) => {
            const isAuthor = note.authorId === currentUser.id;
            const dateStr = new Date(note.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="glass-parchment-card group p-5 sm:p-6 rounded-2xl hover:border-pink-300/50 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:-translate-y-1 relative overflow-hidden min-h-[220px]"
              >
                {/* Washi Tape Accent */}
                <div className="washi-tape" />

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${
                        note.isShared
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                          : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      }`}
                    >
                      {note.isShared ? (
                        <>
                          <Globe2 className="w-3 h-3 text-emerald-300" /> Shared 💌
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-300" /> Private 🔒
                        </>
                      )}
                    </span>

                    <span className="text-[11px] text-pink-200/70 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pink-400/70" />
                      {dateStr}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug group-hover:text-pink-200 transition-colors line-clamp-1">
                    {note.title || 'Untitled Letter'}
                  </h4>

                  <p className="text-xs sm:text-sm text-purple-100/80 line-clamp-3 font-light leading-relaxed">
                    {note.body}
                  </p>
                </div>

                <div className="pt-3 border-t border-pink-400/15 flex items-center justify-between text-xs">
                  <span className="font-handwriting text-xl text-pink-200/90 font-medium truncate">
                    From: {isAuthor ? 'You 🌷' : (note.authorName || partner.displayName) + ' ✨'}
                  </span>

                  {isAuthor && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/20 text-pink-200 hover:text-white transition-all shadow-sm"
                        title="Edit Letter"
                        aria-label={`Edit ${note.title || 'letter'}`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note);
                        }}
                        className="p-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 transition-all shadow-sm"
                        title="Delete Letter"
                        aria-label={`Delete ${note.title || 'letter'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation / Inspiration Card */}
          {notes.length < 4 && (
            <div
              onClick={handleStartCompose}
              className="group p-5 sm:p-6 rounded-2xl border border-dashed border-pink-400/25 hover:border-pink-300/50 bg-gradient-to-br from-pink-500/[0.04] to-transparent hover:bg-pink-500/[0.08] flex flex-col justify-center items-center text-center space-y-3 cursor-pointer transition-all duration-300 min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-white group-hover:text-pink-200 transition-colors">
                  Write a Keepsake Note
                </h4>
                <p className="text-xs text-pink-200/70 max-w-xs mx-auto leading-relaxed font-light">
                  Leave a sweet note or loving thought for {partner.displayName}...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-pink-200 border border-pink-300/20 group-hover:border-pink-300/40 group-hover:bg-pink-500/20 transition-all">
                <PenLine className="w-3.5 h-3.5" /> Start Writing
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reader Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="max-w-lg w-full glass-parchment-card border border-pink-400/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                  selectedNote.isShared
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                }`}
              >
                {selectedNote.isShared ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {selectedNote.isShared ? 'Shared Letter' : 'Private Draft'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(selectedNote.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {selectedNote.title || 'Untitled Letter'}
            </h3>

            <div className="p-5 rounded-2xl bg-black/30 border border-purple-400/20 max-h-72 overflow-y-auto shadow-inner">
              <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-light whitespace-pre-line">
                {selectedNote.body}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span className="font-handwriting text-lg text-pink-300">
                Author: {selectedNote.authorId === currentUser.id ? 'You' : selectedNote.authorName || partner.displayName}
              </span>

              {selectedNote.authorId === currentUser.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
