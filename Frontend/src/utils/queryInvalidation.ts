import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';

export const queryInvalidation = {
  afterEmployeeChange(queryClient: QueryClient) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
    ]);
  },
  afterDepartmentChange(queryClient: QueryClient) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all }),
    ]);
  },
  afterAttendanceChange(queryClient: QueryClient) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
    ]);
  },
  afterLeaveChange(queryClient: QueryClient) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.leave.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me }),
    ]);
  },
};
