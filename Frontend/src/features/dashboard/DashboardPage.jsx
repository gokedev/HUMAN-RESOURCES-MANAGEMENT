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
  ArrowRight,
  TrendingUp,
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
import { DashboardSkeleton, MetricSkeleton } from "../../components/ui/skeletons.jsx";

const todayIso = () => new Date().toISOString().split("T")[0];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => departmentService.list(),
  });

  const isLoading = isLoadingHeadcount || isLoadingEmployeeCounts || isLoadingLeaveStats ||
                   isLoadingAttendanceCompliance || isLoadingDepartments;

  const activeEmployees = employeeCountsData?.active ?? 0;
  const pendingInvites = employeeCountsData?.pending ?? 0;
  const pendingLeave = leaveStatsData?.totalPendingRequests ?? 0;
  const departmentCount = departments.length;

  const leaveByType = leaveStatsData?.leaveByType?.map(stat => ({
    label: stat.leaveType.replace(/_/g, " "),
    value: stat.count,
  })) ?? [];

  const attendanceByStatus = attendanceComplianceData?.todayAttendanceByStatus?.map(stat => ({
    label: stat.status.replace(/_/g, " "),
    value: stat.count,
    color: stat.color === "bg-emerald-500" ? "success" :
         stat.color === "bg-red-500" ? "danger" :
         stat.color === "bg-amber-500" ? "warning" :
         stat.color === "bg-blue-500" ? "info" : "secondary",
  })) ?? [];

  const checkedInToday = attendanceByStatus.find(stat =>
    stat.label.toLowerCase() === "present"
  )?.value ?? 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <header className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Admin overview
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {getGreeting()}, here's what's happening
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          A focused command center for workforce activity, requests, and company structure.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active employees" value={activeEmployees} Icon={Users} trend={headcountTrendData?.trend} />
        <MetricCard label="Pending invitations" value={pendingInvites} Icon={CheckCheck} />
        <MetricCard label="Pending leave" value={pendingLeave} Icon={CalendarDays} />
        <MetricCard label="Departments" value={departmentCount} Icon={Building2} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mt-6">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={18} className="text-primary shrink-0" />
            <h2 className="text-base font-semibold">Leave requests by type</h2>
          </div>
          {leaveByType.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No leave requests yet.</p>
          ) : (
            <BarChart data={leaveByType} />
          )}
        </article>
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 size={18} className="text-primary shrink-0" />
            <h2 className="text-base font-semibold">Today's attendance</h2>
          </div>
          {attendanceByStatus.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No attendance recorded today yet.</p>
          ) : (
            <BarChart data={attendanceByStatus} />
          )}
          <p className="text-sm text-muted-foreground mt-3 font-medium">
            {checkedInToday} employee{checkedInToday === 1 ? "" : "s"} checked in today
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Frequent tasks to keep operations moving.</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
  const myLeave = Array.isArray(leaveData?.content) ? leaveData?.content : [];
  const pendingMyLeave = useMemo(
    () => myLeave.filter((req) => req.status === "PENDING").length,
    [myLeave]
  );

  const { session } = useAuth();
  const firstName = session?.email?.split("@")[0] ?? "there";

  return (
    <>
      <header className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Employee portal
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your attendance, leave, and personal work activity at a glance.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" aria-hidden="true">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Today's status</span>
            <div className="mt-1">
              {hasCheckedOut ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-0.5 text-xs font-semibold">Completed</span>
              ) : hasCheckedIn ? (
                <StatusBadge status={todayRecord.status} />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">Not checked in</span>
              )}
            </div>
          </div>
        </article>
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" aria-hidden="true">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending leave</span>
            <strong className="block text-2xl font-bold text-foreground tabular-nums mt-1">{pendingMyLeave}</strong>
          </div>
        </article>
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" aria-hidden="true">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Quick links</span>
            <Link to="/my-leave" className="text-sm font-semibold text-primary hover:underline mt-1 inline-flex items-center gap-1">
              Request leave <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </section>

      <section className={`rounded-xl border bg-card p-5 shadow-sm mt-6 transition-all duration-200 ${hasCheckedOut ? "border-l-4 border-l-primary" : hasCheckedIn ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock3 size={18} className="text-primary shrink-0" />
          <h2 className="text-base font-semibold">Attendance</h2>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <Button
            type="button"
            disabled={isLoading || hasCheckedIn || isCheckingIn}
            onClick={checkIn}
          >
            {isCheckingIn ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <LogIn size={16} />
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
              <LogOut size={16} />
            )}
            Check out
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your time off and attendance.</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

function MetricCard({ label, value, Icon, trend }) {
  return (
    <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2 mt-1">
          <strong className="text-2xl font-bold text-foreground tabular-nums">{value}</strong>
          {trend !== undefined && trend !== null && (
            <span className={`text-xs font-medium ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function QuickAction({ to, Icon, label, note }) {
  return (
    <Link
      className="group flex flex-col items-start gap-2 text-left border bg-card rounded-xl p-4 text-foreground no-underline hover:border-primary/50 hover:shadow-md transition-all duration-200"
      to={to}
    >
      <div className="flex items-center justify-between w-full">
        <Icon className="h-5 w-5 text-primary" />
        <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      </div>
      <strong className="text-sm font-semibold">{label}</strong>
      <span className="text-xs text-muted-foreground">{note}</span>
    </Link>
  );
}
