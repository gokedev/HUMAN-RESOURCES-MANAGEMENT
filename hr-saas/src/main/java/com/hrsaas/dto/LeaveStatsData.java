package com.hrsaas.dto;

import java.util.List;
import java.util.Map;

/**
 * Data transfer object for leave statistics.
 */
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

    // Getters and setters
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

/**
 * Stats for leave by type (e.g., Vacation, Sick Leave, etc.)
 */
public class LeaveTypeStats {
    private String leaveType;
    private int count;

    public LeaveTypeStats(String leaveType, int count) {
        this.leaveType = leaveType;
        this.count = count;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}

/**
 * Stats for leave by status (e.g., PENDING, APPROVED, REJECTED)
 */
public class LeaveStatusStats {
    private String status;
    private int count;

    public LeaveStatusStats(String status, int count) {
        this.status = status;
        this.count = count;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}