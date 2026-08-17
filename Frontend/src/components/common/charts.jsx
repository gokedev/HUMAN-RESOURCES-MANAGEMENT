export function BarChart({ data = [], height = 180 }) {
  const max = Math.max(1, ...data.map((item) => item.value ?? 0));
  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-4 text-sm">No data to display yet.</p>;
  }
  return (
    <div className="flex flex-col justify-end gap-3" style={{ height }} aria-label="Bar chart">
      {data.map((item) => (
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 2.5rem 4.5rem" }} key={item.label}>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                item.color === "success" ? "bg-emerald-500" :
                item.color === "danger" ? "bg-red-500" :
                item.color === "warning" ? "bg-amber-500" :
                item.color === "info" ? "bg-blue-500" :
                item.color === "secondary" ? "bg-muted-foreground" :
                "bg-primary"
              }`}
              style={{ width: `${Math.round(((item.value ?? 0) / max) * 100)}%` }}
              title={`${item.label}: ${item.value ?? 0}`}
            />
          </div>
          <span className="text-sm font-bold text-right tabular-nums">{item.value ?? 0}</span>
          <span className="text-xs text-muted-foreground truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const statusTone = {
  PRESENT: "bg-emerald-500 text-white",
  ABSENT: "bg-red-500 text-white",
  HALF_DAY: "bg-amber-500 text-white",
  ON_LEAVE: "bg-blue-500 text-white",
};

const legendDotClass = {
  PRESENT: "bg-emerald-500",
  HALF_DAY: "bg-amber-500",
  ON_LEAVE: "bg-blue-500",
  ABSENT: "bg-red-500",
};

export function AttendanceCalendar({ records = [], month = null }) {
  const now = new Date();
  const start = month ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const year = start.getFullYear();
  const monthIndex = start.getMonth();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const monthLabel = start.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const recordByDay = {};
  records.forEach((rec) => {
    const [y, m, d] = rec.workDate.split("-").map(Number);
    if (y === year && m === monthIndex + 1) recordByDay[d] = rec;
  });

  const today = new Date().getDate();

  return (
    <div className="p-4">
      <p className="font-semibold mb-3">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span className="text-[0.72rem] uppercase text-center text-muted-foreground py-1" key={day}>{day}</span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const rec = recordByDay[day];
          const toneClass = rec ? statusTone[rec.status] : "bg-muted text-foreground";
          const isToday = day === today && monthIndex === now.getMonth() && year === now.getFullYear();
          return (
            <span
              key={day}
              className={`aspect-square flex items-center justify-center rounded text-xs font-medium ${toneClass} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
              title={rec ? `${rec.workDate}: ${rec.status.replace(/_/g, " ")}` : undefined}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1 align-middle" /> Present</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1 align-middle" /> Half day</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 align-middle" /> On leave</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1 align-middle" /> Absent</span>
      </div>
    </div>
  );
}
