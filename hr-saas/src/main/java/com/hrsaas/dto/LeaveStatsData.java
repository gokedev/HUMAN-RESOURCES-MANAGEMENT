package com.hrsaas.dto;

import java.util.List;
import java.util.Map;

public class LeaveStatsData {
    private List<LeaveTypeStats> leaveByType;
    private List<LeaveStatusStats> leaveByStatus;
    private Map<String, Integer> monthlyLeaveTrends;
    private int totalPendingRequests;
    private int totalApprovedThisMonth;
    private int totalRejectedThisMonth;

    public LeaveStatsData(List<LeaveTypeStats> leaveByType,
                          List<LeaveStatusStats> leaveByStatus,
                          Map<String, Integer> monthlyLeaveTrends,
                          int totalPendingRequests,
                          int totalApprovedThisMonth,
                          int totalRejectedThisMonth) {
        this.leaveByType = leaveByType;
        this.leaveByStatus = leaveByStatus;
        this.monthlyLeaveTrends = monthlyLeaveTrends;
        this.totalPendingRequests = totalPendingRequests;
        this.totalApprovedThisMonth = totalApprovedThisMonth;
        this.totalRejectedThisMonth = totalRejectedThisMonth;
    }

    public List<LeaveTypeStats> getLeaveByType() {
        return leaveByType;
    }

    public void setLeaveByType(List<LeaveTypeStats> leaveByType) {
        this.leaveByType = leaveByType;
    }

    public List<LeaveStatusStats> getLeaveByStatus() {
        return leaveByStatus;
    }

    public void setLeaveByStatus(List<LeaveStatusStats> leaveByStatus) {
        this.leaveByStatus = leaveByStatus;
    }

    public Map<String, Integer> getMonthlyLeaveTrends() {
        return monthlyLeaveTrends;
    }

    public void setMonthlyLeaveTrends(Map<String, Integer> monthlyLeaveTrends) {
        this.monthlyLeaveTrends = monthlyLeaveTrends;
    }

    public int getTotalPendingRequests() {
        return totalPendingRequests;
    }

    public void setTotalPendingRequests(int totalPendingRequests) {
        this.totalPendingRequests = totalPendingRequests;
    }

    public int getTotalApprovedThisMonth() {
        return totalApprovedThisMonth;
    }

    public void setTotalApprovedThisMonth(int totalApprovedThisMonth) {
        this.totalApprovedThisMonth = totalApprovedThisMonth;
    }

    public int getTotalRejectedThisMonth() {
        return totalRejectedThisMonth;
    }

    public void setTotalRejectedThisMonth(int totalRejectedThisMonth) {
        this.totalRejectedThisMonth = totalRejectedThisMonth;
    }
}
