package com.hrsaas.dto;

/**
 * Data transfer object for employee counts by status.
 */
public class EmployeeCounts {
    private long active;
    private long pending;
    private long suspended;

    public EmployeeCounts(long active, long pending, long suspended) {
        this.active = active;
        this.pending = pending;
        this.suspended = suspended;
    }

    public long getActive() {
        return active;
    }

    public void setActive(long active) {
        this.active = active;
    }

    public long getPending() {
        return pending;
    }

    public void setPending(long pending) {
        this.pending = pending;
    }

    public long getSuspended() {
        return suspended;
    }

    public void setSuspended(long suspended) {
        this.suspended = suspended;
    }
}