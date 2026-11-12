import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Bell, Share } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationState, setNotificationState] = useState<NotificationPermission | 'unsupported'>('default');
  const [showNotificationCard, setShowNotificationCard] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in installed standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as any).standalone);
    setIsStandalone(standaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Check Notification state
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
      if (Notification.permission === 'default') {
        const notifDismissed = localStorage.getItem('pt_pwa_notif_dismissed');
        if (!notifDismissed) {
          setShowNotificationCard(true);
        }
      }
    } else {
      setNotificationState('unsupported');
    }

    // Check if dismissed previously
    const dismissedTime = localStorage.getItem('pt_pwa_install_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      setIsDismissed(true);
    }

    // Listen for Chrome/Android PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    soundEngine.playSparkle();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pt_pwa_install_dismissed', Date.now().toString());
  };

  const handleEnableNotifications = async () => {
    soundEngine.playSparkle();
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(permission);
      setShowNotificationCard(false);

      if (permission === 'granted') {
        soundEngine.playChime(523.25, 1.2, 0.08);
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('Lock Screen Alerts Enabled! 💖', {
              body: 'You will now receive whispers and like alerts directly on your phone.',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
            });
          });
        }
      }
    } catch (err) {
      console.warn('Could not request notification permission:', err);
    }
  };

  const handleDismissNotifications = () => {
    setShowNotificationCard(false);
    localStorage.setItem('pt_pwa_notif_dismissed', 'true');
  };

  // If already standalone and notifications configured, no need to show banner
  if (isStandalone && !showNotificationCard) return null;
  if (isDismissed && !showNotificationCard) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9990] max-w-md mx-auto space-y-2 pointer-events-auto">
      {/* 1. Install App Banner (if not installed yet) */}
      {!isStandalone && !isDismissed && (deferredPrompt || isIos) && (
        <div className="relative overflow-hidden rounded-2xl border border-pink-400/40 bg-gradient-to-r from-purple-950/90 via-fuchsia-950/90 to-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl animate-fade-in text-xs text-white">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/icon-192.png"
                alt="App Icon"
                className="w-10 h-10 rounded-xl border border-pink-400/50 shadow-md shrink-0 object-cover"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif font-bold text-white tracking-wide truncate">
                    Install Perfect Time
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/40 font-mono">
                    App Mode
                  </span>
                </div>
                <p className="text-[11px] text-pink-200/80 leading-tight mt-0.5">
                  {isIos
                    ? 'Tap Share ⎋ then "Add to Home Screen" 📲 for full-screen mode'
                    : 'Add to your phone for a full-screen app with zero browser clutter ✨'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-white/50 hover:text-white p-1 rounded-full shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-white/10">
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install to Phone ✨</span>
              </button>
            )}

            {isIos && (
              <div className="flex-1 text-[11px] font-mono text-pink-300 flex items-center justify-center gap-1.5 bg-white/[0.06] py-1.5 px-2 rounded-xl border border-pink-400/20">
                <Share className="w-3 h-3 text-pink-300" />
                <span>Share ➔ Add to Home Screen</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Notification Permission Card */}
      {showNotificationCard && notificationState === 'default' && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-950/90 to-indigo-950/95 p-3.5 shadow-2xl backdrop-blur-xl animate-fade-in text-xs text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-pink-500/25 border border-pink-400/40 flex items-center justify-center text-pink-300 shrink-0">
                <Bell className="w-4 h-4 animate-bounce-subtle" />
              </div>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-white tracking-wide">
                  Enable Lock Screen Alerts 🔔
                </h4>
                <p className="text-[11px] text-purple-200/80 leading-tight mt-0.5">
                  Get notified like WhatsApp when memories are liked or new notes arrive.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissNotifications}
              className="text-white/50 hover:text-white p-1 rounded-full shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="flex-1 py-1.5 px-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Turn On Phone Alerts ♡</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
