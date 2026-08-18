package com.hrsaas.dto;

public class AttendanceStatusStats {
    private String status;
    private int count;
    private String color;

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
