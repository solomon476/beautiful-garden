import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Book,
  Utensils,
  MapPin,
  Sparkles,
  Compass,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Filter,
  FileText,
  Image as ImageIcon,
  Mic,
  BookOpen,
} from 'lucide-react';
import { shelfService, authService } from '../../services/gardenService';
import type { ShelfEntry, ShelfCategory, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { mediaStorage } from '../../utils/mediaStorage';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { GardenAudioPlayer } from './GardenAudioPlayer';

const CATEGORY_MAP: Record<ShelfCategory, { label: string; icon: any; color: string; badge: string }> = {
  films: {
    label: 'Films & Series',
    icon: Film,
    color: 'from-amber-500 to-orange-400',
    badge: 'bg-amber-500/25 border-amber-400/50 text-amber-200',
  },
  books: {
    label: 'Books & Reads',
    icon: Book,
    color: 'from-emerald-500 to-teal-400',
    badge: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200',
  },
  food: {
    label: 'Food & Recipes',
    icon: Utensils,
    color: 'from-rose-500 to-pink-400',
    badge: 'bg-rose-500/25 border-rose-400/50 text-rose-200',
  },
  places: {
    label: 'Places to Visit',
    icon: MapPin,
    color: 'from-sky-500 to-indigo-400',
    badge: 'bg-sky-500/25 border-sky-400/50 text-sky-200',
  },
  activities: {
    label: 'Activities',
    icon: Compass,
    color: 'from-purple-500 to-fuchsia-400',
    badge: 'bg-purple-500/25 border-purple-400/50 text-purple-200',
  },
  music: {
    label: 'Music & Vinyls',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-400',
    badge: 'bg-pink-500/25 border-pink-400/50 text-pink-200',
  },
};

export const ExchangeShelfSection: React.FC = () => {
  const [items, setItems] = useState<ShelfEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ShelfCategory | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ShelfEntry | null>(null);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ShelfCategory>('books');
  const [description, setDescription] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfFileName, setPdfFileName] = useState<string | undefined>(undefined);
  const [pdfFileSize, setPdfFileSize] = useState<number | undefined>(undefined);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);
  const [showRecorder, setShowRecorder] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const partner = authService.getPartner();

  const loadItems = async () => {
    try {
      setLoading(true);
      const list = await shelfService.getItems();
      setItems(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadItems();
    });
    return unsubscribe;
  }, []);

  const handleOpenAdd = (defaultCat?: ShelfCategory) => {
    soundEngine.playSparkle();
    setTitle('');
    setCategory(defaultCat || 'books');
    setDescription('');
    setLink('');
    setPdfUrl(undefined);
    setPdfFileName(undefined);
    setPdfFileSize(undefined);
    setPhotoUrl(undefined);
    setVoiceNoteUrl(undefined);
    setShowRecorder(false);
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setPdfUrl(stored.dataUrl);
      setPdfFileName(file.name);
      setPdfFileSize(file.size);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setCategory('books');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process PDF. Please try another file.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      soundEngine.playSparkle();
      const stored = await mediaStorage.saveFile(file);
      setPhotoUrl(stored.dataUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image file.');
    }
  };

  const handleVoiceNoteRecorded = (dataUrl: string) => {
    soundEngine.playSparkle();
    setVoiceNoteUrl(dataUrl);
    setShowRecorder(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please specify a title or recommendation.');
      return;
    }

    try {
      await shelfService.addItem({
        title,
        category,
        description,
        link: link.trim() || undefined,
        pdfUrl,
        pdfFileName,
        pdfFileSize,
        photoUrl,
        voiceNoteUrl,
      });

      soundEngine.playChime(523.25, 1.2, 0.08);
      setIsAdding(false);
      await loadItems();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save recommendation.');
    }
  };

  const handleDelete = async (item: ShelfEntry) => {
    if (item.contributorId !== currentUser.id) return;
    if (window.confirm(`Delete recommendation "${item.title}"?`)) {
      await shelfService.deleteItem(item.id);
      setSelectedItem(null);
      await loadItems();
    }
  };

  const handleToggleReaction = (item: ShelfEntry) => {
    soundEngine.playSparkle();
    const reactions = ['Must try! 💖', 'Loved it! ⭐', 'On my list 📌', 'Can’t wait! ✨'];
    const currentReaction = (item as any).reaction || '';
    const currentIdx = reactions.findIndex((r) => r.includes(currentReaction.replace(/[^\w\s]/gi, '').trim()));
    const nextReaction = reactions[(currentIdx + 1) % reactions.length];

    const updated = items.map((i) => (i.id === item.id ? { ...i, reaction: nextReaction } : i));
    setItems(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, reaction: nextReaction } as any);
    }
  };

  const openPdf = (url: string, name?: string) => {
    soundEngine.playSparkle();
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = name || 'Garden PDF Book';
    }
  };

  const filteredItems = items.filter((i) => {
    if (selectedCategory === 'all') return true;
    return i.category === selectedCategory;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner */}
      <section
        className="relative rounded-3xl overflow-hidden border border-amber-400/30 shadow-2xl p-5 sm:p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 24, 18, 0.94) 0%, rgba(20, 12, 10, 0.98) 100%)',
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_shelf.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(251, 191, 36, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 w-full">
          {/* Left Decorative Artwork & Subtitles */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-amber-300/40 shadow-xl shrink-0 group">
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="The Exchange Shelf"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Book className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ The Exchange Shelf</span>
                <span className="text-amber-300">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>The Exchange Shelf</span>
                <span className="text-pink-400 font-sans text-xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-xs sm:text-base text-amber-200/90 max-w-xl leading-relaxed">
                Books, PDF reads, films, dishes, and places to discover together.
              </p>

              <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-amber-300/70 pt-0.5">
                PDF Uploads • Photos • Recommendations
              </div>

              {/* Direct Left Column Add Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAdd('books')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Upload Book / PDF 📚</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 w-full sm:w-auto flex justify-end">
            <button
              onClick={() => handleOpenAdd()}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-2.5 sm:py-3 px-5 sm:px-6 shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Book, PDF or Gem 📚</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Shelf Recommendations Grid */}
      {loading ? (
        <div className="py-16 text-center text-amber-300/60 text-xs font-mono animate-pulse">
          Opening the exchange cabinet...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-midnight-card p-8 sm:p-10 rounded-3xl text-center space-y-4 border border-amber-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Book className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl sm:text-2xl text-white">No recommendations on this shelf yet</h4>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-md mx-auto font-light leading-relaxed">
            {selectedCategory === 'all'
              ? 'Share a book, PDF, film, restaurant or hobby you want to experience together.'
              : `No items currently under "${CATEGORY_MAP[selectedCategory]?.label || selectedCategory}".`}
          </p>
          <button onClick={() => handleOpenAdd(selectedCategory === 'all' ? undefined : selectedCategory)} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Item 📚</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredItems.map((item) => {
            const isAddedByMe = item.contributorId === currentUser.id;
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.books;
            const Icon = cat.icon;
            const displayPhoto = item.photoUrl || '/assets/garden/card_shelf.jpg';

            return (
              <div
                key={item.id}
                className="group relative rounded-3xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:border-amber-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 24, 18, 0.65) 0%, rgba(20, 12, 10, 0.8) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-3.5 sm:gap-5">
                  <div
                    onClick={() => setSelectedItem(item)}
                    className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer block"
                    title="Click to view details"
                  >
                    <img
                      src={displayPhoto}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/80 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3
                        onClick={() => setSelectedItem(item)}
                        className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-amber-200 transition-colors cursor-pointer break-words line-clamp-1"
                      >
                        {item.title}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${cat.badge}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </span>
                    </div>

                    {/* PDF Badge if attached */}
                    {item.pdfUrl && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => openPdf(item.pdfUrl!, item.pdfFileName)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-mono text-emerald-200 transition-all active:scale-95 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Read PDF: {item.pdfFileName || 'Book Attachment'}</span>
                        </button>
                      </div>
                    )}

                    {item.description ? (
                      <p className="text-xs text-amber-100/90 font-serif italic line-clamp-2 leading-relaxed pt-0.5">
                        “{item.description}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-300/60 font-serif italic line-clamp-1 pt-0.5">
                        Recommended for our shared journey...
                      </p>
                    )}
                  </div>
                </div>

                {/* Voice Note if attached */}
                {item.voiceNoteUrl && (
                  <div className="pt-1">
                    <GardenAudioPlayer
                      src={item.voiceNoteUrl}
                      title={`Voice Note: ${item.title}`}
                      subtitle={`Shared by ${item.contributorName || 'Garden'}`}
                      isVoiceNote={true}
                    />
                  </div>
                )}

                {/* Footer Row: Author + Reaction + Details */}
                <div className="pt-3 border-t border-amber-400/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[10px] text-amber-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-amber-200/90 truncate">
                      By: {isAddedByMe ? 'You' : item.contributorName || partner.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(item)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/30 text-[10px] sm:text-[11px] text-amber-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle reaction"
                    >
                      <span>{(item as any).reaction || 'Must try! 💖'}</span>
                    </button>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-white/[0.06] hover:bg-amber-500/30 border border-white/10 text-amber-200 hover:text-white transition-all"
                        title="Open external link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="btn-glow-romantic text-[11px] py-1 px-3 shadow-sm"
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Filter & Action Row */}
      <section className="flex flex-col lg:flex-row gap-5 sm:gap-6 pt-2 w-full">
        <div
          className="rounded-3xl p-5 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 sm:gap-5 justify-between border border-amber-400/30 shadow-xl"
          style={{
            flex: '1.35 1 0%',
            background: 'linear-gradient(135deg, rgba(34, 20, 14, 0.7) 0%, rgba(18, 10, 8, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-3.5 sm:gap-5 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-400/30 shrink-0 shadow-lg">
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="Exchange Cabinet"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                Add a Book, PDF or Discovery
              </h4>
              <p className="text-xs text-amber-200/80 font-light leading-relaxed">
                Upload a book PDF from your phone, photo, or cozy idea.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <Book className="w-3.5 h-3.5" />
            <span>Add to Shelf →</span>
          </button>
        </div>

        {/* Quick Filter Pill Card */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between space-y-3.5 border border-amber-400/30 shadow-xl"
          style={{
            flex: '1 1 0%',
            background: 'linear-gradient(135deg, rgba(28, 16, 12, 0.7) 0%, rgba(16, 8, 6, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-amber-300" />
              <span>Category Filter</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500/30 border border-amber-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-amber-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📚 All
              </button>

              {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((catKey) => {
                const cat = CATEGORY_MAP[catKey];
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      soundEngine.playSparkle();
                      setSelectedCategory(catKey);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === catKey
                        ? 'bg-amber-500/30 border border-amber-400/50 text-white shadow-md'
                        : 'bg-white/[0.05] border border-white/10 text-amber-200/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Details Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="glass-midnight-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-amber-400/40 shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80 uppercase tracking-wider">
                <Book className="w-4 h-4 text-amber-300" />
                <span>Recommendation Details</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white truncate">{selectedItem.title}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                    CATEGORY_MAP[selectedItem.category]?.badge || ''
                  }`}
                >
                  <span>{CATEGORY_MAP[selectedItem.category]?.label}</span>
                </span>
              </div>

              {selectedItem.photoUrl && (
                <div className="rounded-2xl overflow-hidden max-h-56 border border-white/10 shadow-md">
                  <img src={selectedItem.photoUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                </div>
              )}

              {selectedItem.description && (
                <div className="quote-whisper-bubble space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80">
                    Why It's Recommended
                  </div>
                  <p className="font-serif italic text-sm text-amber-100/95 leading-relaxed">
                    “{selectedItem.description}” ♡
                  </p>
                </div>
              )}

              {selectedItem.pdfUrl && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-100 truncate">
                    <FileText className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="truncate">{selectedItem.pdfFileName || 'Book PDF Attached'}</span>
                  </div>
                  <button
                    onClick={() => openPdf(selectedItem.pdfUrl!, selectedItem.pdfFileName)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold shrink-0 shadow-md flex items-center gap-1 active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read PDF</span>
                  </button>
                </div>
              )}

              {selectedItem.voiceNoteUrl && (
                <GardenAudioPlayer
                  src={selectedItem.voiceNoteUrl}
                  title={`Voice Note: ${selectedItem.title}`}
                  subtitle={`Recommended by ${selectedItem.contributorName || 'Garden'}`}
                  isVoiceNote={true}
                />
              )}

              {selectedItem.link && (
                <div className="pt-1">
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 underline font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open External Reference / Link</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-amber-400/20 flex items-center justify-between gap-3">
              {selectedItem.contributorId === currentUser.id ? (
                <button
                  onClick={() => handleDelete(selectedItem)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Item</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-amber-300/60">
                  Recommended by {selectedItem.contributorName || partner.displayName}
                </span>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="btn-glow-romantic text-xs py-2 px-5"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Modal Form with Upload Support */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-400/40 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/20">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                  <Book className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add Recommendation to Shelf
                  </h4>
                  <p className="text-[11px] text-amber-200/70 font-mono uppercase tracking-wider">
                    Upload book PDF, photo, or share an adventure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Buttons: PDF of Book, Photo, Voice Note */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                  pdfUrl
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Upload PDF Book</span>
              </button>

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                  photoUrl
                    ? 'bg-amber-500/25 border-amber-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-300" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(!showRecorder)}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all ${
                  showRecorder || voiceNoteUrl
                    ? 'bg-pink-500/25 border-pink-400/60 text-white'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Mic className="w-4 h-4 text-pink-300" />
                <span>Voice Note</span>
              </button>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Voice Recorder */}
            {showRecorder && (
              <VoiceNoteRecorder
                onRecorded={handleVoiceNoteRecorded}
                onCancel={() => setShowRecorder(false)}
              />
            )}

            {/* Previews */}
            {pdfUrl && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-between text-xs text-emerald-200">
                <span className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">{pdfFileName || 'PDF Book'}</span>
                  {pdfFileSize && (
                    <span className="text-[10px] text-emerald-300/70 font-mono">
                      ({mediaStorage.formatBytes(pdfFileSize)})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPdfUrl(undefined);
                    setPdfFileName(undefined);
                    setPdfFileSize(undefined);
                  }}
                  className="text-slate-400 hover:text-rose-300 ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {photoUrl && (
              <div className="relative rounded-2xl overflow-hidden max-h-40 border border-white/20">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {voiceNoteUrl && (
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-400/30 flex items-center justify-between">
                <span className="text-xs text-pink-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>Voice Note Attached</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceNoteUrl(undefined)}
                  className="text-xs text-slate-400 hover:text-rose-300"
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-field-label">
                  <span>Category *</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((catKey) => {
                    const c = CATEGORY_MAP[catKey];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                          category === catKey
                            ? 'bg-amber-500/30 border-amber-400/70 text-white shadow-md'
                            : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{c.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-field-label">
                  <span>Title / Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Alchemist, About Time, or Boba Place"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Why You Recommend It</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Super cozy vibe, we have to read/watch it together"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Link (Optional)</span>
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Optional reference: https://... (leave empty if none)"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-400/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Place on Shelf ✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
