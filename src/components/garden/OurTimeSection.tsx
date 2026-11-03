import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Filter,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import { hangoutService, authService } from '../../services/gardenService';
import type { HangoutEntry, HangoutStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

const STATUS_MAP: Record<HangoutStatus, { label: string; icon: string; badge: string }> = {
  proposed: {
    label: 'Proposed',
    icon: '💡',
    badge: 'bg-amber-500/25 border-amber-400/50 text-amber-200',
  },
  interested: {
    label: 'Interested!',
    icon: '🙋‍♀️',
    badge: 'bg-sky-500/25 border-sky-400/50 text-sky-200',
  },
  confirmed: {
    label: 'Confirmed',
    icon: '✨',
    badge: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-sm shadow-emerald-500/20',
  },
  completed: {
    label: 'Completed',
    icon: '💖',
    badge: 'bg-purple-500/25 border-purple-400/50 text-purple-200',
  },
  declined: {
    label: 'Maybe Later',
    icon: '☕',
    badge: 'bg-white/10 border-white/20 text-slate-300',
  },
};

export const OurTimeSection: React.FC = () => {
  const [plans, setPlans] = useState<HangoutEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | HangoutStatus>('all');

  // Modal states
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<HangoutEntry | null>(null);

  // Form
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [proposedDate, setProposedDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const partner = authService.getPartner();

  const loadPlans = async () => {
    try {
      setLoading(true);
      const list = await hangoutService.getHangouts();
      setPlans(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadPlans();
    });
    return unsubscribe;
  }, []);

  const handleOpenAdd = () => {
    soundEngine.playSparkle();
    setTitle('');
    setDescription('');
    setProposedDate('');
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please specify an activity or place.');
      return;
    }

    try {
      await hangoutService.addHangout({
        title,
        description,
        proposedDate,
      });

      soundEngine.playChime(587.33, 1.2, 0.08);
      setIsAdding(false);
      await loadPlans();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save suggestion.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: HangoutStatus) => {
    soundEngine.playSparkle();
    await hangoutService.updateHangoutStatus(id, newStatus);
    await loadPlans();
    if (selectedPlan && selectedPlan.id === id) {
      setSelectedPlan({ ...selectedPlan, status: newStatus });
    }
  };

  const handleDelete = async (plan: HangoutEntry) => {
    if (plan.suggestedBy !== currentUser.id) return;
    if (window.confirm(`Delete activity suggestion "${plan.title}"?`)) {
      await hangoutService.deleteHangout(plan.id);
      setSelectedPlan(null);
      await loadPlans();
    }
  };

  const handleToggleReaction = async (plan: HangoutEntry) => {
    soundEngine.playSparkle();
    const reactions = ['Count me in! 🎉', 'Sounds delicious! 🍦', 'Can’t wait! ✨', 'Super cozy 🌸'];
    const currentReaction = (plan as any).reaction || '';
    const currentIdx = reactions.findIndex((r) => r.includes(currentReaction.replace(/[^\w\s]/gi, '').trim()));
    const nextReaction = reactions[(currentIdx + 1) % reactions.length];

    const updated = plans.map((p) => (p.id === plan.id ? { ...p, reaction: nextReaction } : p));
    setPlans(updated);
    if (selectedPlan?.id === plan.id) {
      setSelectedPlan({ ...selectedPlan, reaction: nextReaction } as any);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner — Matching Mockup Format */}
      <section
        className="relative rounded-3xl overflow-hidden border border-teal-400/30 shadow-2xl p-6 sm:p-10 lg:p-12"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 36, 44, 0.94) 0%, rgba(10, 20, 30, 0.98) 100%)',
        }}
      >
        {/* Ambient Hero Background Art */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('/assets/garden/card_time.jpg')` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 15% 50%, rgba(20, 184, 166, 0.25) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(244, 114, 182, 0.25) 0%, transparent 60%)',
          }}
        />

        <div
          className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ width: '100%' }}
        >
          {/* Left Decorative Illuminated Artwork */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-teal-300/40 shadow-xl shrink-0 group"
              style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px' }}
            >
              <img
                src="/assets/garden/card_time.jpg"
                alt="Our Time Calendar"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-teal-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Our Time Planning</span>
                <span className="text-teal-300">✦</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Our Time</span>
                <span className="text-pink-400 font-sans text-2xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-sm sm:text-base text-teal-200/90 max-w-xl leading-relaxed">
                Hangout ideas, date nights, and casual adventures with zero pressure.
              </p>

              <div className="text-[11px] font-mono tracking-widest uppercase text-teal-300/70 pt-1">
                Plan • Experience • Cherish • Together
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-3 px-6 shadow-xl"
            >
              <CalendarDays className="w-4 h-4 text-white" />
              <span>Suggest an Activity</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Hangout Ideas Grid — 2 Column Responsive Glass Cards matching Mockup */}
      {loading ? (
        <div className="py-16 text-center text-teal-300/60 text-xs font-mono animate-pulse">
          Loading scheduled garden adventures...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-4 border border-teal-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
            <CalendarDays className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-2xl text-white">No plans in this view yet</h4>
          <p className="text-xs sm:text-sm text-teal-200/80 max-w-md mx-auto font-light leading-relaxed">
            {activeFilter === 'all'
              ? 'Suggest spontaneous hangouts, dinner runs, or weekend plans with zero pressure.'
              : `No activities currently tagged as "${activeFilter}".`}
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Propose an Idea 🌷</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredPlans.map((plan) => {
            const isAddedByMe = plan.suggestedBy === currentUser.id;
            const badge = STATUS_MAP[plan.status] || STATUS_MAP.proposed;
            const coverImage = (plan as any).coverUrl || '/assets/garden/card_time.jpg';

            return (
              <div
                key={plan.id}
                className="group relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:scale-[1.01] hover:border-teal-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(18, 38, 48, 0.65) 0%, rgba(10, 22, 32, 0.8) 100%)',
                  border: '1px solid rgba(45, 212, 191, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Section: Artwork on Left + Info on Right */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div
                    className="relative rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-lg group/cover"
                    style={{ width: '112px', height: '112px', minWidth: '112px', minHeight: '112px', maxWidth: '112px', maxHeight: '112px' }}
                  >
                    <img
                      src={coverImage}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-teal-500/80 text-white flex items-center justify-center shadow-lg">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Status, Date & Description */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-teal-200 transition-colors truncate">
                        {plan.title}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${badge.badge}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {/* Proposed Date / Time */}
                    {plan.proposedDate ? (
                      <div className="flex items-center gap-1.5 text-xs text-teal-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                        <span className="truncate">{plan.proposedDate}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-teal-200/60 font-mono">Anytime / Casual</div>
                    )}

                    {/* Description */}
                    {plan.description ? (
                      <p className="text-xs text-teal-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                        “{plan.description}” <span className="font-sans not-italic text-pink-300">♡</span>
                      </p>
                    ) : (
                      <p className="text-xs text-teal-300/60 font-serif italic line-clamp-1 pt-1">
                        Looking forward to this adventure...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Row: Author + Reaction + View Details Button */}
                <div className="pt-3 border-t border-teal-400/20 flex items-center justify-between gap-3 text-xs">
                  {/* Contributor Avatar & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[11px] text-teal-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-teal-200/90 truncate">
                      By: {isAddedByMe ? 'You' : plan.suggestedByName || partner.displayName}
                    </span>
                  </div>

                  {/* Reaction Pill & View Details Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleReaction(plan)}
                      className="px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-teal-400/30 text-[11px] text-teal-200 hover:text-white transition-all flex items-center gap-1 active:scale-95"
                      title="Click to cycle RSVP reaction"
                    >
                      <span>{(plan as any).reaction || 'Count me in! 🎉'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedPlan(plan)}
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
        {/* Left Card: Propose Activity Banner (~7 Cols) */}
        <div
          className="lg:col-span-7 rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 justify-between border border-teal-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 36, 44, 0.7) 0%, rgba(10, 20, 32, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
            <div
              className="rounded-2xl overflow-hidden border border-teal-400/30 shrink-0 shadow-lg group"
              style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
            >
              <img
                src="/assets/garden/card_time.jpg"
                alt="Calendar"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Suggest Another Date Idea
              </h4>
              <p className="text-xs sm:text-sm text-teal-200/80 font-light leading-relaxed">
                Propose a fun dinner, movie night, walk, or spontaneous road trip...
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs py-2.5 px-5 shrink-0 w-full sm:w-auto justify-center"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Propose Activity →</span>
          </button>
        </div>

        {/* Right Card: Quick Filters (~5 Cols) */}
        <div
          className="lg:col-span-5 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between space-y-4 border border-teal-400/30 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 30, 40, 0.7) 0%, rgba(8, 18, 28, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-300/80 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-teal-300" />
              <span>Quick Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('all');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-teal-500/30 border border-teal-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-teal-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📅 All
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('interested');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'interested'
                    ? 'bg-sky-500/30 border border-sky-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-teal-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🙋‍♀️ Interested
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('confirmed');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'confirmed'
                    ? 'bg-emerald-500/30 border border-emerald-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-teal-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✨ Confirmed
              </button>

              <button
                onClick={() => {
                  soundEngine.playSparkle();
                  setActiveFilter('proposed');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeFilter === 'proposed'
                    ? 'bg-amber-500/30 border border-amber-400/50 text-white shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-teal-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                💡 Proposed
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-teal-400/15 flex items-center justify-between text-xs text-teal-300/80">
            <span className="font-serif italic text-teal-200/90 text-sm">
              Time together is our favorite time ♡
            </span>
            <span className="text-base">🌷</span>
          </div>
        </div>
      </section>

      {/* 4. Details Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="glass-midnight-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-teal-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-teal-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-teal-300/80 uppercase tracking-wider">
                <CalendarDays className="w-4 h-4 text-teal-300" />
                <span>Activity Details</span>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-white truncate">{selectedPlan.title}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                    STATUS_MAP[selectedPlan.status]?.badge || ''
                  }`}
                >
                  <span>{STATUS_MAP[selectedPlan.status]?.icon}</span>
                  <span>{STATUS_MAP[selectedPlan.status]?.label}</span>
                </span>
              </div>

              {selectedPlan.proposedDate && (
                <div className="flex items-center gap-2 text-xs text-teal-300 font-mono">
                  <Clock className="w-4 h-4 text-teal-300" />
                  <span>{selectedPlan.proposedDate}</span>
                </div>
              )}

              {selectedPlan.description && (
                <div className="quote-whisper-bubble space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-teal-300/80">
                    Vibe & Details
                  </div>
                  <p className="font-serif italic text-sm text-teal-100/95 leading-relaxed">
                    “{selectedPlan.description}” ♡
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-mono uppercase tracking-wider text-teal-300/80 block">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['interested', 'confirmed', 'completed'] as HangoutStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedPlan.id, st)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      selectedPlan.status === st
                        ? 'bg-teal-500/30 border-teal-400/60 text-white font-semibold shadow-md'
                        : 'bg-white/[0.04] border-white/10 text-teal-200/70 hover:text-white'
                    }`}
                  >
                    {st === 'interested' && '🙋‍♀️ Interested'}
                    {st === 'confirmed' && '✨ Confirmed'}
                    {st === 'completed' && '💖 Completed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-teal-400/20 flex items-center justify-between gap-3">
              {selectedPlan.suggestedBy === currentUser.id ? (
                <button
                  onClick={() => handleDelete(selectedPlan)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Idea</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-teal-300/60">
                  Suggested by {selectedPlan.suggestedByName || partner.displayName}
                </span>
              )}

              <button
                onClick={() => setSelectedPlan(null)}
                className="btn-glow-romantic text-xs py-2 px-5"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Hangout Modal Form */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-7 sm:p-9 rounded-3xl border border-teal-400/40 shadow-2xl relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-teal-400/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-300">
                  <CalendarDays className="w-4 h-4 text-teal-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Propose a New Experience
                  </h4>
                  <p className="text-[11px] text-teal-200/70 font-mono uppercase tracking-wider">
                    Hangout ideas, date nights, and casual adventures
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
                  <span>Activity or Place *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Try that new matcha spot or late-night dessert..."
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Proposed Date or Timing (Optional)</span>
                </label>
                <input
                  type="text"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  placeholder="e.g. This Saturday evening or next weekend"
                />
              </div>

              <div>
                <label className="form-field-label">
                  <span>Extra Details or Vibe</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Looks super chill, great music and cozy booths"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-teal-400/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Propose Activity ✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
