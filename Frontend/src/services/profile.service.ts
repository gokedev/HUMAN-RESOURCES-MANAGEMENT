import { apiClient } from './axios';
import type { User } from '../types/api';

export const profileService = {
  me() {
    return apiClient.get<User>('/api/employee/me').then((response) => response.data);
  },
};
