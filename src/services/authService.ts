import { supabase, isLiveSupabaseConfigured } from './supabaseClient';
import type { UserProfile } from '../types/garden';

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: number;
}

export const AUTHORIZED_PROFILES: Record<string, UserProfile> = {
  solomon: {
    id: 'user-solomon-uuid',
    username: 'solomon',
    displayName: 'Solomon 🌿',
    avatarUrl: '/assets/memories/photo-solomon-avatar.jpg',
  },
  noella: {
    id: 'user-noella-uuid',
    username: 'noella',
    displayName: 'Noella ✨',
    avatarUrl: '/assets/memories/photo-sun-portrait.jpg',
  },
};

// Aliases
AUTHORIZED_PROFILES.ella = AUTHORIZED_PROFILES.noella;

// Cryptographic Salt & Hashes for offline/local standalone mode
const AUTH_CONFIG = {
  solomon: {
    salt: 'pt_salt_solomon_2026_garden',
    // Hash of 'solomon2026'
    hash: '00df6f733e7eeeb2da78197d4b4eebd48616f31c0626402fa1fb49ebf16538d5',
  },
  noella: {
    salt: 'pt_salt_noella_2026_garden',
    // Hashes of 'noella2026' and 'ella2026'
    hashes: [
      '77ad5fd165884bb227be40d0a597668c180f4e4c1f4f4e9ea891fab6c7639d41',
      '59897c9830b19aa6349a1085d03cc294a6ea085d8a55eff9f7c386f1b42d254b',
    ],
  },
};

const STORAGE_KEY_SESSION = 'PT_AUTH_SESSION_V2';
const STORAGE_KEY_CUSTOM_HASH = 'PT_AUTH_CUSTOM_HASH_';
const STORAGE_KEY_CUSTOM_AVATAR = 'PT_CUSTOM_AVATAR_';

const authMemoryStore: Record<string, string> = {};

function getStoredAvatar(username: string): string | null {
  return getAuthItem(`${STORAGE_KEY_CUSTOM_AVATAR}${username.toLowerCase()}`);
}

function getAuthItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      // ignore
    }
  }
  return authMemoryStore[key] ?? null;
}

function setAuthItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
  authMemoryStore[key] = value;
}

function removeAuthItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  delete authMemoryStore[key];
}

// Helper to compute SHA-256 hash in browser
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

class AuthService {
  private activeUser: UserProfile | null = null;
  private userListeners = new Set<(user: UserProfile) => void>();
  private initialized = false;

  constructor() {
    this.init();
  }

