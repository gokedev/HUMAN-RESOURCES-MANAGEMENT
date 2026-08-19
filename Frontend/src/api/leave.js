import { apiClient } from "./client.js";

export const leaveService = {
  listCompany(params) {
    const { status, employeeId, ...rest } = params || {};
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    Object.assign(query, rest);
    return apiClient
      .get("/api/admin/leave-requests", { params: query })
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
  getMyBalance() {
    return apiClient
      .get("/api/employee/leave-balance")
      .then((response) => response.data);
  },
  getEmployeeBalanceByType(employeeId, leaveType) {
    return apiClient
      .get(`/api/admin/employees/${employeeId}/leave-balance/${leaveType}`)
      .then((response) => response.data);
  },
  async getLeaveStats() {
    return apiClient.get("/api/admin/analytics/leave-stats").then((response) => response.data);
  },
};
