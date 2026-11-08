import React from 'react';
import { PartnerHeaderAvatar } from './PartnerHeaderAvatar';
import type { UserProfile } from '../../types/garden';

interface UserSwitcherProps {
  currentUser: UserProfile;
  compact?: boolean;
}

/**
 * UserSwitcher — Renders the partner's avatar in the header without text clutter.
 * Solomon sees Noella's photo; Noella sees Solomon's photo.
 */
export const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser }) => {
  return <PartnerHeaderAvatar currentUser={currentUser} />;
};
