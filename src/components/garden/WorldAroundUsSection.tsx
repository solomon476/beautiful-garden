import React, { useState, useEffect } from 'react';
import {
  Globe,
  ExternalLink,
  BookOpen,
  MessageSquare,
  Plus,
  X,
  Trash2,
  Send,
  Heart,
  Smile,
  ArrowUpRight,
  Filter,
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
import { DecoratedPrivacyToggle } from './DecoratedPrivacyToggle';

type SubTab = 'causes' | 'articles' | 'prompts' | 'actions';

export const WorldAroundUsSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('causes');
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());

  // Data states
  const [causes, setCauses] = useState<WorldCause[]>([]);
  const [articles, setArticles] = useState<WorldArticle[]>([]);
  const [prompts, setPrompts] = useState<WorldPrompt[]>([]);
  const [actions, setActions] = useState<WorldSmallAction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form toggles
  const [showAddCause, setShowAddCause] = useState<boolean>(false);
  const [showAddArticle, setShowAddArticle] = useState<boolean>(false);
  const [showAddPrompt, setShowAddPrompt] = useState<boolean>(false);
  const [showAddAction, setShowAddAction] = useState<boolean>(false);

  // Active prompt reflection drafting
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [promptReflectionText, setPromptReflectionText] = useState<string>('');

  // Form states - Causes
  const [causeTitle, setCauseTitle] = useState('');
  const [causeCategory, setCauseCategory] = useState('Mental Wellbeing');
  const [causeDesc, setCauseDesc] = useState('');
  const [causeWhy, setCauseWhy] = useState('');
  const [causeLink, setCauseLink] = useState('');
  const [causeResourceName, setCauseResourceName] = useState('');

  // Form states - Articles
  const [articleTitle, setArticleTitle] = useState('');
  const [articleSource, setArticleSource] = useState('');
  const [articleLink, setArticleLink] = useState('');
  const [articleType, setArticleType] = useState<WorldArticle['type']>('article');
  const [articleWhy, setArticleWhy] = useState('');
  const [articleIsShared, setArticleIsShared] = useState(true);

  // Form states - Custom Prompt
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('Perspective');
  const [newPromptNote, setNewPromptNote] = useState('');

  // Form states - Small Action
  const [actionTitle, setActionTitle] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionCategory, setActionCategory] = useState<WorldSmallAction['category']>('listening');

  const loadAll = async () => {
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

  // Handlers for Causes
  const handleCreateCause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!causeTitle.trim() || !causeDesc.trim() || !causeWhy.trim()) return;
    soundEngine.playSparkle();
    await worldAroundUsService.addCause({
      title: causeTitle,
      category: causeCategory,
      description: causeDesc,
      whyItMatters: causeWhy,
      resourceLink: causeLink,
      resourceName: causeResourceName,
    });
    setCauseTitle('');
    setCauseDesc('');
    setCauseWhy('');
    setCauseLink('');
    setCauseResourceName('');
    setShowAddCause(false);
  };

  const handleDeleteCause = async (id: string) => {
    if (window.confirm('Remove this cause from our space?')) {
      await worldAroundUsService.deleteCause(id);
    }
  };

  // Handlers for Articles
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleLink.trim() || !articleWhy.trim()) return;
    soundEngine.playSparkle();
    await worldAroundUsService.addArticle({
      title: articleTitle,
      source: articleSource,
      link: articleLink,
      type: articleType,
      whyItMatters: articleWhy,
      isShared: articleIsShared,
    });
    setArticleTitle('');
    setArticleSource('');
    setArticleLink('');
    setArticleWhy('');
    setShowAddArticle(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Remove this entry?')) {
      await worldAroundUsService.deleteArticle(id);
    }
  };

  // Handlers for Prompts & Reflections
  const handleSubmitReflection = async (promptId: string) => {
    if (!promptReflectionText.trim()) return;
    soundEngine.playSparkle();
    await worldAroundUsService.addPromptReflection(promptId, promptReflectionText);
    setPromptReflectionText('');
    setActivePromptId(null);
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    soundEngine.playSparkle();
    await worldAroundUsService.addCustomPrompt(newPromptText, newPromptCategory, newPromptNote);
    setNewPromptText('');
    setNewPromptNote('');
    setShowAddPrompt(false);
  };

  // Handlers for Small Actions
  const handleToggleHeart = async (actionId: string) => {
    soundEngine.playChime(659.25, 0.9, 0.08); // pleasant chime
    await worldAroundUsService.toggleHeartAction(actionId);
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !actionDesc.trim()) return;
    soundEngine.playSparkle();
    await worldAroundUsService.addSmallAction(actionTitle, actionDesc, actionCategory);
    setActionTitle('');
    setActionDesc('');
    setShowAddAction(false);
  };

  // Filtered causes
  const causeCategories = ['All', ...Array.from(new Set(causes.map((c) => c.category)))];
  const filteredCauses =
    selectedCategory === 'All'
      ? causes
      : causes.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Editorial Header with Thoughtful Personal Introduction */}
      <div className="text-center space-y-4 max-w-3xl mx-auto px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-200 text-xs font-mono tracking-wider uppercase">
          <Globe className="w-3.5 h-3.5 text-blue-300" />
          <span>A World Worth Caring About 🌍</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
          The World Around Us
        </h2>

        {/* Verbatim Personal Introduction requested by User */}
        <p className="font-serif italic text-base sm:text-lg text-pink-200/90 leading-relaxed max-w-2xl mx-auto">
          &ldquo;Some things deserve more than a passing glance. This is a little space for the issues that matter, the voices that deserve to be heard, and the conversations that can help us understand one another better.&rdquo;
        </p>

        <p className="text-xs sm:text-sm text-slate-300/80 max-w-xl mx-auto font-light">
          A quiet corner to explore issues that matter, share what makes us think, and learn from each other's perspectives without pressure.
        </p>
      </div>

      {/* 4-Pill Sub-Navigation Desk */}
      <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-2 w-full max-w-full">
        <button
          onClick={() => {
            soundEngine.playSparkle();
            setSubTab('causes');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
            subTab === 'causes'
              ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-200 border border-blue-400/50 shadow-lg shadow-blue-500/15'
              : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>1. Causes That Matter</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
            {causes.length}
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playSparkle();
            setSubTab('articles');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
            subTab === 'articles'
              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/50 shadow-lg shadow-purple-500/15'
              : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>2. Things Worth Knowing</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
            {articles.length}
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playSparkle();
            setSubTab('prompts');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
            subTab === 'prompts'
              ? 'bg-gradient-to-r from-teal-500/30 to-emerald-500/30 text-teal-200 border border-teal-400/50 shadow-lg shadow-teal-500/15'
              : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span>3. Let's Think About This</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
            {prompts.length}
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playSparkle();
            setSubTab('actions');
          }}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
            subTab === 'actions'
              ? 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 text-amber-200 border border-amber-400/50 shadow-lg shadow-amber-500/15'
              : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Smile className="w-4 h-4 text-amber-400" />
          <span>4. Small Things That Matter</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
            {actions.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* PART 1: CAUSES THAT MATTER                                     */}
      {/* ============================================================== */}
      {subTab === 'causes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Row & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {causeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40 font-semibold'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundEngine.playSparkle();
                setShowAddCause(!showAddCause);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 border border-white/20"
            >
              {showAddCause ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddCause ? 'Cancel' : '+ Add an Issue or Cause'}</span>
            </button>
          </div>

          {/* Add Cause Form Modal / Expanded Desk */}
          {showAddCause && (
            <div className="max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] bg-[#140d2b]/95 border border-blue-400/30 shadow-2xl backdrop-blur-2xl space-y-6 animate-scale-up">
              <div className="border-b border-blue-400/20 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300">
                  New Topic to Care About
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  Add an Issue or Awareness Focus
                </h3>
                <p className="text-xs text-slate-300 font-light mt-1">
                  Share a topic you care about, along with reliable context or awareness resources.
                </p>
              </div>

              <form onSubmit={handleCreateCause} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                      Topic / Cause Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Men's Mental Health & Vulnerability"
                      value={causeTitle}
                      onChange={(e) => setCauseTitle(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                      Category
                    </label>
                    <select
                      value={causeCategory}
                      onChange={(e) => setCauseCategory(e.target.value)}
                      className="w-full garden-input"
                    >
                      <option value="Mental Wellbeing">Mental Wellbeing</option>
                      <option value="Health & Awareness">Health & Awareness</option>
                      <option value="Equality & Dignity">Equality & Dignity</option>
                      <option value="Kindness & Society">Kindness & Society</option>
                      <option value="Human Rights">Human Rights</option>
                      <option value="Neurodiversity">Neurodiversity</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                    What is this issue about? *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe what this topic entails and what people often overlook..."
                    value={causeDesc}
                    onChange={(e) => setCauseDesc(e.target.value)}
                    className="w-full garden-textarea"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                    Why does this matter? *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Share why this topic resonates with you or why attention here changes lives..."
                    value={causeWhy}
                    onChange={(e) => setCauseWhy(e.target.value)}
                    className="w-full garden-textarea"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                      Resource Name / Organisation (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Movember, Mind UK, UN Women"
                      value={causeResourceName}
                      onChange={(e) => setCauseResourceName(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-blue-200">
                      Resource URL / Info Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={causeLink}
                      onChange={(e) => setCauseLink(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCause(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Pin to Our Space 🌍
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Causes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCauses.map((cause) => (
              <div
                key={cause.id}
                className="group relative p-6 sm:p-7 rounded-[1.75rem] bg-[#140c26]/85 hover:bg-[#1a1032]/95 border border-white/10 hover:border-blue-400/40 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 uppercase tracking-wide">
                      {cause.category}
                    </span>

                    {cause.addedBy === currentUser.id && (
                      <button
                        onClick={() => handleDeleteCause(cause.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove cause"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {cause.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300/90 font-light mt-2 leading-relaxed">
                      {cause.description}
                    </p>
                  </div>

                  {/* Why it Matters Callout */}
                  <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-400/20 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold block">
                      Why This Matters 💡
                    </span>
                    <p className="text-xs text-blue-100/90 font-serif italic leading-relaxed">
                      &ldquo;{cause.whyItMatters}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  {cause.resourceLink ? (
                    <a
                      href={cause.resourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 font-medium group-hover:underline underline-offset-4"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>{cause.resourceName || 'Explore Verified Resource'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Discussion Topic</span>
                  )}

                  <span className="text-[11px] font-mono text-slate-400">
                    Added by {cause.addedByName || 'Solomon 🌿'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 2: THINGS WORTH KNOWING                                   */}
      {/* ============================================================== */}
      {subTab === 'articles' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Articles, Campaigns & Voices
              </h3>
              <p className="text-xs text-slate-300 font-light mt-0.5">
                Thoughtful reads, documentaries, and visual awareness campaigns worth sharing.
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.playSparkle();
                setShowAddArticle(!showAddArticle);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 border border-white/20"
            >
              {showAddArticle ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddArticle ? 'Cancel' : '+ Share Something Worth Knowing'}</span>
            </button>
          </div>

          {/* Add Article Form */}
          {showAddArticle && (
            <div className="max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] bg-[#140d2b]/95 border border-purple-400/30 shadow-2xl backdrop-blur-2xl space-y-6 animate-scale-up">
              <div className="border-b border-purple-400/20 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300">
                  New Resource Entry
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  Share an Article, Video or Campaign
                </h3>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-purple-200">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. How Journaling Clarifies Mental Clutter"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-purple-200">
                      Source / Creator
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Behance, TED, The Atlantic, Mind"
                      value={articleSource}
                      onChange={(e) => setArticleSource(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-purple-200">
                      Link / URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={articleLink}
                      onChange={(e) => setArticleLink(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-purple-200">
                      Format
                    </label>
                    <select
                      value={articleType}
                      onChange={(e) => setArticleType(e.target.value as any)}
                      className="w-full garden-input"
                    >
                      <option value="article">Article / Essay</option>
                      <option value="video">Video / Talk</option>
                      <option value="post">Visual Campaign / Post</option>
                      <option value="book">Book / Study</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-purple-200">
                    Why It Matters (Personal Note) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell each other what stood out to you and why you wanted to share it..."
                    value={articleWhy}
                    onChange={(e) => setArticleWhy(e.target.value)}
                    className="w-full garden-textarea"
                  />
                </div>

                {/* Decorated Privacy Card */}
                <DecoratedPrivacyToggle
                  isShared={articleIsShared}
                  onToggle={setArticleIsShared}
                  partnerName={currentUser.username === 'noella' ? 'Solomon' : 'Noella'}
                  sharedTitle="Share in Our World Corner"
                  privateTitle="Save to My Private Reading List"
                  sharedSubtitle="Visible to both Noella & Solomon for gentle mutual reflection"
                  privateSubtitle="Saved only to your private personal collection"
                />

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddArticle(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Share Entry 📖
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => (
              <div
                key={art.id}
                className="group relative p-6 rounded-[1.75rem] bg-[#140c26]/85 hover:bg-[#1a1032]/95 border border-white/10 hover:border-purple-400/40 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
                      {art.type} • {art.source}
                    </span>

                    {art.addedBy === currentUser.id && (
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-serif text-lg font-bold text-white group-hover:text-purple-200 transition-colors leading-snug">
                    {art.title}
                  </h4>

                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-400/15">
                    <span className="text-[10px] font-mono text-purple-300 block font-semibold mb-1 uppercase tracking-wider">
                      Why it matters 💡
                    </span>
                    <p className="text-xs text-purple-100/90 font-serif italic leading-relaxed">
                      &ldquo;{art.whyItMatters}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-100 font-medium group-hover:underline underline-offset-4"
                  >
                    <span>Read / View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>

                  <span className="text-[10px] font-mono text-slate-400">
                    From {art.addedByName || 'Solomon 🌿'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 3: LET'S THINK ABOUT THIS                                 */}
      {/* ============================================================== */}
      {subTab === 'prompts' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Quiet Reflections & Thought Prompts
              </h3>
              <p className="text-xs text-slate-300 font-light mt-0.5">
                Questions where either person can share a perspective without pressure or expectation to agree.
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.playSparkle();
                setShowAddPrompt(!showAddPrompt);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 border border-white/20"
            >
              {showAddPrompt ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddPrompt ? 'Cancel' : '+ Propose a Prompt'}</span>
            </button>
          </div>

          {/* Add Prompt Form */}
          {showAddPrompt && (
            <div className="max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] bg-[#140d2b]/95 border border-teal-400/30 shadow-2xl backdrop-blur-2xl space-y-6 animate-scale-up">
              <div className="border-b border-teal-400/20 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300">
                  New Discussion Prompt
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  Propose a Question to Think About
                </h3>
              </div>

              <form onSubmit={handleCreatePrompt} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-teal-200">
                    Prompt Question *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What do you think people misunderstand about men's mental health?"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="w-full garden-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-teal-200">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mental Health, Empathy, Daily Connection"
                      value={newPromptCategory}
                      onChange={(e) => setNewPromptCategory(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-teal-200">
                      Context / Gentle Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reflecting on invisible expectations..."
                      value={newPromptNote}
                      onChange={(e) => setNewPromptNote(e.target.value)}
                      className="w-full garden-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPrompt(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Add Prompt ✨
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Prompts Cards */}
          <div className="space-y-6">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-6 sm:p-8 rounded-[2rem] bg-[#140c26]/90 border border-teal-400/25 shadow-xl backdrop-blur-xl space-y-6"
              >
                <div>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-400/30 uppercase tracking-widest">
                    {prompt.category}
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl font-bold text-white mt-3 leading-snug">
                    &ldquo;{prompt.promptText}&rdquo;
                  </h4>
                  {prompt.contextNote && (
                    <p className="text-xs text-slate-300/80 font-light mt-1.5 italic">
                      {prompt.contextNote}
                    </p>
                  )}
                </div>

                {/* Reflections List */}
                <div className="space-y-3">
                  {prompt.responses && prompt.responses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prompt.responses.map((resp) => (
                        <div
                          key={resp.id}
                          className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-teal-400/30 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-teal-300">
                            <span className="font-semibold">{resp.authorName}</span>
                            <span className="text-slate-400">
                              {new Date(resp.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 font-serif italic leading-relaxed">
                            &ldquo;{resp.reflection}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No thoughts shared yet. Be the first to jot down your perspective.
                    </p>
                  )}
                </div>

                {/* Add Reflection Box */}
                {activePromptId === prompt.id ? (
                  <div className="p-5 rounded-2xl bg-[#1b1035] border border-teal-400/30 space-y-4 animate-scale-up">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-teal-200">
                        Sharing as {currentUser.displayName}
                      </span>
                      <button
                        onClick={() => setActivePromptId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={promptReflectionText}
                      onChange={(e) => setPromptReflectionText(e.target.value)}
                      placeholder="Share your personal perspective, honestly and gently..."
                      className="w-full garden-textarea"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActivePromptId(null)}
                        className="px-4 py-2 text-xs text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmitReflection(prompt.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold uppercase tracking-wider"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Perspective</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        soundEngine.playSparkle();
                        setActivePromptId(prompt.id);
                        setPromptReflectionText('');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-teal-400/30 text-teal-200 text-xs font-medium transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Share your perspective</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PART 4: SMALL THINGS THAT MATTER                               */}
      {/* ============================================================== */}
      {subTab === 'actions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Everyday Gentle Micro-Actions
              </h3>
              <p className="text-xs text-slate-300 font-light mt-0.5">
                Simple everyday ways to make a genuine difference in how we treat each other.
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.playSparkle();
                setShowAddAction(!showAddAction);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 border border-white/20"
            >
              {showAddAction ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddAction ? 'Cancel' : '+ Share a Gentle Practice'}</span>
            </button>
          </div>

          {/* Add Action Form */}
          {showAddAction && (
            <div className="max-w-3xl mx-auto p-7 sm:p-9 rounded-[2rem] bg-[#140d2b]/95 border border-amber-400/30 shadow-2xl backdrop-blur-2xl space-y-6 animate-scale-up">
              <div className="border-b border-amber-400/20 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300">
                  New Gentle Practice
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  Share a Small Thing That Matters
                </h3>
              </div>

              <form onSubmit={handleCreateAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-200">
                    Practice Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Check in on someone with no agenda"
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className="w-full garden-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-200">
                    Category
                  </label>
                  <select
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value as any)}
                    className="w-full garden-input"
                  >
                    <option value="listening">Listening & Presence</option>
                    <option value="care">Everyday Care</option>
                    <option value="perspective">Respectful Perspective</option>
                    <option value="learning">Helpful Learning & Resources</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-amber-200">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe how to practice this gently in everyday moments..."
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    className="w-full garden-textarea"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAction(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Add Practice 🌻
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Small Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {actions.map((act) => (
              <div
                key={act.id}
                className="p-6 rounded-[1.75rem] bg-[#140c26]/85 hover:bg-[#1a1032]/95 border border-white/10 hover:border-amber-400/40 shadow-xl backdrop-blur-xl flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                      {act.category}
                    </span>

                    <button
                      onClick={() => handleToggleHeart(act.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                        act.hasHeartedByMe
                          ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 scale-105'
                          : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-rose-300'
                      }`}
                      title="Heart this practice"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          act.hasHeartedByMe ? 'fill-rose-400 text-rose-400' : ''
                        }`}
                      />
                      <span>{act.heartsCount || 0}</span>
                    </button>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-white leading-snug">
                    {act.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-300/90 font-light leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 text-right">
                  <span className="text-[10px] font-mono text-slate-400">
                    Suggested by {act.suggestedByName || 'Noella ✨'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
