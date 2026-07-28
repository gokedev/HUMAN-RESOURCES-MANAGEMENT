import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { appQueryClient } from '../app/queryClient';
import { setUnauthorizedHandler } from '../services/axios';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginRequest, RegisterCompanyRequest, UserRole } from '../types/api';
import { tokenStorage, type StoredSession } from '../utils/tokenStorage';

interface AuthContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (payload: LoginRequest, rememberMe: boolean) => Promise<void>;
  registerCompany: (payload: RegisterCompanyRequest) => Promise<void>;
  logout: () => void;
  storeSession: (auth: AuthResponse, rememberMe: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  // Load an existing saved session so a refresh does not require immediate login.
  const [session, setSession] = useState<StoredSession | null>(() => tokenStorage.get());

  // Persists the backend auth response and refreshes React state.
  const storeSession = useCallback((auth: AuthResponse, rememberMe: boolean) => {
    tokenStorage.set(auth, rememberMe);
    appQueryClient.clear();
    setSession(tokenStorage.get());
  }, []);

  // Clears all token storage and resets session state.
  // ProtectedRoute in guards.tsx handles the redirect to /login.
  const logout = useCallback(() => {
    tokenStorage.clear();
    appQueryClient.clear();
    setSession(null);
  }, []);

  // Lets Axios trigger logout when refresh token rotation fails.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Login follows the README contract: email, password, and companySlug are all required.
  const login = useCallback(
    async (payload: LoginRequest, rememberMe: boolean) => {
      const auth = await authService.login(payload);
      storeSession(auth, rememberMe);
    },
    [storeSession],
  );

  // Company registration returns tokens immediately, so the admin is signed in after creation.
  const registerCompany = useCallback(
    async (payload: RegisterCompanyRequest) => {
      const auth = await authService.registerCompany(payload);
      storeSession(auth, true);
    },
    [storeSession],
  );

  // Memoizing the context value reduces needless rerenders in consumers.
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      role: session?.role ?? null,
      login,
      registerCompany,
      logout,
      storeSession,
    }),
    [login, logout, registerCompany, session, storeSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  // This guard catches accidental use outside the provider during development.
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
