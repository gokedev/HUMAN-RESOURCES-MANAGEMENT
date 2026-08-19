import { apiClient } from "./client.js";

export const employeeService = {
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
  delete(id) {
    return apiClient
      .delete(`/api/admin/employees/${id}`)
      .then((response) => response.data);
  },
  resendInvitation(id) {
    return apiClient.post(`/api/admin/employees/${id}/resend-invite`);
  },
  revokeInvitation(id) {
    return apiClient.post(`/api/admin/employees/${id}/revoke-invite`);
  },
  async getHeadcountTrend() {
    return apiClient.get("/api/admin/analytics/headcount-trend").then((response) => response.data);
  },
  async getEmployeeCounts() {
    return apiClient.get("/api/admin/analytics/employee-counts").then((response) => response.data);
  },
};
