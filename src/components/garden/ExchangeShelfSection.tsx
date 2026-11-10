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
import styles from './ExchangeShelfSection.module.css';

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
    <div className={styles.shelfSection}>
      {/* 1. Top Banner Button — Quick Action across Mobile & Desktop */}
      <div
        onClick={() => handleOpenAdd()}
        className="add-memory-banner group"
        title="Add to Our Exchange Shelf"
        style={{ cursor: 'pointer' }}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
          <Book className="w-5 h-5 text-amber-200" />
        </div>
        <div className="min-w-0 text-left">
          <h3 className="font-bold text-base text-white tracking-wide leading-tight flex items-center gap-1.5">
            <span>Add Book, PDF or Discovery</span>
            <span className="text-amber-300">📚</span>
          </h3>
          <p className="text-xs text-amber-200/90 font-serif italic mt-0.5 leading-relaxed truncate">
            Share a book, film, dish, PDF read, or cozy recommendation ✨
          </p>
        </div>
      </div>

      {/* 2. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientBg} />
        <div className={styles.heroRadialGlow} />

        <div className={styles.heroContent}>
          {/* Left Decorative Artwork & Subtitles */}
          <div className={styles.heroLeft}>
            <div className={styles.heroArtwork}>
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="The Exchange Shelf"
              />
              <div className={styles.heroArtworkOverlay}>
                <Book className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroTag}>
                <span>〰️ The Exchange Shelf</span>
                <span>✦</span>
              </div>

              <h2 className={styles.heroTitle}>
                <span>The Exchange Shelf</span>
                <span className={styles.heroTitleHeart}>♡</span>
              </h2>

              <p className={styles.heroSubtitle}>
                Books, PDF reads, films, dishes, and places to discover together.
              </p>

              <div className={styles.heroSubmeta}>
                PDF Uploads • Photos • Recommendations
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className={styles.heroRightBtnWrapper}>
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className={styles.heroRightActionBtn}
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
        <div className={styles.emptyStateCard}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: 'rgba(251, 191, 36, 0.16)',
            border: '1px solid var(--shf-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--shf-amber-light)',
          }}>
            <Book className="w-6 h-6 animate-pulse" />
          </div>
          <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', color: '#ffffff', margin: 0 }}>
            No recommendations on this shelf yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--shf-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.6 }}>
            {selectedCategory === 'all'
              ? 'Share a book, PDF, film, restaurant or hobby you want to experience together.'
              : `No items currently under "${CATEGORY_MAP[selectedCategory]?.label || selectedCategory}".`}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAdd(selectedCategory === 'all' ? undefined : selectedCategory)}
            className={styles.heroTriggerBtn}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Item 📚</span>
          </button>
        </div>
      ) : (
        <div className={styles.itemsGrid}>
          {filteredItems.map((item) => {
            const isAddedByMe = item.contributorId === currentUser.id;
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.books;
            const Icon = cat.icon;
            const displayPhoto = item.photoUrl || '/assets/garden/card_shelf.jpg';

            return (
              <div key={item.id} className={styles.itemCard}>
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className={styles.itemUpper}>
                  <div
                    onClick={() => setSelectedItem(item)}
                    className={styles.itemCover}
                    title="Click to view details"
                  >
                    <img
                      src={displayPhoto}
                      alt={item.title}
                    />
                    <div className={styles.itemCoverOverlay}>
                      <div className={styles.itemCoverBadge}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemMeta}>
                    <div className={styles.itemHeaderRow}>
                      <h3
                        onClick={() => setSelectedItem(item)}
                        className={styles.itemTitle}
                      >
                        {item.title}
                      </h3>

                      <span className={`${styles.categoryBadge} ${cat.badge}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </span>
                    </div>

                    {/* PDF Badge if attached */}
                    {item.pdfUrl && (
                      <div>
                        <button
                          type="button"
                          onClick={() => openPdf(item.pdfUrl!, item.pdfFileName)}
                          className={styles.readPdfBtn}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Read PDF: {item.pdfFileName || 'Book Attachment'}</span>
                        </button>
                      </div>
                    )}

                    {item.description ? (
                      <p className={styles.itemDesc}>
                        “{item.description}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className={styles.itemDesc} style={{ opacity: 0.6 }}>
                        Recommended for our shared journey...
                      </p>
                    )}
                  </div>
                </div>

                {/* Voice Note if attached */}
                {item.voiceNoteUrl && (
                  <div style={{ paddingTop: '4px' }}>
                    <GardenAudioPlayer
                      src={item.voiceNoteUrl}
                      title={`Voice Note: ${item.title}`}
                      subtitle={`Shared by ${item.contributorName || 'Garden'}`}
                      isVoiceNote={true}
                    />
                  </div>
                )}

                {/* Footer Row: Author + Reaction + Details */}
                <div className={styles.itemFooter}>
                  <div className={styles.authorRow}>
                    <span className={styles.authorAvatar}>
                      👤
                    </span>
                    <span className={styles.authorName}>
                      By: {isAddedByMe ? 'You' : item.contributorName || partner.displayName}
                    </span>
                  </div>

                  <div className={styles.cardActionBtns}>
                    <button
                      type="button"
                      onClick={() => handleToggleReaction(item)}
                      className={styles.reactionBtn}
                      title="Click to cycle reaction"
                    >
                      <span>{(item as any).reaction || 'Must try! 💖'}</span>
                    </button>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkIconBtn}
                        title="Open external link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={styles.detailsBtn}
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
      <section className={styles.bottomActionSection}>
        <div className={styles.addItemCard}>
          <div className={styles.addItemLeft}>
            <div className={styles.addItemThumb}>
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="Exchange Cabinet"
              />
            </div>
            <div className={styles.addItemMeta}>
              <h4 className={styles.addItemTitle}>
                Add a Book, PDF or Discovery
              </h4>
              <p className={styles.addItemSubtitle}>
                Upload a book PDF from your phone, photo, or cozy idea.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className={styles.addItemBtn}
          >
            <Book className="w-3.5 h-3.5" />
            <span>Add to Shelf →</span>
          </button>
        </div>

        {/* Quick Filter Pill Card */}
        <div className={styles.categoryFilterCard}>
          <div>
            <div className={styles.categoryFilterHeader}>
              <Filter className="w-3.5 h-3.5 text-amber-300" />
              <span>Category Filter</span>
            </div>

            <div className={styles.categoryPillsGroup} style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setSelectedCategory('all');
                }}
                className={`${styles.categoryPill} ${
                  selectedCategory === 'all' ? styles.categoryPillActive : ''
                }`}
              >
                📚 All
              </button>

              {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((catKey) => {
                const cat = CATEGORY_MAP[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      soundEngine.playSparkle();
                      setSelectedCategory(catKey);
                    }}
                    className={`${styles.categoryPill} ${
                      selectedCategory === catKey ? styles.categoryPillActive : ''
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
          className={styles.modalBackdrop}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <Book className="w-4 h-4 text-amber-300" />
                <span style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--shf-amber-light)' }}>
                  Recommendation Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {selectedItem.title}
                </h3>
                <span
                  className={`${styles.categoryBadge} ${
                    CATEGORY_MAP[selectedItem.category]?.badge || ''
                  }`}
                >
                  <span>{CATEGORY_MAP[selectedItem.category]?.label}</span>
                </span>
              </div>

              {selectedItem.photoUrl && (
                <div style={{ borderRadius: '16px', overflow: 'hidden', maxHeight: '220px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <img src={selectedItem.photoUrl} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {selectedItem.description && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid var(--shf-border)',
                }}>
                  <div style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--shf-amber-light)', opacity: 0.8, marginBottom: '4px' }}>
                    Why It's Recommended
                  </div>
                  <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#fffdf5', margin: 0, lineHeight: 1.6 }}>
                    “{selectedItem.description}” ♡
                  </p>
                </div>
              )}

              {selectedItem.pdfUrl && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a7f3d0' }}>
                    <FileText className="w-4 h-4 text-emerald-300" />
                    <span>{selectedItem.pdfFileName || 'Book PDF Attached'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPdf(selectedItem.pdfUrl!, selectedItem.pdfFileName)}
                    className={styles.readPdfBtn}
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
                <div>
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontFamily: 'ui-monospace, monospace',
                      color: 'var(--shf-amber-light)',
                      textDecoration: 'underline',
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open External Reference / Link</span>
                  </a>
                </div>
              )}
            </div>

            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(251, 191, 36, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              {selectedItem.contributorId === currentUser.id ? (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.18)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#fda4af',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Item</span>
                </button>
              ) : (
                <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--shf-muted)' }}>
                  Recommended by {selectedItem.contributorName || partner.displayName}
                </span>
              )}

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className={styles.cancelBtn}
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
          className={styles.modalBackdrop}
          onClick={() => setIsAdding(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <span style={{
                  padding: '8px',
                  borderRadius: '12px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid var(--shf-border)',
                  color: 'var(--shf-amber-light)',
                  display: 'flex',
                }}>
                  <Book className="w-4 h-4" />
                </span>
                <div>
                  <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Add Recommendation to Shelf
                  </h4>
                  <p style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--shf-amber-light)', opacity: 0.8, margin: '2px 0 0 0' }}>
                    Upload book PDF, photo, or share an adventure
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className={styles.modalCloseBtn}
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Buttons: PDF of Book, Photo, Voice Note */}
            <div className={styles.uploadChoiceGrid}>
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className={`${styles.uploadChoiceBtn} ${
                  pdfUrl ? styles.uploadChoiceActive : ''
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Upload PDF Book</span>
              </button>

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`${styles.uploadChoiceBtn} ${
                  photoUrl ? styles.uploadChoiceActive : ''
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-300" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecorder(!showRecorder)}
                className={`${styles.uploadChoiceBtn} ${
                  showRecorder || voiceNoteUrl ? styles.uploadChoiceActive : ''
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
              <div style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#a7f3d0',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <FileText className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {pdfFileName || 'PDF Book'}
                  </span>
                  {pdfFileSize && (
                    <span style={{ fontSize: '10px', opacity: 0.75, fontFamily: 'monospace' }}>
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
                  style={{ color: '#fda4af', background: 'transparent', border: 0, cursor: 'pointer', marginLeft: '8px' }}
                >
                  Remove
                </button>
              </div>
            )}

            {photoUrl && (
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', maxHeight: '160px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '6px',
                    borderRadius: '9999px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: '#ffffff',
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {voiceNoteUrl && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '14px',
                background: 'rgba(244, 114, 182, 0.15)',
                border: '1px solid rgba(244, 114, 182, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--shf-text)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>Voice Note Attached</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceNoteUrl(undefined)}
                  style={{ color: '#fda4af', background: 'transparent', border: 0, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Category *</span>
                </label>
                <div className={styles.catChoiceGrid}>
                  {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((catKey) => {
                    const c = CATEGORY_MAP[catKey];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`${styles.catChoiceBtn} ${
                          category === catKey ? styles.catChoiceActive : ''
                        }`}
                      >
                        <span>{c.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Title / Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Alchemist, About Time, or Boba Place"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Why You Recommend It</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Super cozy vibe, we have to read/watch it together"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Link (Optional)</span>
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Optional reference: https://... (leave empty if none)"
                  className={styles.formInput}
                />
              </div>

              {errorMsg && (
                <p style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(159, 18, 57, 0.4)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#fda4af',
                  fontSize: '12px',
                  margin: 0,
                }}>
                  {errorMsg}
                </p>
              )}

              <div className={styles.formFooter}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
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
