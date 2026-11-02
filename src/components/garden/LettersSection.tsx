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
    setIsShared(false); // Default private!
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
      setErrorMsg('Please write a message before saving.');
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
      // Prompt user explicitly before sharing
      setConfirmShareModal(true);
    } else {
      setIsShared(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <PenLine className="w-3.5 h-3.5" />
            <span>Letters in the Garden</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Thoughts, Letters & Quiet Notes
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Private by default. Only letters you deliberately share will be visible to {partner.displayName}.
          </p>
        </div>

        {!isComposing && (
          <button
            onClick={handleStartCompose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write New Letter</span>
          </button>
        )}
      </div>

      {/* Composing / Editing Card */}
      {isComposing && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {editingId ? 'Editing Letter' : 'Compose a Letter'}
            </span>
            <button
              onClick={() => setIsComposing(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A thought from tonight..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              Letter Body *
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your thoughts freely here..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm leading-relaxed focus:outline-none focus:border-pink-400/50 resize-y"
            />
          </div>

          {/* Privacy Toggle: Deliberate Action */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl ${
                  isShared
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}
              >
                {isShared ? <Globe2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {isShared ? 'Visibility: Shared Letter' : 'Visibility: Private to You'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isShared
                    ? `This letter will be readable by ${partner.displayName}.`
                    : 'Only you can see this entry. Nobody else has access.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSharePrompt}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isShared
                  ? 'bg-white/10 border-white/20 text-slate-300 hover:text-white'
                  : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30'
              }`}
            >
              {isShared ? 'Make Private' : `Share with ${partner.displayName}`}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-400 text-xs p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md shadow-pink-500/30 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? 'Update Letter' : 'Save Letter'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Share */}
      {confirmShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm w-full bg-slate-900 border border-emerald-400/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Send className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-lg font-bold text-white">
              Share with {partner.displayName}?
            </h4>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Once shared, {partner.displayName} will be able to read this letter in their Letters tab. You can turn it back to private anytime.
            </p>
            <div className="flex gap-2 justify-center pt-2">
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
                className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md"
              >
                Yes, Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Letters List / Empty State */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Retrieving letters...
        </div>
      ) : notes.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <PenLine className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">Your Garden Parchment is Empty</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Write your first letter or private thought. It starts completely private to you until you decide otherwise.
          </p>
          <button
            onClick={handleStartCompose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Start Writing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="group relative p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-pink-400/30 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                        note.isShared
                          ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                      }`}
                    >
                      {note.isShared ? (
                        <>
                          <Globe2 className="w-2.5 h-2.5" /> Shared Letter
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" /> Private Draft
                        </>
                      )}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-white line-clamp-1 mb-1">
                    {note.title || 'Untitled Letter'}
                  </h4>

                  <p className="text-xs text-slate-300/80 line-clamp-3 font-light leading-relaxed">
                    {note.body}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>From: {isAuthor ? 'You' : note.authorName || partner.displayName}</span>

                  {isAuthor && (
                    <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className="p-1 hover:text-pink-300 transition-colors"
                        title="Edit Letter"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note);
                        }}
                        className="p-1 hover:text-rose-400 transition-colors"
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
        </div>
      )}

      {/* Reader Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="max-w-lg w-full bg-slate-900 border border-pink-400/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative animate-scale-up"
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
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                  selectedNote.isShared
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
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

            <h3 className="font-serif text-2xl font-bold text-white">
              {selectedNote.title || 'Untitled Letter'}
            </h3>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 max-h-72 overflow-y-auto">
              <p className="text-sm text-slate-200 leading-relaxed font-light whitespace-pre-line">
                {selectedNote.body}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
              <span>
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
