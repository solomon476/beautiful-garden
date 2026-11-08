import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Sparkles,
  Calendar,
  X,
  Trash2,
  Globe2,
} from 'lucide-react';
import { timeCapsuleService, authService } from '../../services/gardenService';
import type { TimeCapsuleEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './TimeCapsuleSection.module.css';

export const TimeCapsuleSection: React.FC = () => {
  const [capsules, setCapsules] = useState<TimeCapsuleEntry[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<string>('');
  const [isShared, setIsShared] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read Modal
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsuleEntry | null>(null);

  const partner = authService.getPartner();

  const loadCapsules = async () => {
    try {
      setLoading(true);
      const list = await timeCapsuleService.getCapsules();
      setCapsules(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapsules();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadCapsules();
    });
    return unsubscribe;
  }, []);

  const handleOpenCreate = () => {
    soundEngine.playSparkle();
    setTitle('');
    setBody('');
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setReleaseDate(nextMonth.toISOString().slice(0, 10));
    setIsShared(true);
    setErrorMsg(null);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !releaseDate) {
      setErrorMsg('Please fill in a title, secret message, and choose an unlock date.');
      return;
    }

    const releaseTime = new Date(releaseDate).toISOString();

    try {
      await timeCapsuleService.createCapsule({
        title,
        body,
        releaseAt: releaseTime,
        isShared,
      });

      soundEngine.playHarpStrum();
      setIsCreating(false);
      await loadCapsules();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not seal time capsule.');
    }
  };

  const handleDelete = async (cap: TimeCapsuleEntry) => {
    if (cap.authorId !== currentUser.id) return;
    if (window.confirm(`Delete time capsule "${cap.title}"?`)) {
      await timeCapsuleService.deleteCapsule(cap.id);
      if (selectedCapsule?.id === cap.id) setSelectedCapsule(null);
      await loadCapsules();
    }
  };

  const now = new Date();

  return (
    <div className={styles.capsuleSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroTagline}>
            <span>Future Memories</span>
            <span className={styles.heroTagDot}>✦</span>
            <span>Golden Envelopes</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>Time Capsule</span>
            <span className={styles.heroTitleHeart}>♡</span>
          </h1>

          <p className={styles.heroVerbs}>Save · Lock · Relive</p>

          <p className={styles.heroSubtitle}>
            A treasure box for our future... ♡
          </p>
        </div>

        {/* 3D Glowing Hourglass Artwork Frame */}
        <div className={styles.heroArtworkContainer}>
          <img
            src="/assets/garden/card_capsule.jpg"
            alt="Time Capsule Hourglass Artwork"
            className={styles.heroArtworkImg}
          />
        </div>
      </section>

      {/* 2. Main Sanctuary Panel with Locked Master Card */}
      <div className={styles.mainPanel}>
        {/* The Locked Hero Card — Exactly matching Row 3, Col 2 */}
        <div className={styles.lockedHeroCard}>
          <div className={styles.lockedHeroGlow} />

          <div className={styles.lockIconBadge}>
            <Lock className="w-8 h-8" />
          </div>

          <p className={styles.lockedHeroText}>
            A special message, photos or dreams...
            <br />
            Locked for a future date.
          </p>

          <button
            type="button"
            onClick={handleOpenCreate}
            className={styles.createCapsuleBtn}
          >
            <Sparkles className="w-4 h-4" />
            <span>Create a Time Capsule ⭐</span>
          </button>
        </div>

        {/* 3. Grid of Sealed & Unlocked Capsules */}
        {capsules.length > 0 && (
          <div className={styles.capsulesGrid}>
            {capsules.map((cap) => {
              const isAuthor = cap.authorId === currentUser.id;
              const release = new Date(cap.releaseAt);
              const isUnlocked = release <= now;
              const diffDays = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={cap.id}
                  onClick={() => {
                    if (isUnlocked || isAuthor) {
                      soundEngine.playSparkle();
                      setSelectedCapsule(cap);
                    }
                  }}
                  className={`${styles.capsuleCard} ${isUnlocked ? styles.capsuleCardUnlocked : ''}`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className={styles.capsuleHeader}>
                      <span
                        className={`${styles.statusPill} ${
                          isUnlocked ? styles.statusPillUnlocked : styles.statusPillSealed
                        }`}
                      >
                        {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{isUnlocked ? 'Unlocked ✨' : `Locked (${diffDays}d left)`}</span>
                      </span>

                      <span className={styles.datePill}>
                        <Calendar className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {release.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>

                    <h3 className={styles.capsuleTitle}>{cap.title}</h3>

                    <p className={styles.capsuleBodyPreview}>
                      {isUnlocked || isAuthor ? (
                        cap.body
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--cap-muted)' }}>
                          🔒 Sealed until unlock date arrives...
                        </span>
                      )}
                    </p>
                  </div>

                  <div className={styles.capsuleFooter}>
                    <span className={styles.capsuleAuthor}>
                      From: {isAuthor ? 'You 🌷' : (cap.authorName || partner.displayName) + ' ✨'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(isUnlocked || isAuthor) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSparkle();
                            setSelectedCapsule(cap);
                          }}
                          className={styles.unsealBtn}
                        >
                          <span>Open Capsule →</span>
                        </button>
                      )}

                      {isAuthor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cap);
                          }}
                          style={{
                            background: 'transparent',
                            border: '0',
                            color: '#fda4af',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete capsule"
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

      {/* 4. Create Time Capsule Modal */}
      {isCreating && (
        <div className={styles.modalOverlay} onClick={() => setIsCreating(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Seal a Future Time Capsule ⏳</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className={styles.modalCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Capsule Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. For our next anniversary or birthday..."
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Unlock Date *</label>
                <input
                  type="date"
                  required
                  value={releaseDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>The Secret Message *</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What would you like to say to your future selves? This letter will remain strictly sealed and encrypted until the chosen date..."
                  className={styles.formTextarea}
                />
              </div>

              {/* Privacy toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSparkle();
                  setIsShared(!isShared);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: isShared ? 'rgba(240, 68, 181, 0.15)' : 'rgba(141, 53, 189, 0.15)',
                  border: `1px solid ${isShared ? 'rgba(240, 68, 181, 0.4)' : 'rgba(141, 53, 189, 0.4)'}`,
                  color: isShared ? '#ff8acb' : '#c69ae8',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                {isShared ? (
                  <>
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Sealed for Both of Us 🌸</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private to You Only 🔒</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(251, 113, 133, 0.4)',
                  color: '#fecdd3',
                  fontSize: '12px',
                }}>
                  {errorMsg}
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{
                    background: 'transparent',
                    border: '0',
                    color: 'var(--cap-muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.createCapsuleBtn}>
                  <Lock className="w-4 h-4" />
                  <span>Seal with Golden Wax 🌟</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Reader Modal */}
      {selectedCapsule && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCapsule(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className={styles.modalTitle}>{selectedCapsule.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCapsule(null)}
                className={styles.modalCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{
              background: 'rgba(15, 6, 26, 0.7)',
              border: '1px solid var(--cap-border)',
              borderRadius: '16px',
              padding: '18px 22px',
              maxHeight: '280px',
              overflowY: 'auto',
            }}>
              <p style={{
                margin: 0,
                fontFamily: 'Playfair Display, Georgia, serif',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                lineHeight: 1.6,
                color: '#fff',
                whiteSpace: 'pre-line',
              }}>
                “{selectedCapsule.body}”
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--cap-muted)',
            }}>
              <span>
                From: {selectedCapsule.authorId === currentUser.id ? 'You' : selectedCapsule.authorName || partner.displayName}
              </span>
              <span>
                Unlock: {new Date(selectedCapsule.releaseAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
