import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Check, Award, Flame, Heart, Send, Copy, RotateCcw, CheckCheck } from 'lucide-react';
import { giftContent, type PerkOption } from '../data/giftContent';
import { soundEngine } from '../utils/audio';

export const HiddenSurpriseSection: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [selectedPerkId, setSelectedPerkId] = useState<string>('food-run');
  const [customNote, setCustomNote] = useState<string>('');
  const [redeemedPerk, setRedeemedPerk] = useState<{
    perk: PerkOption;
    date: string;
    certificateId: string;
    note: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleReveal = () => {
    soundEngine.playSparkle();

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#f472b6', '#f59e0b', '#ffffff'],
    });

    setIsRevealed(true);
  };

  const handleSelectPerk = (id: string) => {
    soundEngine.playChime(587.33, 1.0, 0.1);
    setSelectedPerkId(id);
  };

  const handleRedeem = () => {
    const chosenPerk = giftContent.surprise.perkOptions.find((p) => p.id === selectedPerkId) || giftContent.surprise.perkOptions[0];
    
    soundEngine.playHarpStrum();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff', '#f472b6'],
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const certId = `VIP-${Math.floor(1000 + Math.random() * 9000)}-${chosenPerk.id.toUpperCase().slice(0, 4)}`;

    setRedeemedPerk({
      perk: chosenPerk,
      date: formattedDate,
      certificateId: certId,
      note: customNote,
    });
  };

  const handleResetRedemption = () => {
    setRedeemedPerk(null);
  };

  const generateClaimText = () => {
    if (!redeemedPerk) return '';
    return `Hey Solomon! 🌷 Just redeemed my "Noella Gets Her Way" VIP Pass!\n\n👑 Perk: ${redeemedPerk.perk.title}\n💬 Details: ${redeemedPerk.perk.description}\n${redeemedPerk.note ? `📝 Note: "${redeemedPerk.note}"\n` : ''}🎟️ Verification Code: ${giftContent.surprise.couponCode} (${redeemedPerk.certificateId})\n📅 Date: ${redeemedPerk.date}\n\nTime to honor your promise! 😄✨`;
  };

  const handleCopyClaim = () => {
    const text = generateClaimText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundEngine.playSparkle();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = generateClaimText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <section id="surprise" className="relative py-16 px-4 z-10 max-w-3xl mx-auto">
      {/* Teaser state before unlocking */}
      {!isRevealed ? (
        <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-amber-400/30 text-center shadow-2xl overflow-hidden group">
          {/* Subtle glowing ambient halo */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/25 transition-all duration-700" />

          {/* Mystery Pulsing Firefly Beacon */}
          <div className="relative inline-block mb-6">
            <button
              onClick={handleReveal}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/30 hover:scale-110 active:scale-95 transition-all duration-300 flower-pulse cursor-pointer flex items-center justify-center"
              aria-label="Unlock hidden surprise"
            >
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Gift className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
            A Secret Along the Pathway...
          </h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 font-light">
            There’s something glowing between the garden leaves. Tap the golden beacon to discover what is hidden.
          </p>

          <button
            onClick={handleReveal}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Secret Surprise</span>
          </button>
        </div>
      ) : (
        /* The Golden Perk Card Revealed */
        <div className="animate-scale-up">
          <div className="golden-ticket rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl">
            {/* Header / Seal */}
            <div className="flex items-center justify-between border-b border-amber-900/20 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-900" />
                <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-amber-950">
                  {giftContent.surprise.badge}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold bg-amber-900/15 px-2.5 py-1 rounded text-amber-950 border border-amber-900/20">
                  NO. 0001-VIP
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 tracking-tight mb-1">
                {giftContent.surprise.title}
              </h3>
              <p className="text-sm text-amber-900 font-medium max-w-md mx-auto">
                {giftContent.surprise.subtitle}
              </p>
            </div>

            {!redeemedPerk ? (
              /* Step 1: Select which perk to redeem */
              <div>
                <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-5 border border-amber-200/90 mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Choose Your Perk to Redeem:</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-800">
                      Tap to select
                    </span>
                  </h4>

                  <div className="space-y-2.5">
                    {giftContent.surprise.perkOptions.map((perk) => {
                      const isSelected = selectedPerkId === perk.id;
                      return (
                        <div
                          key={perk.id}
                          onClick={() => handleSelectPerk(perk.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                            isSelected
                              ? 'bg-amber-100/90 border-amber-800 shadow-md ring-2 ring-amber-500/30'
                              : 'bg-white/60 border-amber-200 hover:bg-white/90'
                          }`}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                        >
                          <span className="text-2xl mt-0.5">{perk.emoji}</span>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-amber-950 text-sm">
                                {perk.title}
                              </h5>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 font-semibold">
                                {perk.category}
                              </span>
                            </div>
                            <p className="text-xs text-amber-900/90 mt-0.5 leading-snug">
                              {perk.description}
                            </p>
                          </div>
                          <div className="pt-1">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-amber-900 bg-amber-900 text-white'
                                  : 'border-amber-400 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Custom Note */}
                  <div className="mt-4 pt-4 border-t border-amber-200/80">
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Add a Note or Details (Optional):
                    </label>
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="e.g., Boba run, tacos, or Saturday hangout!"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/90 border border-amber-300 text-amber-950 text-xs placeholder:text-amber-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Voucher Footer & Redeem Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-900">
                      Verification Code:
                    </div>
                    <div className="font-mono font-black text-base tracking-widest text-amber-950">
                      {giftContent.surprise.couponCode}
                    </div>
                    <div className="text-[11px] text-amber-900/80 italic mt-0.5">
                      {giftContent.surprise.validity}
                    </div>
                  </div>

                  <button
                    onClick={handleRedeem}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg bg-amber-950 text-amber-100 hover:bg-black hover:scale-105 active:scale-95 shadow-amber-950/40 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>Redeem Selected Perk</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Live Redeemed Voucher & Direct Share */
              <div className="animate-scale-up">
                <div className="bg-emerald-900/10 border-2 border-emerald-600/40 rounded-2xl p-5 mb-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md mb-2">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase font-bold tracking-widest text-emerald-800">
                    Officially Redeemed & Authenticated
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-amber-950 mt-1 mb-1">
                    {redeemedPerk.perk.emoji} {redeemedPerk.perk.title}
                  </h4>
                  <p className="text-xs text-amber-900 max-w-md mx-auto leading-relaxed">
                    {redeemedPerk.perk.description}
                  </p>

                  {redeemedPerk.note && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 text-xs text-amber-950 italic">
                      "{redeemedPerk.note}"
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-amber-900/15 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-amber-900">
                    <span>
                      <strong>Cert ID:</strong> {redeemedPerk.certificateId}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Redeemed:</strong> {redeemedPerk.date}
                    </span>
                  </div>
                </div>

                {/* Actions: WhatsApp Share + Copy + Reset */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full sm:w-auto px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Claim with Solomon on WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyClaim}
                    className="w-full sm:w-auto px-5 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-amber-950 hover:bg-black text-amber-100 shadow-md active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Claim Note Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Voucher Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleResetRedemption}
                    className="w-full sm:w-auto px-4 py-3 rounded-full text-xs font-semibold text-amber-900 hover:text-black hover:bg-amber-900/10 transition-colors flex items-center justify-center gap-1.5"
                    title="Change perk or redeem another"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Choose Another</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
