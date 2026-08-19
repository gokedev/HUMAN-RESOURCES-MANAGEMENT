import axios from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEYS } from "../constants.js";
import { tokenStorage } from "../utils.js";

let onUnauthorized = null;
let refreshPromise = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function refreshTokens() {
  if (!refreshPromise) {
    const session = tokenStorage.get();
    if (!session?.refreshToken) {
      return Promise.reject(new Error("Missing refresh token"));
    }
    const { authService } = await import("./auth.js");
    refreshPromise = authService
      .refresh({ refreshToken: session.refreshToken })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isTransientWakeupError(error) {
  const status = error.response?.status;
  return !status || status >= 500;
}

apiClient.interceptors.request.use((config) => {
  const session = tokenStorage.get();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes("/api/auth/");
      if (isAuthEndpoint) {
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
    if (isTransientWakeupError(error) && (originalRequest._transientRetries ?? 0) < 2) {
      originalRequest._transientRetries = (originalRequest._transientRetries ?? 0) + 1;
      const retryDelay = originalRequest._transientRetries * 2_000;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  },
);
