package com.hrsaas.controller;

import com.hrsaas.dto.CreateEmployeeRequest;
import com.hrsaas.dto.DepartmentCreateDto;
import com.hrsaas.dto.LeaveReviewDto;
import com.hrsaas.entity.Department;
import com.hrsaas.entity.LeaveRequest;
import com.hrsaas.entity.User;
import com.hrsaas.service.AttendanceService;
import com.hrsaas.service.DepartmentService;
import com.hrsaas.service.EmployeeService;
import com.hrsaas.service.LeaveService;
import jakarta.validation.Valid;
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
    public ResponseEntity<User> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @GetMapping("/employees")
    public ResponseEntity<Page<User>> listEmployees(Pageable pageable) {
        return ResponseEntity.ok(employeeService.listEmployees(pageable));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<User> getEmployee(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<User> updateEmployee(@PathVariable UUID id, @Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @PatchMapping("/employees/{id}/deactivate")
    public ResponseEntity<Void> deactivateEmployee(@PathVariable UUID id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/employees/{id}/reactivate")
    public ResponseEntity<Void> reactivateEmployee(@PathVariable UUID id) {
        employeeService.reactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody DepartmentCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.createDepartment(dto));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> listDepartments() {
        return ResponseEntity.ok(departmentService.listDepartments());
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable UUID id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<Page<LeaveRequest>> listLeaveRequests(Pageable pageable) {
        return ResponseEntity.ok(leaveService.listCompanyLeaveRequests(pageable));
    }

    @PatchMapping("/leave-requests/{id}/review")
    public ResponseEntity<LeaveRequest> reviewLeaveRequest(
            @PathVariable UUID id, @Valid @RequestBody LeaveReviewDto dto
    ) {
        return ResponseEntity.ok(leaveService.reviewLeaveRequest(id, dto));
    }

    @GetMapping("/attendance")
    public ResponseEntity<Page<?>> listAttendance(Pageable pageable) {
        return ResponseEntity.ok(attendanceService.listCompanyAttendance(pageable));
    }
}
