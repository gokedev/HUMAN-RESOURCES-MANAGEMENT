import { apiClient } from './axios';
import type { EmployeeRequest, PaginatedResponse, PaginationParams, User } from '../types/api';

export const employeeService = {
  list(params: PaginationParams) {
    return apiClient
      .get<PaginatedResponse<User>>('/api/admin/employees', { params })
      .then((response) => response.data);
  },
  get(id: string) {
    return apiClient.get<User>(`/api/admin/employees/${id}`).then((response) => response.data);
  },
  create(payload: EmployeeRequest) {
    return apiClient.post<User>('/api/admin/employees', payload).then((response) => response.data);
  },
  update(id: string, payload: EmployeeRequest) {
    return apiClient.put<User>(`/api/admin/employees/${id}`, payload).then((response) => response.data);
  },
  deactivate(id: string) {
    return apiClient.patch<void>(`/api/admin/employees/${id}/deactivate`).then((response) => response.data);
  },
  reactivate(id: string) {
    return apiClient.patch<void>(`/api/admin/employees/${id}/reactivate`).then((response) => response.data);
  },
};
