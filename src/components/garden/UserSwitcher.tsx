import React from 'react';
import { UserAccountMenu } from './UserAccountMenu';
import type { UserProfile } from '../../types/garden';

interface UserSwitcherProps {
  currentUser: UserProfile;
  compact?: boolean;
}

/**
 * UserAccountMenu replaces the insecure instant identity switcher.
 * Displays "Solomon — My Garden" or "Noella — My Garden" derived from the authenticated identity,
 * with secure logout and passcode-protected account switching.
 */
export const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, compact = false }) => {
  return <UserAccountMenu currentUser={currentUser} compact={compact} />;
};
