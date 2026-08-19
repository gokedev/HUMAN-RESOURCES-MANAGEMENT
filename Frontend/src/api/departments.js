import { apiClient } from "./client.js";

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
