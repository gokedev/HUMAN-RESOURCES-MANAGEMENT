import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="error-screen">
          <section className="error-panel">
            <AlertTriangle size={32} className="error-icon" />
            <h1>We hit an unexpected issue.</h1>
            <p>Refresh the page or sign in again if your session has expired.</p>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
