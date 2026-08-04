import { Link } from 'react-router-dom';
import { FileQuestion, ShieldOff } from 'lucide-react';
import { usePageTitle } from './hooks.js';

// Shared layout for simple full-screen status pages.
function StatusPage({ icon: Icon, title, message, action }) {
    usePageTitle(title);
    return (<main className="status-page">
      <Icon size={32} className="status-icon"/>
      <h1>{title}</h1>
      <p>{message}</p>
      {action}
    </main>);
}

export function NotFoundPage() {
    return (<StatusPage icon={FileQuestion} title="Page not found" message="The page you opened is not part of this workspace." action={<Link className="btn btn-primary" to="/">Go home</Link>}/>);
}

export function UnauthorizedPage() {
    return (<StatusPage icon={ShieldOff} title="Access restricted" message="Your role does not include permission for this area." action={<Link className="btn btn-primary" to="/">Return to dashboard</Link>}/>);
}
