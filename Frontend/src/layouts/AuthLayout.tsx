import { Link, Outlet } from 'react-router-dom';
import { FileEdit } from 'lucide-react';

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-brand-panel">
        <Link to="/login" className="brand-mark">
          <span className="brand-icon">
            <FileEdit size={20} />
          </span>
          <span>HRMS</span>
        </Link>
        <div className="auth-brand-copy">
          <span className="page-eyebrow">Enterprise HR platform</span>
          <h1>People operations with the control room built in.</h1>
          <p>Manage teams, attendance, leave workflows, and company access from one polished workspace.</p>
        </div>
      </section>
      <section className="auth-form-panel">
        <Outlet />
      </section>
    </main>
  );
}
