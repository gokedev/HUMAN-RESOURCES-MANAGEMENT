import { apiClient } from "./client.js";

/** Attendance: check-in/out, list (admin + employee), and analytics. */
export const attendanceService = {
  /** Admin: list all attendance records (paginated, filtered). */
  listCompany(params) {
    return apiClient.get("/api/admin/attendance", { params }).then((r) => r.data);
  },
  /** Employee: check in for today. */
  checkIn() {
    return apiClient.post("/api/employee/attendance/check-in").then((r) => r.data);
  },
  /** Employee: check out for today. */
  checkOut() {
    return apiClient.post("/api/employee/attendance/check-out").then((r) => r.data);
  },
  /** Employee: list own attendance history. */
  listMine(params) {
    return apiClient.get("/api/employee/attendance", { params }).then((r) => r.data);
  },
  /** Admin dashboard: today's attendance by status. */
  async getAttendanceCompliance() {
    return apiClient.get("/api/admin/analytics/attendance-compliance").then((r) => r.data);
  },
};
