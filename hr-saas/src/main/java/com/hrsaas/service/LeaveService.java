package com.hrsaas.service;

import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.enums.LeaveStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.LeaveRequestRepository;
import com.hrsaas.repository.UserRepository;
import com.hrsaas.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class LeaveService {

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
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();

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

        return leaveRequestRepository.save(leaveRequest);
    }

    public Page<LeaveRequest> listCompanyLeaveRequests(Pageable pageable) {
        return leaveRequestRepository.findByCompanyId(TenantContext.getTenantId(), pageable);
    }

    public Page<LeaveRequest> listOwnLeaveRequests(Pageable pageable) {
        return leaveRequestRepository.findByCompanyIdAndEmployeeId(
                TenantContext.getTenantId(), TenantContext.getUserId(), pageable
        );
    }

    @Transactional
    public LeaveRequest reviewLeaveRequest(UUID leaveRequestId, LeaveReviewDto dto) {
        UUID tenantId = TenantContext.getTenantId();

        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndCompanyId(leaveRequestId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Leave request not found"));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw ApiException.badRequest("This leave request has already been reviewed");
        }

        leaveRequest.setStatus(dto.isApprove() ? LeaveStatus.APPROVED : LeaveStatus.REJECTED);
        leaveRequest.setReviewedBy(TenantContext.getUserId());
        leaveRequest.setReviewedAt(LocalDateTime.now());
        leaveRequest.setReviewNote(dto.getNote());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

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
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();

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
    }
}
