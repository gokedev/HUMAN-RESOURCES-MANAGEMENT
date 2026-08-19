package com.hrsaas.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class PayslipResponseDto {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;
    private int payPeriodMonth;
    private int payPeriodYear;
    private BigDecimal grossSalary;
    private int unpaidLeaveDays;
    private BigDecimal unpaidLeaveDeduction;
    private BigDecimal taxDeduction;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;
    private LocalDateTime generatedAt;

    public PayslipResponseDto(UUID id, UUID employeeId, String employeeName, String employeeEmail,
                              int payPeriodMonth, int payPeriodYear, BigDecimal grossSalary,
                              int unpaidLeaveDays, BigDecimal unpaidLeaveDeduction,
                              BigDecimal taxDeduction, BigDecimal totalDeductions,
                              BigDecimal netPay, LocalDateTime generatedAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeEmail = employeeEmail;
        this.payPeriodMonth = payPeriodMonth;
        this.payPeriodYear = payPeriodYear;
        this.grossSalary = grossSalary;
        this.unpaidLeaveDays = unpaidLeaveDays;
        this.unpaidLeaveDeduction = unpaidLeaveDeduction;
        this.taxDeduction = taxDeduction;
        this.totalDeductions = totalDeductions;
        this.netPay = netPay;
        this.generatedAt = generatedAt;
    }

    public UUID getId() { return id; }
    public UUID getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public String getEmployeeEmail() { return employeeEmail; }
    public int getPayPeriodMonth() { return payPeriodMonth; }
    public int getPayPeriodYear() { return payPeriodYear; }
    public BigDecimal getGrossSalary() { return grossSalary; }
    public int getUnpaidLeaveDays() { return unpaidLeaveDays; }
    public BigDecimal getUnpaidLeaveDeduction() { return unpaidLeaveDeduction; }
    public BigDecimal getTaxDeduction() { return taxDeduction; }
    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public BigDecimal getNetPay() { return netPay; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
}
