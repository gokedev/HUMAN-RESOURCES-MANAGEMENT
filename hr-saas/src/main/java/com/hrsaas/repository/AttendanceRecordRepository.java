package com.hrsaas.repository;

import com.hrsaas.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {
    Page<AttendanceRecord> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId, Pageable pageable);
    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);
    Page<AttendanceRecord> findByCompanyId(UUID companyId, Pageable pageable);
}
