import { apiClient } from './axios';
import type { AttendanceRecord, PaginatedResponse, PaginationParams } from '../types/api';

export const attendanceService = {
  listCompany(params: PaginationParams) {
    return apiClient
      .get<PaginatedResponse<AttendanceRecord>>('/api/admin/attendance', { params })
      .then((response) => response.data);
  },
  checkIn() {
    return apiClient.post<AttendanceRecord>('/api/employee/attendance/check-in').then((response) => response.data);
  },
  checkOut() {
    return apiClient.post<AttendanceRecord>('/api/employee/attendance/check-out').then((response) => response.data);
  },
  listMine(params: PaginationParams) {
    return apiClient
      .get<PaginatedResponse<AttendanceRecord>>('/api/employee/attendance', { params })
      .then((response) => response.data);
  },
};
