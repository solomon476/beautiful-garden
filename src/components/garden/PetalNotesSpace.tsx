import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Globe2,
  X,
} from 'lucide-react';
import { petalNotesService, authService } from '../../services/gardenService';
import type { PetalNoteEntry, UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';
import styles from './PetalNotesSpace.module.css';

const PALETTE = [
  { color: '#f472b6', bgGradient: 'from-pink-500/25 via-rose-500/15 to-transparent', emoji: '🌸', name: 'Cherry Blossom' },
  { color: '#fb7185', bgGradient: 'from-rose-500/25 via-red-500/15 to-transparent', emoji: '🌹', name: 'Velvet Rose' },
  { color: '#f59e0b', bgGradient: 'from-amber-500/25 via-yellow-500/15 to-transparent', emoji: '🌼', name: 'Golden Daisy' },
  { color: '#c084fc', bgGradient: 'from-purple-500/25 via-fuchsia-500/15 to-transparent', emoji: '🪻', name: 'Twilight Lavender' },
  { color: '#38bdf8', bgGradient: 'from-sky-500/25 via-cyan-500/15 to-transparent', emoji: '🪷', name: 'Water Lily' },
  { color: '#34d399', bgGradient: 'from-emerald-500/25 via-teal-500/15 to-transparent', emoji: '🌿', name: 'Fresh Fern' },
];

export const PetalNotesSpace: React.FC = () => {
  const [petals, setPetals] = useState<PetalNoteEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Form state
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [body, setBody] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState(PALETTE[0]);
  const [isShared, setIsShared] = useState<boolean>(false); // Private by default
  const [activePetal, setActivePetal] = useState<PetalNoteEntry | null>(null);

  const partner = authService.getPartner();

  const loadPetals = async () => {
    try {
      setLoading(true);
      const list = await petalNotesService.getPetals();
      setPetals(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPetals();
    const unsubscribe = authService.subscribeUser((u) => {
      setCurrentUser(u);
      loadPetals();
    });
    return unsubscribe;
  }, []);

  const handleOpenCompose = () => {
    soundEngine.playSparkle();
    setBody('');
    setSelectedTheme(PALETTE[0]);
    setIsShared(false);
    setIsComposing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      await petalNotesService.addPetal({
        body,
        color: selectedTheme.color,
        emoji: selectedTheme.emoji,
        isShared,
      });

      soundEngine.playChime(659.25, 1.0, 0.08);
      setIsComposing(false);
      await loadPetals();
    } catch (err: any) {
      alert(err?.message || 'Could not save petal note.');
    }
  };

  const handleDelete = async (p: PetalNoteEntry) => {
    if (p.authorId !== currentUser.id) return;
    if (window.confirm('Delete this petal note?')) {
      await petalNotesService.deletePetal(p.id);
      if (activePetal?.id === p.id) setActivePetal(null);
      await loadPetals();
    }
  };

  const handleViewPetal = (p: PetalNoteEntry) => {
    soundEngine.playSparkle();
    setActivePetal(p);
  };

  return (
    <div className={styles.petalsSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientBg} />
        <div className={styles.heroRadialGlow} />

        <div className={styles.heroContent}>
          {/* Left Decorative Illuminated Artwork */}
          <div className={styles.heroLeft}>
            <div className={styles.heroArtwork}>
              <img
                src="/assets/garden/card_petals.jpg"
                alt="Petal Notes"
              />
              <div className={styles.heroArtworkOverlay}>
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            {/* Title & Romantic Subtitles */}
            <div className={styles.heroText}>
              <div className={styles.heroTag}>
                <span>〰️ The Petal Garden</span>
                <span>✦</span>
              </div>

              <h2 className={styles.heroTitle}>
                <span>Petal Notes</span>
                <span className={styles.heroTitleHeart}>♡</span>
              </h2>

              <p className={styles.heroSubtitle}>
                Little whispers, compliments, and sweet feelings that unfurl like petals.
              </p>

              <div className={styles.heroSubmeta}>
                Whisper • Unfurl • Cherish • Bloom
              </div>
            </div>
          </div>

          {/* Right Action Button Inside Hero Banner (Desktop) */}
          <div className={styles.heroRightBtnWrapper}>
            <button
              type="button"
              onClick={handleOpenCompose}
              className={styles.heroRightActionBtn}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Leave a Petal Note 🌸</span>
            </button>
          </div>
        </div>
      </section>

      {/* Composing Note */}
      {isComposing && (
        <div className={styles.composePanel}>
          <div className={styles.composeHeader}>
            <div className={styles.composeHeaderLeft}>
              <div className={styles.composeHeaderIcon}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className={styles.composeHeaderTitle}>
                  Craft a Flower Petal Note
                </h4>
                <p className={styles.composeHeaderSubtitle}>
                  Delicate whispers, encouragement, and smiles
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className={styles.closeIconBtn}
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                fontSize: '11px',
                fontFamily: 'ui-monospace, monospace',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--pet-rose-light)',
                display: 'block',
                marginBottom: '8px',
              }}>
                Choose Floral Essence
              </label>
              <div className={styles.paletteRow}>
                {PALETTE.map((p) => {
                  const isSelected = selectedTheme.name === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedTheme(p)}
                      className={`${styles.paletteBtn} ${isSelected ? styles.paletteBtnSelected : ''}`}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--pet-rose-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Petal Whisper (Up to 240 characters)</span>
                </label>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--pet-rose-light)',
                  opacity: 0.8,
                }}>
                  {body.length} / 240
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={240}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="A sweet compliment, gentle observation, or warm whisper for the day..."
                className={styles.petalTextarea}
              />
            </div>

            {/* Decorated Privacy Switch */}
            <DecoratedPrivacyToggle
              isShared={isShared}
              onToggle={setIsShared}
              partnerName={partner.displayName}
              sharedTitle={`Bloom Petal for ${partner.displayName}`}
              sharedSubtitle={`Floating softly into ${partner.displayName}'s petal garden where they can read and smile ✨`}
              privateTitle="Keep Petal in Private Journal"
              privateSubtitle="Saved secretly on your profile. Hidden from partner until you choose to bloom it 🔒"
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(244, 114, 182, 0.2)',
            }}>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--pet-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.heroTriggerBtn}
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Bloom Petal Note 🌸</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Petals */}
      {loading ? (
        <div className="py-12 text-center text-purple-300/60 text-xs font-mono animate-pulse">
          Gathering flower blossoms...
        </div>
      ) : petals.length === 0 ? (
        <div className={styles.invitationCard} style={{ maxWidth: '440px', margin: '40px auto' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(244, 114, 182, 0.16)',
            border: '1px solid var(--pet-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--pet-rose)',
          }}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
            No Added Petal Notes Yet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--pet-muted)', margin: 0 }}>
            Leave a spontaneous sweet note, funny observation, or encouragement for {partner.displayName}.
          </p>
          <button
            type="button"
            onClick={handleOpenCompose}
            className={styles.heroTriggerBtn}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Leave First Note 🌸</span>
          </button>
        </div>
      ) : (
        <div className={styles.petalsGrid}>
          {petals.map((petal) => {
            const isMine = petal.authorId === currentUser.id;

            return (
              <div
                key={petal.id}
                onClick={() => handleViewPetal(petal)}
                className={styles.petalCard}
              >
                {/* Glow Aura */}
                <div
                  className={styles.petalGlowAura}
                  style={{ backgroundColor: petal.color }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      className={styles.petalEmojiBadge}
                      style={{
                        backgroundColor: `${petal.color}25`,
                        borderColor: `${petal.color}55`,
                      }}
                    >
                      <span>{petal.emoji}</span>
                    </div>
                    <span
                      className={`${styles.privacyBadge} ${
                        petal.isShared ? styles.privacyBadgeShared : styles.privacyBadgePrivate
                      }`}
                    >
                      {petal.isShared ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{petal.isShared ? 'Shared 💌' : 'Private 🔒'}</span>
                    </span>
                  </div>

                  <p className={styles.petalBody}>
                    “{petal.body}”
                  </p>
                </div>

                <div className={styles.petalFooter}>
                  <span className={styles.petalAuthorSignature}>
                    From: {isMine ? 'You 🌸' : (petal.authorName || partner.displayName) + ' ✨'}
                  </span>
                  {isMine && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(petal);
                      }}
                      className={styles.deleteBtn}
                      title="Delete petal"
                      aria-label="Delete petal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Invitation Card */}
          {petals.length < 4 && (
            <div
              onClick={handleOpenCompose}
              className={styles.invitationCard}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'rgba(244, 114, 182, 0.16)',
                border: '1px solid var(--pet-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pet-rose)',
              }}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Plant a New Petal
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--pet-muted)', margin: '4px 0 0 0' }}>
                  Leave a spontaneous whisper, flower note, or sweet thought...
                </p>
              </div>
              <span className={styles.heroTriggerBtn} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                <Plus className="w-3.5 h-3.5" /> Plant Petal 🌸
              </span>
            </div>
          )}
        </div>
      )}

      {/* Read Petal Dialog */}
      {activePetal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setActivePetal(null)}
        >
          <div
            className={styles.readModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePetal(null)}
              className={styles.closeIconBtn}
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className={styles.readEmojiStage}
              style={{ backgroundColor: `${activePetal.color}35` }}
            >
              <span>{activePetal.emoji}</span>
            </div>

            <div className={styles.readQuoteBox}>
              <p className={styles.readQuoteText}>
                “{activePetal.body}”
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--pet-muted)',
              paddingTop: '10px',
              borderTop: '1px solid rgba(244, 114, 182, 0.2)',
            }}>
              <span>From: {activePetal.authorId === currentUser.id ? 'You' : activePetal.authorName || partner.displayName}</span>
              <span>{new Date(activePetal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
