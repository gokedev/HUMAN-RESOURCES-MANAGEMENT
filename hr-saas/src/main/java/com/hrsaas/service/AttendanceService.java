package com.hrsaas.service;

import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.enums.AttendanceStatus;
import com.hrsaas.exception.ApiException;
import com.hrsaas.repository.AttendanceRecordRepository;
import com.hrsaas.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRecordRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Transactional
    public AttendanceRecord checkIn() {
        UUID tenantId = TenantContext.getTenantId();
        UUID employeeId = TenantContext.getUserId();
        LocalDate today = LocalDate.now();

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

        return attendanceRecordRepository.save(record);
    }

    @Transactional
    public AttendanceRecord checkOut() {
        UUID employeeId = TenantContext.getUserId();
        LocalDate today = LocalDate.now();

        AttendanceRecord record = attendanceRecordRepository.findByEmployeeIdAndWorkDate(employeeId, today)
                .orElseThrow(() -> ApiException.badRequest("You have not checked in today"));

        if (record.getCheckOut() != null) {
            throw ApiException.conflict("You have already checked out today");
        }

        record.setCheckOut(LocalDateTime.now());
        return attendanceRecordRepository.save(record);
    }

    public Page<AttendanceRecord> listOwnAttendance(Pageable pageable) {
        return attendanceRecordRepository.findByCompanyIdAndEmployeeId(
                TenantContext.getTenantId(), TenantContext.getUserId(), pageable
        );
    }

    public Page<AttendanceRecord> listCompanyAttendance(Pageable pageable) {
        return attendanceRecordRepository.findByCompanyId(TenantContext.getTenantId(), pageable);
    }
}
