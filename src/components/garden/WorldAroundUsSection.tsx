import React, { useState, useEffect } from 'react';
import {
  Globe,
  Compass,
  Sparkles,
  BookOpen,
  Heart,
  Plus,
  X,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  worldAroundUsService,
  authService,
} from '../../services/gardenService';
import type {
  WorldCause,
  WorldArticle,
  WorldPrompt,
  WorldSmallAction,
  UserProfile,
} from '../../types/garden';
import { soundEngine } from '../../utils/audio';
import styles from './WorldAroundUsSection.module.css';

type WorldTab = 'travel' | 'inspiration' | 'facts' | 'world';

export const WorldAroundUsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorldTab>('travel');
  const [, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Data states
  const [causes, setCauses] = useState<WorldCause[]>([]);
  const [articles, setArticles] = useState<WorldArticle[]>([]);
  const [prompts, setPrompts] = useState<WorldPrompt[]>([]);
  const [actions, setActions] = useState<WorldSmallAction[]>([]);

  // Reader Modal State
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);
  const [readerData, setReaderData] = useState<{
    title: string;
    subtitle?: string;
    content: string;
    tag?: string;
    link?: string;
    image?: string;
  } | null>(null);

  // Form Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newLink, setNewLink] = useState<string>('');

  const loadAll = async () => {
    try {
      const [c, a, p, ac] = await Promise.all([
        worldAroundUsService.getCauses(),
        worldAroundUsService.getArticles(),
        worldAroundUsService.getPrompts(),
        worldAroundUsService.getSmallActions(),
      ]);
      setCauses(c);
      setArticles(a);
      setPrompts(p);
      setActions(ac);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
    const unsubAuth = authService.subscribeUser((u) => setCurrentUser(u));
    const unsubWorld = worldAroundUsService.subscribe(() => loadAll());
    return () => {
      unsubAuth();
      unsubWorld();
    };
  }, []);

  const handleOpenFeatured = () => {
    soundEngine.playSparkle();
    setReaderData({
      title: 'Beautiful Places on Earth',
      subtitle: 'Because the world is more beautiful when we explore it together... ♡',
      content:
        'From the sun-drenched cliffside villages of the Amalfi Coast and Santorini, to the quiet lantern-lit bamboo paths of Kyoto and the lavender fields of Provence—traveling together is about discovering wonder in every corner of the earth.\n\nEvery journey becomes a page in our story. Whether walking along quiet turquoise shores or tasting warm pastries in a cobblestone café, the greatest destination is wherever we are side-by-side.',
      tag: 'Travel & Wonder',
      image: '/assets/garden/coastal_town.jpg',
    });
    setIsReaderOpen(true);
  };

  const handleToggleHeart = async (actionId: string) => {
    soundEngine.playChime(659.25, 0.9, 0.08);
    await worldAroundUsService.toggleHeartAction(actionId);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    soundEngine.playSparkle();
    if (activeTab === 'travel' || activeTab === 'facts') {
      await worldAroundUsService.addArticle({
        title: newTitle,
        source: 'Sanctuary Wanderlust',
        link: newLink || 'https://earth.google.com',
        type: 'article',
        whyItMatters: newDesc,
        isShared: true,
      });
    } else if (activeTab === 'inspiration') {
      await worldAroundUsService.addCustomPrompt(newTitle, 'Perspective', newDesc);
    } else {
      await worldAroundUsService.addCause({
        title: newTitle,
        category: 'Our World',
        description: newDesc,
        whyItMatters: 'A topic we deeply care about in our sanctuary.',
        resourceLink: newLink,
        resourceName: 'Reference',
      });
    }

    setNewTitle('');
    setNewDesc('');
    setNewLink('');
    setShowAddModal(false);
    await loadAll();
  };

  return (
    <div className={styles.worldSection}>
      {/* 1. Panoramic Themed Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroAmbientGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroTagline}>
            <span>Shared Horizons</span>
            <span className={styles.heroTagDot}>✦</span>
            <span>A Bigger World</span>
          </div>

          <h1 className={styles.heroTitle}>
            <span>The World Around Us</span>
            <span className={styles.heroTitleHeart}>♡</span>
          </h1>

          <p className={styles.heroVerbs}>Explore · Learn · Dream</p>

          <p className={styles.heroSubtitle}>
            Discover together, a bigger world... ♡
          </p>
        </div>

        {/* 3D Cosmic Earth Globe Artwork Frame */}
        <div className={styles.heroArtworkContainer}>
          <img
            src="/assets/garden/card_world.jpg"
            alt="Cosmic Earth Globe Artwork"
            className={styles.heroArtworkImg}
          />
        </div>
      </section>

      {/* 2. Main Sanctuary Panel with Sub-Nav Filter Pills */}
      <div className={styles.mainPanel}>
        {/* Filter Pills Row — Exactly matching master card */}
        <div className={styles.filterPillsRow}>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveTab('travel');
            }}
            className={`${styles.pillBtn} ${activeTab === 'travel' ? styles.pillBtnActive : ''}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Travel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveTab('inspiration');
            }}
            className={`${styles.pillBtn} ${activeTab === 'inspiration' ? styles.pillBtnActive : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inspiration</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveTab('facts');
            }}
            className={`${styles.pillBtn} ${activeTab === 'facts' ? styles.pillBtnActive : ''}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interesting Facts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setActiveTab('world');
            }}
            className={`${styles.pillBtn} ${activeTab === 'world' ? styles.pillBtnActive : ''}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Our World</span>
          </button>
        </div>

        {/* 3. Featured Destination Card (Row 3, Col 3 master visual) */}
        {activeTab === 'travel' && (
          <div className={styles.featuredCard}>
            <div className={styles.featuredImgContainer}>
              <img
                src="/assets/garden/coastal_town.jpg"
                alt="Beautiful Places on Earth"
                className={styles.featuredImg}
              />
            </div>

            <div className={styles.featuredBody}>
              <div>
                <span className={styles.featuredTag}>Wonders & Horizons</span>
                <h2 className={styles.featuredTitle}>
                  Beautiful Places on Earth
                </h2>
                <p className={styles.featuredSubtitle}>
                  Because the world is more beautiful when we explore it together... ♡
                </p>
              </div>

              <div className={styles.featuredFooter}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--wld-muted)' }}>
                  Santorini • Amalfi • Kyoto • Paris
                </span>

                <button
                  type="button"
                  onClick={handleOpenFeatured}
                  className={styles.readMoreBtn}
                >
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Tab Content: Inspiration Prompts */}
        {activeTab === 'inspiration' && (
          <div className={styles.cardsGrid}>
            {prompts.map((p) => (
              <div key={p.id} className={styles.subCard}>
                <span className={styles.subCardCategory}>
                  {p.category} • Reflection
                </span>
                <h3 className={styles.subCardTitle}>“{p.promptText}”</h3>
                {p.contextNote && (
                  <p className={styles.subCardDesc}>{p.contextNote}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--wld-muted)' }}>
                    Reflections: {p.responses?.length || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSparkle();
                      setReaderData({
                        title: p.promptText,
                        subtitle: p.contextNote,
                        content: p.responses?.length
                          ? p.responses.map((r) => `${r.authorName}: "${r.reflection}"`).join('\n\n')
                          : 'No reflections added yet. What are your heartfelt thoughts on this prompt?',
                        tag: p.category,
                      });
                      setIsReaderOpen(true);
                    }}
                    className={styles.readMoreBtn}
                    style={{ padding: '6px 14px', fontSize: '11.5px' }}
                  >
                    <span>Reflect ♡</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Tab Content: Interesting Facts & Articles */}
        {activeTab === 'facts' && (
          <div className={styles.cardsGrid}>
            {articles.map((art) => (
              <div key={art.id} className={styles.subCard}>
                <span className={styles.subCardCategory}>
                  {art.source || 'Curiosity'}
                </span>
                <h3 className={styles.subCardTitle}>{art.title}</h3>
                <p className={styles.subCardDesc}>{art.whyItMatters}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--wld-cyan-light)',
                      fontSize: '11.5px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read Article</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSparkle();
                      setReaderData({
                        title: art.title,
                        subtitle: `Source: ${art.source}`,
                        content: art.whyItMatters,
                        tag: 'Things Worth Knowing',
                        link: art.link,
                      });
                      setIsReaderOpen(true);
                    }}
                    className={styles.readMoreBtn}
                    style={{ padding: '6px 14px', fontSize: '11.5px' }}
                  >
                    <span>Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. Tab Content: Causes & Small Actions */}
        {activeTab === 'world' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.cardsGrid}>
              {causes.map((c) => (
                <div key={c.id} className={styles.subCard}>
                  <span className={styles.subCardCategory}>{c.category}</span>
                  <h3 className={styles.subCardTitle}>{c.title}</h3>
                  <p className={styles.subCardDesc}>{c.whyItMatters}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                    {c.resourceLink && (
                      <a
                        href={c.resourceLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--wld-pink-light)',
                          fontSize: '11.5px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>{c.resourceName || 'Resource'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSparkle();
                        setReaderData({
                          title: c.title,
                          subtitle: c.category,
                          content: `${c.description}\n\nWhy it matters to us:\n${c.whyItMatters}`,
                          tag: 'Causes That Matter',
                          link: c.resourceLink,
                        });
                        setIsReaderOpen(true);
                      }}
                      className={styles.readMoreBtn}
                      style={{ padding: '6px 14px', fontSize: '11.5px' }}
                    >
                      <span>Learn More</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Small daily actions */}
            {actions.length > 0 && (
              <div style={{
                background: 'rgba(20, 8, 36, 0.7)',
                border: '1px solid var(--wld-border)',
                borderRadius: '18px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--wld-lavender)' }}>
                  Small Acts of Light & Empathy
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {actions.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(218, 160, 255, 0.1)',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                          {act.title}
                        </span>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--wld-muted)' }}>
                          {act.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleHeart(act.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          background: act.heartsCount > 0 ? 'rgba(240, 68, 181, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          border: `1px solid ${act.heartsCount > 0 ? 'var(--wld-pink)' : 'var(--wld-border)'}`,
                          color: act.heartsCount > 0 ? 'var(--wld-pink-light)' : 'var(--wld-muted)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        }}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{act.heartsCount}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Entry CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSparkle();
              setShowAddModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--wld-border)',
              color: 'var(--wld-text)',
              fontSize: '12.5px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Destination / Topic</span>
          </button>
        </div>
      </div>

      {/* 7. Reader / Detail Modal */}
      {isReaderOpen && readerData && (
        <div className={styles.modalOverlay} onClick={() => setIsReaderOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                {readerData.tag && (
                  <span style={{ fontSize: '10.5px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'var(--wld-cyan-light)' }}>
                    {readerData.tag}
                  </span>
                )}
                <h3 className={styles.modalTitle}>{readerData.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReaderOpen(false)}
                className={styles.modalCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {readerData.image && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', height: '180px' }}>
                <img
                  src={readerData.image}
                  alt={readerData.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {readerData.subtitle && (
              <p style={{
                margin: 0,
                fontFamily: 'Playfair Display, serif',
                fontStyle: 'italic',
                color: 'var(--wld-pink-light)',
                fontSize: '1.05rem',
              }}>
                {readerData.subtitle}
              </p>
            )}

            <div style={{
              background: 'rgba(15, 6, 26, 0.7)',
              border: '1px solid var(--wld-border)',
              borderRadius: '16px',
              padding: '18px 22px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: '#fff',
                whiteSpace: 'pre-line',
              }}>
                {readerData.content}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              {readerData.link && (
                <a
                  href={readerData.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#93c5fd',
                    fontSize: '12px',
                    textDecoration: 'none',
                  }}
                >
                  <span>Explore Online</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsReaderOpen(false)}
                className={styles.readMoreBtn}
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Destination / Topic Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add to The World Around Us</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={styles.modalCloseBtn}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--wld-muted)' }}>Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kyoto Cherry Blossom Trail or Ocean Conservation"
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    background: 'rgba(18, 5, 31, 0.75)',
                    border: '1px solid var(--wld-border)',
                    color: 'var(--wld-text)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--wld-muted)' }}>Why It Inspires Us *</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Share what makes this special or why you want to discover it together..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(18, 5, 31, 0.75)',
                    border: '1px solid var(--wld-border)',
                    color: 'var(--wld-text)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--wld-muted)' }}>Reference Link (Optional)</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    background: 'rgba(18, 5, 31, 0.75)',
                    border: '1px solid var(--wld-border)',
                    color: 'var(--wld-text)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'transparent',
                    border: '0',
                    color: 'var(--wld-muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.readMoreBtn}>
                  <Sparkles className="w-4 h-4" />
                  <span>Save to Our World</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
