import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Not Found');

  return (
    <main className="status-page">
      <FileQuestion size={32} className="status-icon" />
      <h1>Page not found</h1>
      <p>The page you opened is not part of this workspace.</p>
      <Link className="btn btn-primary" to="/">Go home</Link>
    </main>
  );
}
