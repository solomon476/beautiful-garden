import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { shelfService, authService } from '../../services/gardenService';
import type { ShelfEntry, ShelfCategory, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

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
  const [category, setCategory] = useState<ShelfCategory>('films');
  const [description, setDescription] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setCategory('films');
    setDescription('');
    setLink('');
    setErrorMsg(null);
    setIsAdding(true);
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
        link,
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

  const filteredItems = items.filter((i) => {
    if (selectedCategory === 'all') return true;
    return i.category === selectedCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup Format */}
      <section
        className="relative rounded-3xl overflow-hidden border border-amber-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 24, 18, 0.94) 0%, rgba(20, 12, 10, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
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

        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-amber-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="The Exchange Shelf"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Book className="w-8 h-8 text-amber-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ The Exchange Shelf</span>
                <span className="text-amber-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>The Exchange Shelf</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-amber-200/90 max-w-xl leading-relaxed">
                Films, books, dishes, and places to discover and experience together.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-amber-300/70 pt-1">
                Discover • Share • Recommend • Enjoy
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Recommendation</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Shelf Recommendations Grid — 2 Column Responsive Glass Cards matching Mockup */}
      {loading ? (
        <div className="py-16 text-center text-amber-300/60 text-xs font-mono animate-pulse">
          Opening the exchange cabinet...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-4 border border-amber-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Book className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-2xl text-white">No recommendations on this shelf yet</h4>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-md mx-auto font-light leading-relaxed">
            {selectedCategory === 'all'
              ? 'Share a book, film, restaurant or hobby you want to experience together.'
              : `No items currently under "${CATEGORY_MAP[selectedCategory]?.label || selectedCategory}".`}
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Item 📚</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredItems.map((item) => {
            const isAddedByMe = item.contributorId === currentUser.id;
            const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.films;
            const Icon = cat.icon;

            return (
              <div
                key={item.id}
                className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-amber-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(38, 24, 18, 0.65) 0%, rgba(20, 12, 10, 0.8) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Left Square Artwork with Icon */}
                  <div
                    onClick={() => setSelectedItem(item)}
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover cursor-pointer"
                    style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px', maxWidth: '112px', maxHeight: '112px' }}
                    title="Click to view details"
                  >
                    <img
                      src="/assets/garden/card_shelf.jpg"
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500/80 text-white flex items-center justify-center shadow-lg group-hover/cover:scale-110 transition-all">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Category Badge, & Description */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title + Category Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                        {item.title}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${cat.badge}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </span>
                    </div>

                    {/* Date Added */}
                    <div className="text-[11px] text-amber-300/70 font-mono">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>

                    {/* Description */}
                    {item.description ? (
                      <p className="text-xs text-amber-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                        “{item.description}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-300/60 font-serif italic line-clamp-1 pt-1">
                        Recommended for our shared journey...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + View Details Button */}
                <div className="pt-3 border-t border-amber-400/20 flex items-center justify-between gap-3 text-xs">
                  {/* Contributor Avatar & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[11px] text-amber-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-amber-200/90 truncate">
                      By: {isAddedByMe ? 'You' : item.contributorName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & View Details Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(item)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/30 text-[11px] text-amber-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle reaction"
                    >
                      <span>{(item as any).reaction || 'Must try! 💖'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="btn-glow-romantic text-[11px] py-1 px-3.5 shadow-sm"
                    >
                      <span>View Details</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Action & Filter Section — Matching Mockup Format */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-2">
        {/* Left Card: Add Recommendation Banner (~7 Cols) */}
        <div
          className="lg:col-span-7 rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 justify-between border border-amber-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 20, 14, 0.7) 0%, rgba(18, 10, 8, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
            <div
              className="rounded-2xl overflow-hidden border border-amber-400/30 shrink-0 shadow-lg group"
              style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
            >
              <img
                src="/assets/garden/card_shelf.jpg"
                alt="Exchange Cabinet"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Add Your Own Recommendation
              </h4>
              <p className="text-xs sm:text-sm text-amber-200/80 font-light leading-relaxed">
                Share a film, book, cafe or recipe to add to our shared cabinet.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <Book className="w-3.5 h-3.5" />
            <span>Add Recommendation →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters (~5 Cols) */}
        <div
          className="lg:col-span-5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 border border-amber-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(28, 16, 12, 0.7) 0%, rgba(16, 8, 6, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-amber-300" />
              <span>Quick Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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

          <div className="pt-2 border-t border-amber-400/15 flex items-center justify-between text-xs text-amber-300/80">
            <span className="font-serif italic text-amber-200/90 text-sm">
              Sharing what we love brings us closer ♡
            </span>
            <span className="text-base">🌸</span>
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
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-amber-400/40 shadow-2xl relative space-y-6"
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
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-white truncate">{selectedItem.title}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${
                    CATEGORY_MAP[selectedItem.category]?.badge || ''
                  }`}
                >
                  <span>{CATEGORY_MAP[selectedItem.category]?.label}</span>
                </span>
              </div>

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

              {selectedItem.link && (
                <div className="pt-2">
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

      {/* 5. Add Modal Form */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-amber-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                  <Book className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Add Recommendation to Shelf
                  </h4>
                  <p className="text-[11px] text-amber-200/70 font-mono uppercase tracking-wider">
                    Shared cabinet for things we want to experience
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

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="form-field-label">
                  <span>Category *</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((catKey) => {
                    const c = CATEGORY_MAP[catKey];
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
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
                  placeholder="e.g. About Time (2013) or Matcha Boba"
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
                  placeholder="e.g. Super cozy vibe, we have to watch it together"
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
                  placeholder="https://imdb.com/title/... or https://..."
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-400/20">
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
