import type { ReactNode } from 'react';

interface DataTableShellProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DataTableShell({ title, description, action, children }: DataTableShellProps) {
  return (
    <section className="table-shell">
      <div className="table-shell-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
