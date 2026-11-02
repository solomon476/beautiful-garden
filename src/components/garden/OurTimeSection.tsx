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

const STATUS_MAP: Record<HangoutStatus, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'bg-amber-500/15 border-amber-400/30 text-amber-300' },
  interested: { label: 'Interested! 🙋‍♀️', color: 'bg-sky-500/15 border-sky-400/30 text-sky-300' },
  confirmed: { label: 'Confirmed ✨', color: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' },
  completed: { label: 'Completed 💖', color: 'bg-purple-500/15 border-purple-400/30 text-purple-300' },
  declined: { label: 'Maybe another time', color: 'bg-white/10 border-white/15 text-slate-400' },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-pink-300 text-xs font-mono uppercase tracking-wider mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Our Time</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            Hangout Ideas & Activity Planning
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Suggest spontaneous plans, cafe runs, or weekend activities with zero pressure.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-medium shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Suggest an Activity</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-400/30 backdrop-blur-xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Suggest a Hangout
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Activity or Place *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Try that new matcha cafe downtown..."
                className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Proposed Date or Timeframe (Optional)
                </label>
                <input
                  type="text"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  placeholder="e.g. This Saturday afternoon, or next week"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Details / Thoughts
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Their reviews look amazing, let's go when free"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-400/50"
                />
              </div>
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
                Send Suggestion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-mono animate-pulse">
          Checking plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-300">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h4 className="font-serif text-lg text-white">No Hangouts Suggested Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
            Suggest an activity or spontaneous plan. Both of you can vote or confirm interest.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-pink-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Suggest an Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isMine = plan.suggestedBy === currentUser.id;
            const statusCfg = STATUS_MAP[plan.status] || STATUS_MAP.proposed;

            return (
              <div
                key={plan.id}
                className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-pink-400/30 transition-all flex flex-col justify-between space-y-3 shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>

                    {plan.proposedDate && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {plan.proposedDate}
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-base font-semibold text-white mb-1 group-hover:text-pink-200 transition-colors">
                    {plan.title}
                  </h4>

                  {plan.description && (
                    <p className="text-xs text-slate-300/80 font-light leading-relaxed">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Suggested by: {isMine ? 'You' : plan.suggestedByName || partner.displayName}</span>

                  <div className="flex items-center gap-2">
                    <select
                      value={plan.status}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value as HangoutStatus)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white focus:outline-none"
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
                        className="p-1 hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                        title="Delete suggestion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
