import { apiClient } from "./client.js";

export const payrollService = {
  generate(payload) {
    return apiClient
      .post("/api/admin/payroll/generate", payload)
      .then((response) => response.data);
  },
  listForPeriod(params) {
    return apiClient
      .get("/api/admin/payroll/payslips", { params })
      .then((response) => response.data);
  },
  listMine() {
    return apiClient
      .get("/api/employee/payroll/payslips")
      .then((response) => response.data);
  },
};
