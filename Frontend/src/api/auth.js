import { apiClient } from "./client.js";

/** Authentication endpoints — login, register, token refresh, password reset. */
export const authService = {
  login(payload) {
    return apiClient.post("/api/auth/login", payload).then((r) => r.data);
  },
  registerCompany(payload) {
    return apiClient.post("/api/auth/register-company", payload).then((r) => r.data);
  },
  refresh(payload) {
    return apiClient.post("/api/auth/refresh", payload).then((r) => r.data);
  },
  forgotPassword(payload) {
    return apiClient.post("/api/auth/forgot-password", payload).then((r) => r.data);
  },
  resetPassword(payload) {
    return apiClient.post("/api/auth/reset-password", payload).then((r) => r.data);
  },
  acceptInvitation(payload) {
    return apiClient.post("/api/auth/accept-invitation", payload).then((r) => r.data);
  },
  /** Self-service password change (requires current password). */
  updatePassword(payload) {
    return apiClient.patch("/api/employee/me/password", payload).then((r) => r.data);
  },
};
