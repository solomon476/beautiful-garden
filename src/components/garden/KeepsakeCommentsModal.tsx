import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  Trash2,
  Music2,
  Camera,
} from 'lucide-react';
import { commentService, type GardenComment } from '../../services/commentService';
import { authService, DEFAULT_PROFILES } from '../../services/gardenService';
import { soundEngine } from '../../utils/audio';

interface KeepsakeCommentsModalProps {
  targetId: string;
  targetType: 'memory' | 'song';
  title: string;
  subtitle?: string;
  coverUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const KeepsakeCommentsModal: React.FC<KeepsakeCommentsModalProps> = ({
  targetId,
  targetType,
  title,
  subtitle,
  coverUrl,
  isOpen,
  onClose,
}) => {
  const [comments, setComments] = useState<GardenComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUser = authService.getCurrentUser();
  const partner = authService.getPartner();

  // Load comments and subscribe to real-time updates
  useEffect(() => {
    if (!isOpen || !targetId) return;

    const load = () => {
      setComments(commentService.getComments(targetId));
    };

    load();
    const unsub = commentService.subscribe(load);

    // Focus input after modal animation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 250);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [isOpen, targetId]);

  // Scroll to bottom when comments list updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await commentService.addComment(targetId, targetType, trimmed, title);
      setInputText('');
    } catch (err) {
      console.warn('[Comments] Error adding note:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      soundEngine.playSparkle();
    } catch (err) {
      console.warn('[Comments] Error deleting comment:', err);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const isMemory = targetType === 'memory';
  const partnerName = partner?.displayName || 'partner';

  const modalContent = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999, position: 'fixed', inset: 0 }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-scale-up"
        style={{
          zIndex: 1000000,
          background: 'linear-gradient(180deg, #180d2c 0%, #0d071a 100%)',
          height: '78vh',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative z-10 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {coverUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md">
                <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0 text-pink-300">
                {isMemory ? <Camera className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium text-pink-300/80 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  {isMemory ? 'Keepsake Notes ♡' : 'Track Notes 🎶'}
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/30">
                  {comments.length}
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white truncate max-w-[240px] sm:max-w-[320px]">
                {title || (isMemory ? 'Treasured Keepsake' : 'Soundtrack')}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-purple-200/70 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
            aria-label="Close notes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-purple-200/70">
              <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-400/30 flex items-center justify-center text-pink-300 shadow-inner">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-white font-medium">No notes yet ♡</h4>
                <p className="text-xs text-purple-200/60 max-w-xs mt-1">
                  Leave a sweet note for {partnerName} on this {isMemory ? 'moment' : 'song'}!
                </p>
              </div>

              {/* Quick inspiration prompts */}
              <div className="pt-2 flex flex-wrap gap-2 justify-center max-w-sm">
                {(isMemory
                  ? [
                      'You look beautiful here ✨',
                      'One of my favorite moments with you ♡',
                      'Remember this? 😂',
                    ]
                  : [
                      'This song reminds me of you 🎶',
                      'My favorite part is the chorus ♡',
                      'Add this to our playlist! ✨',
                    ]
                ).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-pink-500/20 text-purple-200 hover:text-white border border-white/10 hover:border-pink-400/40 transition-all cursor-pointer active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            comments.map((comment) => {
              const isMine = comment.authorId === currentUser.id;
              const isSolomon =
                comment.authorId === DEFAULT_PROFILES.solomon.id ||
                comment.authorName.toLowerCase().includes('solomon');

              const avatarUrl =
                comment.authorAvatar ||
                (isSolomon ? DEFAULT_PROFILES.solomon.avatarUrl : DEFAULT_PROFILES.noella.avatarUrl);

              const formattedTime = (() => {
                try {
                  const date = new Date(comment.createdAt);
                  const now = new Date();
                  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
                  if (diffMinutes < 1) return 'Just now';
                  if (diffMinutes < 60) return `${diffMinutes}m ago`;
                  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch {
                  return 'Recently';
                }
              })();

              return (
                <div
                  key={comment.id}
                  className={`flex items-start gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-pink-400/40 shadow-sm mt-0.5">
                      <img
                        src={avatarUrl}
                        alt={comment.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className={`max-w-[78%] group relative ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                      <span
                        className={`font-semibold ${
                          isSolomon ? 'text-indigo-300' : 'text-pink-300'
                        }`}
                      >
                        {comment.authorName}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">• {formattedTime}</span>

                      {/* Delete button (only for own comments) */}
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-white/40 p-0.5 rounded transition-all cursor-pointer ml-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md backdrop-blur-md border ${
                        isMine
                          ? isSolomon
                            ? 'bg-gradient-to-br from-indigo-900/80 to-purple-950/90 text-white border-indigo-400/40 rounded-tr-xs'
                            : 'bg-gradient-to-br from-pink-900/80 to-rose-950/90 text-white border-pink-400/40 rounded-tr-xs'
                          : isSolomon
                          ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900/90 text-slate-100 border-indigo-400/30 rounded-tl-xs'
                          : 'bg-gradient-to-br from-pink-950/80 to-purple-950/90 text-slate-100 border-pink-400/30 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{comment.text}</p>
                    </div>
                  </div>

                  {isMine && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-purple-400/40 shadow-sm mt-0.5">
                      <img
                        src={avatarUrl}
                        alt={comment.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="relative z-20 p-3 sm:p-4 pb-6 sm:pb-4 border-t border-white/10 bg-black/60 backdrop-blur-lg flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-pink-400/30 hidden sm:block">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Whisper a note to ${partnerName} ♡...`}
              className="w-full px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] border border-white/15 focus:border-pink-400 text-white placeholder-purple-200/50 text-xs sm:text-sm outline-none transition-all pr-10 shadow-inner"
              maxLength={400}
            />
            {inputText.trim().length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-purple-300/50 font-mono">
                {400 - inputText.trim().length}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 disabled:hover:from-pink-500 disabled:hover:to-purple-600 text-white flex items-center justify-center transition-all shadow-lg shadow-pink-500/30 active:scale-95 cursor-pointer shrink-0"
            aria-label="Send note"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
