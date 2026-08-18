import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/feedback.jsx";
import { AuthProvider, ThemeProvider, ToastProvider } from "./contexts.jsx";
import { appQueryClient } from "./queryClient.js";
import { router } from "./router.jsx";

export function AppProviders({ children }) {
  return (
    // TanStack Query manages backend data fetching, caching, retries, and invalidation.
    <QueryClientProvider client={appQueryClient}>
      {/* ToastProvider exposes lightweight global notifications. */}
      <ToastProvider>
        {/* ThemeProvider stores light/dark mode preference and applies Bootstrap theme data. */}
        <ThemeProvider>
          {/* AuthProvider owns JWT session state and login/logout behavior. */}
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

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
