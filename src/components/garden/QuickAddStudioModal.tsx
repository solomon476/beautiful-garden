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
  Check,
  Lock,
  Users,
  Sparkles,
  PenLine,
  MessageCircle,
  Eye,
  Send,
  ChevronDown,
  Flower2,
  FileAudio,
  FileText,
  Clock,
  Search,
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
import {
  isSpotifyUrl,
  getCleanSpotifyUrl,
  fetchSpotifyOEmbed,
} from '../../utils/spotify';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import styles from './QuickAddStudioModal.module.css';

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

  // Dynamic user & partner state
  // Solomon's side: partner.displayName is "Noella"
  // Noella's side: partner.displayName is "Solomon"
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
  const [songSpotifyDetected, setSongSpotifyDetected] = useState<{
    title?: string;
    artist?: string;
    thumbnail?: string;
  } | null>(null);
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
      setErrorMsg('Please specify a title for the moment.');
      return;
    }
    if (!photoDataUrl.trim()) {
      setErrorMsg('Please select a photo from your device or gallery.');
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
      setErrorMsg(err?.message || 'Could not save moment.');
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

  const handleSongMusicUrlChange = async (val: string) => {
    setSongMusicUrl(val);
    if (isSpotifyUrl(val)) {
      try {
        const clean = getCleanSpotifyUrl(val);
        const meta = await fetchSpotifyOEmbed(clean);
        if (meta) {
          setSongSpotifyDetected({
            title: meta.title,
            artist: meta.artist,
            thumbnail: meta.thumbnailUrl,
          });
          if (meta.title && !songTitle) setSongTitle(meta.title);
          if (meta.artist && (!songArtist || songArtist === currentUser.displayName)) {
            setSongArtist(meta.artist);
          }
        }
      } catch (err) {
        console.warn('Spotify link notice:', err);
      }
    } else {
      setSongSpotifyDetected(null);
    }
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
        coverUrl: songSpotifyDetected?.thumbnail || undefined,
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.momentContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Frosted Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Navigation Tabs — Exactly matching 2x2 grid from mockup */}
        <div className={styles.momentTabs}>
          {[
            { type: 'photo', label: 'Photo Moments', icon: Camera },
            { type: 'song', label: 'Music', icon: Music },
            { type: 'book', label: 'Read/PDF', icon: BookOpen },
            { type: 'date', label: 'Date', icon: CalendarDays },
            { type: 'letter', label: 'Letter', icon: Mail },
          ].map((tab, idx) => {
            const isActive = activeType === tab.type;
            const Icon = tab.icon;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => handleTypeSwitch(tab.type as QuickAddType)}
                className={`${styles.momentTab} ${isActive ? styles.active : ''} ${
                  idx === 4 ? styles.momentTabFull : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${styles.tabIcon}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className={styles.successBanner}>
            <div style={{ fontSize: '28px' }}>🌸✨</div>
            <div>Bloomed beautifully into Our Garden!</div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FORM 1: Photo / Keepsake Moment (Matching Image 2 Mockup)      */}
        {/* ============================================================== */}
        {activeType === 'photo' && !isSuccess && (
          <form onSubmit={handleSavePhoto}>
            {/* Section 1: ✨ Your Moment */}
            <div className={styles.sectionTitle}>
              <Sparkles className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Your Moment</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Moment Title *</label>
                <div className={styles.inputWrapper}>
                  <PenLine className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    required
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="e.g. Our beautiful day..."
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Date or Season (Optional)</label>
                <div className={styles.inputWrapper}>
                  <CalendarDays className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    placeholder="e.g. Nov 8, 2026 or Spring 🌸"
                    className={`${styles.inputWithPrefix} ${styles.inputWithSuffix}`}
                  />
                  <ChevronDown className={`w-4 h-4 ${styles.inputSuffixIcon}`} />
                </div>
              </div>
            </div>

            {/* Section 2: 💬 A Little Note */}
            <div className={styles.sectionTitle}>
              <MessageCircle className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>A Little Note</span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.textareaWrapper}>
                <textarea
                  rows={3}
                  value={photoCaption}
                  maxLength={300}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Add a caption, thought or message..."
                />
                <span className={styles.charCounter}>
                  {photoCaption.length}/300 💖
                </span>
              </div>
            </div>

            {/* Section 3: 🌸 Add Your Content */}
            <div className={styles.sectionTitle}>
              <Flower2 className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Add Your Content</span>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoFile}
            />

            <div
              className={styles.uploadArea}
              onClick={() => photoInputRef.current?.click()}
            >
              {photoDataUrl ? (
                <>
                  <div
                    className={styles.imagePreview}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img src={photoDataUrl} alt="Preview" />
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl('')}
                      className={styles.removeImage}
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={styles.uploadDivider} />

                  <div className={styles.uploadContentRight}>
                    <div className={styles.uploadIcon}>
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div className={styles.uploadTitle}>
                      Click to change image
                    </div>
                    <div className={styles.uploadSubtitle}>
                      JPG, PNG or other files
                    </div>
                    <svg width="40" height="20" viewBox="0 0 50 25" fill="none" stroke="#ff78d2" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 18 C15 22, 25 22, 35 15 C38 12, 43 8, 41 4 C39 0, 34 3, 33 8 C32 13, 38 18, 47 16" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className={styles.uploadContentRight}>
                  <div className={styles.uploadIcon}>
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className={styles.uploadTitle}>
                    Click to upload or drag and drop
                  </div>
                  <div className={styles.uploadSubtitle}>
                    JPG, PNG or other files
                  </div>
                  <svg width="40" height="20" viewBox="0 0 50 25" fill="none" stroke="#ff78d2" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 18 C15 22, 25 22, 35 15 C38 12, 43 8, 41 4 C39 0, 34 3, 33 8 C32 13, 38 18, 47 16" />
                  </svg>
                </div>
              )}
            </div>

            {/* Voice Whisper Toggle Button */}
            <div
              className={styles.voiceButton}
              onClick={() => setShowPhotoRecorder(!showPhotoRecorder)}
            >
              <Mic className="w-4 h-4 text-pink-300" />
              <span>{photoVoiceNote ? 'Voice Whisper Attached 🎙️ (Click to re-record)' : '+ Add Voice Whisper'}</span>
            </div>

            {showPhotoRecorder && (
              <div style={{ marginBottom: '22px' }}>
                <VoiceNoteRecorder
                  onRecorded={(audioDataUrl: string) => {
                    setPhotoVoiceNote(audioDataUrl);
                    setShowPhotoRecorder(false);
                  }}
                  onCancel={() => setShowPhotoRecorder(false)}
                />
              </div>
            )}

            {/* Section 4: 👁️ Visibility (Dynamic for Solomon & Noella) */}
            <div className={styles.sectionTitle}>
              <Eye className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Visibility</span>
            </div>

            <div className={styles.visibilityOptions}>
              {/* Private Option */}
              <div
                className={`${styles.visibilityOption} ${!photoShared ? styles.selected : ''}`}
                onClick={() => setPhotoShared(false)}
              >
                <div className={`${styles.radioCircle} ${!photoShared ? styles.radioCircleActive : ''}`}>
                  {!photoShared && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <div className={styles.visibilityIconBox}>
                  <Lock className="w-4 h-4 text-pink-300" />
                </div>
                <div className={styles.visibilityText}>
                  <div className={styles.visibilityTitle}>Private</div>
                  <div className={styles.visibilitySubtitle}>Only you can see this</div>
                </div>
                <div className={styles.visibilityEndIcon}>👑</div>
              </div>

              {/* Share Option (Shows "Share with Noella" for Solomon, "Share with Solomon" for Noella) */}
              <div
                className={`${styles.visibilityOption} ${photoShared ? styles.selected : ''}`}
                onClick={() => setPhotoShared(true)}
              >
                <div className={`${styles.radioCircle} ${photoShared ? styles.radioCircleActive : ''}`}>
                  {photoShared && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <div className={styles.visibilityIconBox}>
                  <Users className="w-4 h-4 text-pink-300" />
                </div>
                <div className={styles.visibilityText}>
                  <div className={styles.visibilityTitle}>Share</div>
                  <div className={styles.visibilitySubtitle}>
                    Share with {partner.displayName}
                  </div>
                </div>
                <div className={styles.visibilityEndIcon}>🧑‍🤝‍🧑</div>
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorMessage}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 5: Main Radiant Action Button */}
            <button
              type="submit"
              disabled={isSaving}
              className={styles.postButton}
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSaving ? 'Posting Moment...' : 'Post My Moment ✨'}</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 2: Suggest a Date or Hangout                              */}
        {/* ============================================================== */}
        {activeType === 'date' && !isSuccess && (
          <form onSubmit={handleSaveDate}>
            <div className={styles.sectionTitle}>
              <CalendarDays className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Hangout & Date Adventure</span>
            </div>

            <div className={styles.formGroup}>
              <label>Date Idea or Activity *</label>
              <div className={styles.inputWrapper}>
                <PenLine className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                <input
                  type="text"
                  required
                  value={dateTitle}
                  onChange={(e) => setDateTitle(e.target.value)}
                  placeholder="e.g. Sunset picnic, Boba cafe date, or stargazing..."
                  className={styles.inputWithPrefix}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Proposed Timing</label>
                <div className={styles.inputWrapper}>
                  <Clock className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    value={dateProposed}
                    onChange={(e) => setDateProposed(e.target.value)}
                    placeholder="e.g. This Saturday 6:30 PM"
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Location</label>
                <div className={styles.inputWrapper}>
                  <CalendarDays className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    value={dateLocation}
                    onChange={(e) => setDateLocation(e.target.value)}
                    placeholder="e.g. Waterfront park or cozy cafe"
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <MessageCircle className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>A Little Note & Details</span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.textareaWrapper}>
                <textarea
                  rows={3}
                  value={dateDescription}
                  onChange={(e) => setDateDescription(e.target.value)}
                  placeholder="Bring cozy blankets, warm tea, and good music..."
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '18px',
                background: 'rgba(20, 184, 166, 0.12)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                marginBottom: '20px',
                cursor: 'pointer',
              }}
              onClick={() => setDateReminder(!dateReminder)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock className="w-4 h-4 text-teal-300" />
                <span style={{ fontSize: '13.5px', color: '#99f6e4', fontWeight: 600 }}>
                  Add to Our Time countdown & alerts
                </span>
              </div>
              <input
                type="checkbox"
                checked={dateReminder}
                onChange={(e) => setDateReminder(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#14b8a6', cursor: 'pointer' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {errorMsg && (
              <div className={styles.errorMessage}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={styles.postButton}
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSaving ? 'Planning Date...' : `Suggest Adventure to ${partner.displayName} 📅`}</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 3: Music or Voice Note                                    */}
        {/* ============================================================== */}
        {activeType === 'song' && !isSuccess && (
          <form onSubmit={handleSaveSong}>
            <div className={styles.sectionTitle}>
              <Music className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Music & Audio Keepsake</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Song Title *</label>
                <div className={styles.inputWrapper}>
                  <Music className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Flying or Perfect"
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Artist / Creator</label>
                <div className={styles.inputWrapper}>
                  <PenLine className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder={`e.g. Ed Sheeran or ${currentUser.displayName}`}
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Spotify Track URL (Optional)</label>
              <div className={styles.inputWrapper}>
                <Search className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                <input
                  type="url"
                  value={songMusicUrl}
                  onChange={(e) => handleSongMusicUrlChange(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className={styles.inputWithPrefix}
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <MessageCircle className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>A Sweet Note / Message</span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.textareaWrapper}>
                <textarea
                  rows={2}
                  value={songMessage}
                  onChange={(e) => setSongMessage(e.target.value)}
                  placeholder="The song that reminds me of our unforgettable moments..."
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <Flower2 className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Add Audio Track / Voice Whisper</span>
            </div>

            <input
              ref={songInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleSongFile}
            />

            <div
              className={styles.uploadArea}
              onClick={() => songInputRef.current?.click()}
            >
              {songAudioUrl ? (
                <div className={styles.uploadContentRight}>
                  <div className={styles.uploadIcon}>
                    <FileAudio className="w-7 h-7" />
                  </div>
                  <div className={styles.uploadTitle}>
                    {songAudioName || (isVoiceNote ? 'Voice Note Attached' : 'Audio Track Attached')}
                  </div>
                  <div className={styles.uploadSubtitle}>
                    Click to change or replace audio file
                  </div>
                </div>
              ) : (
                <div className={styles.uploadContentRight}>
                  <div className={styles.uploadIcon}>
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className={styles.uploadTitle}>
                    Click to upload MP3, M4A or WAV
                  </div>
                  <div className={styles.uploadSubtitle}>
                    Audio tracks, voice recordings or sound gems
                  </div>
                </div>
              )}
            </div>

            <div
              className={styles.voiceButton}
              onClick={() => setShowSongRecorder(!showSongRecorder)}
            >
              <Mic className="w-4 h-4 text-pink-300" />
              <span>{isVoiceNote ? 'Re-record Voice Note 🎙️' : '+ Record Voice Note Directly'}</span>
            </div>

            {showSongRecorder && (
              <div style={{ marginBottom: '22px' }}>
                <VoiceNoteRecorder
                  onRecorded={(audioDataUrl: string, dur: number, name: string) => {
                    handleSongVoiceRecorded(audioDataUrl, dur, name || `Voice Note for ${partner.displayName}`);
                  }}
                  onCancel={() => setShowSongRecorder(false)}
                />
              </div>
            )}

            {errorMsg && (
              <div className={styles.errorMessage}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={styles.postButton}
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSaving ? 'Sending Song...' : `Send Track to ${partner.displayName} 🎵`}</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 4: Book, PDF or Shelf Discovery                           */}
        {/* ============================================================== */}
        {activeType === 'book' && !isSuccess && (
          <form onSubmit={handleSaveBook}>
            <div className={styles.sectionTitle}>
              <BookOpen className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Exchange Shelf Discovery</span>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Title or Name *</label>
                <div className={styles.inputWrapper}>
                  <BookOpen className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="e.g. The Alchemist or About Time"
                    className={styles.inputWithPrefix}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <div className={styles.inputWrapper}>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value as ShelfCategory)}
                    className={styles.inputWithSuffix}
                  >
                    <option value="books">Books & Reads 📖</option>
                    <option value="films">Films & Series 🎬</option>
                    <option value="food">Food & Recipes 🍰</option>
                    <option value="places">Places to Visit 🗺️</option>
                    <option value="activities">Activities 🎨</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 ${styles.inputSuffixIcon}`} />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Reference Link (Optional)</label>
              <div className={styles.inputWrapper}>
                <Search className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                <input
                  type="url"
                  value={bookLink}
                  onChange={(e) => setBookLink(e.target.value)}
                  placeholder="https://..."
                  className={styles.inputWithPrefix}
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <MessageCircle className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Why You Recommend It</span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.textareaWrapper}>
                <textarea
                  rows={3}
                  value={bookDesc}
                  onChange={(e) => setBookDesc(e.target.value)}
                  placeholder="e.g. Beautiful prose and deep reflection, we must experience this together..."
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <Flower2 className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Add PDF or Cover Photo</span>
            </div>

            <input
              ref={bookPdfInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleBookPdfFile}
            />

            <input
              ref={bookPhotoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBookPhotoFile}
            />

            <div className={styles.uploadArea}>
              <div
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => bookPdfInputRef.current?.click()}
              >
                <div className={styles.uploadIcon} style={{ margin: '0 auto 8px' }}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className={styles.uploadTitle}>
                  {bookPdfName ? bookPdfName : 'Upload PDF Document'}
                </div>
                <div className={styles.uploadSubtitle}>
                  Books, essays, poems or articles
                </div>
              </div>

              <div className={styles.uploadDivider} />

              <div
                style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => bookPhotoInputRef.current?.click()}
              >
                <div className={styles.uploadIcon} style={{ margin: '0 auto 8px' }}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className={styles.uploadTitle}>
                  {bookPhotoUrl ? 'Cover Photo Selected' : 'Upload Cover / Photo'}
                </div>
                <div className={styles.uploadSubtitle}>
                  JPG, PNG image snapshot
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorMessage}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={styles.postButton}
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSaving ? 'Placing on Shelf...' : 'Place on Shelf ✨'}</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 5: Letter or Whisper Note                                 */}
        {/* ============================================================== */}
        {activeType === 'letter' && !isSuccess && (
          <form onSubmit={handleSaveLetter}>
            <div className={styles.sectionTitle}>
              <Mail className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Letter in the Garden</span>
            </div>

            <div className={styles.formGroup}>
              <label>Letter Title (Optional)</label>
              <div className={styles.inputWrapper}>
                <PenLine className={`w-4 h-4 ${styles.inputPrefixIcon}`} />
                <input
                  type="text"
                  value={letterTitle}
                  onChange={(e) => setLetterTitle(e.target.value)}
                  placeholder="e.g. Thinking of our quiet evenings..."
                  className={styles.inputWithPrefix}
                />
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <MessageCircle className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Words from the Heart *</span>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.textareaWrapper}>
                <textarea
                  required
                  rows={4}
                  value={letterBody}
                  onChange={(e) => setLetterBody(e.target.value)}
                  placeholder="Pour what's in your heart onto parchment..."
                />
              </div>
            </div>

            {/* Visibility Option */}
            <div className={styles.sectionTitle}>
              <Eye className={`w-4 h-4 ${styles.sectionIcon}`} />
              <span>Visibility</span>
            </div>

            <div className={styles.visibilityOptions}>
              <div
                className={`${styles.visibilityOption} ${!letterShared ? styles.selected : ''}`}
                onClick={() => setLetterShared(false)}
              >
                <div className={`${styles.radioCircle} ${!letterShared ? styles.radioCircleActive : ''}`}>
                  {!letterShared && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <div className={styles.visibilityIconBox}>
                  <Lock className="w-4 h-4 text-pink-300" />
                </div>
                <div className={styles.visibilityText}>
                  <div className={styles.visibilityTitle}>Private</div>
                  <div className={styles.visibilitySubtitle}>Only you can see this</div>
                </div>
                <div className={styles.visibilityEndIcon}>👑</div>
              </div>

              <div
                className={`${styles.visibilityOption} ${letterShared ? styles.selected : ''}`}
                onClick={() => setLetterShared(true)}
              >
                <div className={`${styles.radioCircle} ${letterShared ? styles.radioCircleActive : ''}`}>
                  {letterShared && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <div className={styles.visibilityIconBox}>
                  <Users className="w-4 h-4 text-pink-300" />
                </div>
                <div className={styles.visibilityText}>
                  <div className={styles.visibilityTitle}>Share</div>
                  <div className={styles.visibilitySubtitle}>
                    Share with {partner.displayName}
                  </div>
                </div>
                <div className={styles.visibilityEndIcon}>🧑‍🤝‍🧑</div>
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorMessage}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={styles.postButton}
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSaving ? 'Sealing Letter...' : `Send Letter to ${partner.displayName} ✉️`}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
