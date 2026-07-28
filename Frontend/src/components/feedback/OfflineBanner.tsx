import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      <span className="bi bi-wifi-off" aria-hidden="true" />
      You are offline. Changes may not sync until your connection returns.
    </div>
  );
}
