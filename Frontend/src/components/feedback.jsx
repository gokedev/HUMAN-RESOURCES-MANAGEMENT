import { Component } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks.js';

export function EmptyState({ icon: Icon, title, description }) {
    return (<div className="empty-state">
      <Icon size={24} className="empty-state-icon"/>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>);
}

export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (<main className="error-screen">
          <section className="error-panel">
            <AlertTriangle size={32} className="error-icon"/>
            <h1>We hit an unexpected issue.</h1>
            <p>Refresh the page or sign in again if your session has expired.</p>
            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </section>
        </main>);
        }
        return this.props.children;
    }
}

export function OfflineBanner() {
    const isOnline = useOnlineStatus();
    if (isOnline) {
        return null;
    }
    return (<div className="offline-banner" role="status">
      <WifiOff size={16} style={{ marginRight: '0.5rem' }}/>
      You are offline. Changes may not sync until your connection returns.
    </div>);
}

export function TableSkeleton({ rows = 5 }) {
    return (<div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (<div className="skeleton-row" key={i}>
          <div className="skeleton-cell skeleton-cell-lg"/>
          <div className="skeleton-cell"/>
          <div className="skeleton-cell"/>
          <div className="skeleton-cell skeleton-cell-sm"/>
        </div>))}
    </div>);
}
export function CardSkeleton() {
    return (<div className="skeleton-card">
      <div className="skeleton-circle"/>
      <div className="skeleton-lines">
        <div className="skeleton-cell skeleton-cell-lg"/>
        <div className="skeleton-cell"/>
        <div className="skeleton-cell skeleton-cell-sm"/>
      </div>
    </div>);
}

export function DataTableShell({ title, description, action, children }) {
    return (<section className="table-shell">
      <div className="table-shell-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>);
}
