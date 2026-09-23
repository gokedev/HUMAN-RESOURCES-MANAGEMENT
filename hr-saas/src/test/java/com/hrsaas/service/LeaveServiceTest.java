package com.hrsaas.service;

import com.hrsaas.dto.LeaveBalanceDto;
import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.dto.LeaveStatsData;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.enums.Role;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.LeaveRequestRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MailService mailService;

    @InjectMocks
    private LeaveService leaveService;

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

    // ── createLeaveRequest ──────────────────────

    @Test
    void createLeaveRequest_Success() {
        TenantContext.setRole(Role.EMPLOYEE.name());

        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(5));
        dto.setReason("Vacation");

        LeaveRequest savedRequest = LeaveRequest.builder()
                .id(UUID.randomUUID())
                .companyId(tenantId)
                .employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason("Vacation")
                .status(LeaveStatus.PENDING)
                .build();

        when(leaveRequestRepository.save(any(LeaveRequest.class)))
                .thenReturn(savedRequest);

        LeaveRequest result = leaveService.createLeaveRequest(dto);

        assertNotNull(result);
        assertEquals(LeaveType.ANNUAL, result.getLeaveType());
        assertEquals(LeaveStatus.PENDING, result.getStatus());
    }

    @Test
    void createLeaveRequest_EndDateBeforeStartDate() {
        TenantContext.setRole(Role.EMPLOYEE.name());

        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(5));
        dto.setEndDate(LocalDate.now().plusDays(1));

        assertThrows(ApiException.class, () -> leaveService.createLeaveRequest(dto));
    }

    @Test
    void createLeaveRequest_WrongRole_ThrowsForbidden() {
        TenantContext.setRole(Role.ADMIN.name());

        LeaveRequestCreateDto dto = new LeaveRequestCreateDto();
        dto.setLeaveType(LeaveType.ANNUAL);
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(2));

        ApiException ex = assertThrows(ApiException.class, () -> leaveService.createLeaveRequest(dto));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
        verify(leaveRequestRepository, never()).save(any());
    }

    // ── listing ──────────────────────────────────

    @Test
    void listCompanyLeaveRequests_DelegatesWithTenant() {
        Pageable pageable = PageRequest.of(0, 10);
        leaveService.listCompanyLeaveRequests(pageable);

        verify(leaveRequestRepository).findByCompanyId(tenantId, pageable);
    }

    @Test
    void listOwnLeaveRequests_DelegatesWithTenantAndEmployee() {
        Pageable pageable = PageRequest.of(0, 10);
        leaveService.listOwnLeaveRequests(pageable);

        verify(leaveRequestRepository).findByCompanyIdAndEmployeeId(tenantId, employeeId, pageable);
    }

    // ── reviewLeaveRequest ───────────────────────

    @Test
    void reviewLeaveRequest_Approve_Success() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID leaveRequestId = UUID.randomUUID();

        LeaveRequest pending = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(1))
                .status(LeaveStatus.PENDING)
                .build();

        User employee = User.builder()
                .id(employeeId).companyId(tenantId).email("emp@acme.com")
                .firstName("Emp").lastName("Loyee").role(Role.EMPLOYEE)
                .build();

        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);
        dto.setNote("Approved, enjoy!");

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(pending));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(employeeId)).thenReturn(Optional.of(employee));

        LeaveRequest result = leaveService.reviewLeaveRequest(leaveRequestId, dto);

        assertEquals(LeaveStatus.APPROVED, result.getStatus());
        assertNotNull(result.getReviewedAt());
        verify(mailService).sendLeaveStatusEmail(eq("emp@acme.com"), eq("Emp"), eq("APPROVED"), eq("ANNUAL"));
    }

    @Test
    void reviewLeaveRequest_Reject_Success() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID leaveRequestId = UUID.randomUUID();

        LeaveRequest pending = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(false);

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(pending));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(employeeId)).thenReturn(Optional.empty());

        LeaveRequest result = leaveService.reviewLeaveRequest(leaveRequestId, dto);

        assertEquals(LeaveStatus.REJECTED, result.getStatus());
        verify(mailService, never()).sendLeaveStatusEmail(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void reviewLeaveRequest_AlreadyReviewed_ThrowsBadRequest() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID leaveRequestId = UUID.randomUUID();

        LeaveRequest alreadyApproved = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.APPROVED)
                .build();

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(alreadyApproved));

        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);

        assertThrows(ApiException.class, () -> leaveService.reviewLeaveRequest(leaveRequestId, dto));
    }

    @Test
    void reviewLeaveRequest_NotFound_ThrowsNotFound() {
        TenantContext.setRole(Role.ADMIN.name());
        UUID leaveRequestId = UUID.randomUUID();
        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId)).thenReturn(Optional.empty());

        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);

        assertThrows(ApiException.class, () -> leaveService.reviewLeaveRequest(leaveRequestId, dto));
    }

    @Test
    void reviewLeaveRequest_WrongRole_ThrowsForbidden() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        LeaveReviewDto dto = new LeaveReviewDto();
        dto.setApprove(true);

        assertThrows(ApiException.class, () -> leaveService.reviewLeaveRequest(UUID.randomUUID(), dto));
    }

    // ── cancelLeaveRequest ───────────────────────

    @Test
    void cancelLeaveRequest_OwnPending_Success() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        UUID leaveRequestId = UUID.randomUUID();

        LeaveRequest pending = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.PENDING)
                .build();

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(pending));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        leaveService.cancelLeaveRequest(leaveRequestId);

        assertEquals(LeaveStatus.CANCELLED, pending.getStatus());
    }

    @Test
    void cancelLeaveRequest_NotOwner_ThrowsForbidden() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        UUID leaveRequestId = UUID.randomUUID();
        UUID otherEmployeeId = UUID.randomUUID();

        LeaveRequest pending = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(otherEmployeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.PENDING)
                .build();

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(pending));

        ApiException ex = assertThrows(ApiException.class, () -> leaveService.cancelLeaveRequest(leaveRequestId));
        assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void cancelLeaveRequest_NotPending_ThrowsBadRequest() {
        TenantContext.setRole(Role.EMPLOYEE.name());
        UUID leaveRequestId = UUID.randomUUID();

        LeaveRequest approved = LeaveRequest.builder()
                .id(leaveRequestId).companyId(tenantId).employeeId(employeeId)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .status(LeaveStatus.APPROVED)
                .build();

        when(leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId))
                .thenReturn(Optional.of(approved));

        assertThrows(ApiException.class, () -> leaveService.cancelLeaveRequest(leaveRequestId));
    }

    // ── leave balance ─────────────────────────────

    @Test
    void getLeaveBalance_CalculatesRemainingCorrectly() {
        when(leaveRequestRepository.sumApprovedDaysByEmployeeAndType(
                eq(tenantId), eq(employeeId), eq("ANNUAL"), any(), any())).thenReturn(5L);
        when(leaveRequestRepository.sumPendingDaysByEmployeeAndType(
                eq(tenantId), eq(employeeId), eq("ANNUAL"), any(), any())).thenReturn(3L);

        LeaveBalanceDto result = leaveService.getLeaveBalance(employeeId, LeaveType.ANNUAL);

        assertEquals(20, result.getEntitlement());
        assertEquals(5, result.getUsed());
        assertEquals(3, result.getPending());
        assertEquals(12, result.getRemaining());
    }

    @Test
    void getLeaveBalance_NullSums_TreatedAsZero() {
        when(leaveRequestRepository.sumApprovedDaysByEmployeeAndType(
                eq(tenantId), eq(employeeId), eq("SICK"), any(), any())).thenReturn(null);
        when(leaveRequestRepository.sumPendingDaysByEmployeeAndType(
                eq(tenantId), eq(employeeId), eq("SICK"), any(), any())).thenReturn(null);

        LeaveBalanceDto result = leaveService.getLeaveBalance(employeeId, LeaveType.SICK);

        assertEquals(10, result.getEntitlement());
        assertEquals(0, result.getUsed());
        assertEquals(0, result.getPending());
        assertEquals(10, result.getRemaining());
    }

    @Test
    void getAllLeaveBalances_ReturnsOneEntryPerLeaveType() {
        when(leaveRequestRepository.sumApprovedDaysByEmployeeAndType(any(), any(), anyString(), any(), any()))
                .thenReturn(0L);
        when(leaveRequestRepository.sumPendingDaysByEmployeeAndType(any(), any(), anyString(), any(), any()))
                .thenReturn(0L);

        List<LeaveBalanceDto> balances = leaveService.getAllLeaveBalances(employeeId);

        assertEquals(LeaveType.values().length, balances.size());
    }

    // ── analytics ─────────────────────────────────

    @Test
    void getLeaveStats_AggregatesAllCounts() {
        when(leaveRequestRepository.countByCompanyIdAndLeaveType(tenantId))
                .thenReturn(Collections.singletonList(new Object[]{"ANNUAL", 4L}));
        when(leaveRequestRepository.countByCompanyIdAndStatusGrouped(tenantId))
                .thenReturn(Collections.singletonList(new Object[]{"PENDING", 2L}));
        when(leaveRequestRepository.countByCompanyIdAndMonthRange(eq(tenantId), any(), any()))
                .thenReturn(Collections.singletonList(new Object[]{"2026-09", 3L}));
        when(leaveRequestRepository.countByCompanyIdAndStatusName(tenantId, "PENDING"))
                .thenReturn(2L);
        when(leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(eq(tenantId), eq("APPROVED"), any(), any()))
                .thenReturn(Collections.singletonList(new Object[]{"APPROVED", 5L}));
        when(leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(eq(tenantId), eq("REJECTED"), any(), any()))
        .thenReturn(Collections.emptyList());

        LeaveStatsData result = leaveService.getLeaveStats();

        assertEquals(2, result.getTotalPendingRequests());
        assertEquals(5, result.getTotalApprovedThisMonth());
        assertEquals(0, result.getTotalRejectedThisMonth());
        assertEquals(1, result.getLeaveByType().size());
        assertEquals(1, result.getLeaveByStatus().size());
    }

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
