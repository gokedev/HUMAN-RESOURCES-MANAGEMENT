import { apiClient } from "./client.js";

export const attendanceService = {
  listCompany(params) {
    return apiClient
      .get("/api/admin/attendance", { params })
      .then((response) => response.data);
  },
  checkIn() {
    return apiClient.post("/api/employee/attendance/check-in").then((response) => response.data);
  },
  checkOut() {
    return apiClient.post("/api/employee/attendance/check-out").then((response) => response.data);
  },
  listMine(params) {
    return apiClient
      .get("/api/employee/attendance", { params })
      .then((response) => response.data);
  },
  async getAttendanceCompliance() {
    return apiClient.get("/api/admin/analytics/attendance-compliance").then((response) => response.data);
  },
};
