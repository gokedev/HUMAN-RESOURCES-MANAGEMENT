import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { AppProviders } from './providers';
import { router } from '../routes/router';

export function App() {
  return (
    // ErrorBoundary prevents a single rendering bug from blanking the whole app.
    <ErrorBoundary>
      {/* AppProviders supplies shared app state such as auth, theme, toast, and server cache. */}
      <AppProviders>
        {/* RouterProvider renders the correct page based on the browser URL. */}
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
