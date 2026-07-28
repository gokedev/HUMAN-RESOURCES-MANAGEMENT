import { apiClient } from './axios';
import type { CreateDepartmentRequest, Department } from '../types/api';

export const departmentService = {
  list() {
    return apiClient.get<Department[]>('/api/admin/departments').then((response) => response.data);
  },
  create(payload: CreateDepartmentRequest) {
    return apiClient.post<Department>('/api/admin/departments', payload).then((response) => response.data);
  },
  delete(id: string) {
    return apiClient.delete<void>(`/api/admin/departments/${id}`).then((response) => response.data);
  },
};
