import { apiClient } from "./client.js";

/** Department CRUD — cached on the backend via Caffeine. */
export const departmentService = {
  list() {
    return apiClient.get("/api/admin/departments").then((r) => r.data);
  },
  create(payload) {
    return apiClient.post("/api/admin/departments", payload).then((r) => r.data);
  },
  delete(id) {
    return apiClient.delete(`/api/admin/departments/${id}`).then((r) => r.data);
  },
};
