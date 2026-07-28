import type { PaginationParams } from '../types/api';

export const queryKeys = {
  auth: ['auth'] as const,
  profile: {
    me: ['profile', 'me'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (params: PaginationParams) => ['employees', 'list', params] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: ['departments', 'list'] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    company: (params: PaginationParams) => ['attendance', 'company', params] as const,
    mine: (params: PaginationParams) => ['attendance', 'mine', params] as const,
  },
  leave: {
    all: ['leave'] as const,
    company: (params: PaginationParams) => ['leave', 'company', params] as const,
    mine: (params: PaginationParams) => ['leave', 'mine', params] as const,
  },
};
