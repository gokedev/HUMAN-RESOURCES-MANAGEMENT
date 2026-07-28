package com.hrsaas.controller;

import com.hrsaas.dto.LeaveRequestCreateDto;
import com.hrsaas.entity.AttendanceRecord;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import com.hrsaas.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

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
    public ResponseEntity<User> getProfile() {
        UUID userId = TenantContext.getUserId();
        return ResponseEntity.ok(employeeService.getEmployee(userId));
    }

    @PostMapping("/leave-requests")
    public ResponseEntity<LeaveRequest> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.createLeaveRequest(dto));
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<Page<LeaveRequest>> listOwnLeaveRequests(Pageable pageable) {
        return ResponseEntity.ok(leaveService.listOwnLeaveRequests(pageable));
    }

    @PatchMapping("/leave-requests/{id}/cancel")
    public ResponseEntity<Void> cancelLeaveRequest(@PathVariable UUID id) {
        leaveService.cancelLeaveRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/attendance/check-in")
    public ResponseEntity<AttendanceRecord> checkIn() {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.checkIn());
    }

    @PostMapping("/attendance/check-out")
    public ResponseEntity<AttendanceRecord> checkOut() {
        return ResponseEntity.ok(attendanceService.checkOut());
    }

    @GetMapping("/attendance")
    public ResponseEntity<Page<AttendanceRecord>> listOwnAttendance(Pageable pageable) {
        return ResponseEntity.ok(attendanceService.listOwnAttendance(pageable));
    }
}
