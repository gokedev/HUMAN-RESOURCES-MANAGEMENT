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

    public AttendanceService(AttendanceRecordRepository attendanceRecordRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
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
}
