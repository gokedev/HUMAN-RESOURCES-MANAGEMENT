import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      return (
        <main className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">We hit an unexpected issue.</h1>
            <p className="text-muted-foreground">
              Refresh the page or sign in again if your session has expired.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
