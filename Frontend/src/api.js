import axios from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEYS } from "./constants.js";
import { tokenStorage } from "./utils.js";
// AuthProvider registers this callback so the API layer can force logout on refresh failure.
let onUnauthorized = null;
// Shared promise prevents multiple simultaneous 401 responses from rotating the refresh token more than once.
let refreshPromise = null;

// All backend calls go through this configured Axios instance.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export const authService = {
  login(payload) {
    return apiClient.post("/api/auth/login", payload).then((response) => response.data);
  },
  registerCompany(payload) {
    return apiClient
      .post("/api/auth/register-company", payload)
      .then((response) => response.data);
  },
  refresh(payload) {
    return apiClient.post("/api/auth/refresh", payload).then((response) => response.data);
  },
  forgotPassword(payload) {
    return apiClient
      .post("/api/auth/forgot-password", payload)
      .then((response) => response.data);
  },
  resetPassword(payload) {
    return apiClient
      .post("/api/auth/reset-password", payload)
      .then((response) => response.data);
  },
  acceptInvitation(payload) {
    return apiClient
      .post("/api/auth/accept-invitation", payload)
      .then((response) => response.data);
  },
};

export const employeeService = {
  // Fetches every page of the employee list so search, pagination, and name maps work beyond a single page.
  async listAll() {
    const users = [];
    const size = 100;
    for (let page = 0; ; page += 1) {
      const data = await apiClient
        .get("/api/admin/employees", { params: { page, size } })
        .then((response) => response.data);
      users.push(...data.content);
      if (!data.page || page + 1 >= data.page.totalPages) {
        break;
      }
    }
    return users;
  },
  async get(id) {
    const employees = await employeeService.listAll();
    return employees.find((employee) => employee.id === id) ?? null;
  },
  create(payload) {
    return apiClient
      .post("/api/admin/employees", payload)
      .then((response) => response.data);
  },
  update(id, payload) {
    return apiClient
      .put(`/api/admin/employees/${id}`, payload)
      .then((response) => response.data);
  },
  deactivate(id) {
    return apiClient
      .patch(`/api/admin/employees/${id}/deactivate`)
      .then((response) => response.data);
  },
  reactivate(id) {
    return apiClient
      .patch(`/api/admin/employees/${id}/reactivate`)
      .then((response) => response.data);
  },
  // Analytical methods for dashboard
  async getHeadcountTrend() {
    return apiClient.get("/api/admin/analytics/headcount-trend").then((response) => response.data);
  },
  async getEmployeeCounts() {
    return apiClient.get("/api/admin/analytics/employee-counts").then((response) => response.data);
  },
};

export const departmentService = {
  list() {
    return apiClient.get("/api/admin/departments").then((response) => response.data);
  },
  create(payload) {
    return apiClient.post("/api/admin/departments", payload).then((response) => response.data);
  },
  delete(id) {
    return apiClient
      .delete(`/api/admin/departments/${id}`)
      .then((response) => response.data);
  },
};

export const attendanceService = {
  listCompany(params) {
    return apiClient
      .get("/api/admin/attendance", { params })
      .then((response) => response.data);
  },
  checkIn() {
    return apiClient.post("/api/employee/attendance/check-in").then((response) => response.data);
  },
  checkOut() {
    return apiClient.post("/api/employee/attendance/check-out").then((response) => response.data);
  },
  listMine(params) {
    return apiClient
      .get("/api/employee/attendance", { params })
      .then((response) => response.data);
  },
  // Analytical methods for dashboard
  async getAttendanceCompliance() {
    return apiClient.get("/api/admin/analytics/attendance-compliance").then((response) => response.data);
  },
};

export const leaveService = {
  listCompany(params) {
    return apiClient
      .get("/api/admin/leave-requests", { params })
      .then((response) => response.data);
  },
  review(id, payload) {
    return apiClient
      .patch(`/api/admin/leave-requests/${id}/review`, payload)
      .then((response) => response.data);
  },
  createMine(payload) {
    return apiClient
      .post("/api/employee/leave-requests", payload)
      .then((response) => response.data);
  },
  listMine(params) {
    return apiClient
      .get("/api/employee/leave-requests", { params })
      .then((response) => response.data);
  },
  cancelMine(id) {
    return apiClient
      .patch(`/api/employee/leave-requests/${id}/cancel`)
      .then((response) => response.data);
  },
  // Analytical methods for dashboard
  async getLeaveStats() {
    return apiClient.get("/api/admin/analytics/leave-stats").then((response) => response.data);
  },
};

export const profileService = {
  me() {
    return apiClient.get("/api/employee/me").then((response) => response.data);
  },
};

// Refreshes the access token using the README-documented /api/auth/refresh endpoint.
async function refreshTokens() {
  if (!refreshPromise) {
    const session = tokenStorage.get();
    // Without a refresh token, the user must sign in again.
    if (!session?.refreshToken) {
      return Promise.reject(new Error("Missing refresh token"));
    }
    refreshPromise = authService
      .refresh({ refreshToken: session.refreshToken })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Render-hosted services can sleep, so temporary network/5xx failures are retried briefly.
function isTransientWakeupError(error) {
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
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh logic for auth endpoints — a 401 there means bad credentials, not an expired session.
      const isAuthEndpoint = originalRequest.url?.includes("/api/auth/");
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        // Rotate tokens, persist the new pair, and retry the original protected request.
        const auth = await refreshTokens();
        const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEYS.rememberMe) === "true";
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
