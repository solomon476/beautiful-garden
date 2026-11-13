import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../../utils/audio';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/gardenService';
import { chatService } from '../../services/chatService';
import type { UserProfile } from '../../types/garden';

interface ThinkingOfYouButtonProps {
  currentUser: UserProfile;
}

export const ThinkingOfYouButton: React.FC<ThinkingOfYouButtonProps> = ({ currentUser: _currentUser }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSendPetal = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSparkle();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1200);

    const partner = authService.getPartner();
    const user = authService.getCurrentUser();

    // 1. Shower blossom petals on screen
    try {
      confetti({
        particleCount: 32,
        spread: 80,
        origin: { y: 0.15 },
        colors: ['#f472b6', '#ec4899', '#fbcfe8', '#fda4af', '#f43f5e', '#ffb6c1'],
        shapes: ['circle'],
        scalar: 1.3,
        ticks: 220,
        gravity: 0.65,
      });
    } catch {
      // fallback
    }

    // 2. Send realtime notification to partner
    notificationService.sendNotification({
      type: 'petal',
      title: '🌸 Thinking of You',
      message: `${user.displayName} just sent a warm thought and cherry blossoms your way ♡`,
      targetTab: 'garden',
      senderId: user.id,
      senderName: user.displayName,
      recipientId: partner.id,
      entityId: `petal-ping-${Date.now()}`,
    });

    // 2.5 Automatically drop a sweet event into Whispers Chat
    chatService.postEventMessage({
      eventType: 'petal',
      title: 'Thinking of You',
      content: `🌸 ${user.displayName} sent a shower of cherry blossoms! "Thinking of you" ♡`,
      actorId: user.id,
      actorName: user.displayName,
      linkTab: 'garden',
    });

    // 3. Show self confirmation toast
    setToastMessage(`🌸 Sent a warm thought to ${partner.displayName}! ♡`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSendPetal}
        className={`relative p-2 sm:px-2.5 sm:py-1.5 rounded-full bg-white/10 hover:bg-pink-500/25 border border-pink-400/35 hover:border-pink-400/60 text-white transition-all shadow-sm active:scale-90 cursor-pointer flex items-center gap-1.5 ${
          isAnimating ? 'scale-110 ring-2 ring-pink-400/50' : ''
        }`}
        title={`Send a "Thinking of You" blossom to ${authService.getPartner().displayName} 🌸`}
        aria-label="Send Thinking of You blossom"
      >
        <span className={`text-base sm:text-sm leading-none ${isAnimating ? 'animate-bounce' : ''}`}>
          🌸
        </span>
        <span className="hidden lg:inline text-xs font-serif text-pink-200/90 font-medium">
          Thinking of You
        </span>
      </button>

      {/* Floating confirmation toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-600/95 via-rose-500/95 to-purple-600/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl border border-pink-400/40 animate-fade-in flex items-center gap-2 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
