import { usePageTitle } from "../../hooks.js";
import { useAuth } from "../../contexts.jsx";
import { AdminDashboard } from "./AdminDashboard.jsx";
import { EmployeeDashboard } from "./EmployeeDashboard.jsx";

/**
 * Root dashboard component — routes to admin or employee view based on role.
 * The actual dashboard logic lives in AdminDashboard.jsx and EmployeeDashboard.jsx.
 */
export function DashboardPage() {
  usePageTitle("Dashboard");
  const { role } = useAuth();
  return role === "ADMIN" ? <AdminDashboard /> : <EmployeeDashboard />;
}
