import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks.js";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="flex items-center justify-center gap-2 h-10 text-amber-800 bg-amber-50 border-b border-amber-200 text-sm font-semibold dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800" role="status">
      <WifiOff className="h-4 w-4" />
      You are offline. Changes may not sync until your connection returns.
    </div>
  );
}
