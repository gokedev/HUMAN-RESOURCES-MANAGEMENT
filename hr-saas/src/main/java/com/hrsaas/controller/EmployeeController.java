package com.hrsaas.controller;

import com.hrsaas.dto.AttendanceRecordResponseDto;
import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.dto.LeaveRequestResponseDto;
import com.hrsaas.dto.UserResponseDto;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import com.hrsaas.tenant.TenantContext;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    private static final Logger log = LoggerFactory.getLogger(EmployeeController.class);

    private final EmployeeService employeeService;
    private final LeaveService leaveService;
    private final AttendanceService attendanceService;

    public EmployeeController(
            EmployeeService employeeService,
            LeaveService leaveService,
            AttendanceService attendanceService
    ) {
        this.employeeService = employeeService;
        this.leaveService = leaveService;
        this.attendanceService = attendanceService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getProfile() {
        UUID userId = TenantContext.getUserId();
        log.debug("GET /api/employee/me - Fetching profile for userId={}", userId);
        return ResponseEntity.ok(UserResponseDto.fromEntity(employeeService.getEmployee(userId)));
    }

    @PostMapping("/leave-requests")
    public ResponseEntity<LeaveRequestResponseDto> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateDto dto) {
        UUID userId = TenantContext.getUserId();
        log.info("POST /api/employee/leave-requests - Creating leave request for userId={}", userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(LeaveRequestResponseDto.fromEntity(leaveService.createLeaveRequest(dto)));
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<Page<LeaveRequestResponseDto>> listOwnLeaveRequests(Pageable pageable) {
        UUID userId = TenantContext.getUserId();
        log.debug("GET /api/employee/leave-requests - Listing leave requests for userId={}", userId);
        return ResponseEntity.ok(leaveService.listOwnLeaveRequests(pageable).map(LeaveRequestResponseDto::fromEntity));
    }

    @PatchMapping("/leave-requests/{id}/cancel")
    public ResponseEntity<Void> cancelLeaveRequest(@PathVariable UUID id) {
        UUID userId = TenantContext.getUserId();
        log.info("PATCH /api/employee/leave-requests/{}/cancel - Cancelling leave request for userId={}", id, userId);
        leaveService.cancelLeaveRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<AttendanceRecordResponseDto> checkIn() {
        UUID userId = TenantContext.getUserId();
        log.info("POST /api/employee/attendance/check-in - Check-in for userId={}", userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(AttendanceRecordResponseDto.fromEntity(attendanceService.checkIn()));
    }

    @PostMapping("/attendance/check-out")
    public ResponseEntity<AttendanceRecordResponseDto> checkOut() {
        UUID userId = TenantContext.getUserId();
        log.info("POST /api/employee/attendance/check-out - Check-out for userId={}", userId);
        return ResponseEntity.ok(AttendanceRecordResponseDto.fromEntity(attendanceService.checkOut()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<Page<AttendanceRecordResponseDto>> listOwnAttendance(Pageable pageable) {
        UUID userId = TenantContext.getUserId();
        log.debug("GET /api/employee/attendance - Listing attendance for userId={}", userId);
        return ResponseEntity.ok(attendanceService.listOwnAttendance(pageable).map(AttendanceRecordResponseDto::fromEntity));
    }
}
