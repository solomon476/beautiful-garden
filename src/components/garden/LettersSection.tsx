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
    <div className="space-y-8 sm:space-y-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-pink-400/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/40 text-pink-200 text-xs font-mono uppercase tracking-widest shadow-sm">
            <PenLine className="w-3.5 h-3.5 text-pink-300" />
            <span>Letters in the Garden</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient-garden">
            Thoughts, Letters & Keepsakes
          </h3>
          <p className="font-handwriting text-2xl text-pink-200/90 leading-relaxed max-w-xl">
            A quiet desk for thoughts, letters, and feelings you wish to keep in bloom.
          </p>
        </div>

        {!isComposing && (
          <button
            onClick={handleStartCompose}
            className="btn-glow-romantic self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Write New Letter</span>
          </button>
        )}
      </div>

      {/* Composing / Editing Card */}
      {isComposing && (
        <div className="glass-parchment-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          {/* Subtle stamp accent */}
          <div className="absolute top-4 right-4 w-11 h-13 rounded border border-dashed border-pink-400/40 flex flex-col items-center justify-center text-[9px] text-pink-300 font-mono opacity-80 pointer-events-none">
            <Heart className="w-3.5 h-3.5 text-rose-400 mb-0.5" />
            <span>SEAL</span>
          </div>

          <div className="flex items-center justify-between pr-14">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {editingId ? 'Editing Keepsake Letter' : 'Compose in Your Journal'}
            </span>
            <button
              onClick={() => setIsComposing(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A thought from this afternoon..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-pink-400/20 text-white text-sm focus:outline-none focus:border-pink-400 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-pink-200/70 uppercase tracking-wider mb-1">
              Letter Body *
            </label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write freely... This letter starts completely private to you."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-pink-400/20 text-white text-sm leading-relaxed focus:outline-none focus:border-pink-400 shadow-inner resize-y font-light"
            />
          </div>

          {/* Privacy Toggle: Deliberate Action */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}
              >
                {isShared ? <Globe2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {isShared ? 'Visibility: Shared with ' + partner.displayName : 'Visibility: Private to You (Default)'}
                </p>
                <p className="text-[11px] text-slate-300/80">
                  {isShared
                    ? `Readable by ${partner.displayName} in their Letters feed.`
                    : 'Strictly locked to your profile. No one else can view this.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSharePrompt}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                isShared
                  ? 'bg-white/10 border-white/20 text-slate-200 hover:text-white'
                  : 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400/40 text-emerald-200 hover:scale-105 shadow-sm'
              }`}
            >
              {isShared ? 'Change to Private' : `Share with ${partner.displayName} 💌`}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-300 text-xs p-3 rounded-xl bg-rose-500/15 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 border border-white/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'Update Letter' : 'Save to Garden'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Share */}
      {confirmShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full glass-midnight-card border border-emerald-400/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/15">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-xl font-bold text-white">
              Share with {partner.displayName}?
            </h4>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Once confirmed, this letter will be visible to {partner.displayName} in their garden letters tab. You can make it private again at any time.
            </p>
            <div className="flex gap-2.5 justify-center pt-2">
              <button
                onClick={() => setConfirmShareModal(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Keep Private
              </button>
              <button
                onClick={() => {
                  setIsShared(true);
                  setConfirmShareModal(false);
                }}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20"
              >
                Yes, Share 💌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Letters List / Empty State */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Opening parchment letters...
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
            <PenLine className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl text-white">The Letter Parchment is Quiet</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Write your first letter or private thought. Every letter begins completely private to you until you explicitly choose to share.
          </p>
          <button
            onClick={handleStartCompose}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-200 text-xs font-medium border border-pink-400/30 transition-all hover:scale-105"
          >
            Start Writing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
                className="glass-parchment-card group p-7 sm:p-8 rounded-[2rem] hover:border-pink-300/60 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-xl hover:-translate-y-1 relative overflow-hidden min-h-[260px]"
              >
                {/* Cute Washi Tape Accent */}
                <div className="washi-tape" />

                {/* Subtle decorative wax watermark */}
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-pink-500/10 blur-xl pointer-events-none group-hover:bg-pink-500/25 transition-all duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-4 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase border shadow-sm ${
                        note.isShared
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                          : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      }`}
                    >
                      {note.isShared ? (
                        <>
                          <Globe2 className="w-3.5 h-3.5 text-emerald-300" /> Shared Letter 💌
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-300" /> Private Draft 🔒
                        </>
                      )}
                    </span>

                    <span className="text-xs text-pink-200/70 font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400/70" />
                      {dateStr}
                    </span>
                  </div>

                  <h4 className="font-serif text-2xl font-bold text-white mb-2 leading-snug group-hover:text-pink-200 transition-colors line-clamp-1">
                    {note.title || 'Untitled Letter'}
                  </h4>

                  <p className="text-sm sm:text-base text-slate-200/90 line-clamp-3 font-light leading-relaxed min-h-[4rem]">
                    {note.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-pink-400/20 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-handwriting text-2xl text-pink-300 font-medium flex items-center gap-1">
                    From: {isAuthor ? 'You 🌷' : (note.authorName || partner.displayName) + ' ✨'}
                  </span>

                  {isAuthor && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-pink-200 hover:text-white flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                        title="Edit Letter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note);
                        }}
                        className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-rose-100 flex items-center justify-center transition-all hover:scale-110 shadow-sm"
                        title="Delete Letter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation / Inspiration Card when fewer notes exist */}
          {notes.length < 3 && (
            <div
              onClick={handleStartCompose}
              className="group p-7 sm:p-8 rounded-[2rem] border-2 border-dashed border-pink-400/30 hover:border-pink-300/60 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-transparent flex flex-col justify-center items-center text-center space-y-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-pink-500/10 min-h-[260px] shadow-sm relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-400/20 border border-pink-400/40 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform shadow-inner">
                <Sparkles className="w-6 h-6 text-pink-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                  Write a Keepsake Note
                </h4>
                <p className="font-handwriting text-xl text-pink-200/80 max-w-xs mx-auto leading-snug">
                  Leave a sweet note, an inside joke, or a loving thought for {partner.displayName}...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-pink-200 border border-pink-300/30 group-hover:bg-pink-500/30 transition-all">
                <PenLine className="w-3.5 h-3.5" /> Start Writing 🌸
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
