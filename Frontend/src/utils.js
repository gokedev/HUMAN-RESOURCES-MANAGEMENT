import axios from 'axios';
import { TOKEN_STORAGE_KEYS, queryKeys } from './constants.js';

export function getErrorMessage(error) {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}

const storageFor = (rememberMe) => (rememberMe ? localStorage : sessionStorage);
export const tokenStorage = {
    get() {
        const rememberMe = localStorage.getItem(TOKEN_STORAGE_KEYS.rememberMe) === 'true';
        const storage = storageFor(rememberMe);
        const accessToken = storage.getItem(TOKEN_STORAGE_KEYS.accessToken);
        const refreshToken = storage.getItem(TOKEN_STORAGE_KEYS.refreshToken);
        const role = storage.getItem(TOKEN_STORAGE_KEYS.role);
        const email = storage.getItem(TOKEN_STORAGE_KEYS.email);
        const companySlug = storage.getItem(TOKEN_STORAGE_KEYS.companySlug);
        if (!accessToken || !refreshToken || !role || !email || !companySlug) {
            return null;
        }
        return { accessToken, refreshToken, role, email, companySlug };
    },
    set(auth, rememberMe) {
        tokenStorage.clear();
        localStorage.setItem(TOKEN_STORAGE_KEYS.rememberMe, String(rememberMe));
        const storage = storageFor(rememberMe);
        storage.setItem(TOKEN_STORAGE_KEYS.accessToken, auth.accessToken);
        storage.setItem(TOKEN_STORAGE_KEYS.refreshToken, auth.refreshToken);
        storage.setItem(TOKEN_STORAGE_KEYS.role, auth.role);
        storage.setItem(TOKEN_STORAGE_KEYS.email, auth.email);
        storage.setItem(TOKEN_STORAGE_KEYS.companySlug, auth.companySlug);
    },
    clear() {
        localStorage.removeItem(TOKEN_STORAGE_KEYS.rememberMe);
        Object.values(TOKEN_STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    },
};

// Centralized cache invalidation so every mutation refreshes the same set of queries.
export const queryInvalidation = {
    afterEmployeeChange(queryClient) {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        ]);
    },
    afterDepartmentChange(queryClient) {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.departments.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
        ]);
    },
    afterAttendanceChange(queryClient) {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        ]);
    },
    afterLeaveChange(queryClient) {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.leave.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
        ]);
    },
};
