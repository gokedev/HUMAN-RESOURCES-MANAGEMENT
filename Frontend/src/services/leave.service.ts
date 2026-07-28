import { apiClient } from './axios';
import type {
  CreateLeaveRequest,
  LeaveRequest,
  PaginatedResponse,
  PaginationParams,
  ReviewLeaveRequest,
} from '../types/api';

export const leaveService = {
  listCompany(params: PaginationParams) {
    return apiClient
      .get<PaginatedResponse<LeaveRequest>>('/api/admin/leave-requests', { params })
      .then((response) => response.data);
  },
  review(id: string, payload: ReviewLeaveRequest) {
    return apiClient
      .patch<LeaveRequest>(`/api/admin/leave-requests/${id}/review`, payload)
      .then((response) => response.data);
  },
  createMine(payload: CreateLeaveRequest) {
    return apiClient.post<LeaveRequest>('/api/employee/leave-requests', payload).then((response) => response.data);
  },
  listMine(params: PaginationParams) {
    return apiClient
      .get<PaginatedResponse<LeaveRequest>>('/api/employee/leave-requests', { params })
      .then((response) => response.data);
  },
  cancelMine(id: string) {
    return apiClient.patch<void>(`/api/employee/leave-requests/${id}/cancel`).then((response) => response.data);
  },
};
