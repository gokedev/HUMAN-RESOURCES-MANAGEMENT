import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { appQueryClient } from './queryClient';

export function AppProviders({ children }: PropsWithChildren) {
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
