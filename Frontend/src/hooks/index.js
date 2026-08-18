import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService, employeeService } from "../api.js";
import { queryKeys } from "../constants.js";
import { useToast } from "../contexts.jsx";
import { getErrorMessage, queryInvalidation } from "../utils.js";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  return isOnline;
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | CoralHR` : "CoralHR";
  }, [title]);
}

export function useEmployeeNameMap() {
  const { data } = useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeeService.listAll(),
  });
  return useMemo(() => {
    const map = {};
    data?.forEach((emp) => {
      map[emp.id] = `${emp.firstName} ${emp.lastName}`;
    });
    return map;
  }, [data]);
}

export function useTodayAttendance(enabled = true) {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const todayQuery = useQuery({
    queryKey: queryKeys.attendance.mine({ page: 0, size: 1, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: 0, size: 1, sort: "workDate,desc" }),
    enabled,
  });
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = todayQuery.data?.content?.find((r) => r.workDate === today);
  const hasCheckedIn = Boolean(todayRecord);
  const hasCheckedOut = hasCheckedIn && Boolean(todayRecord?.checkOut);
  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: async () => {
      await queryInvalidation.afterAttendanceChange(queryClient);
      notify({
        title: "Checked in",
        message: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        variant: "success",
      });
    },
    onError: (error) => notify({ title: "Check-in failed", message: getErrorMessage(error), variant: "danger" }),
  });
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: async () => {
      await queryInvalidation.afterAttendanceChange(queryClient);
      notify({
        title: "Checked out",
        message: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        variant: "success",
      });
    },
    onError: (error) => notify({ title: "Check-out failed", message: getErrorMessage(error), variant: "danger" }),
  });
  return {
    isLoading: todayQuery.isLoading,
    todayRecord,
    hasCheckedIn,
    hasCheckedOut,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    checkIn: () => checkInMutation.mutate(),
    checkOut: () => checkOutMutation.mutate(),
  };
}
