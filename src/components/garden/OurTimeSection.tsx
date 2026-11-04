import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Sparkles,
  MapPin,
  Clock,
  Bell,
  CalendarPlus,
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
  const [location, setLocation] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
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
    setLocation('');
    setReminderEnabled(true);
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
        location,
        reminderEnabled,
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

  // Google Calendar Link generator
  const getGoogleCalendarUrl = (plan: HangoutEntry) => {
    const text = encodeURIComponent(`Date with ${partner.displayName}: ${plan.title}`);
    const details = encodeURIComponent(
      `${plan.description || ''}\n\nPlanned in Our Garden Sanctuary ♡`
    );
    const loc = encodeURIComponent(plan.location || '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${loc}`;
  };

  // Next Upcoming Date for Spotlight
  const upcomingDate = plans.find((p) => p.status === 'confirmed' || p.status === 'proposed');

  const filteredPlans = plans.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* 1. Panoramic Themed Hero Banner */}
      <section
        className="relative rounded-3xl overflow-hidden border border-teal-400/30 shadow-2xl p-5 sm:p-8 lg:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 36, 44, 0.94) 0%, rgba(10, 20, 30, 0.98) 100%)',
        }}
      >
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

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 w-full">
          {/* Left Decorative Artwork & Details */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-teal-300/40 shadow-xl shrink-0 group">
              <img
                src="/assets/garden/card_time.jpg"
                alt="Our Time Calendar"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/70 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-teal-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[10px] font-mono uppercase tracking-widest">
                <span>〰️ Our Time Planning</span>
                <span className="text-teal-300">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Our Time</span>
                <span className="text-pink-400 font-sans text-xl sm:text-3xl">♡</span>
              </h2>

              <p className="font-serif italic text-xs sm:text-base text-teal-200/90 max-w-xl leading-relaxed">
                Hangout ideas, date nights, and sweet adventures with zero pressure.
              </p>

              <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-teal-300/70 pt-0.5">
                Plan • Remind • Experience • Cherish
              </div>

              {/* Direct Left Column Add Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all border border-white/20"
                >
                  <CalendarDays className="w-4 h-4 text-white" />
                  <span>Suggest an Adventure 📅</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className="shrink-0 w-full sm:w-auto flex justify-end">
            <button
              onClick={handleOpenAdd}
              className="btn-glow-romantic text-xs sm:text-sm font-semibold tracking-wide py-2.5 sm:py-3 px-5 sm:px-6 shadow-xl w-full sm:w-auto justify-center"
            >
              <CalendarDays className="w-4 h-4 text-white" />
              <span>Suggest a Date or Hangout 📅</span>
            </button>
          </div>
        </div>
      </section>

      {/* Spotlight: Next Upcoming Date Alert */}
      {upcomingDate && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-500/20 via-emerald-500/15 to-purple-500/15 border border-teal-400/40 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/30 border border-teal-400/40 text-teal-200 shadow-md">
              <Sparkles className="w-5 h-5 text-teal-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-300 font-bold">
                  Next Garden Adventure ✨
                </span>
                <span className="text-xs">{STATUS_MAP[upcomingDate.status]?.icon}</span>
              </div>
              <h4 className="font-serif text-base sm:text-lg font-bold text-white mt-0.5">
                {upcomingDate.title}
              </h4>
              <p className="text-xs text-teal-100/80 font-light">
                {upcomingDate.proposedDate ? `Scheduled for: ${upcomingDate.proposedDate}` : 'Date in planning'}
                {upcomingDate.location ? ` • ${upcomingDate.location}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={getGoogleCalendarUrl(upcomingDate)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-teal-500/25 hover:bg-teal-500/40 border border-teal-400/40 text-teal-100 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>Add to Phone Calendar</span>
            </a>
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => {
            soundEngine.playSparkle();
            setActiveFilter('all');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-teal-500/30 border border-teal-400/60 text-white shadow-md'
              : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          All Dates & Ideas
        </button>
        {(['proposed', 'interested', 'confirmed', 'completed'] as HangoutStatus[]).map((statusKey) => {
          const st = STATUS_MAP[statusKey];
          return (
            <button
              key={statusKey}
              onClick={() => {
                soundEngine.playSparkle();
                setActiveFilter(statusKey);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeFilter === statusKey
                  ? 'bg-teal-500/30 border border-teal-400/60 text-white shadow-md'
                  : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <span>{st.icon}</span>
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Hangout Ideas Grid */}
      {loading ? (
        <div className="py-16 text-center text-teal-300/60 text-xs font-mono animate-pulse">
          Loading scheduled garden adventures...
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="glass-midnight-card p-8 sm:p-10 rounded-3xl text-center space-y-4 border border-teal-400/25">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
            <CalendarDays className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-serif text-xl sm:text-2xl text-white">No plans in this view yet</h4>
          <p className="text-xs sm:text-sm text-teal-200/80 max-w-md mx-auto font-light leading-relaxed">
            Suggest spontaneous hangouts, dinner runs, or weekend dates with zero pressure.
          </p>
          <button onClick={handleOpenAdd} className="btn-glow-romantic text-xs mx-auto">
            <Plus className="w-3.5 h-3.5" />
            <span>Propose an Idea 🌷</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredPlans.map((plan) => {
            const isSuggestedByMe = plan.suggestedBy === currentUser.id;
            const statusInfo = STATUS_MAP[plan.status] || STATUS_MAP.proposed;

            return (
              <div
                key={plan.id}
                className="group relative rounded-3xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between space-y-4 hover:border-teal-400/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 36, 44, 0.65) 0%, rgba(10, 20, 30, 0.8) 100%)',
                  border: '1px solid rgba(20, 184, 166, 0.25)',
                  boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Upper Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <h3
                      onClick={() => setSelectedPlan(plan)}
                      className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-teal-200 transition-colors cursor-pointer break-words line-clamp-1"
                    >
                      {plan.title}
                    </h3>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${statusInfo.badge}`}
                    >
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Proposed Date & Location */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-teal-200/90 font-mono">
                    {plan.proposedDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{plan.proposedDate}</span>
                      </span>
                    )}
                    {plan.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        <span>{plan.location}</span>
                      </span>
                    )}
                    {plan.reminderEnabled && (
                      <span className="flex items-center gap-1 text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-400/30">
                        <Bell className="w-3 h-3 text-pink-300" />
                        <span>Reminders On</span>
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-xs text-teal-100/90 font-serif italic line-clamp-2 leading-relaxed pt-1">
                      “{plan.description}” ♡
                    </p>
                  )}
                </div>

                {/* Footer Row */}
                <div className="pt-3 border-t border-teal-400/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[10px] text-teal-300 shrink-0">
                      👤
                    </span>
                    <span className="font-mono text-[11px] text-teal-200/90 truncate">
                      By: {isSuggestedByMe ? 'You' : plan.suggestedByName || partner.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={getGoogleCalendarUrl(plan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-white/[0.06] hover:bg-teal-500/30 border border-white/10 text-teal-200 hover:text-white transition-all"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="btn-glow-romantic text-[11px] py-1 px-3 shadow-sm"
                    >
                      <span>Details & Status</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Details Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="glass-midnight-card max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-teal-400/40 shadow-2xl relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-teal-400/20">
              <div className="flex items-center gap-2 text-xs font-mono text-teal-300/80 uppercase tracking-wider">
                <CalendarDays className="w-4 h-4 text-teal-300" />
                <span>Date & Adventure Details</span>
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
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white truncate">{selectedPlan.title}</h3>
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
                <div className="text-xs font-mono text-teal-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Proposed for: {selectedPlan.proposedDate}</span>
                </div>
              )}

              {selectedPlan.location && (
                <div className="text-xs font-mono text-teal-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Location: {selectedPlan.location}</span>
                </div>
              )}

              {selectedPlan.description && (
                <div className="quote-whisper-bubble space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-teal-300/80">
                    Vibe & Thoughts
                  </div>
                  <p className="font-serif italic text-sm text-teal-100/95 leading-relaxed">
                    “{selectedPlan.description}” ♡
                  </p>
                </div>
              )}

              {/* Status Update Buttons */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono uppercase tracking-wider text-teal-300/80 block">
                  Change Response
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['interested', 'confirmed', 'completed'] as HangoutStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedPlan.id, st)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedPlan.status === st
                          ? 'bg-teal-500/30 border-teal-400/60 text-white font-semibold shadow-md'
                          : 'bg-white/[0.04] border-white/10 text-teal-200/70 hover:text-white'
                      }`}
                    >
                      {st === 'interested' && '🙋‍♀️ Interested'}
                      {st === 'confirmed' && '✨ Confirmed'}
                      {st === 'completed' && '💖 Done'}
                    </button>
                  ))}
                </div>
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

              <a
                href={getGoogleCalendarUrl(selectedPlan)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow-romantic text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Save to Calendar</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Date Suggestion Form */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="glass-midnight-card max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-teal-400/40 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-teal-400/20">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-300">
                  <CalendarDays className="w-4 h-4 text-teal-300" />
                </span>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    Plan an Adventure or Date
                  </h4>
                  <p className="text-[11px] text-teal-200/70 font-mono uppercase tracking-wider">
                    Suggest a cozy date, dinner, or road trip
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-field-label">
                  <span>Activity or Date Idea *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunset walk & gelato, or weekend road trip"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="form-field-label">
                    <span>Proposed Date or Timing</span>
                  </label>
                  <input
                    type="text"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    placeholder="e.g. This Saturday 6:00 PM"
                  />
                </div>

                <div>
                  <label className="form-field-label">
                    <span>Location / Place</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Beachside cafe or park"
                  />
                </div>
              </div>

              <div>
                <label className="form-field-label">
                  <span>Notes / Why It'll Be Fun</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cozy booths, great pastries, relaxing music"
                />
              </div>

              {/* Reminder Checkbox */}
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-300" />
                  <span className="text-xs text-teal-100">Send reminder notification to partner</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded border-teal-400/40 text-teal-500 focus:ring-teal-400"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-300 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-teal-400/20">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-glow-romantic">
                  <Sparkles className="w-4 h-4" />
                  <span>Propose Date ✨</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
