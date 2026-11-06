import React, { useState, useRef } from 'react';
import {
  Camera,
  CalendarDays,
  Music,
  Book,
  PenLine,
  Sparkles,
  X,
  Upload,
  Mic,
  FileText,
  Check,
  MapPin,
  Clock,
  Heart,
  FileAudio,
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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

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
      await hangoutService.addHangout({
        title: dateTitle,
        proposedDate: dateProposed,
        location: dateLocation,
        description: dateDescription,
        reminderEnabled: dateReminder,
      });
      finishSuccess('date');
    } catch (err: any) {
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
      await notesService.saveNote({
        title: letterTitle,
        body: letterBody,
        isShared: letterShared,
      });
      finishSuccess('letter');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save letter.');
    }
  };

  const finishSuccess = (type: QuickAddType) => {
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
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3.5 sm:p-6 bg-black/92 backdrop-blur-xl animate-fade-in font-body"
      style={{ zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full p-5 sm:p-8 rounded-3xl border border-pink-400/40 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: '#130826',
          backgroundImage: 'linear-gradient(165deg, #1b0c38 0%, #0e051c 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(167, 139, 250, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Add to Our Garden</span>
                <span className="text-pink-300 font-sans text-sm">♡</span>
              </h3>
              <p className="text-[11px] text-pink-200/70 font-mono">
                Upload from phone, plan dates, voice notes & reads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Option Action Tabs Bar */}
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <button
            type="button"
            onClick={() => handleTypeSwitch('photo')}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
              activeType === 'photo'
                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-rose-300" />
            <span className="text-[10px] font-medium leading-none">Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('date')}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
              activeType === 'date'
                ? 'bg-teal-500/30 text-teal-200 border border-teal-400/50 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-teal-300" />
            <span className="text-[10px] font-medium leading-none">Date</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('song')}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
              activeType === 'song'
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4 text-purple-300" />
            <span className="text-[10px] font-medium leading-none">Music</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('book')}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
              activeType === 'book'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Book className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] font-medium leading-none">Book/PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('letter')}
            className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-all ${
              activeType === 'letter'
                ? 'bg-pink-500/30 text-pink-200 border border-pink-400/50 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <PenLine className="w-4 h-4 text-pink-300" />
            <span className="text-[10px] font-medium leading-none">Letter</span>
          </button>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-center text-emerald-200 text-sm font-medium flex items-center justify-center gap-2 animate-scale-up">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>Bloomed beautifully into Our Garden! ✨</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* FORM 1: Photo / Keepsake Memory                                */}
        {/* ============================================================== */}
        {activeType === 'photo' && !isSuccess && (
          <form onSubmit={handleSavePhoto} className="space-y-4 animate-fade-in">
            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  photoDataUrl
                    ? 'bg-rose-500/25 border-rose-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-rose-200 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4 text-rose-300" />
                <span>Choose Photo from Phone</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPhotoRecorder(!showPhotoRecorder)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  showPhotoRecorder || photoVoiceNote
                    ? 'bg-pink-500/25 border-pink-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-pink-200 hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4 text-pink-300" />
                <span>Voice Memo</span>
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoFile}
            />

            {showPhotoRecorder && (
              <VoiceNoteRecorder
                onRecorded={(url) => {
                  setPhotoVoiceNote(url);
                  setShowPhotoRecorder(false);
                }}
                onCancel={() => setShowPhotoRecorder(false)}
              />
            )}

            {photoDataUrl && (
              <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/20">
                <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-field-label">
                  <span>Moment Title *</span>
                </label>
                <input
                  type="text"
                  required
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Evening by the Shore"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Date or Season (Optional)</span>
                </label>
                <input
                  type="text"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  placeholder="e.g. Oct 2026, Summer walk"
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">
                <span>Sweet Caption / Thought</span>
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="e.g. Your smile when the sun dipped below the trees..."
              />
            </div>

            <DecoratedPrivacyToggle
              isShared={photoShared}
              onToggle={setPhotoShared}
              partnerName={partner.displayName}
            />

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-glow-romantic w-full sm:w-auto justify-center">
                <Camera className="w-4 h-4" />
                <span>Save Photo into Archive 📸</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 2: Suggest a Date                                         */}
        {/* ============================================================== */}
        {activeType === 'date' && !isSuccess && (
          <form onSubmit={handleSaveDate} className="space-y-4 animate-fade-in">
            <div>
              <label className="form-field-label">
                <span>Date Idea or Activity *</span>
              </label>
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
                <label className="form-field-label">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                  <span>Proposed Timing</span>
                </label>
                <input
                  type="text"
                  value={dateProposed}
                  onChange={(e) => setDateProposed(e.target.value)}
                  placeholder="e.g. This Saturday 6:30 PM"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                  <span>Location</span>
                </label>
                <input
                  type="text"
                  value={dateLocation}
                  onChange={(e) => setDateLocation(e.target.value)}
                  placeholder="e.g. Waterfront park or downtown cafe"
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">
                <span>Notes & What We'll Do</span>
              </label>
              <input
                type="text"
                value={dateDescription}
                onChange={(e) => setDateDescription(e.target.value)}
                placeholder="e.g. Bring cozy blankets, warm tea, and good music"
              />
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-between">
              <span className="text-xs text-teal-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Notify partner & enable date countdown</span>
              </span>
              <input
                type="checkbox"
                checked={dateReminder}
                onChange={(e) => setDateReminder(e.target.checked)}
                className="rounded border-teal-400/40 text-teal-500"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-glow-romantic w-full sm:w-auto justify-center">
                <CalendarDays className="w-4 h-4" />
                <span>Propose Date to {partner.displayName} 📅</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 3: Music or Voice Note                                    */}
        {/* ============================================================== */}
        {activeType === 'song' && !isSuccess && (
          <form onSubmit={handleSaveSong} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => songInputRef.current?.click()}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  songAudioUrl && !isVoiceNote
                    ? 'bg-purple-500/25 border-purple-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-purple-200 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-300" />
                <span>Upload Audio File</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSongRecorder(!showSongRecorder)}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  showSongRecorder || isVoiceNote
                    ? 'bg-pink-500/25 border-pink-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-pink-200 hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4 text-pink-300" />
                <span>Record Voice Note</span>
              </button>
            </div>

            <input
              ref={songInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleSongFile}
            />

            {showSongRecorder && (
              <VoiceNoteRecorder
                onRecorded={handleSongVoiceRecorded}
                onCancel={() => setShowSongRecorder(false)}
              />
            )}

            {songAudioUrl && (
              <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-between text-xs text-purple-200">
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
                  className="text-slate-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-field-label">
                  <span>Song or Note Title *</span>
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
                <label className="form-field-label">
                  <span>Artist / Creator</span>
                </label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder={`e.g. Tom Odell or ${currentUser.displayName}`}
                />
              </div>
            </div>

            <div>
              <label className="form-field-label">
                <span>Music Link (Spotify, YouTube) — Optional</span>
              </label>
              <input
                type="url"
                value={songMusicUrl}
                onChange={(e) => setSongMusicUrl(e.target.value)}
                placeholder="Optional link: https://open.spotify.com/... (can leave empty)"
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Whisper Message / Memory</span>
              </label>
              <input
                type="text"
                value={songMessage}
                onChange={(e) => setSongMessage(e.target.value)}
                placeholder="e.g. The song that reminds me of our long talks..."
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-glow-romantic w-full sm:w-auto justify-center">
                <Music className="w-4 h-4" />
                <span>Share Song or Voice Note 🎵</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 4: Book, PDF or Shelf Discovery                           */}
        {/* ============================================================== */}
        {activeType === 'book' && !isSuccess && (
          <form onSubmit={handleSaveBook} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => bookPdfInputRef.current?.click()}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  bookPdfUrl
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-amber-200 hover:bg-white/10'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Upload PDF Book</span>
              </button>

              <button
                type="button"
                onClick={() => bookPhotoInputRef.current?.click()}
                className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  bookPhotoUrl
                    ? 'bg-amber-500/25 border-amber-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-amber-200 hover:bg-white/10'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-300" />
                <span>Upload Cover Photo</span>
              </button>
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

            {bookPdfUrl && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between text-xs text-emerald-200">
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
                  className="text-slate-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            )}

            {bookPhotoUrl && (
              <div className="relative rounded-2xl overflow-hidden max-h-40 border border-white/20">
                <img src={bookPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setBookPhotoUrl(undefined)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-field-label">
                  <span>Title or Book Name *</span>
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
                <label className="form-field-label">
                  <span>Category</span>
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

            <div>
              <label className="form-field-label">
                <span>Why You Recommend It</span>
              </label>
              <input
                type="text"
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                placeholder="e.g. Beautiful prose, we have to read it together"
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Link (Optional)</span>
              </label>
              <input
                type="url"
                value={bookLink}
                onChange={(e) => setBookLink(e.target.value)}
                placeholder="Optional link: https://... (can leave blank)"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-glow-romantic w-full sm:w-auto justify-center">
                <Book className="w-4 h-4" />
                <span>Place on Exchange Shelf 📚</span>
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 5: Letter or Petal Note                                   */}
        {/* ============================================================== */}
        {activeType === 'letter' && !isSuccess && (
          <form onSubmit={handleSaveLetter} className="space-y-4 animate-fade-in">
            <div>
              <label className="form-field-label">
                <span>Letter Title (Optional)</span>
              </label>
              <input
                type="text"
                value={letterTitle}
                onChange={(e) => setLetterTitle(e.target.value)}
                placeholder="e.g. Thinking of our quiet evenings..."
              />
            </div>

            <div>
              <label className="form-field-label">
                <span>Your Letter / Thoughts *</span>
              </label>
              <textarea
                required
                rows={4}
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                placeholder="Pour what's in your heart onto parchment..."
              />
            </div>

            <DecoratedPrivacyToggle
              isShared={letterShared}
              onToggle={setLetterShared}
              partnerName={partner.displayName}
            />

            {errorMsg && (
              <p className="text-xs text-rose-300 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn-glow-romantic w-full sm:w-auto justify-center">
                <Heart className="w-4 h-4" />
                <span>Save Letter into Sanctuary 💌</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
