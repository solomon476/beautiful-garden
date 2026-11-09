import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { authService } from '../../services/authService';
import type { UserProfile } from '../../types/garden';
import { soundEngine } from '../../utils/audio';

interface ChangeProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

const PRESET_AVATARS = [
  { id: 'solomon', label: 'Solomon', url: '/assets/memories/photo-solomon-avatar.jpg' },
  { id: 'noella-sun', label: 'Noella (Sun)', url: '/assets/memories/photo-sun-portrait.jpg' },
  { id: 'noella-balcony', label: 'Noella (Balcony)', url: '/assets/memories/photo-balcony-peace.jpg' },
  { id: 'noella-laugh', label: 'Noella (Laugh)', url: '/assets/memories/photo-goofy-laugh.jpg' },
  { id: 'hands', label: 'Holding Hands', url: '/assets/memories/photo-holding-hands.jpg' },
  { id: 'twilight', label: 'Twilight Date', url: '/assets/memories/photo-twilight-date.jpg' },
  { id: 'rose', label: 'Garden Rose', url: '/assets/garden/mobile_rose_banner.jpg' },
  { id: 'night', label: 'Dreamy Night', url: '/assets/dreamy_night_garden.jpg' },
];

export const ChangeProfilePhotoModal: React.FC<ChangeProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentUser.avatarUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process uploaded image file: downscale to a 400x400 square for fast, responsive loading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    soundEngine.playSparkle();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setSelectedPhoto(event.target?.result as string);
            setIsProcessing(false);
            return;
          }

          // Center crop to square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedPhoto(compressed);
        } catch (err) {
          console.warn('Canvas crop fallback:', err);
          setSelectedPhoto(event.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setErrorMsg('Could not read image file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Failed to open file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedPhoto) {
      setErrorMsg('Please select or upload a photo.');
      return;
    }

    try {
      soundEngine.playChime(587.33, 1.2, 0.1);
      await authService.updateAvatar(selectedPhoto, currentUser.username);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not save profile photo.');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      style={{
        zIndex: 20000,
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
      }}
      onClick={onClose}
    >
      <div
        className="relative bg-[#130728] border border-pink-400/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-scale-up"
        style={{
          zIndex: 20001,
          width: 'min(420px, 92vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#14062a',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(244, 114, 182, 0.25)',
          borderRadius: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-400/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                Change Profile Photo
              </h3>
              <p className="text-[11px] text-pink-200/70 font-sans">
                For {currentUser.displayName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Current / Selected Preview */}
        <div className="flex flex-col items-center justify-center py-1 space-y-2">
          <div
            className="relative group cursor-pointer"
            style={{ width: '96px', height: '96px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #f472b6',
                boxShadow: '0 0 20px rgba(244, 114, 182, 0.35)',
                backgroundColor: '#090314',
              }}
            >
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt="Avatar preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-purple-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Hover Camera Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
              <Camera className="w-5 h-5 text-pink-300 mb-0.5" />
              <span className="text-[9px] font-sans font-medium">Upload</span>
            </div>
          </div>

          <p className="text-[11px] text-purple-200/80 font-sans">
            Tap photo above or choose an option below
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playSparkle();
            fileInputRef.current?.click();
          }}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-pink-400/30 text-pink-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-pink-300" />
          <span>{isProcessing ? 'Processing Image...' : 'Upload from Phone or Computer 📷'}</span>
        </button>

        {/* Preset Garden Avatars */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/70 block">
            Or Choose from Garden Presets
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
            }}
          >
            {PRESET_AVATARS.map((preset) => {
              const isSelected = selectedPhoto === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playSparkle();
                    setSelectedPhoto(preset.url);
                  }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: isSelected
                      ? '2px solid #f472b6'
                      : '1px solid rgba(255, 255, 255, 0.18)',
                    padding: 0,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 10px rgba(244, 114, 182, 0.5)' : 'none',
                    transform: isSelected ? 'scale(1.05)' : 'none',
                  }}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/garden/card_archive.jpg';
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(244, 114, 182, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-400/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Save Profile Photo ✨</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
