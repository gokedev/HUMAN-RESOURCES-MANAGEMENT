export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton-cell skeleton-cell-lg" />
          <div className="skeleton-cell" />
          <div className="skeleton-cell" />
          <div className="skeleton-cell skeleton-cell-sm" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-circle" />
      <div className="skeleton-lines">
        <div className="skeleton-cell skeleton-cell-lg" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell skeleton-cell-sm" />
      </div>
    </div>
  );
}
