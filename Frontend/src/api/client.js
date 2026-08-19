import axios from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEYS } from "../constants.js";
import { tokenStorage } from "../utils.js";

// Callback set by AuthContext to force-logout on refresh failure
let onUnauthorized = null;
// Prevents multiple simultaneous 401s from rotating the token more than once
let refreshPromise = null;

// Shared Axios instance — every API call goes through this
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

/** Registers a callback that fires when the session is no longer valid. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/** Calls /api/auth/refresh with the stored refresh token to get a new pair. */
async function refreshTokens() {
  if (!refreshPromise) {
    const session = tokenStorage.get();
    if (!session?.refreshToken) {
      return Promise.reject(new Error("Missing refresh token"));
    }
    // Dynamic import avoids circular dependency (auth.js imports client.js)
    const { authService } = await import("./auth.js");
    refreshPromise = authService
      .refresh({ refreshToken: session.refreshToken })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/** Detects Render cold-start errors (no status or 5xx) for automatic retry. */
function isTransientWakeupError(error) {
  const status = error.response?.status;
  return !status || status >= 500;
}

// Attach JWT to every outgoing request
apiClient.interceptors.request.use((config) => {
  const session = tokenStorage.get();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Handle 401s (token refresh) and transient errors (Render cold starts)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // ── 401: try refreshing the token ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints (bad credentials, not expired token)
      if (originalRequest.url?.includes("/api/auth/")) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        const auth = await refreshTokens();
        const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEYS.rememberMe) === "true";
        tokenStorage.set(auth, rememberMe);
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    // ── Transient errors: retry up to 2 times with backoff ──
    if (isTransientWakeupError(error) && (originalRequest._transientRetries ?? 0) < 2) {
      originalRequest._transientRetries = (originalRequest._transientRetries ?? 0) + 1;
      const retryDelay = originalRequest._transientRetries * 2_000;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  },
);
