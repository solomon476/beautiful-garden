import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Heart,
  Camera,
  Mic,
  Sparkles,
  ArrowRight,
  CheckCheck,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { chatService, type ChatMessage } from '../../services/chatService';
import { authService } from '../../services/gardenService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import confetti from 'canvas-confetti';

interface WhispersChatSectionProps {
  onSelectTab: (tab: any) => void;
}

export const WhispersChatSection: React.FC<WhispersChatSectionProps> = ({ onSelectTab }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const partner = authService.getPartner();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const refreshMessages = () => {
    const list = chatService.getMessages();
    setMessages(list);
  };

  useEffect(() => {
    refreshMessages();
    chatService.markAllRead(currentUser.id);

    const unsubUser = authService.subscribeUser((u) => {
      setCurrentUser(u);
      refreshMessages();
    });

    const unsubChat = chatService.subscribe(() => {
      refreshMessages();
      chatService.markAllRead(currentUser.id);
    });

    const cleanupRealtime = chatService.initRealtime();

    const handleUpdate = () => {
      refreshMessages();
      chatService.markAllRead(currentUser.id);
    };

    window.addEventListener('garden-chat-updated', handleUpdate);

    return () => {
      unsubUser();
      unsubChat();
      cleanupRealtime();
      window.removeEventListener('garden-chat-updated', handleUpdate);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [currentUser.id]);

  useEffect(() => {
    // Scroll to bottom smoothly on load or new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isRecordingVoice, previewPhotoUrl]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!textInput.trim() && !previewPhotoUrl) || isSending) return;

    try {
      setIsSending(true);
      soundEngine.playSparkle();

      if (previewPhotoUrl) {
        await chatService.sendMessage({
          content: textInput.trim() || '📸 Shared a photo moment ♡',
          senderId: currentUser.id,
          senderName: currentUser.displayName,
          recipientId: partner.id,
          type: 'photo',
          photoUrl: previewPhotoUrl,
        });
        setPreviewPhotoUrl(null);
      } else {
        await chatService.sendMessage({
          content: textInput.trim(),
          senderId: currentUser.id,
          senderName: currentUser.displayName,
          recipientId: partner.id,
          type: 'text',
        });
      }

      setTextInput('');
    } catch (err) {
      console.error('Failed to send whisper:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVoiceRecorded = async (dataUrl: string, duration: number) => {
    soundEngine.playSparkle();
    setIsRecordingVoice(false);
    try {
      await chatService.sendMessage({
        content: `🎙️ Spoken whisper (${Math.round(duration)}s) ♡`,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        recipientId: partner.id,
        type: 'voice',
        voiceNoteUrl: dataUrl,
        voiceDuration: duration,
      });
    } catch (err) {
      console.error('Voice send failed', err);
    }
  };

  const handlePlayVoice = (id: string, url: string) => {
    if (playingVoiceId === id) {
      audioPlayerRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setPlayingVoiceId(id);

    audio.onended = () => {
      setPlayingVoiceId(null);
    };

    audio.onerror = () => {
      setPlayingVoiceId(null);
    };

    audio.play().catch(() => {
      setPlayingVoiceId(null);
    });
  };

  const handleReaction = (msgId: string, emoji: string = '❤️') => {
    soundEngine.playSparkle();
    chatService.toggleReaction(msgId, currentUser.id, emoji);

    try {
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#ec4899', '#f43f5e', '#fda4af'],
        scalar: 1.1,
      });
    } catch {
      // ignore
    }
  };

  const formatMessageTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[650px] max-w-3xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#170a2c]/95 via-[#1d0b36]/90 to-[#100420]/95 border border-pink-400/30 shadow-2xl backdrop-blur-2xl">
      {/* 1. Chat Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-white/[0.04] backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={partner.avatarUrl || '/assets/memories/photo-noella-avatar.jpg'}
              alt={partner.displayName}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-pink-400/60 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#170a2c]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif font-bold text-sm sm:text-base text-white truncate">
                Our Whispers
              </h2>
              <span className="text-pink-300 text-xs">♡</span>
            </div>
            <p className="text-[11px] text-pink-200/80 font-mono truncate">
              {partner.displayName} • Connected in Sanctuary
            </p>
          </div>
        </div>

        {/* Quick Send Sparkle / Petal Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            try {
              confetti({
                particleCount: 25,
                spread: 70,
                origin: { y: 0.2 },
                colors: ['#f472b6', '#ec4899', '#fda4af', '#fbcfe8'],
              });
            } catch {
              // ignore
            }
            chatService.postEventMessage({
              eventType: 'petal',
              title: 'Thinking of You',
              content: `🌸 ${currentUser.displayName} tapped the Petal in Whispers! "Thinking of you" ♡`,
              actorId: currentUser.id,
              actorName: currentUser.displayName,
              linkTab: 'garden',
            });
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 hover:text-white text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          title="Send a quick blossom whisper"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
          <span className="hidden sm:inline">Send Petal</span>
          <span>🌸</span>
        </button>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isSystem = msg.senderId === 'system';

          // A. System / Automatic Garden Event Message
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                <div className="whisper-event-card flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-pink-200 font-serif italic">
                    <span>{msg.content}</span>
                  </div>
                  <div className="flex items-center justify-between w-full pt-1.5 border-t border-white/10 text-[10px] font-mono text-purple-200/80">
                    <span className="font-semibold text-pink-300">{msg.eventData?.title || 'Garden Event'}</span>
                    {msg.eventData?.linkTab && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playSparkle();
                          onSelectTab(msg.eventData!.linkTab);
                        }}
                        className="text-pink-300 hover:text-white flex items-center gap-1 font-semibold underline cursor-pointer"
                      >
                        <span>View in Garden</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <span>{formatMessageTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // B. User Whispers (Solomon / Noella)
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 animate-fade-in ${
                isMe ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Partner Avatar for incoming messages */}
              {!isMe && (
                <img
                  src={partner.avatarUrl || '/assets/memories/photo-noella-avatar.jpg'}
                  alt={partner.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-purple-300/40 shrink-0 mb-1"
                />
              )}

              {/* Message Bubble Container */}
              <div className="max-w-[80%] sm:max-w-[70%] group relative">
                <div
                  onDoubleClick={() => handleReaction(msg.id, '❤️')}
                  className={`relative p-3 rounded-2xl transition-all shadow-md ${
                    isMe ? 'whisper-bubble-me' : 'whisper-bubble-partner'
                  }`}
                >
                  {/* Photo Attachment if present */}
                  {msg.photoUrl && (
                    <div
                      onClick={() => setLightboxPhoto(msg.photoUrl!)}
                      className="mb-2 rounded-xl overflow-hidden border border-white/20 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                    >
                      <img
                        src={msg.photoUrl}
                        alt="Shared Photo"
                        className="w-full max-h-60 object-cover"
                      />
                    </div>
                  )}

                  {/* Voice Note Player if present */}
                  {msg.voiceNoteUrl && (
                    <div className="flex items-center gap-2.5 my-1 p-2 rounded-xl bg-black/20 border border-white/10">
                      <button
                        type="button"
                        onClick={() => handlePlayVoice(msg.id, msg.voiceNoteUrl!)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 transition-transform active:scale-90"
                      >
                        {playingVoiceId === msg.id ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-pink-300 rounded-full ${
                              playingVoiceId === msg.id ? 'w-full animate-pulse' : 'w-1/3'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono opacity-80 mt-1 block">
                          Voice Whisper • {Math.round(msg.voiceDuration || 0)}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.content && msg.type !== 'voice' && (
                    <p className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}

                  {/* Bubble Timestamp & Status */}
                  <div
                    className={`flex items-center gap-1.5 mt-1 text-[10px] font-mono ${
                      isMe ? 'text-pink-100/80 justify-end' : 'text-purple-200/70 justify-start'
                    }`}
                  >
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isMe && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.isRead ? 'text-sky-300' : 'text-white/60'
                        }`}
                      />
                    )}
                  </div>

                  {/* Floating Heart Reactions Badge */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div
                      className={`absolute -bottom-2.5 ${
                        isMe ? '-left-2' : '-right-2'
                      } flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#1b0a33] border border-pink-400/40 text-xs shadow-md animate-scale-in`}
                    >
                      {Object.values(msg.reactions).map((emoji, idx) => (
                        <span key={idx}>{emoji}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtle Hover Reaction Trigger */}
                <button
                  type="button"
                  onClick={() => handleReaction(msg.id, '❤️')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2.5 right-0 p-1 rounded-full bg-black/60 hover:bg-pink-500/80 text-pink-300 hover:text-white border border-pink-400/30 shadow-md text-xs cursor-pointer active:scale-95"
                  title="Send Heart reaction"
                >
                  <Heart className="w-3 h-3 fill-pink-400" />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Photo Attachment Preview (Before sending) */}
      {previewPhotoUrl && (
        <div className="p-3 bg-black/50 border-t border-pink-400/30 flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/30 shrink-0">
            <img src={previewPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-pink-200 font-serif italic truncate flex-1">
            Photo selected • Ready to whisper 📸
          </p>
        </div>
      )}

      {/* 4. Voice Recording Panel if active */}
      {isRecordingVoice && (
        <div className="p-3 bg-black/60 border-t border-pink-400/30">
          <VoiceNoteRecorder
            onRecorded={handleVoiceRecorded}
            onCancel={() => setIsRecordingVoice(false)}
          />
        </div>
      )}

      {/* 5. Sticky Bottom Chat Input Bar */}
      {!isRecordingVoice && (
        <div className="p-3 sm:p-4 bg-white/[0.03] border-t border-white/10 backdrop-blur-xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-full bg-white/[0.08] hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-400/30 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Attach photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Voice Record Button */}
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2 sm:p-2.5 rounded-full bg-white/[0.08] hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-400/30 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Record voice whisper"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Text Input Pill */}
            <div className="flex-1 flex items-center bg-white/[0.08] border border-pink-400/35 rounded-2xl px-3.5 py-1.5 focus-within:border-pink-400/80 focus-within:ring-2 focus-within:ring-pink-400/30 transition-all shadow-inner">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Whisper to ${partner.displayName}... ♡`}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-pink-200/50 focus:outline-none"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!textInput.trim() && !previewPhotoUrl) || isSending}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 text-white shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
              title="Send whisper"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Lightbox for full size photo viewing */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <img
            src={lightboxPhoto}
            alt="Full Preview"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
          />
          <button
            type="button"
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
