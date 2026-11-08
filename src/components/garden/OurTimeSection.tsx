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
import styles from './OurTimeSection.module.css';

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
    <div className={styles.ourTimeSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientBg} />
        <div className={styles.heroRadialGlow} />

        <div className={styles.heroContent}>
          {/* Left Decorative Artwork & Details */}
          <div className={styles.heroLeft}>
            <div className={styles.heroArtwork}>
              <img
                src="/assets/garden/card_time.jpg"
                alt="Our Time Calendar"
              />
              <div className={styles.heroArtworkOverlay}>
                <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className={styles.heroText}>
              <div className={styles.heroTag}>
                <span>〰️ Our Time Planning</span>
                <span>✦</span>
              </div>

              <h2 className={styles.heroTitle}>
                <span>Our Time</span>
                <span className={styles.heroTitleHeart}>♡</span>
              </h2>

              <p className={styles.heroSubtitle}>
                Hangout ideas, date nights, and sweet adventures with zero pressure.
              </p>

              <div className={styles.heroSubmeta}>
                Plan • Remind • Experience • Cherish
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner */}
          <div className={styles.heroRightBtnWrapper}>
            <button
              type="button"
              onClick={handleOpenAdd}
              className={styles.heroRightActionBtn}
            >
              <CalendarDays className="w-4 h-4 text-white" />
              <span>Suggest a Date or Hangout 📅</span>
            </button>
          </div>
        </div>
      </section>

      {/* Spotlight: Next Upcoming Date Alert */}
      {upcomingDate && (
        <div className={styles.spotlightCard}>
          <div className={styles.spotlightLeft}>
            <div className={styles.spotlightIcon}>
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className={styles.spotlightMeta}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--tim-teal-light)',
                  fontWeight: 'bold',
                }}>
                  Next Garden Adventure ✨
                </span>
                <span style={{ fontSize: '12px' }}>{STATUS_MAP[upcomingDate.status]?.icon}</span>
              </div>
              <h4 className={styles.spotlightTitle}>
                {upcomingDate.title}
              </h4>
              <p className={styles.spotlightSub}>
                {upcomingDate.proposedDate ? `Scheduled for: ${upcomingDate.proposedDate}` : 'Date in planning'}
                {upcomingDate.location ? ` • ${upcomingDate.location}` : ''}
              </p>
            </div>
          </div>

          <div>
            <a
              href={getGoogleCalendarUrl(upcomingDate)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.calendarLinkBtn}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Add to Phone Calendar</span>
            </a>
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className={styles.filterRow}>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            setActiveFilter('all');
          }}
          className={`${styles.filterPill} ${
            activeFilter === 'all' ? styles.filterPillActive : ''
          }`}
        >
          All Dates & Ideas
        </button>
        {(['proposed', 'interested', 'confirmed', 'completed'] as HangoutStatus[]).map((statusKey) => {
          const st = STATUS_MAP[statusKey];
          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => {
                soundEngine.playSparkle();
                setActiveFilter(statusKey);
              }}
              className={`${styles.filterPill} ${
                activeFilter === statusKey ? styles.filterPillActive : ''
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
        <div className={styles.emptyStateCard}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: 'rgba(20, 184, 166, 0.16)',
            border: '1px solid var(--tim-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--tim-teal-light)',
          }}>
            <CalendarDays className="w-6 h-6 animate-pulse" />
          </div>
          <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', color: '#ffffff', margin: 0 }}>
            No plans in this view yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--tim-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.6 }}>
            Suggest spontaneous hangouts, dinner runs, or weekend dates with zero pressure.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className={styles.heroTriggerBtn}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose an Idea 🌷</span>
          </button>
        </div>
      ) : (
        <div className={styles.plansGrid}>
          {filteredPlans.map((plan) => {
            const isSuggestedByMe = plan.suggestedBy === currentUser.id;
            const statusInfo = STATUS_MAP[plan.status] || STATUS_MAP.proposed;

            return (
              <div key={plan.id} className={styles.planCard}>
                {/* Upper Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className={styles.planHeaderRow}>
                    <h3
                      onClick={() => setSelectedPlan(plan)}
                      className={styles.planTitle}
                    >
                      {plan.title}
                    </h3>

                    <span className={`${styles.statusBadge} ${statusInfo.badge}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Proposed Date & Location */}
                  <div className={styles.metaRow}>
                    {plan.proposedDate && (
                      <span className={styles.metaItem}>
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{plan.proposedDate}</span>
                      </span>
                    )}
                    {plan.location && (
                      <span className={styles.metaItem}>
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        <span>{plan.location}</span>
                      </span>
                    )}
                    {plan.reminderEnabled && (
                      <span className={styles.reminderTag}>
                        <Bell className="w-3 h-3" />
                        <span>Reminders On</span>
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className={styles.planDesc}>
                      “{plan.description}” ♡
                    </p>
                  )}
                </div>

                {/* Footer Row */}
                <div className={styles.planFooter}>
                  <div className={styles.authorRow}>
                    <span className={styles.authorAvatar}>
                      👤
                    </span>
                    <span className={styles.authorName}>
                      By: {isSuggestedByMe ? 'You' : plan.suggestedByName || partner.displayName}
                    </span>
                  </div>

                  <div className={styles.cardActionBtns}>
                    <a
                      href={getGoogleCalendarUrl(plan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.calIconBtn}
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={styles.detailsBtn}
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
          className={styles.modalBackdrop}
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <CalendarDays className="w-4 h-4 text-teal-300" />
                <span style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--tim-teal-light)' }}>
                  Date & Adventure Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {selectedPlan.title}
                </h3>
                <span
                  className={`${styles.statusBadge} ${STATUS_MAP[selectedPlan.status]?.badge || ''}`}
                >
                  <span>{STATUS_MAP[selectedPlan.status]?.icon}</span>
                  <span>{STATUS_MAP[selectedPlan.status]?.label}</span>
                </span>
              </div>

              {selectedPlan.proposedDate && (
                <div style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--tim-teal-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Proposed for: {selectedPlan.proposedDate}</span>
                </div>
              )}

              {selectedPlan.location && (
                <div style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--tim-teal-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Location: {selectedPlan.location}</span>
                </div>
              )}

              {selectedPlan.description && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(20, 184, 166, 0.12)',
                  border: '1px solid var(--tim-border)',
                }}>
                  <div style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--tim-teal-light)', opacity: 0.8, marginBottom: '4px' }}>
                    Vibe & Thoughts
                  </div>
                  <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#fff0f9', margin: 0, lineHeight: 1.6 }}>
                    “{selectedPlan.description}” ♡
                  </p>
                </div>
              )}

              {/* Status Update Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--tim-teal-light)', fontWeight: 600 }}>
                  Change Response
                </label>
                <div className={styles.statusChangeGrid}>
                  {(['interested', 'confirmed', 'completed'] as HangoutStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedPlan.id, st)}
                      className={`${styles.statusChoiceBtn} ${
                        selectedPlan.status === st ? styles.statusChoiceActive : ''
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

            <div style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(20, 184, 166, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              {selectedPlan.suggestedBy === currentUser.id ? (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedPlan)}
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
                  <span>Remove Idea</span>
                </button>
              ) : (
                <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: 'var(--tim-muted)' }}>
                  Suggested by {selectedPlan.suggestedByName || partner.displayName}
                </span>
              )}

              <a
                href={getGoogleCalendarUrl(selectedPlan)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.calendarLinkBtn}
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
                  background: 'rgba(20, 184, 166, 0.2)',
                  border: '1px solid var(--tim-border)',
                  color: 'var(--tim-teal-light)',
                  display: 'flex',
                }}>
                  <CalendarDays className="w-4 h-4" />
                </span>
                <div>
                  <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Plan an Adventure or Date
                  </h4>
                  <p style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', color: 'var(--tim-teal-light)', opacity: 0.8, margin: '2px 0 0 0' }}>
                    Suggest a cozy date, dinner, or road trip
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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Activity or Date Idea *</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunset walk & gelato, or weekend road trip"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Proposed Date or Timing</span>
                  </label>
                  <input
                    type="text"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    placeholder="e.g. This Saturday 6:00 PM"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Location / Place</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Beachside cafe or park"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span>Notes / Why It'll Be Fun</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cozy booths, great pastries, relaxing music"
                  className={styles.formInput}
                />
              </div>

              {/* Reminder Checkbox */}
              <div className={styles.reminderBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell className="w-4 h-4 text-teal-300" />
                  <span style={{ fontSize: '12px', color: 'var(--tim-text)' }}>
                    Send reminder notification to partner
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--tim-teal)' }}
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
