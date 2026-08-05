import { Link } from "react-router-dom";
import {
  FileQuestion,
  ShieldOff,
  Timer,
  ServerCrash,
} from "lucide-react";
import { usePageTitle } from "./hooks.js";

// Shared layout for simple full-screen status pages.
function StatusPage({ icon: Icon, title, message, action }) {
  usePageTitle(title);
  return (
    <main className="status-page">
      <Icon size={32} className="status-icon" />
      <h1>{title}</h1>
      <p>{message}</p>
      {action}
    </main>
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      icon={FileQuestion}
      title="Page not found"
      message="The page you opened is not part of this workspace."
      action={
        <Link className="btn btn-primary" to="/dashboard">
          Go home
        </Link>
      }
    />
  );
}

export function UnauthorizedPage() {
  return (
    <StatusPage
      icon={ShieldOff}
      title="Access restricted"
      message="Your role does not include permission for this area."
      action={
        <Link className="btn btn-primary" to="/dashboard">
          Return to dashboard
        </Link>
      }
    />
  );
}

export function SessionExpiredPage() {
  return (
    <StatusPage
      icon={Timer}
      title="Session expired"
      message="Your session is no longer valid. Sign in again to continue."
      action={
        <Link className="btn btn-primary" to="/login">
          Sign in
        </Link>
      }
    />
  );
}

export function ServerErrorPage() {
  return (
    <StatusPage
      icon={ServerCrash}
      title="Something went wrong"
      message="The server hit an unexpected error. Please try again in a moment."
      action={
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      }
    />
  );
}
