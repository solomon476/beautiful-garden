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

const CATEGORY_MAP: Record<ShelfCategory, { label: string; icon: any; color: string }> = {
  films: { label: 'Films & Series', icon: Film, color: 'text-amber-300 bg-amber-500/15 border-amber-400/30' },
  books: { label: 'Books', icon: Book, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' },
  food: { label: 'Food & Recipes', icon: Utensils, color: 'text-rose-300 bg-rose-500/15 border-rose-400/30' },
  places: { label: 'Places to Visit', icon: MapPin, color: 'text-sky-300 bg-sky-500/15 border-sky-400/30' },
  activities: { label: 'Activities', icon: Compass, color: 'text-purple-300 bg-purple-500/15 border-purple-400/30' },
  music: { label: 'Music & Albums', icon: Sparkles, color: 'text-pink-300 bg-pink-500/15 border-pink-400/30' },
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
      setErrorMsg('Please provide a title.');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>The Exchange Shelf</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Films, Books, Food & Discoveries
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            A shared cabinet of things to watch, read, taste, visit and experience together.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Recommendation</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-pink-500/20 text-pink-200 border border-pink-400/40'
              : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          All Items ({items.length})
        </button>

        {(Object.keys(CATEGORY_MAP) as ShelfCategory[]).map((cat) => {
          const cfg = CATEGORY_MAP[cat];
          const count = items.filter((i) => i.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-pink-500/20 text-pink-200 border border-pink-400/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <span>{cfg.label}</span>
              {count > 0 && <span className="text-[10px] opacity-70 font-mono">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Add to the Exchange Shelf
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Past Lives (2023)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShelfCategory)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                >
                  <option value="films">Films & Series</option>
                  <option value="books">Books</option>
                  <option value="food">Food & Recipes</option>
                  <option value="places">Places to Visit</option>
                  <option value="activities">Activities & Experiences</option>
                  <option value="music">Music & Albums</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Description / Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why you recommend it, when we should try it, or what it's about..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Optional Link / Location URL
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-md"
              >
                Place on Shelf
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Items */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Opening shelf...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">This Shelf is Clean & Ready</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Share a movie, book, favorite spot, or late-night dessert recipe.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Add an Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isMine = item.contributorId === currentUser.id;
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.films;
            const Icon = catInfo.icon;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-pink-400/30 transition-all flex flex-col justify-between space-y-3 shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${catInfo.color}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {catInfo.label}
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-semibold text-white mb-1 group-hover:text-pink-200 transition-colors">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-xs text-slate-300/80 line-clamp-3 font-light leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 mt-2 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View reference link</span>
                    </a>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Rec by: {isMine ? 'You' : item.contributorName || partner.displayName}</span>

                  {isMine && (
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 hover:text-rose-400 transition-colors opacity-80 hover:opacity-100"
                      title="Delete item"
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
