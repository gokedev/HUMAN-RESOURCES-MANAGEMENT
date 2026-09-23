package com.hrsaas.service;

import com.hrsaas.dto.PayrollGenerateRequest;
import com.hrsaas.dto.PayslipResponseDto;
import com.hrsaas.entity.LeaveRequest;
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
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock
    private PayslipRepository payslipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @InjectMocks
    private PayrollService payrollService;

    private UUID tenantId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(employeeId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private User activeEmployeeWithSalary(BigDecimal salary) {
        return User.builder()
                .id(employeeId).companyId(tenantId).email("emp@acme.com")
                .firstName("Emp").lastName("Loyee").role(Role.EMPLOYEE)
                .status(UserStatus.ACTIVE).baseSalary(salary)
                .build();
    }

    // ── generatePayroll ──────────────────────────

    @Test
    void generatePayroll_NoUnpaidLeave_NetPayIsSalaryMinusTax() {
        TenantContext.setRole(Role.ADMIN.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);
        request.setOverwriteExisting(false);

        User employee = activeEmployeeWithSalary(new BigDecimal("5000.00"));
        when(userRepository.findByCompanyId(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(employee)));
        when(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                tenantId, employeeId, 6, 2026)).thenReturn(false);
        when(leaveRequestRepository.findByCompanyIdAndEmployeeId(eq(tenantId), eq(employeeId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = payrollService.generatePayroll(request);

        assertEquals(1, result.get("created"));
        assertEquals(0, result.get("skipped"));

        @SuppressWarnings("unchecked")
        List<Payslip> payslips = (List<Payslip>) result.get("payslips");
        Payslip payslip = payslips.get(0);

        // Tax = 5000 * 0.10 = 500.00; no unpaid leave deduction
        assertEquals(0, new BigDecimal("500.00").compareTo(payslip.getTaxDeduction()));
        assertEquals(0, BigDecimal.ZERO.compareTo(payslip.getUnpaidLeaveDeduction()));
        assertEquals(0, new BigDecimal("4500.00").compareTo(payslip.getNetPay()));
        assertEquals(0, payslip.getUnpaidLeaveDays());
    }

    @Test
    void generatePayroll_WithApprovedUnpaidLeave_DeductsWeekdaysOnly() {
        TenantContext.setRole(Role.ADMIN.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);
        request.setOverwriteExisting(false);

        User employee = activeEmployeeWithSalary(new BigDecimal("4400.00")); // divides cleanly by 22 weekdays

        // Mon 2026-06-01 through Fri 2026-06-05 = 5 weekdays, all unpaid & approved
        LeaveRequest unpaidLeave = LeaveRequest.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.UNPAID).status(LeaveStatus.APPROVED)
                .startDate(LocalDate.of(2026, 6, 1)).endDate(LocalDate.of(2026, 6, 5))
                .build();

        when(userRepository.findByCompanyId(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(employee)));
        when(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                tenantId, employeeId, 6, 2026)).thenReturn(false);
        when(leaveRequestRepository.findByCompanyIdAndEmployeeId(eq(tenantId), eq(employeeId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(unpaidLeave)));
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = payrollService.generatePayroll(request);

        @SuppressWarnings("unchecked")
        List<Payslip> payslips = (List<Payslip>) result.get("payslips");
        Payslip payslip = payslips.get(0);

        // June 2026 has 22 weekdays; daily rate = 4400/22 = 200.00; 5 unpaid weekdays => 1000.00 deduction
        assertEquals(5, payslip.getUnpaidLeaveDays());
        assertEquals(0, new BigDecimal("1000.00").compareTo(payslip.getUnpaidLeaveDeduction()));
        // Tax = 4400 * 0.10 = 440.00; net = 4400 - 1000 - 440 = 2960.00
        assertEquals(0, new BigDecimal("2960.00").compareTo(payslip.getNetPay()));
    }

    @Test
    void generatePayroll_SkipsInactiveOrNoSalaryEmployees() {
        TenantContext.setRole(Role.ADMIN.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);

        User inactive = User.builder().id(UUID.randomUUID()).companyId(tenantId)
                .email("inactive@acme.com").firstName("In").lastName("Active")
                .role(Role.EMPLOYEE).status(UserStatus.SUSPENDED).baseSalary(new BigDecimal("3000")).build();
        User noSalary = User.builder().id(UUID.randomUUID()).companyId(tenantId)
                .email("nosalary@acme.com").firstName("No").lastName("Salary")
                .role(Role.EMPLOYEE).status(UserStatus.ACTIVE).baseSalary(null).build();

        when(userRepository.findByCompanyId(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(inactive, noSalary)));

        Map<String, Object> result = payrollService.generatePayroll(request);

        assertEquals(0, result.get("created"));
        verify(payslipRepository, never()).save(any());
    }

    @Test
    void generatePayroll_ExistingNotOverwrite_Skips() {
        TenantContext.setRole(Role.ADMIN.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);
        request.setOverwriteExisting(false);

        User employee = activeEmployeeWithSalary(new BigDecimal("5000.00"));
        when(userRepository.findByCompanyId(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(employee)));
        when(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                tenantId, employeeId, 6, 2026)).thenReturn(true);

        Map<String, Object> result = payrollService.generatePayroll(request);

        assertEquals(0, result.get("created"));
        assertEquals(1, result.get("skipped"));
        verify(payslipRepository, never()).save(any());
        verify(payslipRepository, never()).delete(any());
    }

    @Test
    void generatePayroll_ExistingWithOverwrite_DeletesThenRegenerates() {
        TenantContext.setRole(Role.ADMIN.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);
        request.setOverwriteExisting(true);

        User employee = activeEmployeeWithSalary(new BigDecimal("5000.00"));
        Payslip existing = Payslip.builder().id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .payPeriodMonth(6).payPeriodYear(2026).build();

        when(userRepository.findByCompanyId(eq(tenantId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(employee)));
        when(payslipRepository.existsByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                tenantId, employeeId, 6, 2026)).thenReturn(true);
        when(payslipRepository.findByCompanyIdAndEmployeeIdAndPayPeriodMonthAndPayPeriodYear(
                tenantId, employeeId, 6, 2026)).thenReturn(Optional.of(existing));
        when(leaveRequestRepository.findByCompanyIdAndEmployeeId(eq(tenantId), eq(employeeId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = payrollService.generatePayroll(request);

        verify(payslipRepository).delete(existing);
        assertEquals(1, result.get("created"));
    }

    @Test
    void generatePayroll_WrongRole_ThrowsForbidden() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        PayrollGenerateRequest request = new PayrollGenerateRequest();
        request.setMonth(6);
        request.setYear(2026);

        assertThrows(ApiException.class, () -> payrollService.generatePayroll(request));
        verifyNoInteractions(payslipRepository);
    }

    // ── listPayslipsForPeriod ─────────────────────

    @Test
    void listPayslipsForPeriod_AdminOnly() {
        TenantContext.setRole(Role.ADMIN.name());
        Payslip payslip = Payslip.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();
        User employee = activeEmployeeWithSalary(new BigDecimal("5000"));

        when(payslipRepository.findByCompanyIdAndPayPeriodYearAndPayPeriodMonthOrderByEmployeeId(tenantId, 2026, 6))
                .thenReturn(List.of(payslip));
        when(userRepository.findAllById(List.of(employeeId))).thenReturn(List.of(employee));

        List<PayslipResponseDto> result = payrollService.listPayslipsForPeriod(6, 2026);

        assertEquals(1, result.size());
        assertEquals("Emp Loyee", result.get(0).getEmployeeName());
    }

    @Test
    void listPayslipsForPeriod_WrongRole_ThrowsForbidden() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        assertThrows(ApiException.class, () -> payrollService.listPayslipsForPeriod(6, 2026));
    }

    // ── listMyPayslips ─────────────────────────────

    @Test
    void listMyPayslips_ReturnsOwnPayslips() {
        Payslip payslip = Payslip.builder()
                .id(UUID.randomUUID()).companyId(tenantId).employeeId(employeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();
        User employee = activeEmployeeWithSalary(new BigDecimal("5000"));

        when(payslipRepository.findByCompanyIdAndEmployeeIdOrderByPayPeriodYearDescPayPeriodMonthDesc(tenantId, employeeId))
                .thenReturn(List.of(payslip));
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        List<PayslipResponseDto> result = payrollService.listMyPayslips();

        assertEquals(1, result.size());
    }

    // ── getPayslip ──────────────────────────────────

    @Test
    void getPayslip_AdminCanViewAny() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID otherEmployeeId = UUID.randomUUID();
        UUID payslipId = UUID.randomUUID();

        Payslip payslip = Payslip.builder()
                .id(payslipId).companyId(tenantId).employeeId(otherEmployeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();

        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
        when(userRepository.findById(otherEmployeeId)).thenReturn(Optional.empty());

        PayslipResponseDto result = payrollService.getPayslip(payslipId);

        assertNotNull(result);
        assertEquals("Unknown", result.getEmployeeName());
    }

    @Test
    void getPayslip_EmployeeCanViewOwn() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        UUID payslipId = UUID.randomUUID();

        Payslip payslip = Payslip.builder()
                .id(payslipId).companyId(tenantId).employeeId(employeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();

        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(activeEmployeeWithSalary(new BigDecimal("5000"))));

        assertDoesNotThrow(() -> payrollService.getPayslip(payslipId));
    }

    @Test
    void getPayslip_EmployeeCannotViewOthers_ThrowsForbidden() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        UUID otherEmployeeId = UUID.randomUUID();
        UUID payslipId = UUID.randomUUID();

        Payslip payslip = Payslip.builder()
                .id(payslipId).companyId(tenantId).employeeId(otherEmployeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();

        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

        ApiException ex = assertThrows(ApiException.class, () -> payrollService.getPayslip(payslipId));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void getPayslip_WrongCompany_ThrowsNotFound() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID payslipId = UUID.randomUUID();

        Payslip payslip = Payslip.builder()
                .id(payslipId).companyId(UUID.randomUUID()).employeeId(employeeId)
                .payPeriodMonth(6).payPeriodYear(2026)
                .grossSalary(new BigDecimal("5000")).unpaidLeaveDays(0)
                .unpaidLeaveDeduction(BigDecimal.ZERO).taxDeduction(new BigDecimal("500"))
                .totalDeductions(new BigDecimal("500")).netPay(new BigDecimal("4500"))
                .generatedAt(java.time.LocalDateTime.now())
                .build();

        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(payslip));

        assertThrows(ApiException.class, () -> payrollService.getPayslip(payslipId));
    }

    @Test
    void getPayslip_NotFound_ThrowsNotFound() {
        UUID payslipId = UUID.randomUUID();
        when(payslipRepository.findById(payslipId)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> payrollService.getPayslip(payslipId));
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
