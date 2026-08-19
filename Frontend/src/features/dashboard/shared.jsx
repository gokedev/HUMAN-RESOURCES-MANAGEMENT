import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Returns a time-of-day greeting string. */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Reusable metric card used on both admin and employee dashboards. */
export function MetricCard({ label, value, Icon, trend }) {
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

/** Quick-action link card used on both dashboards. */
export function QuickAction({ to, Icon, label, note }) {
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
