import React, { useState } from 'react';
import { Sparkles, Lock, KeyRound, Eye, EyeOff, ShieldCheck, Heart } from 'lucide-react';
import { authService, AUTHORIZED_PROFILES } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialUser?: 'solomon' | 'noella' | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialUser = null,
}) => {
  const [selectedUser, setSelectedUser] = useState<'solomon' | 'noella'>(initialUser || 'solomon');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const solomonProfile = AUTHORIZED_PROFILES.solomon;
  const ellaProfile = AUTHORIZED_PROFILES.noella;

  const handleSelectAccount = (userKey: 'solomon' | 'noella') => {
    soundEngine.playSparkle();
    setSelectedUser(userKey);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter your sanctuary passcode.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await authService.signIn(selectedUser, password, rememberMe);

      if (result.success && result.user) {
        soundEngine.playChime(659.25, 1.2, 0.08);
        onSuccess(result.user);
        onClose();
      } else {
        soundEngine.playChime(220, 0.4, 0.08);
        setErrorMessage(result.error || 'Authentication failed. Please verify your passcode.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#1c0d38]/95 via-[#130728]/98 to-[#0a0318] border border-pink-400/35 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(236,72,153,0.2)] text-white space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 border border-white/20 mb-1">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Unlock Sanctuary</span>
            <span className="text-pink-300 font-sans text-xl">♡</span>
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 font-light max-w-xs mx-auto">
            Choose your account to access your private notes, letters, and shared garden moments.
          </p>
        </div>

        {/* Account Selector Cards */}
        <div className="space-y-2.5 relative z-10">
          <label className="text-xs font-mono uppercase tracking-wider text-pink-200/90 font-semibold block px-1">
            Who is logging in?
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* Solomon Card */}
            <button
              type="button"
              onClick={() => handleSelectAccount('solomon')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col items-center text-center gap-2 cursor-pointer ${
                selectedUser === 'solomon'
                  ? 'bg-gradient-to-b from-purple-800/60 to-purple-950/80 border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.4)] scale-[1.02]'
                  : 'bg-white/[0.04] border-white/10 hover:border-white/25 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-pink-300/60 shadow-md">
                <img
                  src={solomonProfile.avatarUrl}
                  alt="Solomon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm block text-white truncate">
                  {solomonProfile.displayName}
                </span>
                <span className="text-[10px] font-mono text-purple-300/80 block">
                  @solomon
                </span>
              </div>
            </button>

            {/* Ella Card */}
            <button
              type="button"
              onClick={() => handleSelectAccount('noella')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col items-center text-center gap-2 cursor-pointer ${
                selectedUser === 'noella'
                  ? 'bg-gradient-to-b from-purple-800/60 to-purple-950/80 border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.4)] scale-[1.02]'
                  : 'bg-white/[0.04] border-white/10 hover:border-white/25 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-pink-300/60 shadow-md">
                <img
                  src={ellaProfile.avatarUrl}
                  alt="Ella"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm block text-white truncate">
                  {ellaProfile.displayName}
                </span>
                <span className="text-[10px] font-mono text-purple-300/80 block">
                  @ella
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label
              htmlFor="sanctuary-passcode"
              className="text-xs font-mono uppercase tracking-wider text-pink-200/90 font-semibold block px-1"
            >
              Passcode for {selectedUser === 'solomon' ? 'Solomon' : 'Ella'}
            </label>

            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 absolute left-3.5 text-pink-300/80 pointer-events-none" />
              <input
                id="sanctuary-passcode"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter sanctuary passcode..."
                required
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-black/40 border border-purple-400/30 text-white placeholder-purple-300/40 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/25 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-purple-300/70 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between text-xs text-purple-200/80 px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-purple-400/40 bg-black/40 text-pink-500 focus:ring-pink-400/30 w-3.5 h-3.5"
              />
              <span>Remember me on this device</span>
            </label>
            <span className="text-[11px] font-mono text-purple-300/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Isolated</span>
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-shake">
              <span className="shrink-0 text-base">⚠️</span>
              <p className="flex-1">{errorMessage}</p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-500/30 border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Unlocking Sanctuary...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Enter {selectedUser === 'solomon' ? 'Solomon’s' : 'Ella’s'} Garden</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-purple-400/15">
          <p className="text-[11px] font-mono text-purple-300/60 flex items-center justify-center gap-1.5">
            <Heart className="w-3 h-3 text-pink-400/60" />
            <span>Private Sanctuary for Solomon & Ella</span>
          </p>
        </div>
      </div>
    </div>
  );
};
