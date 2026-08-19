import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, Inbox, LogIn, LogOut, ClipboardCheck, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useTodayAttendance } from "../../hooks.js";
import { useAuth } from "../../contexts.jsx";
import { leaveService } from "../../api/index.js";
import { queryKeys } from "../../constants.js";
import { QuickAction, getGreeting } from "./shared.jsx";

/**
 * Employee dashboard — shows today's attendance status, pending leave count,
 * and quick-action links. Much simpler than the admin dashboard.
 */
export function EmployeeDashboard() {
  const { hasCheckedIn, hasCheckedOut, todayRecord, isCheckingIn, isCheckingOut, checkIn, checkOut, isLoading } =
    useTodayAttendance();

  const { data: leaveData } = useQuery({
    queryKey: queryKeys.leave.mine({ page: 0, size: 100, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: 0, size: 100, sort: "createdAt,desc" }),
  });

  const myLeave = Array.isArray(leaveData?.content) ? leaveData.content : [];
  const pendingMyLeave = useMemo(() => myLeave.filter(req => req.status === "PENDING").length, [myLeave]);

  const { session } = useAuth();
  const firstName = session?.email?.split("@")[0] ?? "there";

  return (
    <>
      <header className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Employee portal</span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your attendance, leave, and personal work activity at a glance.
        </p>
      </header>

      {/* Status cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending leave</span>
            <strong className="block text-2xl font-bold text-foreground tabular-nums mt-1">{pendingMyLeave}</strong>
          </div>
        </article>
        <article className="flex items-center gap-4 p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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

      {/* Attendance check-in/out */}
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
          <Button type="button" disabled={isLoading || hasCheckedIn || isCheckingIn} onClick={checkIn}>
            {isCheckingIn ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (<LogIn size={16} />)}
            Check in
          </Button>
          <Button variant="outline" type="button" disabled={isLoading || !hasCheckedIn || hasCheckedOut || isCheckingOut} onClick={checkOut}>
            {isCheckingOut ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (<LogOut size={16} />)}
            Check out
          </Button>
        </div>
      </section>

      {/* Quick actions */}
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
