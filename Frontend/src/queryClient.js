import { QueryClient } from "@tanstack/react-query";
// Shared QueryClient instance for server state, cache invalidation, and auth cache clearing.
export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once for normal query failures; Axios handles token refresh separately.
      retry: 1,
      // Enterprise dashboards should not refetch unexpectedly while users are reviewing tables.
      refetchOnWindowFocus: false,
      // Brief stale time keeps repeated navigation snappy without hiding fresh data for long.
      staleTime: 30_000,
    },
  },
});
