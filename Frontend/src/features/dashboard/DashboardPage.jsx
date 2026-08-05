import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  Inbox,
  LogIn,
  LogOut,
  Plus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader, StatusBadge } from "../../components/common/ui.jsx";
import { usePageTitle, useTodayAttendance } from "../../hooks.js";
import { useAuth } from "../../contexts.jsx";
import { attendanceService, departmentService, employeeService, leaveService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { BarChart } from "../../components/common/charts.jsx";

const todayIso = () => new Date().toISOString().split("T")[0];

export function DashboardPage() {
  usePageTitle("Dashboard");
  const { role } = useAuth();
  return role === "ADMIN" ? <AdminDashboard /> : <EmployeeDashboard />;
}

function AdminDashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });
  const { data: leaveData } = useQuery({
    queryKey: queryKeys.leave.company({ page: 0, size: 100, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listCompany({ page: 0, size: 100, sort: "createdAt,desc" }),
  });
  const { data: attendanceData } = useQuery({
    queryKey: queryKeys.attendance.company({ page: 0, size: 100, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listCompany({ page: 0, size: 100, sort: "workDate,desc" }),
  });

  const leaveRequests = leaveData?.content ?? [];
  const attendanceRecords = attendanceData?.content ?? [];
  const today = todayIso();

  const activeEmployees = useMemo(
    () => employees.filter((emp) => emp.status === "ACTIVE").length,
    [employees]
  );
  const pendingInvites = useMemo(
    () => employees.filter((emp) => emp.status === "PENDING").length,
    [employees]
  );
  const pendingLeave = useMemo(
    () => leaveRequests.filter((req) => req.status === "PENDING").length,
    [leaveRequests]
  );
  const leaveByType = useMemo(() => {
    const counts = {};
    leaveRequests.forEach((req) => {
      counts[req.leaveType] = (counts[req.leaveType] ?? 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({
      label: label.replace(/_/g, " "),
      value,
    }));
  }, [leaveRequests]);
  const todayRecords = useMemo(
    () => attendanceRecords.filter((rec) => rec.workDate === today),
    [attendanceRecords, today]
  );
  const checkedInToday = useMemo(
    () => todayRecords.filter((rec) => Boolean(rec.checkIn)).length,
    [todayRecords]
  );
  const attendanceByStatus = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, ON_LEAVE: 0 };
    todayRecords.forEach((rec) => {
      if (rec.status in counts) counts[rec.status] += 1;
    });
    const colors = { PRESENT: "success", ABSENT: "danger", HALF_DAY: "warning", ON_LEAVE: "info" };
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({ label: label.replace(/_/g, " "), value, color: colors[label] }));
  }, [todayRecords]);

  return (
    <>
      <PageHeader
        title="People operations dashboard"
        description="A focused command center for workforce activity, requests, and company structure."
      />
      <section className="metric-grid">
        <MetricCard label="Active employees" value={activeEmployees} Icon={Users} />
        <MetricCard label="Pending invitations" value={pendingInvites} Icon={CheckCheck} />
        <MetricCard label="Pending leave" value={pendingLeave} Icon={CalendarDays} />
        <MetricCard label="Departments" value={departments.length} Icon={Building2} />
      </section>

      <section className="dashboard-grid">
        <article className="insight-panel">
          <div className="insight-header">
            <CalendarDays size={18} className="insight-icon" />
            <h2>Leave requests by type</h2>
          </div>
          {leaveByType.length === 0 ? (
            <p className="chart-empty">No leave requests yet.</p>
          ) : (
            <BarChart data={leaveByType} />
          )}
        </article>
        <article className="insight-panel">
          <div className="insight-header">
            <Clock3 size={18} className="insight-icon" />
            <h2>Today's attendance</h2>
          </div>
          {attendanceByStatus.length === 0 ? (
            <p className="chart-empty">No attendance recorded today yet.</p>
          ) : (
            <BarChart data={attendanceByStatus} />
          )}
          <p className="metric-sub" style={{ marginTop: "0.75rem" }}>
            {checkedInToday} employee{checkedInToday === 1 ? "" : "s"} checked in today
          </p>
        </article>
      </section>

      <section className="table-shell" style={{ marginTop: "1rem" }}>
        <div className="table-shell-header">
          <div>
            <h2>Quick actions</h2>
            <p>Frequent tasks to keep operations moving.</p>
          </div>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="quick-actions">
            <QuickAction to="/employees/new" Icon={Plus} label="Add employee" note="Invite someone to your workspace" />
            <QuickAction to="/leave" Icon={Inbox} label="Review leave" note={`${pendingLeave} pending request${pendingLeave === 1 ? "" : "s"}`} />
            <QuickAction to="/attendance" Icon={ClipboardCheck} label="View attendance" note="Check company attendance" />
            <QuickAction to="/departments" Icon={Building2} label="Departments" note="Manage company teams" />
          </div>
        </div>
      </section>
    </>
  );
}

function EmployeeDashboard() {
  const { hasCheckedIn, hasCheckedOut, todayRecord, isCheckingIn, isCheckingOut, checkIn, checkOut, isLoading } =
    useTodayAttendance();
  const { data: leaveData } = useQuery({
    queryKey: queryKeys.leave.mine({ page: 0, size: 100, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: 0, size: 100, sort: "createdAt,desc" }),
  });
  const myLeave = leaveData?.content ?? [];
  const pendingMyLeave = useMemo(
    () => myLeave.filter((req) => req.status === "PENDING").length,
    [myLeave]
  );

  return (
    <>
      <PageHeader
        title="My dashboard"
        description="Your attendance, leave, and personal work activity at a glance."
      />
      <section className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon" aria-hidden="true">
            <Clock3 size={22} />
          </span>
          <div>
            <span>Today's status</span>
            <strong>
              {todayRecord ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                "Not checked in"
              )}
            </strong>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon" aria-hidden="true">
            <CalendarDays size={22} />
          </span>
          <div>
            <span>Annual leave balance</span>
            <strong>—</strong>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon" aria-hidden="true">
            <Inbox size={22} />
          </span>
          <div>
            <span>Pending leave</span>
            <strong>{pendingMyLeave}</strong>
          </div>
        </article>
      </section>

      <section className="checkin-card">
        <div className="insight-header">
          <Clock3 size={18} className="insight-icon" />
          <h2>Attendance</h2>
        </div>
        <p className="metric-value">
          {todayRecord?.checkIn
            ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Not checked in"}
        </p>
        <p className="metric-sub">
          {todayRecord?.checkOut
            ? `Checked out at ${new Date(todayRecord.checkOut).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : hasCheckedIn
              ? "You are currently checked in."
              : "Start your workday."}
        </p>
        <div className="quick-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={isLoading || hasCheckedIn || isCheckingIn}
            onClick={checkIn}
          >
            {isCheckingIn ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <LogIn size={16} style={{ marginRight: "0.35rem" }} />
            )}
            Check in
          </button>
          <button
            className="btn btn-outline-secondary"
            type="button"
            disabled={isLoading || !hasCheckedIn || hasCheckedOut || isCheckingOut}
            onClick={checkOut}
          >
            {isCheckingOut ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <LogOut size={16} style={{ marginRight: "0.35rem" }} />
            )}
            Check out
          </button>
        </div>
      </section>

      <section className="table-shell" style={{ marginTop: "1rem" }}>
        <div className="table-shell-header">
          <div>
            <h2>Quick actions</h2>
            <p>Manage your time off and attendance.</p>
          </div>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="quick-actions">
            <QuickAction to="/my-leave" Icon={CalendarDays} label="Request leave" note="Submit time off" />
            <QuickAction to="/my-leave" Icon={Inbox} label="My requests" note={`${pendingMyLeave} pending`} />
            <QuickAction to="/my-attendance" Icon={ClipboardCheck} label="My attendance" note="View your history" />
            <QuickAction to="/profile" Icon={Users} label="My profile" note="Personal information" />
          </div>
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, Icon }) {
  return (
    <article className="metric-card">
      <span className="metric-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function QuickAction({ to, Icon, label, note }) {
  return (
    <Link className="quick-action" to={to}>
      <Icon size={20} className="metric-icon" />
      <strong>{label}</strong>
      <span style={{ color: "var(--app-muted)", fontSize: "0.85rem" }}>{note}</span>
    </Link>
  );
}
