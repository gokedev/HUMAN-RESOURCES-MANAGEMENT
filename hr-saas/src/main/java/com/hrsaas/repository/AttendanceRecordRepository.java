package com.hrsaas.repository;

import com.hrsaas.entity.AttendanceRecord;
import org.springframework.data.domain Page;
import org.springframework.data.domain Pageable;
import org.springframework.data.jpa.repository JpaRepository;
import org.springframework.data.jpa.repository Query;
import org.springframework.data.repository.query Param;

import java.time LocalDate;
import java.util List;
import java.util Optional;
import java.util UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {
    Page<AttendanceRecord> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId, Pageable pageable);
    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);
    Page<AttendanceRecord> findByCompanyId(UUID companyId, Pageable pageable);

    // Analytical query methods
    @Query("SELECT LOWER(ar.status), COUNT(ar) FROM AttendanceRecord ar WHERE ar.companyId = :companyId AND ar.workDate = :workDate GROUP BY LOWER(ar.status)")
    List<Object[]> countByCompanyIdAndWorkDate(@Param("companyId") UUID companyId,
                                               @Param("workDate") LocalDate workDate);

    @Query("SELECT LOWER(ar.status), COUNT(ar) FROM AttendanceRecord ar WHERE ar.companyId = :companyId AND ar.workDate >= :startDate AND ar.workDate <= :endDate GROUP BY LOWER(ar.status)")
    List<Object[]> countByCompanyIdAndWorkDateBetween(@Param("companyId") UUID companyId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);
}