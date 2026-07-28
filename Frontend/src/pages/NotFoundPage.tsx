import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Not Found');

  return (
    <main className="status-page">
      <span className="status-icon bi bi-signpost-split" aria-hidden="true" />
      <h1>Page not found</h1>
      <p>The page you opened is not part of this workspace.</p>
      <Link className="btn btn-primary" to="/">Go home</Link>
    </main>
  );
}
