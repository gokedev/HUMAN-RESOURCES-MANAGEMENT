import type { NavigationItem } from '../types/navigation';

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Employees', path: '/employees', icon: 'Users', roles: ['ADMIN'] },
  { label: 'Departments', path: '/departments', icon: 'Building2', roles: ['ADMIN'] },
  { label: 'Attendance', path: '/attendance', icon: 'ClipboardCheck', roles: ['ADMIN'] },
  { label: 'Leave Requests', path: '/leave-requests', icon: 'FileClock', roles: ['ADMIN'] },
  { label: 'My Attendance', path: '/my-attendance', icon: 'Clock3', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'My Leave', path: '/my-leave', icon: 'CalendarDays', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Profile', path: '/profile', icon: 'UserRound', roles: ['ADMIN', 'EMPLOYEE'] },
  { label: 'Settings', path: '/settings', icon: 'Settings', roles: ['ADMIN', 'EMPLOYEE'] },
];
