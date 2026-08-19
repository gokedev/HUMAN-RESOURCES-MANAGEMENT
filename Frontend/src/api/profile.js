import { apiClient } from "./client.js";

/** Employee self-service: view and update own profile. */
export const profileService = {
  /** GET /api/employee/me — returns the logged-in user's profile. */
  me() {
    return apiClient.get("/api/employee/me").then((r) => r.data);
  },
  /** PUT /api/employee/me — updates profile fields (phone, address, etc.). */
  update(payload) {
    return apiClient.put("/api/employee/me", payload).then((r) => r.data);
  },
};
