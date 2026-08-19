package com.hrsaas.service;

import com.hrsaas.dto.PayslipResponseDto;
import com.hrsaas.dto.PayrollGenerateRequest;
import com.hrsaas.entity.Payslip;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.enums.Role;
import com.hrsaas.enums.UserStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.LeaveRequestRepository;
import com.hrsaas.repository.PayslipRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.security.RoleGuard;
import com.hrsaas.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// Future work: tax rates should be configurable per-company in Settings.
// Future work: add statutory deductions (pension, health insurance) for compliance.
// Future work: integrate with payment disbursement (e.g. Paystack) for actual salary payment.
@Service
public class PayrollService {

    private static final Logger log = LoggerFactory.getLogger(PayrollService.class);

    // Illustrative flat tax rate — hardcoded for school presentation.
    // Future work: make configurable in Settings per-company.
    private static final BigDecimal TAX_RATE = new BigDecimal("0.10");

    private final PayslipRepository payslipRepository;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public PayrollService(PayslipRepository payslipRepository,
                          UserRepository userRepository,
                          LeaveRequestRepository leaveRequestRepository) {
        this.payslipRepository = payslipRepository;
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    /**
     * Admin: Generate payslips for all active employees for a given month/year.
     * For each active employee with a base salary set:
     *   1. Count approved UNPAID leave days overlapping the pay period.
     *   2. Calculate unpaid leave deduction = (baseSalary / workingDaysInMonth) * unpaidDays.
     *   3. Calculate tax deduction = baseSalary * 10% (illustrative).
     *   4. Net pay = baseSalary - unpaidLeaveDeduction - taxDeduction.
     *
     * If payslips already exist for the period:
     *   - overwriteExisting=false → skip existing, return count of skipped.
     *   - overwriteExisting=true  → delete old and regenerate.
     */
    @Transactional
    public Map<String, Object> generatePayroll(PayrollGenerateRequest request) {
        RoleGuard.requireRole(Role.ADMIN);
        UUID tenantId = TenantContext.getTenantId();

        int month = request.getMonth();
        int year = request.getYear();
        YearMonth yearMonth = YearMonth.of(year, month);
        log.info("Generating payroll for company={}, month={}/{}", tenantId, month, year);

        long workingDaysInMonth = countWorkingDays(yearMonth);

        // Fetch all active employees with a base salary
        List<User> activeEmployees = userRepository.findByCompanyId(tenantId, org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(e -> e.getStatus() == UserStatus.ACTIVE && e.getBaseSalary() != null && e.getBaseSalary().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        List<Payslip> savedPayslips = new ArrayList<>();
        int skipped = 0;

        for (User employee : activeEmployees) {
            boolean exists = payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                    tenantId, employee.getId(), month, year);

            if (exists) {
                if (request.isOverwriteExisting()) {
                    payslipRepository.findByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                            tenantId, employee.getId(), month, year)
                            .ifPresent(payslipRepository::delete);
                } else {
                    skipped++;
                    continue;
                }
            }

            // Count approved UNPAID leave days overlapping this pay period
            int unpaidDays = countUnpaidLeaveDays(tenantId, employee.getId(), yearMonth);

            Payslip payslip = calculatePayslip(tenantId, employee, month, year, workingDaysInMonth, unpaidDays);
            savedPayslips.add(payslipRepository.save(payslip));
        }

        log.info("Payroll generated: {} payslips created, {} skipped", savedPayslips.size(), skipped);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("created", savedPayslips.size());
        result.put("skipped", skipped);
        result.put("payslips", savedPayslips);
        return result;
    }

    /**
     * Admin: List all payslips for a given period.
     */
    public List<PayslipResponseDto> listPayslipsForPeriod(int month, int year) {
        RoleGuard.requireRole(Role.ADMIN);
        UUID tenantId = TenantContext.getTenantId();

        List<Payslip> payslips = payslipRepository.findByCompanyIdAndPayPeriodYearAndPayPeriodMonthOrderByEmployeeId(
                tenantId, year, month);

        // Batch-fetch employee names
        List<UUID> employeeIds = payslips.stream().map(Payslip::getEmployeeId).distinct().toList();
        Map<UUID, User> employeeMap = userRepository.findAllById(employeeIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return payslips.stream().map(p -> {
            User emp = employeeMap.get(p.getEmployeeId());
            String name = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
            String email = emp != null ? emp.getEmail() : "";
            return new PayslipResponseDto(
                    p.getId(), p.getEmployeeId(), name, email,
                    p.getPayPeriodMonth(), p.getPayPeriodYear(), p.getGrossSalary(),
                    p.getUnpaidLeaveDays(), p.getUnpaidLeaveDeduction(),
                    p.getTaxDeduction(), p.getTotalDeductions(),
                    p.getNetPay(), p.getGeneratedAt());
        }).toList();
    }

    /**
     * Employee: List own payslips (newest first).
     */
    public List<PayslipResponseDto> listMyPayslips() {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();

        List<Payslip> payslips = payslipRepository.findByCompanyIdAndEmployeeIdOrderByPayPeriodYearDescPayPeriodMonthDesc(
                tenantId, employeeId);

        User emp = userRepository.findById(employeeId).orElse(null);
        String name = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String email = emp != null ? emp.getEmail() : "";

        return payslips.stream().map(p ->
                new PayslipResponseDto(
                        p.getId(), p.getEmployeeId(), name, email,
                        p.getPayPeriodMonth(), p.getPayPeriodYear(), p.getGrossSalary(),
                        p.getUnpaidLeaveDays(), p.getUnpaidLeaveDeduction(),
                        p.getTaxDeduction(), p.getTotalDeductions(),
                        p.getNetPay(), p.getGeneratedAt())
        ).toList();
    }

    /**
     * Get a single payslip by ID — admin sees any in company, employee sees only their own.
     */
    public PayslipResponseDto getPayslip(UUID payslipId) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> ApiException.notFound("Payslip not found"));

        if (!payslip.getCompanyId().equals(tenantId)) {
            throw ApiException.notFound("Payslip not found");
        }

        // Employees can only view their own payslips
        if (RoleGuard.hasRole(Role.EMPLOYEE) && !payslip.getEmployeeId().equals(userId)) {
            throw ApiException.forbidden("You can only view your own payslips");
        }

        User emp = userRepository.findById(payslip.getEmployeeId()).orElse(null);
        String name = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String email = emp != null ? emp.getEmail() : "";

        return new PayslipResponseDto(
                payslip.getId(), payslip.getEmployeeId(), name, email,
                payslip.getPayPeriodMonth(), payslip.getPayPeriodYear(), payslip.getGrossSalary(),
                payslip.getUnpaidLeaveDays(), payslip.getUnpaidLeaveDeduction(),
                payslip.getTaxDeduction(), payslip.getTotalDeductions(),
                payslip.getNetPay(), payslip.getGeneratedAt());
    }

