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
    displayName: 'Ella ✨',
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
    salt: 'pt_salt_ella_2026_garden',
    // Hashes of 'ella2026' and 'noella2026'
    hashes: [
      'd184953a6e43cdb8b57f44dce9ba2e1001c3e8ad2d866659adb2499e40332a05',
      '7a3e80d57dbef61654e4fa6b2dc17f9bd40b6381de800233497b3f582e7edf41',
    ],
  },
};

const STORAGE_KEY_SESSION = 'PT_AUTH_SESSION_V2';
const STORAGE_KEY_CUSTOM_HASH = 'PT_AUTH_CUSTOM_HASH_';

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
          } else if (email.includes('ella') || email.includes('noella') || metaUsername === 'noella' || metaUsername === 'ella') {
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
    return this.activeUser || AUTHORIZED_PROFILES.solomon;
  }

  public getAuthenticatedUser(): UserProfile | null {
    return this.activeUser;
  }

  public isAuthenticated(): boolean {
    return this.activeUser !== null;
  }

  public isLiveSupabase(): boolean {
    return isLiveSupabaseConfigured;
  }

  public getPartner(): UserProfile {
    const cur = this.getCurrentUser();
    return cur.username === 'solomon' ? AUTHORIZED_PROFILES.noella : AUTHORIZED_PROFILES.solomon;
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
    
    // Strict whitelist: Only Solomon or Ella
    if (normalized !== 'solomon' && normalized !== 'noella' && normalized !== 'ella') {
      return {
        success: false,
        error: 'Only Solomon and Ella have access to this sanctuary.',
      };
    }

    const canonicalKey = normalized === 'solomon' ? 'solomon' : 'noella';
    const targetProfile = AUTHORIZED_PROFILES[canonicalKey];

    // 1. If Supabase is connected, attempt remote signInWithPassword
    if (isLiveSupabaseConfigured && supabase) {
      try {
        const email = canonicalKey === 'solomon' ? 'solomon@perfecttime.internal' : 'ella@perfecttime.internal';
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
    const customHash = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CUSTOM_HASH + canonicalKey) : null;
    let isValid = false;

    if (canonicalKey === 'solomon') {
      const cfg = AUTH_CONFIG.solomon;
      const computedHash = await sha256Hex(cfg.salt + passwordInput.trim());
      if (customHash && computedHash === customHash) {
        isValid = true;
      } else if (computedHash === cfg.hash) {
        isValid = true;
      }
    } else {
      const cfg = AUTH_CONFIG.noella;
      const computedHash = await sha256Hex(cfg.salt + passwordInput.trim());
      if (customHash && computedHash === customHash) {
        isValid = true;
      } else if (cfg.hashes.includes(computedHash)) {
        isValid = true;
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

    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(session);
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_SESSION, serialized);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }

  public async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.activeUser) {
      return { success: false, error: 'Must be logged in to update password.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Passcode must be at least 6 characters long.' };
    }

    const canonicalKey = this.activeUser.username === 'solomon' ? 'solomon' : 'noella';
    const salt = canonicalKey === 'solomon' ? AUTH_CONFIG.solomon.salt : AUTH_CONFIG.noella.salt;
    const newHash = await sha256Hex(salt + newPassword.trim());

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CUSTOM_HASH + canonicalKey, newHash);
    }

    if (isLiveSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (err) {
        console.warn('Could not update remote Supabase password:', err);
      }
    }

    return { success: true };
  }
}

export const authService = new AuthService();
