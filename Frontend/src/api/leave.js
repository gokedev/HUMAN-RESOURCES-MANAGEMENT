import { apiClient } from "./client.js";

/** Leave requests: submit, list, cancel, review (admin), balance, and analytics. */
export const leaveService = {
  /** Admin: list company-wide leave requests with optional filters. */
  listCompany(params) {
    const { status, employeeId, ...rest } = params || {};
    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    Object.assign(query, rest);
    return apiClient.get("/api/admin/leave-requests", { params: query }).then((r) => r.data);
  },
  /** Admin: approve or reject a pending leave request. */
  review(id, payload) {
    return apiClient.patch(`/api/admin/leave-requests/${id}/review`, payload).then((r) => r.data);
  },
  /** Employee: submit a new leave request. */
  createMine(payload) {
    return apiClient.post("/api/employee/leave-requests", payload).then((r) => r.data);
  },
  /** Employee: list own leave requests. */
  listMine(params) {
    return apiClient.get("/api/employee/leave-requests", { params }).then((r) => r.data);
  },
  /** Employee: cancel a pending leave request. */
  cancelMine(id) {
    return apiClient.patch(`/api/employee/leave-requests/${id}/cancel`).then((r) => r.data);
  },
  /** Employee: get own leave balance by type. */
  getMyBalance() {
    return apiClient.get("/api/employee/leave-balance").then((r) => r.data);
  },
  /** Admin: get a specific employee's balance for a leave type. */
  getEmployeeBalanceByType(employeeId, leaveType) {
    return apiClient.get(`/api/admin/employees/${employeeId}/leave-balance/${leaveType}`).then((r) => r.data);
  },
  /** Admin dashboard: leave stats by type, status, and monthly trends. */
  async getLeaveStats() {
    return apiClient.get("/api/admin/analytics/leave-stats").then((r) => r.data);
  },
};
