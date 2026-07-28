package com.hrsaas.repository;

import com.hrsaas.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    Page<LeaveRequest> findByCompanyId(UUID companyId, Pageable pageable);
    Page<LeaveRequest> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId, Pageable pageable);
    Optional<LeaveRequest> findByIdAndCompanyId(UUID id, UUID companyId);
}
