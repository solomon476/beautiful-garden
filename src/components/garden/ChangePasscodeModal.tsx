import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface ChangePasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const ChangePasscodeModal: React.FC<ChangePasscodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current passcode.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMessage('New passcode must be at least 4 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('New passcodes do not match. Please re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.updatePassword(newPassword.trim(), currentPassword.trim());

      if (!res.success) {
        setErrorMessage(res.error || 'Could not update passcode.');
        soundEngine.playChime(300, 0.4, 0.08);
      } else {
        soundEngine.playSparkle();
        setSuccessMessage('Passcode updated successfully! Your new sanctuary key is active.');
        setTimeout(() => {
          handleClose();
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 20000 }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-passcode-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#140827] border border-pink-400/40 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(244,114,182,0.2)] text-white space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-purple-200 hover:text-white transition-colors cursor-pointer"
          aria-label="Close change passcode dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30 border border-white/20">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2
            id="change-passcode-title"
            className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide"
          >
            Change Sanctuary Passcode
          </h2>
          <p className="text-xs text-purple-200/80 font-light">
            Update the private access key for{' '}
            <span className="font-semibold text-pink-200">{currentUser.displayName}</span>
          </p>
        </div>

        {/* Success Banner */}
        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold">{successMessage}</p>
              <p className="text-[11px] text-emerald-300/80">Saving changes to device memory...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Current Passcode */}
            <div className="space-y-1.5">
              <label
                htmlFor="current-passcode"
                className="text-xs font-mono uppercase tracking-wider text-pink-200/90 font-semibold block px-1"
              >
                Current Passcode
              </label>
              <div className="relative flex items-center">
                <input
                  id="current-passcode"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your existing passcode..."
                  required
                  autoFocus
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border border-purple-400/30 text-white placeholder-purple-300/40 text-xs focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 p-1 text-purple-300/70 hover:text-white transition-colors"
                  aria-label={showCurrent ? 'Hide current passcode' : 'Show current passcode'}
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Passcode */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-passcode"
                className="text-xs font-mono uppercase tracking-wider text-pink-200/90 font-semibold block px-1"
              >
                New Passcode
              </label>
              <div className="relative flex items-center">
                <input
                  id="new-passcode"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose at least 4 characters..."
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border border-purple-400/30 text-white placeholder-purple-300/40 text-xs focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 p-1 text-purple-300/70 hover:text-white transition-colors"
                  aria-label={showNew ? 'Hide new passcode' : 'Show new passcode'}
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Passcode */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-passcode"
                className="text-xs font-mono uppercase tracking-wider text-pink-200/90 font-semibold block px-1"
              >
                Confirm New Passcode
              </label>
              <input
                id="confirm-passcode"
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new passcode..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-400/30 text-white placeholder-purple-300/40 text-xs focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/25 transition-all"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-shake">
                <span className="shrink-0 text-sm">⚠️</span>
                <p className="flex-1">{errorMessage}</p>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-pink-500/30 border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Updating Key...' : 'Save New Passcode'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

