import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export function UnauthorizedPage() {
  usePageTitle('Unauthorized');

  return (
    <main className="status-page">
      <ShieldOff size={32} className="status-icon" />
      <h1>Access restricted</h1>
      <p>Your role does not include permission for this area.</p>
      <Link className="btn btn-primary" to="/">Return to dashboard</Link>
    </main>
  );
}
