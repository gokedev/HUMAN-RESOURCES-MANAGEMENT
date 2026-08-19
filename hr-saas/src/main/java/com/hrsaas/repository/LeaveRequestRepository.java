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

    // Analytical query methods — using native queries for PostgreSQL compatibility
    @Query(value = "SELECT lr.leave_type, COUNT(*) FROM leave_requests lr WHERE lr.company_id = :companyId GROUP BY lr.leave_type",
            nativeQuery = true)
    List<Object[]> countByCompanyIdAndLeaveType(@Param("companyId") UUID companyId);

    @Query(value = "SELECT lr.status, COUNT(*) FROM leave_requests lr WHERE lr.company_id = :companyId GROUP BY lr.status",
            nativeQuery = true)
    List<Object[]> countByCompanyIdAndStatusGrouped(@Param("companyId") UUID companyId);

    @Query(value = "SELECT TO_CHAR(lr.start_date, 'YYYY-MM') as lrmonth, COUNT(*) FROM leave_requests lr WHERE lr.company_id = :companyId AND lr.start_date >= :startDate AND lr.start_date <= :endDate GROUP BY TO_CHAR(lr.start_date, 'YYYY-MM') ORDER BY lrmonth",
            nativeQuery = true)
    List<Object[]> countByCompanyIdAndMonthRange(@Param("companyId") UUID companyId,
                                                 @Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate);

    @Query(value = "SELECT COUNT(*) FROM leave_requests lr WHERE lr.company_id = :companyId AND lr.status = :status",
            nativeQuery = true)
    Long countByCompanyIdAndStatusName(@Param("companyId") UUID companyId, @Param("status") String status);

    @Query(value = "SELECT COALESCE(lr.status, 'UNKNOWN') as status_val, COUNT(*) FROM leave_requests lr WHERE lr.company_id = :companyId AND lr.status = :status AND lr.start_date >= :startDate AND lr.start_date <= :endDate GROUP BY lr.status",
            nativeQuery = true)
    List<Object[]> countByCompanyIdAndStatusAndDateRange(@Param("companyId") UUID companyId,
                                                         @Param("status") String status,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);

    // Leave balance counts CALENDAR days (standard HR practice: "20 days of annual leave"
    // means 20 calendar days off). Payroll deductions count WEEKDAYS only (you only lose
    // salary for working days missed). This difference is intentional, not a bug.
    @Query(value = "SELECT COALESCE(SUM(lr.end_date - lr.start_date + 1), 0) FROM leave_requests lr " +
            "WHERE lr.company_id = :companyId AND lr.employee_id = :employeeId " +
            "AND lr.leave_type = :leaveType AND lr.status = 'APPROVED' " +
            "AND lr.start_date >= :yearStart AND lr.start_date <= :yearEnd",
            nativeQuery = true)
    Long sumApprovedDaysByEmployeeAndType(@Param("companyId") UUID companyId,
                                          @Param("employeeId") UUID employeeId,
                                          @Param("leaveType") String leaveType,
                                          @Param("yearStart") LocalDate yearStart,
                                          @Param("yearEnd") LocalDate yearEnd);

    @Query(value = "SELECT COALESCE(SUM(lr.end_date - lr.start_date + 1), 0) FROM leave_requests lr " +
            "WHERE lr.company_id = :companyId AND lr.employee_id = :employeeId " +
            "AND lr.leave_type = :leaveType AND lr.status = 'PENDING' " +
            "AND lr.start_date >= :yearStart AND lr.start_date <= :yearEnd",
            nativeQuery = true)
    Long sumPendingDaysByEmployeeAndType(@Param("companyId") UUID companyId,
                                         @Param("employeeId") UUID employeeId,
                                         @Param("leaveType") String leaveType,
                                         @Param("yearStart") LocalDate yearStart,
                                         @Param("yearEnd") LocalDate yearEnd);
}