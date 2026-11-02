import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { hangoutService, authService } from '../../services/gardenService';
import type { HangoutEntry, HangoutStatus, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

const STATUS_MAP: Record<HangoutStatus, { label: string; color: string; badge: string }> = {
  proposed: { label: 'Proposed', color: 'text-amber-200', badge: 'bg-amber-500/20 border-amber-400/40 text-amber-200' },
  interested: { label: 'Interested! 🙋‍♀️', color: 'text-sky-200', badge: 'bg-sky-500/20 border-sky-400/40 text-sky-200' },
  confirmed: { label: 'Confirmed ✨', color: 'text-emerald-200', badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 shadow-sm shadow-emerald-500/20' },
  completed: { label: 'Completed 💖', color: 'text-purple-200', badge: 'bg-purple-500/20 border-purple-400/40 text-purple-200' },
  declined: { label: 'Maybe another time', color: 'text-slate-400', badge: 'bg-white/10 border-white/20 text-slate-300' },
};

export const OurTimeSection: React.FC = () => {
  const [plans, setPlans] = useState<HangoutEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form
  const [isAdding, setIsAdding] = useState<boolean>(false);
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
  };

  const handleDelete = async (plan: HangoutEntry) => {
    if (plan.suggestedBy !== currentUser.id) return;
    if (window.confirm(`Delete activity suggestion "${plan.title}"?`)) {
      await hangoutService.deleteHangout(plan.id);
      await loadPlans();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-teal-400/15">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-200 text-[10px] font-mono uppercase tracking-widest">
            <CalendarDays className="w-3 h-3 text-teal-300" />
            <span>Our Time</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gradient-garden">
            Hangout Ideas & Activity Planning
          </h3>
          <p className="text-xs sm:text-sm text-teal-200/80 font-light leading-relaxed max-w-xl">
            Suggest spontaneous hangouts, dinner runs, or weekend plans with zero pressure.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-glow-romantic self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Suggest an Activity</span>
        </button>
      </div>

      {/* Add Form with Luxurious Breathing Room */}
      {isAdding && (
        <div className="glass-midnight-card max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] space-y-6 sm:space-y-7 animate-fade-in relative overflow-hidden border border-teal-400/35 shadow-2xl">
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

          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <button
                type="submit"
                className="btn-glow-romantic"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Propose Activity ✨</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Opening activity calendar...
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-2xl text-center space-y-3.5 border border-teal-400/25">
          <div className="w-12 h-12 mx-auto rounded-xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-xl text-white">No Hangouts Suggested Yet</h4>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-md mx-auto font-light leading-relaxed">
            Suggest a spontaneous hangout or activity. Both of you can vote or confirm interest whenever convenient.
          </p>
          <button
            onClick={handleOpenAdd}
            className="btn-glow-romantic text-xs mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Suggest an Activity</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {plans.map((plan) => {
            const isMine = plan.suggestedBy === currentUser.id;
            const statusCfg = STATUS_MAP[plan.status] || STATUS_MAP.proposed;

            return (
              <div
                key={plan.id}
                className="glass-midnight-card group p-5 sm:p-6 rounded-2xl hover:border-teal-400/40 transition-all flex flex-col justify-between space-y-4 shadow-lg relative min-h-[190px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border shadow-sm ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>

                    {plan.proposedDate && (
                      <span className="text-[11px] text-teal-300/80 font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-teal-400" />
                        {plan.proposedDate}
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-teal-200 transition-colors line-clamp-1">
                    {plan.title}
                  </h4>

                  {plan.description && (
                    <p className="text-xs sm:text-sm text-purple-100/80 font-light leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-purple-400/15 flex items-center justify-between gap-3 text-xs">
                  <span className="font-handwriting text-xl text-teal-200 font-medium truncate">
                    Suggested by: {isMine ? 'You 🌷' : (plan.suggestedByName || partner.displayName) + ' ✨'}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={plan.status}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value as HangoutStatus)}
                      className="garden-select"
                      aria-label={`Status for ${plan.title}`}
                    >
                      <option value="proposed">Proposed</option>
                      <option value="interested">Interested! 🙋‍♀️</option>
                      <option value="confirmed">Confirmed ✨</option>
                      <option value="completed">Completed 💖</option>
                      <option value="declined">Maybe later</option>
                    </select>

                    {isMine && (
                      <button
                        onClick={() => handleDelete(plan)}
                        className="p-1.5 rounded-full hover:bg-rose-500/20 text-purple-300/70 hover:text-rose-300 transition-colors"
                        title="Delete suggestion"
                        aria-label={`Delete ${plan.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {plans.length < 4 && (
            <div
              onClick={handleOpenAdd}
              className="group p-5 sm:p-6 rounded-2xl border border-dashed border-teal-400/25 hover:border-teal-300/50 bg-gradient-to-br from-teal-500/[0.04] to-transparent hover:bg-teal-500/[0.08] flex flex-col justify-center items-center text-center space-y-3 cursor-pointer transition-all duration-300 min-h-[190px]"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-5 h-5 text-teal-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-white group-hover:text-teal-200 transition-colors">
                  Suggest Another Date Idea
                </h4>
                <p className="text-xs text-teal-200/70 max-w-xs mx-auto leading-relaxed font-light">
                  Propose a fun dinner, movie night, walk, or spontaneous road trip...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] text-teal-200 border border-teal-300/20 group-hover:border-teal-300/40 group-hover:bg-teal-500/20 transition-all">
                <Plus className="w-3.5 h-3.5" /> Plan Together ✨
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
