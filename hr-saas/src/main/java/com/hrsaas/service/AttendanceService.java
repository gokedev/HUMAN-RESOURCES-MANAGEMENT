package com.hrsaas.service;

import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.enums.AttendanceStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.AttendanceRecordRepository;
import com.hrsaas.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EmployeeService employeeService;

    public AttendanceService(AttendanceRecordRepository attendanceRecordRepository,
                             EmployeeService employeeService) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.employeeService = employeeService;
    }

    @Transactional
    public AttendanceRecord checkIn() {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        LocalDate today = LocalDate.now();
        log.info("Check-in attempt for employee={} on date={}", employeeId, today);

        if (attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, today).isPresent()) {
            throw ApiException.conflict("You have already checked in today");
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .companyId(tenantId)
                .employeeId(employeeId)
                .workDate(today)
                .checkIn(LocalDateTime.now())
                .status(AttendanceStatus.PRESENT)
                .build();

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-in successful: employee={}, time={}", employeeId, saved.getCheckIn());
        return saved;
    }

    @Transactional
    public AttendanceRecord checkOut() {
        UUID employeeId = TenantContext.getUserId();
        LocalDate today = LocalDate.now();
        log.info("Check-out attempt for employee={} on date={}", employeeId, today);

        AttendanceRecord record = attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, today)
                .orElseThrow(() -> ApiException.badRequest("You have not checked in today"));

        if (record.getCheckOut() != null) {
            throw ApiException.conflict("You have already checked out today");
        }

        record.setCheckOut(LocalDateTime.now());
        AttendanceRecord saved = attendanceRecordRepository.save(record);
        log.info("Check-out successful: employee={}, time={}", employeeId, saved.getCheckOut());
        return saved;
    }

    public Page<AttendanceRecord> listOwnAttendance(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        log.debug("Listing attendance for employee={} in company={}", employeeId, tenantId);
        return attendanceRecordRepository.findByCompanyIdAndEmployeeId(tenantId, employeeId, pageable);
    }

    public Page<AttendanceRecord> listCompanyAttendance(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        log.debug("Listing company attendance for company={}", tenantId);
        return attendanceRecordRepository.findByCompanyId(tenantId, pageable);
    }

    // Analytical method for dashboard
    public AttendanceComplianceData getAttendanceCompliance() {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDate endOfWeek = startOfWeek.plusDays(6);

        // Get today's attendance by status
        List<Object[]> todayAttendanceByStatusRaw = attendanceRecordRepository.countByCompanyIdAndWorkDate(
                tenantId, today);
        List<AttendanceStatusStats> todayAttendanceByStatus = new java.util.ArrayList<>();
        for (Object[] row : todayAttendanceByStatusRaw) {
            String status = ((String) row[0]).toLowerCase();
            int count = ((Number) row[1]).intValue();
            String color = getStatusColor(status);
            todayAttendanceByStatus.add(new AttendanceStatusStats(status, count, color));
        }

        // Get week's attendance by status
        List<Object[]> weekAttendanceByStatusRaw = attendanceRecordRepository.countByCompanyIdAndWorkDateBetween(
                tenantId, startOfWeek, endOfWeek);
        List<AttendanceStatusStats> weekAttendanceByStatus = new java.util.ArrayList<>();
        for (Object[] row : weekAttendanceByStatusRaw) {
            String status = ((String) row[0]).toLowerCase();
            int count = ((Number) row[1]).intValue();
            String color = getStatusColor(status);
            weekAttendanceByStatus.add(new AttendanceStatusStats(status, count, color));
        }

        // Get total employees for compliance calculation
        int totalEmployees = employeeService.getActiveVsPendingCounts().getActive().intValue();

        // Calculate expected check-ins (assuming 1 per employee per workday)
        int expectedCheckins = totalEmployees; // For today
        int actualCheckins = 0;
        for (AttendanceStatusStats stat : todayAttendanceByStatus) {
            if ("present".equalsIgnoreCase(stat.getStatus()) ||
                "half_day".equalsIgnoreCase(stat.getStatus()) ||
                "on_leave".equalsIgnoreCase(stat.getStatus())) {
                actualCheckins += stat.getCount();
            }
        }

        double complianceRate = expectedCheckins > 0 ?
                ((double) actualCheckins / expectedCheckins) * 100 : 0.0;

        int todayCheckedIn = 0;
        int todayTotalEmployees = totalEmployees;
        for (AttendanceStatusStats stat : todayAttendanceByStatus) {
            if ("present".equalsIgnoreCase(stat.getStatus())) {
                todayCheckedIn = stat.getCount();
                break;
            }
        }

        return new AttendanceComplianceData(
                todayAttendanceByStatus,
                weekAttendanceByStatus,
                complianceRate,
                expectedCheckins,
                actualCheckins,
                todayCheckedIn,
                todayTotalEmployees
        );
    }

    private String getStatusColor(String status) {
        switch (status.toLowerCase()) {
            case "present": return "bg-emerald-500";
            case "absent": return "bg-red-500";
            case "half_day": return "bg-amber-500";
            case "on_leave": return "bg-blue-500";
            default: return "bg-gray-500";
        }
    }
}
