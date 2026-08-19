package com.hrsaas.service;

import com.hrsaas.dto.LeaveBalanceDto;
import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.dto.LeaveStatsData;
import com.hrsaas.dto.LeaveTypeStats;
import com.hrsaas.dto.LeaveStatusStats;
import com.hrsaas.dto.LeaveRequestResponseDto;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.enums.LeaveType;
import com.hrsaas.enums.Role;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.LeaveRequestRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.security.RoleGuard;
import com.hrsaas.tenant.TenantContext;
import org.slf4j.Logger;

import java.time.LocalDate;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Leave request lifecycle: submit, review (approve/reject), cancel.
 * Also calculates leave balances and provides analytics for the dashboard.
 */
@Service
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    public LeaveService(
            LeaveRequestRepository leaveRequestRepository,
            UserRepository userRepository,
            MailService mailService
    ) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    // ── Create leave request ──────────────────────

    /** Employee submits a new leave request (status starts as PENDING). */
    @Transactional
    public LeaveRequest createLeaveRequest(LeaveRequestCreateDto dto) {
        RoleGuard.requireRole(Role.EMPLOYEE);
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        log.info("Creating leave request: employee={}, company={}", employeeId, tenantId);

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw ApiException.badRequest("End date cannot be before start date");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .companyId(tenantId)
                .employeeId(employeeId)
                .leaveType(dto.getLeaveType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request created: id={}, type={}, dates={}-{}", saved.getId(), saved.getLeaveType(), saved.getStartDate(), saved.getEndDate());
        return saved;
    }

    // ── List leave requests ───────────────────────

    /** Lists all leave requests in the company (admin, unfiltered). */
    public Page<LeaveRequest> listCompanyLeaveRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return leaveRequestRepository.findByCompanyId(tenantId, pageable);
    }

    /**
     * Lists leave requests with optional filters (status, employeeId).
     * Batch-fetches employee names to avoid N+1 queries.
     */
    public Page<LeaveRequestResponseDto> listCompanyLeaveRequestsWithFilters(
            String status, UUID employeeId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<LeaveRequest> page = leaveRequestRepository.findByCompanyIdWithFilters(
                tenantId, status, employeeId, pageable);

        // Batch-fetch employee names in one query
        List<UUID> employeeIds = page.getContent().stream()
                .map(LeaveRequest::getEmployeeId)
                .distinct()
                .toList();
        Map<UUID, User> employeeMap = userRepository.findAllById(employeeIds).stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, u -> u));

        return page.map(lr -> LeaveRequestResponseDto.fromEntityWithEmployee(lr, employeeMap.get(lr.getEmployeeId())));
    }

    /** Lists only the current employee's own leave requests. */
    public Page<LeaveRequest> listOwnLeaveRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        return leaveRequestRepository.findByCompanyIdAndEmployeeId(tenantId, employeeId, pageable);
    }

    // ── Review leave request (admin) ──────────────

    /** Admin approves or rejects a PENDING leave request. Sends email notification to employee. */
    @Transactional
    public LeaveRequest reviewLeaveRequest(UUID leaveRequestId, LeaveReviewDto dto) {
        RoleGuard.requireRole(Role.ADMIN);
        UUID tenantId = TenantContext.getTenantId();
        UUID reviewerId = TenantContext.getUserId();
        log.info("Reviewing leave request={} by user={}", leaveRequestId, reviewerId);

        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Leave request not found"));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw ApiException.badRequest("This leave request has already been reviewed");
        }

        leaveRequest.setStatus(dto.isApprove() ? LeaveStatus.APPROVED : LeaveStatus.REJECTED);
        leaveRequest.setReviewedBy(reviewerId);
        leaveRequest.setReviewedAt(LocalDateTime.now());
        leaveRequest.setReviewNote(dto.getNote());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request={} reviewed: status={}", leaveRequestId, saved.getStatus());

        // Notify the employee via email (async)
        User employee = userRepository.findById(leaveRequest.getEmployeeId()).orElse(null);
        if (employee != null) {
            mailService.sendLeaveStatusEmail(
                    employee.getEmail(),
                    employee.getFirstName(),
                    saved.getStatus().name(),
                    saved.getLeaveType().name()
            );
        }

        return saved;
    }

    // ── Cancel leave request (employee) ───────────

    /** Employee cancels their own PENDING leave request. */
    @Transactional
    public void cancelLeaveRequest(UUID leaveRequestId) {
        RoleGuard.requireRole(Role.EMPLOYEE);
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        log.info("Cancelling leave request={} by employee={}", leaveRequestId, employeeId);

        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Leave request not found"));

        if (!leaveRequest.getEmployeeId().equals(employeeId)) {
            throw ApiException.forbidden("You can only cancel your own leave requests");
        }

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw ApiException.badRequest("Only pending leave requests can be cancelled");
        }

        leaveRequest.setStatus(LeaveStatus.CANCELLED);
        leaveRequestRepository.save(leaveRequest);
        log.info("Leave request={} cancelled", leaveRequestId);
    }

    // ── Leave balance ─────────────────────────────

    /**
     * Calculates leave balance for a specific type.
     * Uses default entitlements (ANNUAL=20, SICK=10, MATERNITY=90, PATERNITY=14).
     * Remaining = entitlement - approved days - pending days.
     */
    public LeaveBalanceDto getLeaveBalance(UUID employeeId, LeaveType leaveType) {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate yearStart = LocalDate.now().withDayOfYear(1);
        LocalDate yearEnd = LocalDate.now().withDayOfYear(LocalDate.now().lengthOfYear());

        int entitlement = getDefaultEntitlement(leaveType);
        Long approvedDays = leaveRequestRepository.sumApprovedDaysByEmployeeAndType(
                tenantId, employeeId, leaveType.name(), yearStart, yearEnd);
        Long pendingDays = leaveRequestRepository.sumPendingDaysByEmployeeAndType(
                tenantId, employeeId, leaveType.name(), yearStart, yearEnd);

        int used = approvedDays != null ? approvedDays.intValue() : 0;
        int pending = pendingDays != null ? pendingDays.intValue() : 0;
        int remaining = entitlement - used - pending;

        return LeaveBalanceDto.builder()
                .leaveType(leaveType)
                .entitlement(entitlement)
                .used(used)
                .pending(pending)
                .remaining(remaining)
                .build();
    }

    /** Returns leave balances for all leave types. */
    public List<LeaveBalanceDto> getAllLeaveBalances(UUID employeeId) {
        List<LeaveBalanceDto> balances = new java.util.ArrayList<>();
        for (LeaveType type : LeaveType.values()) {
            balances.add(getLeaveBalance(employeeId, type));
        }
        return balances;
    }

    /** Default annual entitlements per leave type (in calendar days). */
    private int getDefaultEntitlement(LeaveType leaveType) {
        return switch (leaveType) {
            case ANNUAL -> 20;
            case SICK -> 10;
            case UNPAID -> 0;
            case MATERNITY -> 90;
            case PATERNITY -> 14;
            case OTHER -> 0;
        };
    }

    // ── Analytics (admin dashboard) ───────────────

    /** Aggregates leave stats: by type, by status, monthly trends, pending/approved/rejected counts. */
    public LeaveStatsData getLeaveStats() {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);

        // Leave by type
        List<Object[]> leaveByTypeRaw = leaveRequestRepository.countByCompanyIdAndLeaveType(tenantId);
        List<LeaveTypeStats> leaveByType = new java.util.ArrayList<>();
        for (Object[] row : leaveByTypeRaw) {
            leaveByType.add(new LeaveTypeStats(((String) row[0]).toLowerCase(), ((Number) row[1]).intValue()));
        }

        // Leave by status
        List<Object[]> leaveByStatusRaw = leaveRequestRepository.countByCompanyIdAndStatusGrouped(tenantId);
        List<LeaveStatusStats> leaveByStatus = new java.util.ArrayList<>();
        for (Object[] row : leaveByStatusRaw) {
            leaveByStatus.add(new LeaveStatusStats(((String) row[0]).toLowerCase(), ((Number) row[1]).intValue()));
        }

        // Monthly trends (current month only for MVP)
        List<Object[]> monthlyRaw = leaveRequestRepository.countByCompanyIdAndMonthRange(tenantId, startOfMonth, now);
        java.util.Map<String, Integer> monthlyLeaveTrends = new java.util.HashMap<>();
        for (Object[] row : monthlyRaw) {
            monthlyLeaveTrends.put((String) row[0], ((Number) row[1]).intValue());
        }

        // Pending count (company-wide)
        Long pendingCount = leaveRequestRepository.countByCompanyIdAndStatusName(tenantId, "PENDING");
        int totalPendingRequests = pendingCount != null ? pendingCount.intValue() : 0;

        // Approved this month
        List<Object[]> approvedRaw = leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(tenantId, "APPROVED", startOfMonth, now);
        int totalApprovedThisMonth = approvedRaw.isEmpty() ? 0 : ((Number) approvedRaw.get(0)[1]).intValue();

        // Rejected this month
        List<Object[]> rejectedRaw = leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(tenantId, "REJECTED", startOfMonth, now);
        int totalRejectedThisMonth = rejectedRaw.isEmpty() ? 0 : ((Number) rejectedRaw.get(0)[1]).intValue();

        return new LeaveStatsData(leaveByType, leaveByStatus, monthlyLeaveTrends,
                totalPendingRequests, totalApprovedThisMonth, totalRejectedThisMonth);
    }
}
