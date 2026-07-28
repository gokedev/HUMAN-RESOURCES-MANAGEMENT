import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { tokenStorage } from '../utils/tokenStorage';
import type { ApiErrorResponse, AuthResponse } from '../types/api';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  // Marks that a 401 response has already triggered one refresh attempt.
  _retry?: boolean;
  // Counts short retries for transient Render wake-up/server errors.
  _transientRetries?: number;
}

// AuthProvider registers this callback so the API layer can force logout on refresh failure.
let onUnauthorized: (() => void) | null = null;
// Shared promise prevents multiple simultaneous 401 responses from rotating the refresh token more than once.
let refreshPromise: Promise<AuthResponse> | null = null;

// All backend calls go through this configured Axios instance.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// Refreshes the access token using the README-documented /api/auth/refresh endpoint.
async function refreshTokens() {
  if (!refreshPromise) {
    const session = tokenStorage.get();

    // Without a refresh token, the user must sign in again.
    if (!session?.refreshToken) {
      return Promise.reject(new Error('Missing refresh token'));
    }

    refreshPromise = axios
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken: session.refreshToken,
      })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Render-hosted services can sleep, so temporary network/5xx failures are retried briefly.
function isTransientWakeupError(error: AxiosError<ApiErrorResponse>) {
  const status = error.response?.status;
  return !status || status >= 500;
}

// Adds the JWT access token to every authenticated backend request.
apiClient.interceptors.request.use((config) => {
  const session = tokenStorage.get();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

// Handles expired tokens, transient backend wake-up errors, and final error propagation.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh logic for auth endpoints — a 401 there means bad credentials, not an expired session.
      const isAuthEndpoint = originalRequest.url?.includes('/api/auth/');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Rotate tokens, persist the new pair, and retry the original protected request.
        const auth = await refreshTokens();
        const rememberMe = localStorage.getItem('hrms.rememberMe') === 'true';
        tokenStorage.set(auth, rememberMe);
        originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failure means the session is no longer valid.
        tokenStorage.clear();
        onUnauthorized?.();
        return Promise.reject(refreshError);
      }
    }

    if (isTransientWakeupError(error) && (originalRequest._transientRetries ?? 0) < 2) {
      // Back off slightly before retrying a likely sleeping Render service.
      originalRequest._transientRetries = (originalRequest._transientRetries ?? 0) + 1;
      const retryDelay = originalRequest._transientRetries * 2_000;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