  public async init(): Promise<UserProfile | null> {
    if (this.initialized) return this.activeUser;
    this.initialized = true;

    // 1. If Supabase is connected, check remote session
    if (isLiveSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const email = session.user.email?.toLowerCase() || '';
          const metaUsername = (session.user.user_metadata?.username || '').toLowerCase();
          
          if (email.includes('solomon') || metaUsername === 'solomon') {
            this.activeUser = AUTHORIZED_PROFILES.solomon;
          } else if (email.includes('noella') || email.includes('ella') || metaUsername === 'noella' || metaUsername === 'ella') {
            this.activeUser = AUTHORIZED_PROFILES.noella;
          }
        }

        // Listen for live Supabase Auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
          if (!session?.user) {
            this.activeUser = null;
          } else {
            const email = session.user.email?.toLowerCase() || '';
            const metaUsername = (session.user.user_metadata?.username || '').toLowerCase();
            if (email.includes('solomon') || metaUsername === 'solomon') {
              this.activeUser = AUTHORIZED_PROFILES.solomon;
            } else {
              this.activeUser = AUTHORIZED_PROFILES.noella;
            }
          }
          this.notifyListeners();
        });
      } catch (err) {
        console.warn('Supabase auth session check failed:', err);
      }
    }

    // 2. If no active user yet, check persisted local session token
    if (!this.activeUser && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SESSION) || sessionStorage.getItem(STORAGE_KEY_SESSION);
        if (raw) {
          const session: AuthSession = JSON.parse(raw);
          if (session && session.expiresAt > Date.now() && session.user) {
            const canonicalUsername = session.user.username === 'solomon' ? 'solomon' : 'noella';
            this.activeUser = AUTHORIZED_PROFILES[canonicalUsername];
          } else {
            this.clearLocalSession();
          }
        }
      } catch (e) {
        this.clearLocalSession();
      }
    }

    this.notifyListeners();
    return this.activeUser;
  }

  public getCurrentUser(): UserProfile {
    // Return active authenticated user, or default to Solomon for read-only initial page view
    const base = this.activeUser || AUTHORIZED_PROFILES.solomon;
    const customAvatar = getStoredAvatar(base.username);
    if (customAvatar) {
      return { ...base, avatarUrl: customAvatar };
    }
    return base;
  }

  public getAuthenticatedUser(): UserProfile | null {
    if (!this.activeUser) return null;
    const customAvatar = getStoredAvatar(this.activeUser.username);
    return customAvatar ? { ...this.activeUser, avatarUrl: customAvatar } : this.activeUser;
  }

  public isAuthenticated(): boolean {
    return this.activeUser !== null;
  }

  public isLiveSupabase(): boolean {
    return isLiveSupabaseConfigured;
  }

  public getPartner(): UserProfile {
    const cur = this.getCurrentUser();
    const partnerKey = cur.username === 'solomon' ? 'noella' : 'solomon';
    const base = AUTHORIZED_PROFILES[partnerKey];
    const customAvatar = getStoredAvatar(base.username);
    if (customAvatar) {
      return { ...base, avatarUrl: customAvatar };
    }
    return base;
  }

  public async updateAvatar(avatarUrl: string, username?: string): Promise<void> {
    const targetKey = (username || this.getCurrentUser().username).toLowerCase();
    setAuthItem(`${STORAGE_KEY_CUSTOM_AVATAR}${targetKey}`, avatarUrl);
    
    if (AUTHORIZED_PROFILES[targetKey]) {
      AUTHORIZED_PROFILES[targetKey] = {
        ...AUTHORIZED_PROFILES[targetKey],
        avatarUrl,
      };
    }
    if (this.activeUser && this.activeUser.username.toLowerCase() === targetKey) {
      this.activeUser = {
        ...this.activeUser,
        avatarUrl,
      };
    }
    this.notifyListeners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('garden-profile-updated', {
          detail: { username: targetKey, avatarUrl },
        })
      );
    }
  }

  public subscribeUser(listener: (user: UserProfile) => void): () => void {
    this.userListeners.add(listener);
    // Trigger immediately with current user profile
    listener(this.getCurrentUser());
    return () => this.userListeners.delete(listener);
  }

  private notifyListeners(): void {
    const user = this.getCurrentUser();
    this.userListeners.forEach((fn) => fn(user));
  }

  public async signIn(
    usernameInput: string,
    passwordInput: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const normalized = usernameInput.trim().toLowerCase();
    
    // Strict whitelist: Only Solomon or Noella
    if (normalized !== 'solomon' && normalized !== 'noella' && normalized !== 'ella') {
      return {
        success: false,
        error: 'Only Solomon and Noella have access to this sanctuary.',
      };
    }

    const canonicalKey = normalized === 'solomon' ? 'solomon' : 'noella';
    const targetProfile = AUTHORIZED_PROFILES[canonicalKey];

    // 1. If Supabase is connected, attempt remote signInWithPassword
    if (isLiveSupabaseConfigured && supabase) {
      try {
        const email = canonicalKey === 'solomon' ? 'solomon@perfecttime.internal' : 'noella@perfecttime.internal';
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordInput,
        });

        if (error) {
          // If remote fails, fall back to checking cryptographic local hash
          console.warn('Supabase sign-in error:', error.message);
        } else if (data?.user) {
          this.activeUser = targetProfile;
          this.notifyListeners();
          return { success: true, user: targetProfile };
        }
      } catch (e: any) {
        console.warn('Supabase auth network error, attempting local validation:', e);
      }
    }

    // 2. Cryptographic Salt & Hash Verification
    const customHash = getAuthItem(STORAGE_KEY_CUSTOM_HASH + canonicalKey);
    let isValid = false;

    if (canonicalKey === 'solomon') {
      const cfg = AUTH_CONFIG.solomon;
      const computedHash = await sha256Hex(cfg.salt + passwordInput.trim());
      if (customHash) {
        isValid = computedHash === customHash;
      } else {
        isValid = computedHash === cfg.hash;
      }
    } else {
      const cfg = AUTH_CONFIG.noella;
      const computedHash = await sha256Hex(cfg.salt + passwordInput.trim());
      if (customHash) {
        isValid = computedHash === customHash;
      } else {
        isValid = cfg.hashes.includes(computedHash);
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: 'Incorrect passcode for this sanctuary account.',
      };
    }

    // Validated successfully
    this.activeUser = targetProfile;

    // Generate secure session token (valid for 30 days if rememberMe, else 24 hours)
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    const session: AuthSession = {
      token,
      user: targetProfile,
      expiresAt: Date.now() + duration,
    };

    const serialized = JSON.stringify(session);
    setAuthItem(STORAGE_KEY_SESSION, serialized);

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
      } else {
        sessionStorage.setItem(STORAGE_KEY_SESSION, serialized);
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    }

    this.notifyListeners();
    return { success: true, user: targetProfile };
  }

  public async signOut(): Promise<void> {
    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    this.clearLocalSession();
    this.activeUser = null;
    this.notifyListeners();
  }

  private clearLocalSession(): void {
    removeAuthItem(STORAGE_KEY_SESSION);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
      } catch {
        // ignore
      }
    }
  }

  public async updatePassword(
    newPassword: string,
    currentPassword?: string,
    targetUsername?: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.activeUser || (targetUsername ? AUTHORIZED_PROFILES[targetUsername.toLowerCase()] : null) || AUTHORIZED_PROFILES.solomon;
    const canonicalKey = user.username === 'solomon' ? 'solomon' : 'noella';
    const cfg = canonicalKey === 'solomon' ? AUTH_CONFIG.solomon : AUTH_CONFIG.noella;

    // Optional current password check
    if (currentPassword) {
      const currentSalt = cfg.salt;
      const currentHash = await sha256Hex(currentSalt + currentPassword.trim());
      const savedHash = getAuthItem(STORAGE_KEY_CUSTOM_HASH + canonicalKey);

      let isValidCurrent = false;
      if (savedHash && currentHash === savedHash) {
        isValidCurrent = true;
      } else if (canonicalKey === 'solomon' && currentHash === AUTH_CONFIG.solomon.hash) {
        isValidCurrent = true;
      } else if (canonicalKey === 'noella' && AUTH_CONFIG.noella.hashes.includes(currentHash)) {
        isValidCurrent = true;
      }

      if (!isValidCurrent) {
        return { success: false, error: 'Current passcode is incorrect.' };
      }
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'New passcode must be at least 4 characters long.' };
    }

    const salt = cfg.salt;
    const newHash = await sha256Hex(salt + newPassword.trim());

    setAuthItem(STORAGE_KEY_CUSTOM_HASH + canonicalKey, newHash);

    // Automatically establish active authenticated session
    this.activeUser = AUTHORIZED_PROFILES[canonicalKey];
    const session: AuthSession = {
      token: 'pt_token_' + Date.now(),
      user: this.activeUser,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    setAuthItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    this.notifyListeners();

    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({ password: newPassword.trim() });
      } catch (err) {
        console.warn('Could not update remote Supabase password:', err);
      }
    }

    return { success: true };
  }
}

export const authService = new AuthService();
