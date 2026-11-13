import React, { useState, useEffect } from 'react';
import {
  Home,
  Sparkles,
  Music2,
  BookOpen,
  MessageCircleHeart,
  Heart,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { chatService } from '../../services/chatService';
import { authService } from '../../services/gardenService';

interface MobileBottomNavProps {
  currentView: 'home' | 'garden' | 'music' | 'archive' | 'chat' | 'more' | string;
  onNavigate: (target: 'home' | 'garden' | 'music' | 'archive' | 'chat' | 'more' | string) => void;
  isGardenOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  isGardenOpen,
}) => {
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setUnreadChatCount(chatService.getUnreadCount(user.id));

    const unsub = chatService.subscribe(() => {
      setUnreadChatCount(chatService.getUnreadCount(user.id));
    });
    return unsub;
  }, []);

  const handleNavClick = (target: 'home' | 'garden' | 'music' | 'archive' | 'chat' | 'more') => {
    soundEngine.playSparkle();
    onNavigate(target);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: !isGardenOpen && (currentView === 'home' || currentView === 'welcome' || !currentView),
    },
    {
      id: 'garden',
      label: 'Our Garden',
      icon: Sparkles,
      isActive: isGardenOpen && (currentView === 'garden' || currentView === 'overview'),
    },
    {
      id: 'music',
      label: 'Music',
      icon: Music2,
      isActive: isGardenOpen && currentView === 'sound',
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: BookOpen,
      isActive: isGardenOpen ? currentView === 'archive' : currentView === 'memories',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageCircleHeart,
      isActive: isGardenOpen && currentView === 'chat',
      badgeCount: unreadChatCount,
    },
    {
      id: 'more',
      label: 'More',
      icon: Heart,
      isActive:
        isGardenOpen &&
        (currentView === 'more' ||
          ['letters', 'petals', 'shelf', 'capsule', 'world'].includes(currentView)),
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav sm:hidden"
      style={{ zIndex: 3000 }}
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id as any)}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 ${isActive ? 'stroke-[2.2] text-[#8b25a8]' : 'text-[#65487d]'
                  }`}
              />
              {Boolean(item.badgeCount && item.badgeCount > 0) && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse border border-white" />
              )}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#8b25a8]" />
              )}
            </div>
            <span
              className={`text-[10px] font-sans ${isActive ? 'font-bold text-[#8b25a8]' : 'text-[#65487d]'
                }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
