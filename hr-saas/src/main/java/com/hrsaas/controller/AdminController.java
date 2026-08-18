package com.hrsaas.controller;

import com.hrsaas.dto.AttendanceComplianceData;
import com.hrsaas.dto.AttendanceRecordResponseDto;
import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.dto.DepartmentResponseDto;
import com.hrsaas.dto.EmployeeCounts;
import com.hrsaas.dto.HeadcountTrendData;
import com.hrsaas.dto.LeaveRequestResponseDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.dto.LeaveStatsData;
import com.hrsaas.dto.UserResponseDto;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.DepartmentService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final EmployeeService employeeService;
    private final DepartmentService departmentService;
    private final LeaveService leaveService;
    private final AttendanceService attendanceService;

    public AdminController(
            EmployeeService employeeService,
            DepartmentService departmentService,
            LeaveService leaveService,
            AttendanceService attendanceService
    ) {
        this.employeeService = employeeService;
        this.departmentService = departmentService;
        this.leaveService = leaveService;
        this.attendanceService = attendanceService;
    }

    @PostMapping("/employees")
    public ResponseEntity<UserResponseDto> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        log.info("POST /api/admin/employees - Creating employee: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponseDto.fromEntity(employeeService.createEmployee(request)));
    }

    @GetMapping("/employees")
    public ResponseEntity<Page<UserResponseDto>> listEmployees(Pageable pageable) {
        log.debug("GET /api/admin/employees - Listing employees, page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return ResponseEntity.ok(employeeService.listEmployees(pageable).map(UserResponseDto::fromEntity));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<UserResponseDto> getEmployee(@PathVariable UUID id) {
        log.debug("GET /api/admin/employees/{} - Fetching employee", id);
        return ResponseEntity.ok(UserResponseDto.fromEntity(employeeService.getEmployee(id)));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<UserResponseDto> updateEmployee(@PathVariable UUID id, @Valid @RequestBody CreateEmployeeRequest request) {
        log.info("PUT /api/admin/employees/{} - Updating employee", id);
        return ResponseEntity.ok(UserResponseDto.fromEntity(employeeService.updateEmployee(id, request)));
    }

    @PatchMapping("/employees/{id}/deactivate")
    public ResponseEntity<Void> deactivateEmployee(@PathVariable UUID id) {
        log.info("PATCH /api/admin/employees/{}/deactivate - Deactivating employee", id);
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/employees/{id}/reactivate")
    public ResponseEntity<Void> reactivateEmployee(@PathVariable UUID id) {
        log.info("PATCH /api/admin/employees/{}/reactivate - Reactivating employee", id);
        employeeService.reactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentResponseDto> createDepartment(@Valid @RequestBody DepartmentCreateDto dto) {
        log.info("POST /api/admin/departments - Creating department: {}", dto.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(DepartmentResponseDto.fromEntity(departmentService.createDepartment(dto)));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponseDto>> listDepartments() {
        log.debug("GET /api/admin/departments - Listing departments");
        return ResponseEntity.ok(departmentService.listDepartments().stream()
                .map(DepartmentResponseDto::fromEntity)
                .toList());
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable UUID id) {
        log.info("DELETE /api/admin/departments/{} - Deleting department", id);
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<Page<LeaveRequestResponseDto>> listLeaveRequests(
            Pageable pageable,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID employeeId
    ) {
        log.debug("GET /api/admin/leave-requests - Listing leave requests, status={}, employeeId={}", status, employeeId);
        return ResponseEntity.ok(leaveService.listCompanyLeaveRequestsWithFilters(status, employeeId, pageable));
    }

    @PatchMapping("/leave-requests/{id}/review")
    public ResponseEntity<LeaveRequestResponseDto> reviewLeaveRequest(
            @PathVariable UUID id, @Valid @RequestBody LeaveReviewDto dto
    ) {
        log.info("PATCH /api/admin/leave-requests/{}/review - Reviewing leave request: approve={}", id, dto.isApprove());
        return ResponseEntity.ok(LeaveRequestResponseDto.fromEntity(leaveService.reviewLeaveRequest(id, dto)));
    }

    @GetMapping("/attendance")
    public ResponseEntity<Page<AttendanceRecordResponseDto>> listAttendance(Pageable pageable) {
        log.debug("GET /api/admin/attendance - Listing attendance, page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return ResponseEntity.ok(attendanceService.listCompanyAttendance(pageable).map(AttendanceRecordResponseDto::fromEntity));
    }

    // Analytical endpoints for dashboard
    @GetMapping("/analytics/headcount-trend")
    public ResponseEntity<HeadcountTrendData> getHeadcountTrend() {
        log.debug("GET /api/admin/analytics/headcount-trend - Getting headcount trend data");
        HeadcountTrendData trendData = employeeService.getHeadcountTrend(12); // Last 12 months
        return ResponseEntity.ok(trendData);
    }

    @GetMapping("/analytics/employee-counts")
    public ResponseEntity<EmployeeCounts> getEmployeeCounts() {
        log.debug("GET /api/admin/analytics/employee-counts - Getting employee counts by status");
        EmployeeCounts counts = employeeService.getActiveVsPendingCounts();
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/analytics/leave-stats")
    public ResponseEntity<LeaveStatsData> getLeaveStats() {
        log.debug("GET /api/admin/analytics/leave-stats - Getting leave statistics");
        LeaveStatsData stats = leaveService.getLeaveStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/analytics/attendance-compliance")
    public ResponseEntity<AttendanceComplianceData> getAttendanceCompliance() {
        log.debug("GET /api/admin/analytics/attendance-compliance - Getting attendance compliance data");
        AttendanceComplianceData compliance = attendanceService.getAttendanceCompliance();
        return ResponseEntity.ok(compliance);
    }
}
