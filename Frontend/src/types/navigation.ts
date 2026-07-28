import type { UserRole } from './api';

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}
