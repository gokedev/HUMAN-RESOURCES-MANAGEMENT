package com.hrsaas.dto;

import java.util.List;

/**
 * Data transfer object for attendance compliance statistics.
 */
public class AttendanceComplianceData {
    private List<AttendanceStatusStats> todayAttendanceByStatus;
    private List<AttendanceStatusStats> weekAttendanceByStatus;
    private double complianceRate; // Percentage of expected check-ins that occurred
    private int expectedCheckins;
    private int actualCheckins;
    private int todayCheckedIn;
    private int todayTotalEmployees;

    public AttendanceComplianceData(List<AttendanceStatusStats> todayAttendanceByStatus,
                                    List<AttendanceStatusStats> weekAttendanceByStatus,
                                    double complianceRate,
                                    int expectedCheckins,
                                    int actualCheckins,
                                    int todayCheckedIn,
                                    int todayTotalEmployees) {
        this.todayAttendanceByStatus = todayAttendanceByStatus;
        this.weekAttendanceByStatus = weekAttendanceByStatus;
        this.complianceRate = complianceRate;
        this.expectedCheckins = expectedCheckins;
        this.actualCheckins = actualCheckins;
        this.todayCheckedIn = todayCheckedIn;
        this.todayTotalEmployees = todayTotalEmployees;
    }

    // Getters and setters
    public List<AttendanceStatusStats> getTodayAttendanceByStatus() {
        return todayAttendanceByStatus;
    }

    public void setTodayAttendanceByStatus(List<AttendanceStatusStats> todayAttendanceByStatus) {
        this.todayAttendanceByStatus = todayAttendanceByStatus;
    }

    public List<AttendanceStatusStats> getWeekAttendanceByStatus() {
        return weekAttendanceByStatus;
    }

    public void setWeekAttendanceByStatus(List<AttendanceStatusStats> weekAttendanceByStatus) {
        this.weekAttendanceByStatus = weekAttendanceByStatus;
    }

    public double getComplianceRate() {
        return complianceRate;
    }

    public void setComplianceRate(double complianceRate) {
        this.complianceRate = complianceRate;
    }

    public int getExpectedCheckins() {
        return expectedCheckins;
    }

    public void setExpectedCheckins(int expectedCheckins) {
        this.expectedCheckins = expectedCheckins;
    }

    public int getActualCheckins() {
        return actualCheckins;
    }

    public void setActualCheckins(int actualCheckins) {
        this.actualCheckins = actualCheckins;
    }

    public int getTodayCheckedIn() {
        return todayCheckedIn;
    }

    public void setTodayCheckedIn(int todayCheckedIn) {
        this.todayCheckedIn = todayCheckedIn;
    }

    public int getTodayTotalEmployees() {
        return todayTotalEmployees;
    }

    public void setTodayTotalEmployees(int todayTotalEmployees) {
        this.todayTotalEmployees = todayTotalEmployees;
    }
}

/**
 * Stats for attendance by status (e.g., PRESENT, ABSENT, etc.)
 */
public class AttendanceStatusStats {
    private String status;
    private int count;
    private String color; // For chart styling

    public AttendanceStatusStats(String status, int count, String color) {
        this.status = status;
        this.count = count;
        this.color = color;
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}