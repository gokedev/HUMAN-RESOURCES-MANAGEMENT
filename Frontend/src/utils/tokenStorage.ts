import { TOKEN_STORAGE_KEYS } from '../constants/config';
import type { AuthResponse, UserRole } from '../types/api';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  email: string;
  companySlug: string;
}

const storageFor = (rememberMe: boolean) => (rememberMe ? localStorage : sessionStorage);

export const tokenStorage = {
  get(): StoredSession | null {
    const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEYS.rememberMe) === 'true';
    const storage = storageFor(rememberMe);
    const accessToken = storage.getItem(TOKEN_STORAGE_KEYS.accessToken);
    const refreshToken = storage.getItem(TOKEN_STORAGE_KEYS.refreshToken);
    const role = storage.getItem(TOKEN_STORAGE_KEYS.role) as UserRole | null;
    const email = storage.getItem(TOKEN_STORAGE_KEYS.email);
    const companySlug = storage.getItem(TOKEN_STORAGE_KEYS.companySlug);

    if (!accessToken || !refreshToken || !role || !email || !companySlug) {
      return null;
    }

    return { accessToken, refreshToken, role, email, companySlug };
  },
  set(auth: AuthResponse, rememberMe: boolean) {
    tokenStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEYS.rememberMe, String(rememberMe));
    const storage = storageFor(rememberMe);
    storage.setItem(TOKEN_STORAGE_KEYS.accessToken, auth.accessToken);
    storage.setItem(TOKEN_STORAGE_KEYS.refreshToken, auth.refreshToken);
    storage.setItem(TOKEN_STORAGE_KEYS.role, auth.role);
    storage.setItem(TOKEN_STORAGE_KEYS.email, auth.email);
    storage.setItem(TOKEN_STORAGE_KEYS.companySlug, auth.companySlug);
  },
  clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.rememberMe);
    Object.values(TOKEN_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  },
};
