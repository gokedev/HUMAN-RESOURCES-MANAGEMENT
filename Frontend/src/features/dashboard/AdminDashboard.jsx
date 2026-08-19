import { useQuery } from "@tanstack/react-query";
import {
  Building2, CalendarDays, CheckCheck, ClipboardCheck,
  Clock3, Inbox, Plus, Users, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { BarChart } from "../../components/common/charts.jsx";
import { attendanceService, departmentService, employeeService, leaveService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { MetricCard, QuickAction, getGreeting } from "./shared.jsx";

/**
 * Admin dashboard — shows headcount metrics, leave/attendance charts,
 * and quick-action links. Fetches all data in parallel via TanStack Query.
 */
export function AdminDashboard() {
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

  // Extract metric values with safe defaults
  const activeEmployees = employeeCountsData?.active ?? 0;
  const pendingInvites = employeeCountsData?.pending ?? 0;
  const pendingLeave = leaveStatsData?.totalPendingRequests ?? 0;
  const departmentCount = departments.length;

  // Transform leave stats into chart-friendly format
  const leaveByType = Array.isArray(leaveStatsData?.leaveByType)
    ? leaveStatsData.leaveByType.map(stat => ({
        label: stat.leaveType.replace(/_/g, " "),
        value: stat.count,
      }))
    : [];

  // Transform attendance stats with color coding
  const attendanceByStatus = Array.isArray(attendanceComplianceData?.todayAttendanceByStatus)
    ? attendanceComplianceData.todayAttendanceByStatus.map(stat => ({
        label: stat.status.replace(/_/g, " "),
        value: stat.count,
        color: stat.color === "bg-emerald-500" ? "success" :
             stat.color === "bg-red-500" ? "danger" :
             stat.color === "bg-amber-500" ? "warning" :
             stat.color === "bg-blue-500" ? "info" : "secondary",
      }))
    : [];

  const checkedInToday = attendanceByStatus.find(stat =>
    stat.label.toLowerCase() === "present"
  )?.value ?? 0;

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-muted rounded-xl" />)}</div>
    </div>;
  }

  return (
    <>
      <header className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Admin overview</span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {getGreeting()}, here's what's happening
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          A focused command center for workforce activity, requests, and company structure.
        </p>
      </header>

      {/* Metric cards row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active employees" value={activeEmployees} Icon={Users} trend={headcountTrendData?.trend} />
        <MetricCard label="Pending invitations" value={pendingInvites} Icon={CheckCheck} />
        <MetricCard label="Pending leave" value={pendingLeave} Icon={CalendarDays} />
        <MetricCard label="Departments" value={departmentCount} Icon={Building2} />
      </section>

      {/* Charts row */}
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

      {/* Quick actions */}
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
