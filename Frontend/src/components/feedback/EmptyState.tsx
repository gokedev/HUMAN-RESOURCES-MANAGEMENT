import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon size={24} className="empty-state-icon" />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
