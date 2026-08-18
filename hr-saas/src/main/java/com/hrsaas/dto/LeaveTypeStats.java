package com.hrsaas.dto;

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
