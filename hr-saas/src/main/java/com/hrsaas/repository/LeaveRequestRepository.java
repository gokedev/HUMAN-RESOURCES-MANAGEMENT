package com.hrsaas.repository;

import com.hrsaas.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    Page<LeaveRequest> findByCompanyId(UUID companyId, Pageable pageable);
    Page<LeaveRequest> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId, Pageable pageable);
    Optional<LeaveRequest> findByIdAndCompanyId(UUID id, UUID companyId);

    // Analytical query methods
    @Query("SELECT LOWER(lr.leaveType), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId GROUP BY LOWER(lr.leaveType)")
    List<Object[]> countByCompanyIdAndLeaveType(@Param("companyId") UUID companyId);

    @Query("SELECT LOWER(lr.status), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId GROUP BY LOWER(lr.status)")
    List<Object[]> countByCompanyIdAndStatusGrouped(@Param("companyId") UUID companyId);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId AND LOWER(lr.status) = :status")
    Long countByCompanyIdAndStatusName(@Param("companyId") UUID companyId, @Param("status") String status);

    @Query("SELECT lrmonth, COUNT(lr) FROM (" +
           "SELECT CONCAT(YEAR(lr.startDate), '-', LPAD(CAST(MONTH(lr.startDate) AS CHAR), 2, '0')) as lrmonth, lr.id " +
           "FROM LeaveRequest lr WHERE lr.companyId = :companyId AND lr.startDate >= :startDate AND lr.startDate <= :endDate" +
           ") AS monthly GROUP BY lrmonth")
    List<Object[]> countByCompanyIdAndMonthRange(@Param("companyId") UUID companyId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    @Query("SELECT LOWER(lr.status), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId AND LOWER(lr.status) = :status AND lr.startDate >= :startDate AND lr.startDate <= :endDate")
    List<Object[]> countByCompanyIdAndStatusAndDateRange(@Param("companyId") UUID companyId,
                                                         @Param("status") String status,
                                                         @Param("startDate") LocalDateTime startDate,
                                                         @Param("endDate") LocalDateTime endDate);

}