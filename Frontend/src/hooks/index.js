import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService, employeeService, leaveService } from "../api/index.js";
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
  const today = new Date().toISOString().split("T")[0];
  const todayQuery = useQuery({
    queryKey: queryKeys.attendance.mine({ page: 0, size: 7, sort: "workDate,desc" }),
    queryFn: () => attendanceService.listMine({ page: 0, size: 7, sort: "workDate,desc" }),
    enabled,
  });

  // Fetch approved leave requests to check for attendance sync
  const leaveQuery = useQuery({
    queryKey: queryKeys.leave.mine({ page: 0, size: 100, sort: "createdAt,desc" }),
    queryFn: () => leaveService.listMine({ page: 0, size: 100, sort: "createdAt,desc" }),
    enabled,
  });

  const todayRecordRaw = todayQuery.data?.content?.find((r) => r.workDate === today) ?? null;

  // Check if today falls within any approved leave period
  const todayInApprovedLeave = leaveQuery.data?.content?.some(leave =>
    leave.status === "APPROVED" &&
    new Date(today) >= new Date(leave.startDate) &&
    new Date(today) <= new Date(leave.endDate)
  );

  let todayRecord = todayRecordRaw;
  let hasCheckedIn = Boolean(todayRecord);
  let hasCheckedOut = hasCheckedIn && Boolean(todayRecord?.checkOut);

  // If today is in approved leave, override the attendance record
  if (todayInApprovedLeave) {
    todayRecord = {
      ...todayRecordRaw,
      status: "ON_LEAVE",
    };
    hasCheckedIn = Boolean(todayRecord);
    hasCheckedOut = hasCheckedIn && Boolean(todayRecord?.checkOut);
  }

  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: async (data) => {
      await queryInvalidation.afterAttendanceChange(queryClient);
      queryClient.setQueryData(
        queryKeys.attendance.mine({ page: 0, size: 7, sort: "workDate,desc" }),
        (old) => {
          if (!old) return old;
          const content = Array.isArray(old.content) ? old.content : [];
          return { ...old, content: [data, ...content.filter((r) => r.workDate !== today)] };
        }
      );
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
    onSuccess: async (data) => {
      await queryInvalidation.afterAttendanceChange(queryClient);
      queryClient.setQueryData(
        queryKeys.attendance.mine({ page: 0, size: 7, sort: "workDate,desc" }),
        (old) => {
          if (!old) return old;
          const content = Array.isArray(old.content) ? old.content : [];
          return { ...old, content: content.map((r) => (r.workDate === today ? data : r)) };
        }
      );
      notify({
        title: "Checked out",
        message: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        variant: "success",
      });
    },
    onError: (error) => notify({ title: "Check-out failed", message: getErrorMessage(error), variant: "danger" }),
  });
  return {
    isLoading: todayQuery.isLoading || leaveQuery.isLoading,
    todayRecord,
    hasCheckedIn,
    hasCheckedOut,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
    checkIn: () => checkInMutation.mutate(),
    checkOut: () => checkOutMutation.mutate(),
  };
}
