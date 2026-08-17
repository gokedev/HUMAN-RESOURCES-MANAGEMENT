import { Link } from "react-router-dom";
import { FileQuestion, ShieldOff, Timer, ServerCrash } from "lucide-react";
import { usePageTitle } from "./hooks.js";
import { Button } from "@/components/ui/button.jsx";

function StatusPage({ icon: Icon, title, message, action }) {
  usePageTitle(title);
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-8 text-center">
      <div className="space-y-4 max-w-md">
        <Icon className="h-8 w-8 text-primary mx-auto" />
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        {action}
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      icon={FileQuestion}
      title="Page not found"
      message="The page you opened is not part of this workspace."
      action={<Link to="/dashboard"><Button>Go home</Button></Link>}
    />
  );
}

export function UnauthorizedPage() {
  return (
    <StatusPage
      icon={ShieldOff}
      title="Access restricted"
      message="Your role does not include permission for this area."
      action={<Link to="/dashboard"><Button>Return to dashboard</Button></Link>}
    />
  );
}

export function SessionExpiredPage() {
  return (
    <StatusPage
      icon={Timer}
      title="Session expired"
      message="Your session is no longer valid. Sign in again to continue."
      action={<Link to="/login"><Button>Sign in</Button></Link>}
    />
  );
}

export function ServerErrorPage() {
  return (
    <StatusPage
      icon={ServerCrash}
      title="Something went wrong"
      message="The server hit an unexpected error. Please try again in a moment."
      action={<Button onClick={() => window.location.reload()}>Try again</Button>}
    />
  );
}
