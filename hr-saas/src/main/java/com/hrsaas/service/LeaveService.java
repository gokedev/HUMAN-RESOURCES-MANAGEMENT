package com.hrsaas.service;

import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.dto.LeaveStatsData;
import com.hrsaas.dto.LeaveTypeStats;
import com.hrsaas.dto.LeaveStatusStats;
import com.hrsaas.dto.LeaveRequestResponseDto;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
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

    @Transactional
    public LeaveRequest createLeaveRequest(LeaveRequestCreateDto dto) {
        RoleGuard.requireRole(Role.EMPLOYEE);
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        log.info("Creating leave request for employee={} in company={}", employeeId, tenantId);

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

    public Page<LeaveRequest> listCompanyLeaveRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing company leave requests for company={}", tenantId);
        return leaveRequestRepository.findByCompanyId(tenantId, pageable);
    }

    public Page<LeaveRequestResponseDto> listCompanyLeaveRequestsWithFilters(
            String status, UUID employeeId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing filtered leave requests for company={}", tenantId);
        Page<LeaveRequest> page = leaveRequestRepository.findByCompanyIdWithFilters(
                tenantId, status, employeeId, pageable);

        // Batch-fetch employee names
        List<UUID> employeeIds = page.getContent().stream()
                .map(LeaveRequest::getEmployeeId)
                .distinct()
                .toList();
        Map<UUID, User> employeeMap = userRepository.findAllById(employeeIds).stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, u -> u));

        return page.map(lr -> LeaveRequestResponseDto.fromEntityWithEmployee(lr, employeeMap.get(lr.getEmployeeId())));
    }

    public Page<LeaveRequest> listOwnLeaveRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        log.debug("Listing leave requests for employee={} in company={}", employeeId, tenantId);
        return leaveRequestRepository.findByCompanyIdAndEmployeeId(tenantId, employeeId, pageable);
    }

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

    // Analytical method for dashboard
    public LeaveStatsData getLeaveStats() {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);

        // Get leave requests by type
        List<Object[]> leaveByTypeRaw = leaveRequestRepository.countByCompanyIdAndLeaveType(tenantId);
        List<LeaveTypeStats> leaveByType = new java.util.ArrayList<>();
        for (Object[] row : leaveByTypeRaw) {
            String leaveType = ((String) row[0]).toLowerCase();
            int count = ((Number) row[1]).intValue();
            leaveByType.add(new LeaveTypeStats(leaveType, count));
        }

        // Get leave requests by status
        List<Object[]> leaveByStatusRaw = leaveRequestRepository.countByCompanyIdAndStatusGrouped(tenantId);
        List<LeaveStatusStats> leaveByStatus = new java.util.ArrayList<>();
        for (Object[] row : leaveByStatusRaw) {
            String status = ((String) row[0]).toLowerCase();
            int count = ((Number) row[1]).intValue();
            leaveByStatus.add(new LeaveStatusStats(status, count));
        }

        // Get monthly leave trends (last 6 months)
        List<Object[]> monthlyLeaveTrendsRaw = leaveRequestRepository.countByCompanyIdAndMonthRange(
                tenantId, startOfMonth, now);
        java.util.Map<String, Integer> monthlyLeaveTrends = new java.util.HashMap<>();
        for (Object[] row : monthlyLeaveTrendsRaw) {
            String month = ((String) row[0]); // Format: yyyy-MM
            int count = ((Number) row[1]).intValue();
            monthlyLeaveTrends.put(month, count);
        }

        // Get counts for pending requests
        Long pendingCount = leaveRequestRepository.countByCompanyIdAndStatusName(tenantId, "PENDING");
        int totalPendingRequests = pendingCount != null ? pendingCount.intValue() : 0;

        // Get counts for approved this month
        List<Object[]> approvedThisMonthRaw = leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(
                tenantId, "APPROVED", startOfMonth, now);
        int totalApprovedThisMonth = approvedThisMonthRaw.isEmpty() ? 0 : ((Number) approvedThisMonthRaw.get(0)[1]).intValue();

        // Get counts for rejected this month
        List<Object[]> rejectedThisMonthRaw = leaveRequestRepository.countByCompanyIdAndStatusAndDateRange(
                tenantId, "REJECTED", startOfMonth, now);
        int totalRejectedThisMonth = rejectedThisMonthRaw.isEmpty() ? 0 : ((Number) rejectedThisMonthRaw.get(0)[1]).intValue();

        return new LeaveStatsData(
                leaveByType,
                leaveByStatus,
                monthlyLeaveTrends,
                totalPendingRequests,
                totalApprovedThisMonth,
                totalRejectedThisMonth
        );
    }
}
