interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  children: React.ReactNode;
}

const variantClass: Record<BadgeProps['variant'], string> = {
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
  secondary: 'badge-secondary',
};

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge ${variantClass[variant]}`}>{children}</span>;
}

const statusVariantMap: Record<string, BadgeProps['variant']> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'danger',
  PRESENT: 'success',
  ABSENT: 'danger',
  HALF_DAY: 'warning',
  ON_LEAVE: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'secondary',
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariantMap[status] ?? 'secondary';
  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}
