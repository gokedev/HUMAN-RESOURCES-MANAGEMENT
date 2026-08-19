import { apiClient } from "./client.js";

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
  updatePassword(payload) {
    return apiClient
      .patch("/api/employee/me/password", payload)
      .then((response) => response.data);
  },
};
