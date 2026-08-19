import { apiClient } from "./client.js";

/** Employee CRUD, status changes, invitation management, and analytics. */
export const employeeService = {
  /** Fetches ALL pages of employees (for search/filter to work across all data). */
  async listAll() {
    const users = [];
    const size = 100;
    for (let page = 0; ; page += 1) {
      const data = await apiClient.get("/api/admin/employees", { params: { page, size } }).then((r) => r.data);
      users.push(...data.content);
      if (!data.page || page + 1 >= data.page.totalPages) break;
    }
    return users;
  },
  /** Fetches a single employee by finding them in the full list. */
  async get(id) {
    const employees = await employeeService.listAll();
    return employees.find((e) => e.id === id) ?? null;
  },
  create(payload) {
    return apiClient.post("/api/admin/employees", payload).then((r) => r.data);
  },
  update(id, payload) {
    return apiClient.put(`/api/admin/employees/${id}`, payload).then((r) => r.data);
  },
  /** Sets status to SUSPENDED — employee can no longer log in. */
  deactivate(id) {
    return apiClient.patch(`/api/admin/employees/${id}/deactivate`).then((r) => r.data);
  },
  /** Sets status back to ACTIVE. */
  reactivate(id) {
    return apiClient.patch(`/api/admin/employees/${id}/reactivate`).then((r) => r.data);
  },
  delete(id) {
    return apiClient.delete(`/api/admin/employees/${id}`).then((r) => r.data);
  },
  /** Regenerates invitation token and resends the email. */
  resendInvitation(id) {
    return apiClient.post(`/api/admin/employees/${id}/resend-invite`);
  },
  /** Deletes the pending invitation record. */
  revokeInvitation(id) {
    return apiClient.post(`/api/admin/employees/${id}/revoke-invite`);
  },
  /** Admin dashboard: hire/separation trend data. */
  async getHeadcountTrend() {
    return apiClient.get("/api/admin/analytics/headcount-trend").then((r) => r.data);
  },
  /** Admin dashboard: active/pending/suspended counts. */
  async getEmployeeCounts() {
    return apiClient.get("/api/admin/analytics/employee-counts").then((r) => r.data);
  },
};
