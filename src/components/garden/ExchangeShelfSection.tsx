import React, { useState, useEffect } from 'react';
import {
  Layers,
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
} from 'lucide-react';
import { shelfService, authService } from '../../services/gardenService';
import type { ShelfEntry, ShelfCategory, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

const CATEGORY_MAP: Record<ShelfCategory, { label: string; icon: any; color: string; badge: string }> = {
  films: {
    label: 'Films & Series',
    icon: Film,
    color: 'from-amber-500 to-orange-400',
    badge: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
  },
  books: {
    label: 'Books & Reads',
    icon: Book,
    color: 'from-emerald-500 to-teal-400',
    badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
  },
  food: {
    label: 'Food & Recipes',
    icon: Utensils,
    color: 'from-rose-500 to-pink-400',
    badge: 'bg-rose-500/20 border-rose-400/40 text-rose-200',
  },
  places: {
    label: 'Places to Visit',
    icon: MapPin,
    color: 'from-sky-500 to-indigo-400',
    badge: 'bg-sky-500/20 border-sky-400/40 text-sky-200',
  },
  activities: {
    label: 'Activities',
    icon: Compass,
    color: 'from-purple-500 to-fuchsia-400',
    badge: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
  },
  music: {
    label: 'Music & Vinyls',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-400',
    badge: 'bg-pink-500/20 border-pink-400/40 text-pink-200',
  },
};

export const ExchangeShelfSection: React.FC = () => {
  const [items, setItems] = useState<ShelfEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ShelfCategory | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form state
  const [isAdding, setIsAdding] = useState<boolean>(false);
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
      setErrorMsg('Please provide a title for the shelf item.');
      return;
    }

    try {
      await shelfService.addItem({
        title,
        category,
        description,
        link,
      });

      soundEngine.playChime(587.33, 1.2, 0.08);
      setIsAdding(false);
      await loadItems();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save item.');
    }
  };

  const handleDelete = async (item: ShelfEntry) => {
    if (item.contributorId !== currentUser.id) return;
    if (window.confirm(`Remove "${item.title}" from the shelf?`)) {
      await shelfService.deleteItem(item.id);
      await loadItems();
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-400/15">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>The Exchange Shelf</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Films, Books, Food & Discoveries
          </h3>
          <p className="font-handwriting text-lg text-amber-200/80 mt-0.5">
            A shared cabinet of things to watch, read, taste, visit and experience together.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Recommendation</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white border border-pink-400/50 shadow-sm font-semibold'
              : 'bg-white/5 text-slate-300/80 hover:text-white border border-white/10 hover:bg-white/10'
          }`}
        >
          All Recommendations ({items.length})
        </button>

        {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((cat) => {
          const cfg = CATEGORY_MAP[cat];
          const count = items.filter((i) => i.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-rose-500/30 text-white border border-pink-400/50 shadow-sm font-semibold'
                  : 'bg-white/5 text-slate-300/80 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{cfg.label}</span>
              {count > 0 && <span className="text-[10px] opacity-75 font-mono">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="glass-midnight-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Add to the Exchange Shelf
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Past Lives (2023)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShelfCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner"
                >
                  <option value="films">Films & Series 🎬</option>
                  <option value="books">Books & Reads 📚</option>
                  <option value="food">Food & Recipes 🍝</option>
                  <option value="places">Places to Visit ✈️</option>
                  <option value="activities">Activities & Experiences 🧭</option>
                  <option value="music">Music & Vinyls 🎵</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                Description / Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why you recommend it, when we should try it, or what makes it special..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner resize-y font-light"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-amber-200/70 uppercase tracking-wider mb-1">
                Reference Link / Maps Link (Optional)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-amber-400/20 text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-300">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-amber-500/25 border border-white/20"
              >
                Place on Shelf ✨
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Items */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Opening cabinet shelves...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl text-white">This Shelf Section is Clean & Ready</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Share a movie to watch together, a dessert recipe to try, or an adventure destination.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-200 text-xs font-medium border border-amber-400/30 transition-all hover:scale-105"
          >
            Add an Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredItems.map((item) => {
            const isMine = item.contributorId === currentUser.id;
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.films;
            const Icon = catInfo.icon;

            return (
              <div
                key={item.id}
                className="glass-midnight-card group p-5 sm:p-6 rounded-2xl hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3 shadow-md relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${catInfo.badge}`}
                    >
                      <Icon className="w-3 h-3" />
                      {catInfo.label}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-white mb-1.5 group-hover:text-amber-200 transition-colors">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 font-light leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 mt-2 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open reference link</span>
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-handwriting text-base text-amber-200">
                    Rec by: {isMine ? 'You' : item.contributorName || partner.displayName}
                  </span>

                  {isMine && (
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors opacity-80 hover:opacity-100"
                      title="Delete recommendation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