    /**
     * Calculate a payslip for a single employee.
     */
    private Payslip calculatePayslip(UUID tenantId, User employee, int month, int year,
                                     long workingDaysInMonth, int unpaidDays) {
        BigDecimal salary = employee.getBaseSalary();
        BigDecimal dailyRate = salary.divide(BigDecimal.valueOf(workingDaysInMonth), 2, RoundingMode.HALF_UP);
        BigDecimal unpaidDeduction = dailyRate.multiply(BigDecimal.valueOf(unpaidDays));
        BigDecimal taxDeduction = salary.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDeductions = unpaidDeduction.add(taxDeduction);
        BigDecimal netPay = salary.subtract(totalDeductions);

        return Payslip.builder()
                .companyId(tenantId)
                .employeeId(employee.getId())
                .payPeriodMonth(month)
                .payPeriodYear(year)
                .grossSalary(salary)
                .unpaidLeaveDays(unpaidDays)
                .unpaidLeaveDeduction(unpaidDeduction)
                .taxDeduction(taxDeduction)
                .totalDeductions(totalDeductions)
                .netPay(netPay)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Count approved UNPAID leave days overlapping the given pay period.
     * An overlap exists if the leave start <= periodEnd AND leave end >= periodStart.
     * Only days within the pay period are counted (clamped).
     */
    private int countUnpaidLeaveDays(UUID tenantId, UUID employeeId, YearMonth yearMonth) {
        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();

        // Fetch approved unpaid leave requests for this employee that overlap the period
        List<?> overlappingLeaves = leaveRequestRepository.findByCompanyIdAndEmployeeId(tenantId, employeeId,
                org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(lr -> lr.getLeaveType() == LeaveType.UNPAID
                        && lr.getStatus() == LeaveStatus.APPROVED
                        && !lr.getStartDate().isAfter(periodEnd)
                        && !lr.getEndDate().isBefore(periodStart))
                .toList();

        int totalDays = 0;
        for (Object obj : overlappingLeaves) {
            com.hrsaas.entity.LeaveRequest lr = (com.hrsaas.entity.LeaveRequest) obj;
            // Clamp to pay period boundaries
            LocalDate effectiveStart = lr.getStartDate().isBefore(periodStart) ? periodStart : lr.getStartDate();
            LocalDate effectiveEnd = lr.getEndDate().isAfter(periodEnd) ? periodEnd : lr.getEndDate();
            // Count only weekdays within the overlap
            long weekdays = effectiveStart.datesUntil(effectiveEnd.plusDays(1))
                    .filter(d -> d.getDayOfWeek().getValue() <= 5)
                    .count();
            totalDays += (int) weekdays;
        }
        return totalDays;
    }

    /**
     * Count weekdays (Mon-Fri) in a month. Standard approach: 20-23 depending on month.
     */
    private long countWorkingDays(YearMonth yearMonth) {
        return yearMonth.atDay(1).datesUntil(yearMonth.plusMonths(1).atDay(1))
                .filter(d -> d.getDayOfWeek().getValue() <= 5)
                .count();
    }
}
