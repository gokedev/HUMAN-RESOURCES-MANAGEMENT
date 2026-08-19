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
import { PageHeader } from "../../components/ui/page-header.jsx";
import { StatusBadge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card.jsx";
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
  const { data: headcountTrendData, isLoading: isLoadingHeadcount } = useQuery({
    queryKey: queryKeys.analytics.headcountTrend,
    queryFn: () => employeeService.getHeadcountTrend(),
  });

  const { data: employeeCountsData, isLoading: isLoadingEmployeeCounts } = useQuery({
    queryKey: queryKeys.analytics.employeeCounts,
    queryFn: () => employeeService.getEmployeeCounts(),
  });

  const { data: leaveStatsData, isLoading: isLoadingLeaveStats } = useQuery({
    queryKey: queryKeys.analytics.leaveStats,
    queryFn: () => leaveService.getLeaveStats(),
  });

  const { data: attendanceComplianceData, isLoading: isLoadingAttendanceCompliance } = useQuery({
    queryKey: queryKeys.analytics.attendanceCompliance,
    queryFn: () => attendanceService.getAttendanceCompliance(),
  });

  // Fetch department count for the metric card
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  // Show loading state if any data is loading
  const isLoading = isLoadingHeadcount || isLoadingEmployeeCounts || isLoadingLeaveStats ||
                   isLoadingAttendanceCompliance || isLoadingDepartments;

  // Extract data for backward compatibility with existing components
  const activeEmployees = employeeCountsData?.active ?? 0;
  const pendingInvites = employeeCountsData?.pending ?? 0;
  const pendingLeave = leaveStatsData?.totalPendingRequests ?? 0;
  const departmentCount = departments.length;

  // Transform leave stats data for the existing BarChart component
  const leaveByType = leaveStatsData?.leaveByType?.map(stat => ({
    label: stat.leaveType.replace(/_/g, " "),
    value: stat.count,
  })) ?? [];

  // Transform attendance compliance data for the existing BarChart component
  const attendanceByStatus = attendanceComplianceData?.todayAttendanceByStatus?.map(stat => ({
    label: stat.status.replace(/_/g, " "),
    value: stat.count,
    color: stat.color === "bg-emerald-500" ? "success" :
         stat.color === "bg-red-500" ? "danger" :
         stat.color === "bg-amber-500" ? "warning" :
         stat.color === "bg-blue-500" ? "info" : "secondary",
  })) ?? [];

  const today = todayIso();
  const checkedInToday = attendanceByStatus.find(stat =>
    stat.label.toLowerCase() === "present"
  )?.value ?? 0;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="People operations dashboard"
          description="A focused command center for workforce activity, requests, and company structure."
        />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="People operations dashboard"
        description="A focused command center for workforce activity, requests, and company structure."
      />
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active employees" value={activeEmployees} Icon={Users} />
        <MetricCard label="Pending invitations" value={pendingInvites} Icon={CheckCheck} />
        <MetricCard label="Pending leave" value={pendingLeave} Icon={CalendarDays} />
        <MetricCard label="Departments" value={departmentCount} Icon={Building2} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={18} className="text-primary shrink-0" />
            <h2>Leave requests by type</h2>
          </div>
          {leaveByType.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No leave requests yet.</p>
          ) : (
            <BarChart data={leaveByType} />
          )}
        </article>
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock3 size={18} className="text-primary shrink-0" />
            <h2>Today's attendance</h2>
          </div>
          {attendanceByStatus.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No attendance recorded today yet.</p>
          ) : (
            <BarChart data={attendanceByStatus} />
          )}
          <p className="text-sm text-muted-foreground mt-1 font-medium" style={{ marginTop: "0.75rem" }}>
            {checkedInToday} employee{checkedInToday === 1 ? "" : "s"} checked in today
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mt-4">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Quick actions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Frequent tasks to keep operations moving.</p>
          </div>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
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

  // Get leave stats for annual leave balance and other personal metrics
  const { data: leaveStatsData, isLoading: isLoadingLeaveStats } = useQuery({
    queryKey: queryKeys.analytics.leaveStats,
    queryFn: () => leaveService.getLeaveStats(),
  });

  // Extract annual leave balance (this would need to be adapted based on actual API response structure)
  // For now, we'll calculate it from leave requests or use a placeholder
  const annualLeaveBalance = 20; // Placeholder - in reality this would come from employee profile or policy

  // Alternative: if the API provided personal leave balances, we'd use that instead
  // const annualLeaveBalance = leaveStatsData?.personalLeaveBalance ?? 20;

  return (
    <>
      <PageHeader
        title="My dashboard"
        description="Your attendance, leave, and personal work activity at a glance."
      />
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <span className="text-sm text-muted-foreground font-medium">Today's status</span>
            <strong className="block text-2xl font-bold text-foreground tabular-nums">
              {hasCheckedOut ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-sm font-semibold text-primary">Completed</span>
              ) : hasCheckedIn ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                "Not checked in"
              )}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <span className="text-sm text-muted-foreground font-medium">Annual leave balance</span>
            <strong className="block text-2xl font-bold text-foreground tabular-nums">
              {annualLeaveBalance}
            </strong>
          </div>
        </article>
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <span className="text-sm text-muted-foreground font-medium">Pending leave</span>
            <strong className="block text-2xl font-bold text-foreground tabular-nums">{pendingMyLeave}</strong>
          </div>
        </article>
      </section>

      <section className={`rounded-xl border bg-card p-5 shadow-sm border-l-4 mb-4 ${hasCheckedOut ? "border-l-primary" : hasCheckedIn ? "border-l-emerald-500" : "border-l-muted"}`}>
        <div className="flex items-center gap-2 mb-1">
          <Clock3 size={18} className="text-primary shrink-0" />
          <h2>Attendance</h2>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {hasCheckedOut
            ? "Done for today"
            : todayRecord?.checkIn
              ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Not checked in"}
        </p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          {hasCheckedOut
            ? "You've completed your check-in for today."
            : hasCheckedIn
              ? "You are currently checked in."
              : "Start your workday."}
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
          <Button
            type="button"
            disabled={isLoading || hasCheckedIn || isCheckingIn}
            onClick={checkIn}
          >
            {isCheckingIn ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogIn size={16} className="mr-1" />
            )}
            Check in
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading || !hasCheckedIn || hasCheckedOut || isCheckingOut}
            onClick={checkOut}
          >
            {isCheckingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogOut size={16} className="mr-1" />
            )}
            Check out
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mt-4">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Quick actions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your time off and attendance.</p>
          </div>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
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
    <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <strong className="block text-2xl font-bold text-foreground tabular-nums">{value}</strong>
      </div>
    </article>
  );
}

function QuickAction({ to, Icon, label, note }) {
  return (
    <Link className="flex flex-col items-start gap-2 text-left border bg-card rounded-xl p-4 text-foreground no-underline hover:border-primary hover:shadow-md transition-all" to={to}>
      <Icon className="h-5 w-5 text-primary" />
      <strong className="text-sm font-semibold">{label}</strong>
      <span className="text-sm text-muted-foreground">{note}</span>
    </Link>
  );
}
