import React, { useState, useRef } from 'react';
import {
  Camera,
  CalendarDays,
  Music,
  BookOpen,
  Mail,
  X,
  UploadCloud,
  Mic,
  FileText,
  Check,
  Clock,
  FileAudio,
  Flower2,
  Lock,
  Users,
} from 'lucide-react';
import {
  memoryArchiveService,
  hangoutService,
  soundGardenService,
  shelfService,
  notesService,
  authService,
} from '../../services/gardenService';
import type { ShelfCategory, SongStatus } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { mediaStorage } from '../../utils/mediaStorage';
import { compressImage } from '../../utils/imageCompressor';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

export type QuickAddType = 'photo' | 'date' | 'song' | 'book' | 'letter';

interface QuickAddStudioModalProps {
  isOpen: boolean;
  initialType?: QuickAddType;
  onClose: () => void;
  onSuccess?: (type: QuickAddType) => void;
}

export const QuickAddStudioModal: React.FC<QuickAddStudioModalProps> = ({
  isOpen,
  initialType = 'photo',
  onClose,
  onSuccess,
}) => {
  const [activeType, setActiveType] = useState<QuickAddType>(initialType);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync activeType when opening or initialType changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      setErrorMsg(null);
      setIsSuccess(false);
    }
  }, [isOpen, initialType]);

  // User state
  const currentUser = authService.getCurrentUser();
  const partner = authService.getPartner();

  // 1. Photo state
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoDate, setPhotoDate] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoVoiceNote, setPhotoVoiceNote] = useState<string | undefined>(undefined);
  const [photoShared, setPhotoShared] = useState(true);
  const [showPhotoRecorder, setShowPhotoRecorder] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Date state
  const [dateTitle, setDateTitle] = useState('');
  const [dateProposed, setDateProposed] = useState('');
  const [dateLocation, setDateLocation] = useState('');
  const [dateDescription, setDateDescription] = useState('');
  const [dateReminder, setDateReminder] = useState(true);

  // 3. Song / Voice Note state
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songMusicUrl, setSongMusicUrl] = useState('');
  const [songMessage, setSongMessage] = useState('');
  const [songAudioUrl, setSongAudioUrl] = useState<string | undefined>(undefined);
  const [songAudioName, setSongAudioName] = useState<string | undefined>(undefined);
  const [isVoiceNote, setIsVoiceNote] = useState(false);
  const [showSongRecorder, setShowSongRecorder] = useState(false);
  const songInputRef = useRef<HTMLInputElement | null>(null);

  // 4. Book / PDF state
  const [bookTitle, setBookTitle] = useState('');
  const [bookCategory, setBookCategory] = useState<ShelfCategory>('books');
  const [bookDesc, setBookDesc] = useState('');
  const [bookLink, setBookLink] = useState('');
  const [bookPdfUrl, setBookPdfUrl] = useState<string | undefined>(undefined);
  const [bookPdfName, setBookPdfName] = useState<string | undefined>(undefined);
  const [bookPdfSize, setBookPdfSize] = useState<number | undefined>(undefined);
  const [bookPhotoUrl, setBookPhotoUrl] = useState<string | undefined>(undefined);
  const bookPdfInputRef = useRef<HTMLInputElement | null>(null);
  const bookPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // 5. Letter state
  const [letterTitle, setLetterTitle] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [letterShared, setLetterShared] = useState(true);

  if (!isOpen) return null;

  const resetAll = () => {
    setErrorMsg(null);
    setIsSuccess(false);
  };

  const handleTypeSwitch = (type: QuickAddType) => {
    soundEngine.playSparkle();
    setActiveType(type);
    setErrorMsg(null);
    setIsSuccess(false);
  };

  // --- Handlers for Photo ---
  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      soundEngine.playSparkle();
      const compressed = await compressImage(file, 1280, 1280, 0.82);
      setPhotoDataUrl(compressed);
      if (!photoTitle) setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch {
      setErrorMsg('Failed to process image file.');
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim()) {
      setErrorMsg('Please specify a title for the memory.');
      return;
    }
    if (!photoDataUrl.trim()) {
      setErrorMsg('Please select a photo from your phone or camera.');
      return;
    }

    try {
      setIsSaving(true);
      await memoryArchiveService.addMemory({
        title: photoTitle,
        caption: photoCaption,
        photoUrl: photoDataUrl,
        voiceNoteUrl: photoVoiceNote,
        dateTaken: photoDate || 'Special Day',
        isShared: photoShared,
      });
      finishSuccess('photo');
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not save memory.');
    }
  };

  // --- Handlers for Date ---
  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTitle.trim()) {
      setErrorMsg('Please specify a date activity or idea.');
      return;
    }

    try {
      setIsSaving(true);
      await hangoutService.addHangout({
        title: dateTitle,
        proposedDate: dateProposed,
        location: dateLocation,
        description: dateDescription,
        reminderEnabled: dateReminder,
      });
      finishSuccess('date');
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not propose date.');
    }
  };

  // --- Handlers for Song / Voice Note ---
  const handleSongFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setSongAudioUrl(stored.dataUrl);
      setSongAudioName(file.name);
      setIsVoiceNote(false);
      setShowSongRecorder(false);
      if (!songTitle) setSongTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch {
      setErrorMsg('Failed to process audio file.');
    }
  };

  const handleSongVoiceRecorded = (url: string, _dur: number, name: string) => {
    soundEngine.playSparkle();
    setSongAudioUrl(url);
    setSongAudioName(name);
    setIsVoiceNote(true);
    setShowSongRecorder(false);
    if (!songTitle) setSongTitle(`Voice Note for ${partner.displayName}`);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) {
      setErrorMsg('Please specify a title for the song or voice note.');
      return;
    }

    try {
      setIsSaving(true);
      await soundGardenService.addSong({
        title: songTitle,
        artist: songArtist.trim() || currentUser.displayName,
        musicUrl: songMusicUrl.trim() || undefined,
        audioUrl: songAudioUrl,
        audioFileName: songAudioName,
        isVoiceNote,
        message: songMessage,
        status: 'want_to_listen' as SongStatus,
      });
      finishSuccess('song');
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not save song.');
    }
  };

  // --- Handlers for Book / PDF ---
  const handleBookPdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setBookPdfUrl(stored.dataUrl);
      setBookPdfName(file.name);
      setBookPdfSize(file.size);
      setBookCategory('books');
      if (!bookTitle) setBookTitle(file.name.replace(/\.[^/.]+$/, ''));
    } catch {
      setErrorMsg('Failed to process PDF.');
    }
  };

  const handleBookPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setBookPhotoUrl(stored.dataUrl);
    } catch {
      setErrorMsg('Failed to process image.');
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) {
      setErrorMsg('Please specify a title or book name.');
      return;
    }

    try {
      setIsSaving(true);
      await shelfService.addItem({
        title: bookTitle,
        category: bookCategory,
        description: bookDesc,
        link: bookLink.trim() || undefined,
        pdfUrl: bookPdfUrl,
        pdfFileName: bookPdfName,
        pdfFileSize: bookPdfSize,
        photoUrl: bookPhotoUrl,
      });
      finishSuccess('book');
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not save shelf item.');
    }
  };

  // --- Handlers for Letter ---
  const handleSaveLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterBody.trim()) {
      setErrorMsg('Please write your thoughts or letter.');
      return;
    }

    try {
      setIsSaving(true);
      await notesService.saveNote({
        title: letterTitle,
        body: letterBody,
        isShared: letterShared,
      });
      finishSuccess('letter');
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not save letter.');
    }
  };

  const finishSuccess = (type: QuickAddType) => {
    setIsSaving(false);
    soundEngine.playChime(659.25, 1.2, 0.09);
    setIsSuccess(true);
    setTimeout(() => {
      resetAll();
      onClose();
      if (onSuccess) onSuccess(type);
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-xl animate-fade-in font-body"
      style={{ zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="max-w-xl sm:max-w-2xl w-full p-5 sm:p-7 rounded-3xl border-2 border-pink-400/65 relative space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#1b0a36',
          backgroundImage: 'linear-gradient(165deg, #220d42 0%, #120526 100%)',
          boxShadow: '0 0 35px rgba(236, 72, 153, 0.45), 0 25px 60px -15px rgba(0, 0, 0, 0.95)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Flower Embellishments on Corners */}
        <div className="absolute bottom-2 left-3 pointer-events-none opacity-60 select-none text-base">🌸</div>
        <div className="absolute bottom-2 right-3 pointer-events-none opacity-60 select-none text-base">🌸</div>

        {/* 1. Header Matching Sanctuary Mockup */}
        <div className="flex items-center justify-between pb-3.5 border-b border-purple-400/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/30 border border-white/20 shrink-0">
              <Flower2 className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Add to Our Garden</span>
                <span className="text-pink-300 font-sans text-sm">♡</span>
              </h3>
              <p className="text-xs text-pink-200/80 font-serif italic">
                Share a moment, a thought or a memory with {partner.displayName} ❤️
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Section 1: "🌸 What are you adding?" with Checkmark Badges */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
            <span>🌸</span>
            <span>What are you adding?</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { type: 'photo', label: 'Photo', icon: Camera },
              { type: 'date', label: 'Date', icon: CalendarDays },
              { type: 'song', label: 'Music', icon: Music },
              { type: 'book', label: 'Book/PDF', icon: BookOpen },
              { type: 'letter', label: 'Letter', icon: Mail },
            ].map((tab) => {
              const isActive = activeType === tab.type;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => handleTypeSwitch(tab.type as QuickAddType)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-purple-900/80 to-[#270d42] border-2 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.55)] scale-[1.02]'
                      : 'bg-[#150a2b]/80 border border-purple-400/25 hover:border-purple-300/50 hover:bg-white/[0.06] text-slate-300'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 rounded-full bg-pink-500 border border-white flex items-center justify-center text-white shadow-sm">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'text-pink-200' : 'text-purple-300/80'}`} />
                  <span className={`text-[10px] sm:text-[11px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-center text-emerald-200 text-sm font-medium flex items-center justify-center gap-2 animate-scale-up">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>Bloomed beautifully into Our Garden! ✨</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* FORM 1: Photo / Keepsake Moment                                */}
        {/* ============================================================== */}
        {activeType === 'photo' && !isSuccess && (
          <form onSubmit={handleSavePhoto} className="space-y-4 animate-fade-in">
            {/* Section 2: Your Moment */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Your Moment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Moment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Our beautiful day..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Date or Season (Optional)
                  </label>
                  <input
                    type="text"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    placeholder="Select date or season 📅"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: A Little Note */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>A Little Note</span>
              </div>
              <div className="relative">
                <textarea
                  rows={2}
                  value={photoCaption}
                  maxLength={500}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Add a caption, thought or message..."
                  className="w-full"
                />
                <span className="absolute bottom-2 right-3 text-[10px] font-mono text-pink-300/60 pointer-events-none">
                  {photoCaption.length}/500
                </span>
              </div>
            </div>

            {/* Section 4: Add Your Content (Upload Dropzone) */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Add Your Content</span>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFile}
              />

              {photoDataUrl ? (
                <div className="relative rounded-2xl overflow-hidden max-h-52 border-2 border-pink-400/50 shadow-lg">
                  <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-500 text-white shadow-md transition-all cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const compressed = await compressImage(file, 1280, 1280, 0.82);
                      setPhotoDataUrl(compressed);
                      if (!photoTitle) setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="p-5 sm:p-6 rounded-2xl border-2 border-dashed border-purple-400/40 hover:border-pink-400/80 bg-purple-950/25 hover:bg-purple-900/35 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shadow-inner"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5 text-pink-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">
                      <span className="text-pink-300 underline font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-pink-200/60 mt-0.5">
                      JPG, PNG or other files
                    </p>
                  </div>
                </div>
              )}

              {/* Voice Memo Attachment */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowPhotoRecorder(!showPhotoRecorder)}
                  className="inline-flex items-center gap-1.5 text-xs text-pink-300 hover:text-pink-200 font-medium cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>{photoVoiceNote ? 'Voice memo recorded 🎙️' : '+ Add Voice Whisper'}</span>
                </button>
              </div>

              {showPhotoRecorder && (
                <VoiceNoteRecorder
                  onRecorded={(url) => {
                    setPhotoVoiceNote(url);
                    setShowPhotoRecorder(false);
                  }}
                  onCancel={() => setShowPhotoRecorder(false)}
                />
              )}
            </div>

            {/* Section 5: Visibility Matching Mockup */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Visibility</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPhotoShared(false)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    !photoShared
                      ? 'bg-purple-900/60 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] ring-1 ring-pink-400'
                      : 'bg-[#150a2b]/80 border-purple-400/20 hover:border-purple-300/40 text-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    !photoShared ? 'border-pink-400 bg-pink-500' : 'border-white/40'
                  }`}>
                    {!photoShared && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-pink-300" />
                      <span>Private</span>
                    </div>
                    <p className="text-[10px] text-pink-200/70 font-sans mt-0.5">Only you can see this</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoShared(true)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    photoShared
                      ? 'bg-purple-900/60 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] ring-1 ring-pink-400'
                      : 'bg-[#150a2b]/80 border-purple-400/20 hover:border-purple-300/40 text-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    photoShared ? 'border-pink-400 bg-pink-500' : 'border-white/40'
                  }`}>
                    {photoShared && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Users className="w-3.5 h-3.5 text-pink-300" />
                      <span>Share</span>
                    </div>
                    <p className="text-[10px] text-pink-200/70 font-sans mt-0.5">Both of us can see this</p>
                  </div>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons Matching Mockup */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-purple-400/30 hover:border-pink-300/50 text-slate-300 hover:text-white text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:from-pink-400 hover:to-amber-300 text-white text-xs font-bold shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Flower2 className="w-4 h-4 fill-white" />
                <span>{isSaving ? 'Blooming into Garden...' : 'Add to Our Garden ✨'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 2: Suggest a Date                                         */}
        {/* ============================================================== */}
        {activeType === 'date' && !isSuccess && (
          <form onSubmit={handleSaveDate} className="space-y-4 animate-fade-in">
            {/* Section 2: Your Date */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Date Idea or Activity *</span>
              </div>
              <input
                type="text"
                required
                value={dateTitle}
                onChange={(e) => setDateTitle(e.target.value)}
                placeholder="e.g. Sunset picnic, Boba cafe date, or stargazing"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                  Proposed Timing
                </label>
                <input
                  type="text"
                  value={dateProposed}
                  onChange={(e) => setDateProposed(e.target.value)}
                  placeholder="e.g. This Saturday 6:30 PM"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={dateLocation}
                  onChange={(e) => setDateLocation(e.target.value)}
                  placeholder="e.g. Waterfront park or downtown cafe"
                />
              </div>
            </div>

            {/* Section 3: A Little Note */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>A Little Note & Details</span>
              </div>
              <textarea
                rows={2}
                value={dateDescription}
                onChange={(e) => setDateDescription(e.target.value)}
                placeholder="e.g. Bring cozy blankets, warm tea, and good music..."
                className="w-full"
              />
            </div>

            {/* Section 4: Countdown & Reminders */}
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-400/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-300" />
                <span className="text-xs text-teal-200 font-medium">Add to Our Time countdown & reminders</span>
              </div>
              <input
                type="checkbox"
                checked={dateReminder}
                onChange={(e) => setDateReminder(e.target.checked)}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-purple-400/30 hover:border-pink-300/50 text-slate-300 hover:text-white text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400 hover:from-teal-400 hover:to-amber-300 text-white text-xs font-bold shadow-[0_0_25px_rgba(20,184,166,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4" />
                <span>{isSaving ? 'Planning Date...' : `Propose Date to ${partner.displayName} 📅`}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 3: Music or Voice Note                                    */}
        {/* ============================================================== */}
        {activeType === 'song' && !isSuccess && (
          <form onSubmit={handleSaveSong} className="space-y-4 animate-fade-in">
            {/* Section 2: Song Title & Artist */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Song or Voice Note</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Flying or For You"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Artist / Creator
                  </label>
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder={`e.g. Tom Odell or ${currentUser.displayName}`}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: A Little Note */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>A Little Note / Whisper</span>
              </div>
              <input
                type="text"
                value={songMessage}
                onChange={(e) => setSongMessage(e.target.value)}
                placeholder="e.g. The song that reminds me of our long walks..."
              />
            </div>

            {/* Section 4: Add Audio Content */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Add Your Content</span>
              </div>

              <input
                ref={songInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleSongFile}
              />

              {songAudioUrl ? (
                <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-between text-xs text-purple-200">
                  <span className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-purple-300" />
                    <span>{songAudioName || (isVoiceNote ? 'Voice Note' : 'Audio Track')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSongAudioUrl(undefined);
                      setSongAudioName(undefined);
                      setIsVoiceNote(false);
                    }}
                    className="text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => songInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-purple-400/40 hover:border-purple-300/80 bg-purple-950/25 hover:bg-purple-900/35 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shadow-inner"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">
                      <span className="text-purple-300 underline font-semibold">Upload Audio File</span> or drag audio
                    </p>
                    <p className="text-[10px] text-purple-200/60 mt-0.5">
                      MP3, M4A, WAV or record voice note
                    </p>
                  </div>
                </div>
              )}

              {/* Record Voice Note Option */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-purple-200/70 font-mono text-[11px]">Or record directly:</span>
                <button
                  type="button"
                  onClick={() => setShowSongRecorder(!showSongRecorder)}
                  className="inline-flex items-center gap-1.5 text-xs text-pink-300 hover:text-pink-200 font-medium cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>{showSongRecorder ? 'Close Voice Recorder' : 'Record Voice Note 🎙️'}</span>
                </button>
              </div>

              {showSongRecorder && (
                <VoiceNoteRecorder
                  onRecorded={handleSongVoiceRecorded}
                  onCancel={() => setShowSongRecorder(false)}
                />
              )}

              {/* Optional Music Link */}
              <div className="pt-1">
                <input
                  type="url"
                  value={songMusicUrl}
                  onChange={(e) => setSongMusicUrl(e.target.value)}
                  placeholder="Optional link: https://open.spotify.com/... (can leave empty)"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-purple-400/30 hover:border-pink-300/50 text-slate-300 hover:text-white text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Music className="w-4 h-4" />
                <span>{isSaving ? 'Sharing Melody...' : 'Share Song into Sound Garden 🎵'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 4: Book, PDF or Shelf Discovery                           */}
        {/* ============================================================== */}
        {activeType === 'book' && !isSuccess && (
          <form onSubmit={handleSaveBook} className="space-y-4 animate-fade-in">
            {/* Section 2: Book Title & Category */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Title & Category</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Title or Book Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="e.g. The Alchemist or About Time"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-purple-200/80 block mb-1">
                    Category
                  </label>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value as ShelfCategory)}
                    className="garden-select w-full"
                  >
                    <option value="books">Books & Reads 📖</option>
                    <option value="films">Films & Series 🎬</option>
                    <option value="food">Food & Recipes 🍰</option>
                    <option value="places">Places to Visit 🗺️</option>
                    <option value="activities">Activities 🎨</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: A Little Note */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Why You Recommend It</span>
              </div>
              <textarea
                rows={2}
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                placeholder="e.g. Beautiful prose, we have to read it together..."
                className="w-full"
              />
            </div>

            {/* Section 4: Add Content (PDF Upload Dropzone) */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Add Your Content (PDF / Link)</span>
              </div>

              <input
                ref={bookPdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleBookPdfFile}
              />
              <input
                ref={bookPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBookPhotoFile}
              />

              {bookPdfUrl ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-between text-xs text-emerald-200">
                  <span className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="truncate">{bookPdfName || 'Book PDF'}</span>
                    {bookPdfSize && (
                      <span className="text-[10px] text-emerald-300/70 font-mono">
                        ({mediaStorage.formatBytes(bookPdfSize)})
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBookPdfUrl(undefined);
                      setBookPdfName(undefined);
                    }}
                    className="text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => bookPdfInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-purple-400/40 hover:border-amber-300/80 bg-purple-950/25 hover:bg-purple-900/35 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shadow-inner"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">
                      <span className="text-amber-300 underline font-semibold">Upload Book PDF</span> or drag file
                    </p>
                    <p className="text-[10px] text-purple-200/60 mt-0.5">
                      Read together anytime in the garden
                    </p>
                  </div>
                </div>
              )}

              {/* Cover Photo / Link Options */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => bookPhotoInputRef.current?.click()}
                  className="text-amber-300 hover:text-amber-200 font-medium cursor-pointer"
                >
                  {bookPhotoUrl ? 'Cover image attached 📸' : '+ Add Book Cover Photo'}
                </button>
                <input
                  type="url"
                  value={bookLink}
                  onChange={(e) => setBookLink(e.target.value)}
                  placeholder="Optional link: https://..."
                  className="max-w-[200px]"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-purple-400/30 hover:border-pink-300/50 text-slate-300 hover:text-white text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-bold shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isSaving ? 'Placing on Shelf...' : 'Place on Exchange Shelf 📚'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 5: Letter or Whisper Note                                 */}
        {/* ============================================================== */}
        {activeType === 'letter' && !isSuccess && (
          <form onSubmit={handleSaveLetter} className="space-y-4 animate-fade-in">
            {/* Section 2: Letter Title */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Letter Title (Optional)</span>
              </div>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                placeholder="e.g. Thinking of our quiet evenings..."
              />
            </div>

            {/* Section 3: Letter Body */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Words from the Heart *</span>
              </div>
              <textarea
                required
                rows={4}
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                placeholder="Pour what's in your heart onto parchment..."
                className="w-full"
              />
            </div>

            {/* Section 5: Visibility Matching Mockup */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5 font-sans">
                <span>🌸</span>
                <span>Visibility</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLetterShared(false)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    !letterShared
                      ? 'bg-purple-900/60 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] ring-1 ring-pink-400'
                      : 'bg-[#150a2b]/80 border-purple-400/20 hover:border-purple-300/40 text-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    !letterShared ? 'border-pink-400 bg-pink-500' : 'border-white/40'
                  }`}>
                    {!letterShared && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Lock className="w-3.5 h-3.5 text-pink-300" />
                      <span>Private</span>
                    </div>
                    <p className="text-[10px] text-pink-200/70 font-sans mt-0.5">Only you can see this</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLetterShared(true)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    letterShared
                      ? 'bg-purple-900/60 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] ring-1 ring-pink-400'
                      : 'bg-[#150a2b]/80 border-purple-400/20 hover:border-purple-300/40 text-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    letterShared ? 'border-pink-400 bg-pink-500' : 'border-white/40'
                  }`}>
                    {letterShared && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Users className="w-3.5 h-3.5 text-pink-300" />
                      <span>Share</span>
                    </div>
                    <p className="text-[10px] text-pink-200/70 font-sans mt-0.5">Both of us can see this</p>
                  </div>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-purple-400/30 hover:border-pink-300/50 text-slate-300 hover:text-white text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{isSaving ? 'Sealing Letter...' : 'Save Letter into Sanctuary 💌'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
