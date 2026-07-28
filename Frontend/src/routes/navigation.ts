import type { NavigationItem } from '../types/navigation';

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'bi-grid-1x2', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Employees', path: '/employees', icon: 'bi-people', roles: ['ADMIN'] },
  { label: 'Departments', path: '/departments', icon: 'bi-diagram-3', roles: ['ADMIN'] },
  { label: 'Attendance', path: '/attendance', icon: 'bi-calendar2-check', roles: ['ADMIN'] },
  { label: 'Leave Requests', path: '/leave-requests', icon: 'bi-inboxes', roles: ['ADMIN'] },
  { label: 'My Attendance', path: '/my-attendance', icon: 'bi-clock-history', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'My Leave', path: '/my-leave', icon: 'bi-calendar-heart', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Profile', path: '/profile', icon: 'bi-person-circle', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Settings', path: '/settings', icon: 'bi-sliders', roles: ['ADMIN', 'EMPLOYEE'] },
];
