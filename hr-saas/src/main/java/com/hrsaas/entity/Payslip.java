package com.hrsaas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payslips", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "employee_id", "pay_period_month", "pay_period_year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payslip {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "pay_period_month", nullable = false)
    private int payPeriodMonth;

    @Column(name = "pay_period_year", nullable = false)
    private int payPeriodYear;

    @Column(name = "gross_salary", nullable = false)
    private BigDecimal grossSalary;

    @Column(name = "unpaid_leave_days", nullable = false)
    private int unpaidLeaveDays;

    @Column(name = "unpaid_leave_deduction", nullable = false)
    private BigDecimal unpaidLeaveDeduction;

    @Column(name = "tax_deduction", nullable = false)
    private BigDecimal taxDeduction;

    @Column(name = "total_deductions", nullable = false)
    private BigDecimal totalDeductions;

    @Column(name = "net_pay", nullable = false)
    private BigDecimal netPay;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
}
