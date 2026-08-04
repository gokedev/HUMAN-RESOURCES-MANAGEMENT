// Vite exposes public environment variables through import.meta.env.
export const API_BASE_URL = import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL ?? 'https://hr-saas-cmra.onrender.com');
// Centralized storage keys keep token persistence consistent across auth utilities.
export const TOKEN_STORAGE_KEYS = {
    accessToken: 'hrms.accessToken',
    refreshToken: 'hrms.refreshToken',
    role: 'hrms.role',
    email: 'hrms.email',
    companySlug: 'hrms.companySlug',
    rememberMe: 'hrms.rememberMe',
};

export const queryKeys = {
    profile: {
        me: ['profile', 'me'],
    },
    employees: {
        all: ['employees'],
    },
    departments: {
        all: ['departments'],
    },
    attendance: {
        all: ['attendance'],
        company: (params) => ['attendance', 'company', params],
        mine: (params) => ['attendance', 'mine', params],
    },
    leave: {
        all: ['leave'],
        company: (params) => ['leave', 'company', params],
        mine: (params) => ['leave', 'mine', params],
    },
};
