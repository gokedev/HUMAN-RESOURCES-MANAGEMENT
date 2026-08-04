import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { appQueryClient } from './queryClient.js';
import { setUnauthorizedHandler } from './api.js';
import { authService } from './api.js';
import { tokenStorage } from './utils.js';

const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    // Load an existing saved session so a refresh does not require immediate login.
    const [session, setSession] = useState(() => tokenStorage.get());
    // Persists the backend auth response and refreshes React state.
    const storeSession = useCallback((auth, rememberMe) => {
        tokenStorage.set(auth, rememberMe);
        appQueryClient.clear();
        setSession(tokenStorage.get());
    }, []);
    // Clears all token storage and resets session state.
    // ProtectedRoute in router.jsx handles the redirect to /login.
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
        async (payload, rememberMe) => {
            const auth = await authService.login(payload);
            storeSession(auth, rememberMe);
        },
        [storeSession],
    );
    // Company registration returns tokens immediately, so the admin is signed in after creation.
    const registerCompany = useCallback(
        async (payload) => {
            const auth = await authService.registerCompany(payload);
            storeSession(auth, true);
        },
        [storeSession],
    );
    // Memoizing the context value reduces needless rerenders in consumers.
    const value = useMemo(
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

const ThemeContext = createContext(undefined);
const THEME_KEY = 'hrms.theme';
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem(THEME_KEY);
        return storedTheme === 'dark' ? 'dark' : 'light';
    });
    useEffect(() => {
        document.documentElement.dataset.bsTheme = theme;
        document.body.classList.toggle('theme-dark', theme === 'dark');
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);
    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    }, []);
    const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }
    return context;
}

const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const notify = useCallback((message, tone = 'info') => {
        const id = crypto.randomUUID();
        setMessages((current) => [...current, { id, tone, message }]);
        window.setTimeout(() => {
            setMessages((current) => current.filter((toast) => toast.id !== id));
        }, 4_000);
    }, []);
    const value = useMemo(() => ({ notify }), [notify]);
    return (<ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {messages.map((toast) => (<div key={toast.id} className={`app-toast app-toast-${toast.tone}`} role="status">
            {toast.message}
          </div>))}
      </div>
    </ToastContext.Provider>);
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used inside ToastProvider');
    }
    return context;
}
