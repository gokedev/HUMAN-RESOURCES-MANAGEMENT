import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function UnauthorizedPage() {
  usePageTitle('Unauthorized');

  return (
    <main className="status-page">
      <span className="status-icon bi bi-shield-lock" aria-hidden="true" />
      <h1>Access restricted</h1>
      <p>Your role does not include permission for this area.</p>
      <Link className="btn btn-primary" to="/">Return to dashboard</Link>
    </main>
  );
}
