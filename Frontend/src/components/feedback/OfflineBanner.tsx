import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      <WifiOff size={16} style={{ marginRight: '0.5rem' }} />
      You are offline. Changes may not sync until your connection returns.
    </div>
  );
}
