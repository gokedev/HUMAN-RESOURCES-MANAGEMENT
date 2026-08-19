package com.hrsaas.repository;

import com.hrsaas.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    Page<LeaveRequest> findByCompanyId(UUID companyId, Pageable pageable);
    Page<LeaveRequest> findByCompanyIdAndEmployeeId(UUID companyId, UUID employeeId, Pageable pageable);
    Optional<LeaveRequest> findByIdAndCompanyId(UUID id, UUID companyId);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.companyId = :companyId "
            + "AND (:status IS NULL OR lr.status = :status) "
            + "AND (:employeeId IS NULL OR lr.employeeId = :employeeId) "
            + "ORDER BY lr.createdAt DESC")
    Page<LeaveRequest> findByCompanyIdWithFilters(
            @Param("companyId") UUID companyId,
            @Param("status") String status,
            @Param("employeeId") UUID employeeId,
            Pageable pageable);

    // Analytical query methods
    @Query("SELECT LOWER(lr.leaveType), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId GROUP BY LOWER(lr.leaveType)")
    List<Object[]> countByCompanyIdAndLeaveType(@Param("companyId") UUID companyId);

    @Query("SELECT LOWER(lr.status), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId GROUP BY LOWER(lr.status)")
    List<Object[]> countByCompanyIdAndStatusGrouped(@Param("companyId") UUID companyId);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId AND LOWER(lr.status) = :status")
    Long countByCompanyIdAndStatusName(@Param("companyId") UUID companyId, @Param("status") String status);

    @Query("SELECT CONCAT(CAST(YEAR(lr.startDate) AS string), '-', CASE WHEN MONTH(lr.startDate) < 10 THEN CONCAT('0', CAST(MONTH(lr.startDate) AS string)) ELSE CAST(MONTH(lr.startDate) AS string) END) as lrmonth, COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId AND lr.startDate >= :startDate AND lr.startDate <= :endDate GROUP BY YEAR(lr.startDate), MONTH(lr.startDate)")
    List<Object[]> countByCompanyIdAndMonthRange(@Param("companyId") UUID companyId,
                                                 @Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate);

    @Query("SELECT LOWER(lr.status), COUNT(lr) FROM LeaveRequest lr WHERE lr.companyId = :companyId AND LOWER(lr.status) = :status AND lr.startDate >= :startDate AND lr.startDate <= :endDate")
    List<Object[]> countByCompanyIdAndStatusAndDateRange(@Param("companyId") UUID companyId,
                                                         @Param("status") String status,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(lr.endDate - lr.startDate + 1), 0) FROM LeaveRequest lr " +
            "WHERE lr.companyId = :companyId AND lr.employeeId = :employeeId " +
            "AND lr.leaveType = :leaveType AND lr.status = 'APPROVED' " +
            "AND lr.startDate >= :yearStart AND lr.startDate <= :yearEnd")
    Long sumApprovedDaysByEmployeeAndType(@Param("companyId") UUID companyId,
                                          @Param("employeeId") UUID employeeId,
                                          @Param("leaveType") String leaveType,
                                          @Param("yearStart") LocalDate yearStart,
                                          @Param("yearEnd") LocalDate yearEnd);

    @Query("SELECT COALESCE(SUM(lr.endDate - lr.startDate + 1), 0) FROM LeaveRequest lr " +
            "WHERE lr.companyId = :companyId AND lr.employeeId = :employeeId " +
            "AND lr.leaveType = :leaveType AND lr.status = 'PENDING' " +
            "AND lr.startDate >= :yearStart AND lr.startDate <= :yearEnd")
    Long sumPendingDaysByEmployeeAndType(@Param("companyId") UUID companyId,
                                         @Param("employeeId") UUID employeeId,
                                         @Param("leaveType") String leaveType,
                                         @Param("yearStart") LocalDate yearStart,
                                         @Param("yearEnd") LocalDate yearEnd);
}