import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  X,
  Sparkles,
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-teal-400/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-400/40 text-teal-200 text-xs font-mono uppercase tracking-widest shadow-sm">
            <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
            <span>Our Time</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gradient-garden">
            Hangout Ideas & Activity Planning
          </h3>
          <p className="font-handwriting text-2xl text-teal-200/90 leading-relaxed max-w-xl">
            Suggest spontaneous hangouts, dinner runs, or weekend plans with zero pressure.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-glow-romantic self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Suggest an Activity</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass-midnight-card p-6 sm:p-8 rounded-3xl space-y-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-teal-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Propose a New Experience
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-teal-200/70 uppercase tracking-wider mb-1">
                Activity or Place *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Try that new matcha spot or late-night dessert..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-teal-400/20 text-white text-sm focus:outline-none focus:border-teal-400 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono text-teal-200/70 uppercase tracking-wider mb-1">
                  Proposed Date or Timing (Optional)
                </label>
                <input
                  type="text"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  placeholder="e.g. This Saturday evening or next weekend"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-teal-400/20 text-white text-sm focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-teal-200/70 uppercase tracking-wider mb-1">
                  Extra Details / Vibe
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Looks super chill, great music and cozy booths"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-teal-400/20 text-white text-sm focus:outline-none focus:border-teal-400 shadow-inner"
                />
              </div>
            </div>

            {errorMsg && <p className="text-xs text-rose-300">{errorMsg}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:scale-105 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-teal-500/25 border border-white/20"
              >
                Propose Activity ✨
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Opening activity calendar...
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-midnight-card p-10 rounded-3xl text-center space-y-3.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl text-white">No Hangouts Suggested Yet</h4>
          <p className="text-xs sm:text-sm text-slate-300/80 max-w-md mx-auto font-light leading-relaxed">
            Suggest a spontaneous hangout or activity. Both of you can vote or confirm interest whenever convenient.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-200 text-xs font-medium border border-teal-400/30 transition-all hover:scale-105"
          >
            Suggest an Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {plans.map((plan) => {
            const isMine = plan.suggestedBy === currentUser.id;
            const statusCfg = STATUS_MAP[plan.status] || STATUS_MAP.proposed;

            return (
              <div
                key={plan.id}
                className="glass-midnight-card group p-7 sm:p-8 rounded-[2rem] hover:border-teal-400/50 transition-all flex flex-col justify-between space-y-4 shadow-xl relative min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={`px-3.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase border shadow-sm ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>

                    {plan.proposedDate && (
                      <span className="text-xs text-teal-300 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        {plan.proposedDate}
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-teal-200 transition-colors">
                    {plan.title}
                  </h4>

                  {plan.description && (
                    <p className="text-sm text-slate-200/90 font-light leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-purple-400/15 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-handwriting text-2xl text-teal-300 font-medium">
                    Suggested by: {isMine ? 'You 🌷' : (plan.suggestedByName || partner.displayName) + ' ✨'}
                  </span>

                  <div className="flex items-center gap-2">
                    <select
                      value={plan.status}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value as HangoutStatus)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-teal-400/30 text-xs text-teal-200 hover:text-white focus:outline-none"
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
                        className="p-2 rounded-full hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 transition-colors"
                        title="Delete suggestion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {plans.length < 3 && (
            <div
              onClick={handleOpenAdd}
              className="group p-7 sm:p-8 rounded-[2rem] border-2 border-dashed border-teal-400/30 hover:border-teal-300/60 bg-gradient-to-br from-teal-500/5 via-indigo-500/5 to-transparent flex flex-col justify-center items-center text-center space-y-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:bg-teal-500/10 min-h-[220px] shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform shadow-inner">
                <CalendarDays className="w-6 h-6 text-teal-300" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-xl font-bold text-white group-hover:text-teal-200 transition-colors">
                  Suggest Another Date Idea
                </h4>
                <p className="font-handwriting text-xl text-teal-200/80 max-w-xs mx-auto leading-snug">
                  Propose a fun dinner, movie night, walk, or spontaneous road trip...
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-teal-200 border border-teal-300/30 group-hover:bg-teal-500/30 transition-all">
                <Plus className="w-3.5 h-3.5" /> Plan Together ✨
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
