import { apiClient } from "./client.js";

/** Payroll: generate payslips (admin), list payslips (admin + employee). */
export const payrollService = {
  /** Admin: generate payslips for all active employees for a given month. */
  generate(payload) {
    return apiClient.post("/api/admin/payroll/generate", payload).then((r) => r.data);
  },
  /** Admin: list payslips filtered by year/month. */
  listForPeriod(params) {
    return apiClient.get("/api/admin/payroll/payslips", { params }).then((r) => r.data);
  },
  /** Employee: list own payslips. */
  listMine() {
    return apiClient.get("/api/employee/payroll/payslips").then((r) => r.data);
  },
};
