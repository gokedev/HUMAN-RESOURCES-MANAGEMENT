import { apiClient } from "./client.js";

export const profileService = {
  me() {
    return apiClient.get("/api/employee/me").then((response) => response.data);
  },
  update(payload) {
    return apiClient.put("/api/employee/me", payload).then((response) => response.data);
  },
};
