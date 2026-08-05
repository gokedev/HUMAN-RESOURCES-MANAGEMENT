import { useMemo } from 'react';

// Lightweight horizontal bar chart rendered with divs/CSS. Avoids a chart library dependency.
export function BarChart({ data = [], height = 180 }) {
  const max = Math.max(1, ...data.map((item) => item.value ?? 0));
  if (data.length === 0) {
    return <p className="chart-empty">No data to display yet.</p>;
  }
  return (
    <div className="bar-chart" style={{ height }} aria-label="Bar chart">
      {data.map((item) => (
        <div className="bar-chart-item" key={item.label}>
          <div className="bar-chart-track">
            <div
              className={`bar-chart-bar${item.color ? ` bar-chart-bar-${item.color}` : ''}`}
              style={{ width: `${Math.round(((item.value ?? 0) / max) * 100)}%` }}
              title={`${item.label}: ${item.value ?? 0}`}
            />
          </div>
          <span className="bar-chart-value">{item.value ?? 0}</span>
          <span className="bar-chart-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const statusTone = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half',
  ON_LEAVE: 'leave',
};

// Month grid that colors each day based on the user's attendance records. UI-only visualization.
export function AttendanceCalendar({ records = [], month = null }) {
  const now = new Date();
  const start = month ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const { days, year, monthLabel, firstWeekday } = useMemo(() => {
    const year = start.getFullYear();
    const monthIndex = start.getMonth();
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    return {
      days: Array.from({ length: totalDays }, (_, i) => i + 1),
      year,
      monthLabel: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      firstWeekday,
    };
  }, [start]);
  const recordByDay = useMemo(() => {
    const map = {};
    records.forEach((rec) => {
      const [y, m, d] = rec.workDate.split('-').map(Number);
      if (y === year && m === start.getMonth() + 1) {
        map[d] = rec;
      }
    });
    return map;
  }, [records, year, start]);
  const today = new Date().getDate();
  return (
    <div className="attendance-calendar">
      <p className="calendar-month-label">{monthLabel}</p>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span className="calendar-weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span className="calendar-cell calendar-cell-empty" key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const rec = recordByDay[day];
          const tone = rec ? statusTone[rec.status] : null;
          const isToday = day === today && start.getMonth() === now.getMonth() && year === now.getFullYear();
          return (
            <span
              key={day}
              className={`calendar-cell${tone ? ` calendar-cell-${tone}` : ''}${isToday ? ' calendar-cell-today' : ''}`}
              title={rec ? `${rec.workDate}: ${rec.status.replace(/_/g, ' ')}` : undefined}
            >
              {day}
            </span>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span><i className="legend-dot legend-present" /> Present</span>
        <span><i className="legend-dot legend-half" /> Half day</span>
        <span><i className="legend-dot legend-leave" /> On leave</span>
        <span><i className="legend-dot legend-absent" /> Absent</span>
      </div>
    </div>
  );
}
